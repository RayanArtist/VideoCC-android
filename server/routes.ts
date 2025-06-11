import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcrypt";
import Stripe from "stripe";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { 
  insertUserSchema, 
  loginSchema, 
  updateProfileSchema, 
  forgotPasswordSchema,
  insertMessageSchema,
  insertNotificationSchema,
  userFilterSchema,
  userReportSchema,
  vipSubscriptionSchema,
  insertPhotoSchema
} from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import "./types";
import type { AuthenticatedRequest } from "./types";

// Initialize Stripe (will use test keys by default)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_51234567890abcdef', {
  apiVersion: '2023-10-16',
});

// Authentication middleware
const requireAuth = (req: AuthenticatedRequest, res: any, next: any) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  next();
};

export function registerRoutes(app: Express): Server {
  
  // APK download endpoint
  app.get("/api/download-apk", (req, res) => {
    try {
      const apkPath = path.resolve(process.cwd(), "VideoCC-Final-Working.apk");
      
      if (fs.existsSync(apkPath)) {
        res.setHeader('Content-Disposition', 'attachment; filename="VideoCC-Mobile-App.apk"');
        res.setHeader('Content-Type', 'application/vnd.android.package-archive');
        res.setHeader('Content-Length', fs.statSync(apkPath).size);
        res.sendFile(apkPath);
      } else {
        res.status(404).json({ error: "APK not found", path: apkPath });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  app.post("/api/register", async (req, res) => {
    try {
      const result = insertUserSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: fromZodError(result.error).toString() });
      }

      const { username, email, password, phone, gender, age, country } = result.data;
      
      if (!password) {
        return res.status(400).json({ message: "Password is required" });
      }

      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      if (email) {
        const existingEmail = await storage.getUserByEmail(email);
        if (existingEmail) {
          return res.status(400).json({ message: "Email already exists" });
        }
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await storage.createUser({
        username,
        email,
        password: hashedPassword,
        phone,
        gender,
        age,
        country
      });

      const session = await storage.createSession(user.id);
      
      req.session.sessionId = session.id;
      req.session.userId = user.id;

      res.json({ 
        message: "Registration successful",
        user: { ...user, password: undefined }
      });
    } catch (error: any) {
      res.status(500).json({ message: "Registration failed: " + error.message });
    }
  });

  app.post("/api/login", async (req, res) => {
    try {
      const result = loginSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: fromZodError(result.error).toString() });
      }

      const { username, password } = result.data;
      const user = await storage.validateUser(username, password);
      
      if (!user) {
        return res.status(401).json({ message: "Invalid username or password" });
      }

      if (user.isBanned) {
        return res.status(403).json({ message: "Account is banned" });
      }

      await storage.updateUserOnlineStatus(user.id, true);

      const session = await storage.createSession(user.id);
      
      req.session.sessionId = session.id;
      req.session.userId = user.id;

      res.json({ 
        message: "Login successful",
        user: { ...user, password: undefined }
      });
    } catch (error: any) {
      res.status(500).json({ message: "Login failed: " + error.message });
    }
  });

  app.post("/api/logout", async (req, res) => {
    try {
      if (req.session.sessionId) {
        await storage.deleteSession(req.session.sessionId);
        
        if (req.session.userId) {
          await storage.updateUserOnlineStatus(req.session.userId, false);
        }
      }
      
      req.session.destroy((err) => {
        if (err) {
          return res.status(500).json({ message: "Logout failed" });
        }
        res.clearCookie('connect.sid');
        res.json({ message: "Logout successful" });
      });
    } catch (error: any) {
      res.status(500).json({ message: "Logout failed: " + error.message });
    }
  });

  app.get("/api/me", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ ...user, password: undefined });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to get user data: " + error.message });
    }
  });

  app.post("/api/forgot-password", async (req, res) => {
    try {
      const result = forgotPasswordSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: fromZodError(result.error).toString() });
      }

      const { email } = result.data;
      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const securityCode = await storage.generateSecurityCode();
      
      res.json({ 
        message: "Security code sent",
        securityCode: securityCode.code
      });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to send security code: " + error.message });
    }
  });

  app.post("/api/verify-security-code", async (req, res) => {
    try {
      const { code } = req.body;
      const isValid = await storage.validateSecurityCode(code);
      
      if (!isValid) {
        return res.status(400).json({ message: "Invalid security code" });
      }

      res.json({ message: "Security code verified" });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to verify security code: " + error.message });
    }
  });

  app.put("/api/profile", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const result = updateProfileSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: fromZodError(result.error).toString() });
      }

      const updatedUser = await storage.updateProfile(req.session.userId, result.data);
      
      res.json({ 
        message: "Profile updated successfully",
        user: { ...updatedUser, password: undefined }
      });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to update profile: " + error.message });
    }
  });

  app.get("/api/users", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const result = userFilterSchema.safeParse(req.query);
      if (!result.success) {
        return res.status(400).json({ message: fromZodError(result.error).toString() });
      }

      const users = await storage.getUsers(result.data);
      const usersWithoutPasswords = users.map(user => ({ ...user, password: undefined }));
      
      res.json(usersWithoutPasswords);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to get users: " + error.message });
    }
  });

  app.post("/api/messages", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const result = insertMessageSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: fromZodError(result.error).toString() });
      }

      const canSend = await storage.canSendMessageToUser(req.session.userId, result.data.receiverId);
      if (!canSend) {
        return res.status(403).json({ message: "Cannot send message to this user" });
      }

      const withinLimit = await storage.checkDailyMessageLimit(req.session.userId);
      if (!withinLimit) {
        return res.status(429).json({ message: "Daily message limit exceeded" });
      }

      const message = await storage.sendMessage(req.session.userId, result.data);
      await storage.incrementDailyMessageCount(req.session.userId);
      
      await storage.createNotification({
        userId: result.data.receiverId,
        title: 'New Message',
        message: 'You have received a new message',
        content: 'New message received',
        type: 'message',
        relatedId: message.id
      });

      res.json({ 
        message: "Message sent successfully",
        data: message
      });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to send message: " + error.message });
    }
  });

  app.get("/api/messages/:userId", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const otherUserId = parseInt(req.params.userId);
      const messages = await storage.getMessages(req.session.userId, otherUserId);
      
      res.json(messages);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to get messages: " + error.message });
    }
  });

  app.get("/api/notifications", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const notifications = await storage.getNotifications(req.session.userId);
      res.json(notifications);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to get notifications: " + error.message });
    }
  });

  app.post("/api/notifications", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const result = insertNotificationSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: fromZodError(result.error).toString() });
      }

      const notification = await storage.createNotification(result.data);
      res.json({ 
        message: "Notification created",
        data: notification
      });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to create notification: " + error.message });
    }
  });

  app.put("/api/notifications/:id/read", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const notificationId = parseInt(req.params.id);
      await storage.markNotificationAsRead(notificationId);
      
      res.json({ message: "Notification marked as read" });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to mark notification as read: " + error.message });
    }
  });

  app.put("/api/messages/:id/read", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const messageId = parseInt(req.params.id);
      await storage.markMessageAsRead(messageId);
      
      res.json({ message: "Message marked as read" });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to mark message as read: " + error.message });
    }
  });

  app.post("/api/report-user", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const result = userReportSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: fromZodError(result.error).toString() });
      }

      const report = await storage.reportUser({
        ...result.data,
        reporterId: req.session.userId
      });
      
      res.json({ 
        message: "Report submitted",
        data: report
      });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to submit report: " + error.message });
    }
  });

  app.post("/api/block-user/:userId", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const blockedUserId = parseInt(req.params.userId);
      await storage.blockUser(req.session.userId, blockedUserId);
      
      res.json({ message: "User blocked" });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to block user: " + error.message });
    }
  });

  app.delete("/api/block-user/:userId", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const blockedUserId = parseInt(req.params.userId);
      await storage.unblockUser(req.session.userId, blockedUserId);
      
      res.json({ message: "User unblocked" });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to unblock user: " + error.message });
    }
  });

  app.post("/api/favorites/:userId", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const favoriteUserId = parseInt(req.params.userId);
      await storage.addToFavorites(req.session.userId, favoriteUserId);
      
      res.json({ message: "Added to favorites" });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to add to favorites: " + error.message });
    }
  });

  app.delete("/api/favorites/:userId", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const favoriteUserId = parseInt(req.params.userId);
      await storage.removeFromFavorites(req.session.userId, favoriteUserId);
      
      res.json({ message: "Removed from favorites" });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to remove from favorites: " + error.message });
    }
  });

  app.get("/api/favorites", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const favorites = await storage.getFavorites(req.session.userId);
      const favoritesWithoutPasswords = favorites.map(user => ({ ...user, password: undefined }));
      
      res.json(favoritesWithoutPasswords);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to get favorites: " + error.message });
    }
  });

  app.post("/api/vip-subscription", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const result = vipSubscriptionSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: fromZodError(result.error).toString() });
      }

      const subscription = await storage.createVipSubscription({
        ...result.data,
        userId: req.session.userId
      });
      
      res.json({ 
        message: "VIP subscription created",
        data: subscription
      });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to create VIP subscription: " + error.message });
    }
  });

  app.post("/api/activate-vip/:subscriptionId", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const subscriptionId = parseInt(req.params.subscriptionId);
      await storage.activateVip(req.session.userId, subscriptionId);
      
      res.json({ message: "VIP activated" });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to activate VIP: " + error.message });
    }
  });

  app.get("/api/vip-status", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const isVip = await storage.checkVipStatus(req.session.userId);
      res.json({ isVip });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to check VIP status: " + error.message });
    }
  });

  app.post("/api/admin/ban-user/:userId", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const userId = parseInt(req.params.userId);
      await storage.banUser(userId);
      
      res.json({ message: "User banned" });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to ban user: " + error.message });
    }
  });

  app.post("/api/admin/unban-user/:userId", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const userId = parseInt(req.params.userId);
      await storage.unbanUser(userId);
      
      res.json({ message: "User unbanned" });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to unban user: " + error.message });
    }
  });

  app.get("/api/admin/banned-users", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const bannedUsers = await storage.getBannedUsers();
      const usersWithoutPasswords = bannedUsers.map(user => ({ ...user, password: undefined }));
      
      res.json(usersWithoutPasswords);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to get banned users: " + error.message });
    }
  });

  // Live streaming endpoints
  app.get('/api/live-streams', async (req, res) => {
    try {
      const streams = await storage.getLiveStreams();
      res.json(streams);
    } catch (error) {
      console.error('Error getting live streams:', error);
      res.status(500).json({ message: 'Failed to get live streams' });
    }
  });

  app.post('/api/live-streams/start', async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const { title, description } = req.body;
      const userId = req.session.userId;
      
      const stream = await storage.startLiveStream(userId, title, description);
      res.json(stream);
    } catch (error) {
      console.error('Error starting live stream:', error);
      res.status(500).json({ message: 'Failed to start live stream' });
    }
  });

  app.post('/api/live-streams/stop', async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const userId = req.session.userId;
      await storage.stopLiveStream(userId);
      res.json({ message: 'Live stream stopped' });
    } catch (error) {
      console.error('Error stopping live stream:', error);
      res.status(500).json({ message: 'Failed to stop live stream' });
    }
  });

  app.post('/api/live-streams/:id/join', async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const streamId = parseInt(req.params.id);
      const userId = req.session.userId;
      
      await storage.joinLiveStream(streamId, userId);
      res.json({ message: 'Joined live stream' });
    } catch (error) {
      console.error('Error joining live stream:', error);
      res.status(500).json({ message: 'Failed to join live stream' });
    }
  });

  // VIP Plans endpoint
  app.get('/api/vip-plans', (req, res) => {
    const plans = [
      {
        id: 'vip_1_month',
        name: 'VIP 1 Month',
        duration: 30,
        price: 9.99,
        currency: 'USD',
        originalPrice: 19.99,
        features: [
          'Unlimited messaging',
          'Video calls with VIP members',
          'Priority customer support',
          'Enhanced profile features',
          'No ads',
          'Special VIP badge'
        ]
      },
      {
        id: 'vip_3_months',
        name: 'VIP 3 Months',
        duration: 90,
        price: 24.99,
        currency: 'USD',
        originalPrice: 59.97,
        features: [
          'All 1-month features',
          'Advanced search filters',
          'Profile boost priority',
          'Exclusive VIP events access',
          '3x daily rewards',
          'Custom profile themes'
        ]
      },
      {
        id: 'vip_1_year',
        name: 'VIP 1 Year',
        duration: 365,
        price: 79.99,
        currency: 'USD',
        originalPrice: 239.88,
        features: [
          'All previous features',
          'Lifetime VIP badge',
          'Exclusive content access',
          'Private VIP chat rooms',
          '5x daily rewards',
          'Priority live stream access',
          'Custom emojis and stickers'
        ]
      }
    ];
    res.json(plans);
  });

  // Create payment intent for VIP subscription
  app.post('/api/create-payment-intent', requireAuth, async (req, res) => {
    try {
      const { planId, amount } = req.body;
      const userId = req.session.userId;

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: 'usd',
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          userId: userId.toString(),
          planId: planId,
          type: 'vip_subscription'
        }
      });

      res.json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      });
    } catch (error) {
      console.error('Error creating payment intent:', error);
      res.status(500).json({ message: 'Failed to create payment intent' });
    }
  });

  // Confirm VIP purchase
  app.post('/api/confirm-vip-purchase', requireAuth, async (req, res) => {
    try {
      const { paymentIntentId, planId } = req.body;
      const userId = req.session.userId;

      // Verify payment with Stripe
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      if (paymentIntent.status === 'succeeded') {
        // Create VIP subscription
        const subscription = await storage.createVipSubscription({
          userId,
          planType: planId,
          startDate: new Date(),
          endDate: new Date(Date.now() + (planId.includes('1_month') ? 30 : planId.includes('3_months') ? 90 : 365) * 24 * 60 * 60 * 1000),
          amount: paymentIntent.amount / 100,
          currency: 'USD',
          paymentIntentId: paymentIntentId,
          status: 'active'
        });

        // Activate VIP for user
        await storage.activateVip(userId, subscription.id);

        res.json({ 
          message: 'VIP subscription activated successfully',
          subscription 
        });
      } else {
        res.status(400).json({ message: 'Payment not completed' });
      }
    } catch (error) {
      console.error('Error confirming VIP purchase:', error);
      res.status(500).json({ message: 'Failed to confirm purchase' });
    }
  });

  // Check VIP status
  app.get('/api/vip-status', requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
      const isVip = await storage.checkVipStatus(userId);
      res.json({ isVip });
    } catch (error) {
      console.error('Error checking VIP status:', error);
      res.status(500).json({ message: 'Failed to check VIP status' });
    }
  });

  // Gift transactions for VIP users
  app.post('/api/send-gift', requireAuth, async (req, res) => {
    try {
      const { receiverId, giftId, amount } = req.body;
      const senderId = req.session.userId;

      // Check if sender is VIP
      const isVip = await storage.checkVipStatus(senderId);
      if (!isVip) {
        return res.status(403).json({ message: 'VIP membership required to send gifts' });
      }

      // Create gift transaction
      const transaction = {
        senderId,
        receiverId,
        giftId,
        amount,
        createdAt: new Date()
      };

      // Here you would implement the actual gift sending logic
      // For now, just return success
      res.json({ 
        message: 'Gift sent successfully',
        transaction 
      });
    } catch (error) {
      console.error('Error sending gift:', error);
      res.status(500).json({ message: 'Failed to send gift' });
    }
  });

  // Token purchase endpoint
  app.post('/api/purchase-tokens', requireAuth, async (req, res) => {
    try {
      const { packageId, amount, walletAddress, tokens } = req.body;
      const userId = req.session.userId!;

      // Create token purchase request
      const purchaseRequest = {
        userId,
        packageId,
        amount,
        walletAddress,
        tokens,
        status: 'pending',
        createdAt: new Date()
      };

      // Here you would save to database and process the request
      // For now, just return success
      res.json({ 
        message: 'Token purchase request submitted successfully',
        request: purchaseRequest 
      });
    } catch (error) {
      console.error('Error processing token purchase:', error);
      res.status(500).json({ message: 'Failed to process token purchase' });
    }
  });

  // Coin purchase packages
  app.get('/api/coin-packages', (req, res) => {
    const packages = [
      {
        id: 'coins_50',
        name: '50 Coins',
        coins: 50,
        price: 5,
        bonus: 0,
        icon: '🪙'
      },
      {
        id: 'coins_100',
        name: '100 Coins',
        coins: 100,
        price: 9,
        bonus: 10,
        icon: '💰',
        popular: true
      },
      {
        id: 'coins_500',
        name: '500 Coins',
        coins: 500,
        price: 40,
        bonus: 100,
        icon: '💎'
      },
      {
        id: 'coins_1000',
        name: '1000 Coins',
        coins: 1000,
        price: 70,
        bonus: 300,
        icon: '👑'
      }
    ];
    res.json(packages);
  });

  // VIP + Coins bundle packages
  app.get('/api/vip-coin-bundles', (req, res) => {
    const bundles = [
      {
        id: 'vip_1m_coins_100',
        name: 'VIP 1 Month + 100 Coins',
        vipDuration: 30,
        coins: 100,
        price: 14.99,
        originalPrice: 19.98,
        features: [
          'VIP 1 Month access',
          '100 bonus coins',
          'Unlimited messaging',
          'Priority support',
          'No ads'
        ]
      },
      {
        id: 'vip_3m_coins_500',
        name: 'VIP 3 Months + 500 Coins',
        vipDuration: 90,
        coins: 500,
        price: 64.99,
        originalPrice: 99.97,
        features: [
          'VIP 3 Months access',
          '500 bonus coins',
          'All VIP features',
          'Advanced search',
          'Profile boost',
          'Exclusive events'
        ],
        popular: true
      },
      {
        id: 'vip_1y_coins_2000',
        name: 'VIP 1 Year + 2000 Coins',
        vipDuration: 365,
        coins: 2000,
        price: 149.99,
        originalPrice: 319.88,
        features: [
          'VIP 1 Year access',
          '2000 bonus coins',
          'Lifetime VIP badge',
          'Exclusive content',
          'Private chat rooms',
          'Custom themes',
          'Priority live streams'
        ]
      }
    ];
    res.json(bundles);
  });

  // Purchase coins
  app.post('/api/purchase-coins', requireAuth, async (req, res) => {
    try {
      const { packageId, amount } = req.body;
      const userId = req.session.userId!;

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency: 'usd',
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          userId: userId.toString(),
          packageId: packageId,
          type: 'coin_purchase'
        }
      });

      res.json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      });
    } catch (error) {
      console.error('Error creating coin payment intent:', error);
      res.status(500).json({ message: 'Failed to create payment intent' });
    }
  });

  // Purchase VIP + Coins bundle
  app.post('/api/purchase-vip-bundle', requireAuth, async (req, res) => {
    try {
      const { bundleId, amount } = req.body;
      const userId = req.session.userId!;

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency: 'usd',
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          userId: userId.toString(),
          bundleId: bundleId,
          type: 'vip_coin_bundle'
        }
      });

      res.json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      });
    } catch (error) {
      console.error('Error creating bundle payment intent:', error);
      res.status(500).json({ message: 'Failed to create payment intent' });
    }
  });

  // Confirm coin purchase
  app.post('/api/confirm-coin-purchase', requireAuth, async (req, res) => {
    try {
      const { paymentIntentId, packageId } = req.body;
      const userId = req.session.userId!;

      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      if (paymentIntent.status === 'succeeded') {
        // Here you would add coins to user account
        // For now, just return success
        res.json({ 
          message: 'Coins purchased successfully',
          coins: paymentIntent.metadata.coins || 0
        });
      } else {
        res.status(400).json({ message: 'Payment not completed' });
      }
    } catch (error) {
      console.error('Error confirming coin purchase:', error);
      res.status(500).json({ message: 'Failed to confirm purchase' });
    }
  });

  // Confirm VIP + Coins bundle purchase
  app.post('/api/confirm-bundle-purchase', requireAuth, async (req, res) => {
    try {
      const { paymentIntentId, bundleId } = req.body;
      const userId = req.session.userId!;

      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      if (paymentIntent.status === 'succeeded') {
        // Here you would:
        // 1. Activate VIP subscription
        // 2. Add coins to user account
        // For now, just return success
        res.json({ 
          message: 'VIP + Coins bundle activated successfully',
          vip: true,
          coins: paymentIntent.metadata.coins || 0
        });
      } else {
        res.status(400).json({ message: 'Payment not completed' });
      }
    } catch (error) {
      console.error('Error confirming bundle purchase:', error);
      res.status(500).json({ message: 'Failed to confirm purchase' });
    }
  });

  // Global VCC token balance - starts with 1 billion tokens
  let globalVccTokens = 1000000000;

  // Anti-fraud tracking
  const purchaseHistory = new Map(); // userId -> array of purchases
  const walletHistory = new Map(); // walletAddress -> array of users
  const ipHistory = new Map(); // ip -> array of purchases
  
  // Rate limiting
  const rateLimits = new Map(); // userId -> { lastPurchase: timestamp, count: number }

  // Get global VCC token balance
  app.get('/api/vcc-tokens-balance', (req, res) => {
    res.json({ 
      balance: globalVccTokens,
      formatted: globalVccTokens.toLocaleString()
    });
  });

  // Update VCC tokens balance (admin only)
  app.post('/api/update-vcc-balance', requireAuth, async (req, res) => {
    try {
      const { amount, operation } = req.body;
      const userId = req.session.userId!;
      
      // Check if user is admin (you might want to add proper admin check)
      if (operation === 'subtract') {
        globalVccTokens = Math.max(0, globalVccTokens - amount);
      } else if (operation === 'add') {
        globalVccTokens += amount;
      } else if (operation === 'set') {
        globalVccTokens = amount;
      }

      res.json({ 
        message: 'VCC balance updated successfully',
        newBalance: globalVccTokens,
        formatted: globalVccTokens.toLocaleString()
      });
    } catch (error) {
      console.error('Error updating VCC balance:', error);
      res.status(500).json({ message: 'Failed to update VCC balance' });
    }
  });

  // Anti-fraud validation function
  const validatePurchase = (userId: number, walletAddress: string, amount: number, userIP: string) => {
    const now = Date.now();
    const userLimit = rateLimits.get(userId) || { lastPurchase: 0, count: 0 };
    
    // Rate limiting: Max 3 purchases per hour per user
    if (now - userLimit.lastPurchase < 3600000) { // 1 hour
      if (userLimit.count >= 3) {
        return { valid: false, reason: 'Rate limit exceeded: Maximum 3 purchases per hour' };
      }
    } else {
      userLimit.count = 0;
    }

    // Check wallet reuse: Same wallet can't be used by more than 2 different users
    const walletUsers = walletHistory.get(walletAddress) || [];
    if (walletUsers.length > 0 && !walletUsers.includes(userId) && walletUsers.length >= 2) {
      return { valid: false, reason: 'Wallet address has been used by too many users' };
    }

    // Check IP reuse: Max 5 purchases per day per IP
    const ipPurchases = ipHistory.get(userIP) || [];
    const todayPurchases = ipPurchases.filter(p => now - p.timestamp < 86400000); // 24 hours
    if (todayPurchases.length >= 5) {
      return { valid: false, reason: 'IP limit exceeded: Maximum 5 purchases per day per IP' };
    }

    // Check user purchase history for suspicious patterns
    const userPurchases = purchaseHistory.get(userId) || [];
    const recentPurchases = userPurchases.filter(p => now - p.timestamp < 86400000);
    
    // Suspicious: More than $100 in purchases per day
    const dailyTotal = recentPurchases.reduce((sum, p) => sum + p.amount, 0);
    if (dailyTotal + amount > 100) {
      return { valid: false, reason: 'Daily purchase limit exceeded: Maximum $100 per day' };
    }

    // Minimum amount validation
    if (amount < 1 || amount > 500) {
      return { valid: false, reason: 'Invalid amount: Must be between $1 and $500' };
    }

    // Wallet address format validation (basic TRC20 check)
    if (!walletAddress.match(/^T[A-Za-z0-9]{33}$/)) {
      return { valid: false, reason: 'Invalid wallet address format' };
    }

    return { valid: true };
  };

  // Update tracking data
  const updateTrackingData = (userId: number, walletAddress: string, amount: number, userIP: string, type: string) => {
    const now = Date.now();
    
    // Update rate limits
    const userLimit = rateLimits.get(userId) || { lastPurchase: 0, count: 0 };
    userLimit.lastPurchase = now;
    userLimit.count += 1;
    rateLimits.set(userId, userLimit);

    // Update wallet history
    const walletUsers = walletHistory.get(walletAddress) || [];
    if (!walletUsers.includes(userId)) {
      walletUsers.push(userId);
      walletHistory.set(walletAddress, walletUsers);
    }

    // Update IP history
    const ipPurchases = ipHistory.get(userIP) || [];
    ipPurchases.push({ userId, amount, timestamp: now, type });
    ipHistory.set(userIP, ipPurchases);

    // Update purchase history
    const userPurchases = purchaseHistory.get(userId) || [];
    userPurchases.push({ amount, timestamp: now, type, walletAddress });
    purchaseHistory.set(userId, userPurchases);
  };

  // Crypto purchase endpoints with fraud protection
  app.post('/api/purchase-vip-crypto', requireAuth, async (req, res) => {
    try {
      const { planId, amount, walletAddress, duration } = req.body;
      const userId = req.session.userId!;
      const userIP = req.ip || req.connection.remoteAddress || 'unknown';

      // Fraud validation
      const validation = validatePurchase(userId, walletAddress, amount, userIP);
      if (!validation.valid) {
        return res.status(400).json({ 
          message: 'Purchase rejected',
          reason: validation.reason 
        });
      }

      // Update tracking data
      updateTrackingData(userId, walletAddress, amount, userIP, 'vip_crypto');

      const purchaseRequest = {
        userId,
        planId,
        amount,
        walletAddress,
        duration,
        type: 'vip_crypto',
        status: 'pending',
        userIP,
        createdAt: new Date()
      };

      res.json({ 
        message: 'VIP crypto purchase request submitted successfully',
        request: purchaseRequest 
      });
    } catch (error) {
      console.error('Error processing VIP crypto purchase:', error);
      res.status(500).json({ message: 'Failed to process VIP crypto purchase' });
    }
  });

  app.post('/api/purchase-coins-crypto', requireAuth, async (req, res) => {
    try {
      const { packageId, amount, walletAddress, coins } = req.body;
      const userId = req.session.userId!;
      const userIP = req.ip || req.connection.remoteAddress || 'unknown';

      // Fraud validation
      const validation = validatePurchase(userId, walletAddress, amount, userIP);
      if (!validation.valid) {
        return res.status(400).json({ 
          message: 'Purchase rejected',
          reason: validation.reason 
        });
      }

      // Check VCC token availability
      if (globalVccTokens < coins) {
        return res.status(400).json({ 
          message: 'Insufficient VCC tokens in global pool',
          availableTokens: globalVccTokens
        });
      }

      // Additional coin-specific validation
      if (coins < 10 || coins > 10000) {
        return res.status(400).json({ 
          message: 'Invalid coin amount: Must be between 10 and 10,000 coins'
        });
      }

      // Deduct coins from global pool
      globalVccTokens -= coins;

      // Update tracking data
      updateTrackingData(userId, walletAddress, amount, userIP, 'coins_crypto');

      const purchaseRequest = {
        userId,
        packageId,
        amount,
        walletAddress,
        coins,
        type: 'coins_crypto',
        status: 'pending',
        userIP,
        createdAt: new Date()
      };

      res.json({ 
        message: 'Coin crypto purchase request submitted successfully',
        request: purchaseRequest,
        remainingVccTokens: globalVccTokens
      });
    } catch (error) {
      console.error('Error processing coin crypto purchase:', error);
      res.status(500).json({ message: 'Failed to process coin crypto purchase' });
    }
  });

  app.post('/api/purchase-bundle-crypto', requireAuth, async (req, res) => {
    try {
      const { bundleId, amount, walletAddress, vipDuration, coins } = req.body;
      const userId = req.session.userId!;
      const userIP = req.ip || req.connection.remoteAddress || 'unknown';

      // Fraud validation
      const validation = validatePurchase(userId, walletAddress, amount, userIP);
      if (!validation.valid) {
        return res.status(400).json({ 
          message: 'Purchase rejected',
          reason: validation.reason 
        });
      }

      // Check VCC token availability
      if (globalVccTokens < coins) {
        return res.status(400).json({ 
          message: 'Insufficient VCC tokens in global pool',
          availableTokens: globalVccTokens
        });
      }

      // Additional bundle-specific validation
      if (vipDuration < 7 || vipDuration > 365) {
        return res.status(400).json({ 
          message: 'Invalid VIP duration: Must be between 7 and 365 days'
        });
      }

      if (coins < 50 || coins > 5000) {
        return res.status(400).json({ 
          message: 'Invalid coin amount: Must be between 50 and 5,000 coins'
        });
      }

      // Deduct coins from global pool
      globalVccTokens -= coins;

      // Update tracking data
      updateTrackingData(userId, walletAddress, amount, userIP, 'bundle_crypto');

      const purchaseRequest = {
        userId,
        bundleId,
        amount,
        walletAddress,
        vipDuration,
        coins,
        type: 'bundle_crypto',
        status: 'pending',
        userIP,
        createdAt: new Date()
      };

      res.json({ 
        message: 'Bundle crypto purchase request submitted successfully',
        request: purchaseRequest,
        remainingVccTokens: globalVccTokens
      });
    } catch (error) {
      console.error('Error processing bundle crypto purchase:', error);
      res.status(500).json({ message: 'Failed to process bundle crypto purchase' });
    }
  });

  // Admin endpoint to view fraud analytics
  app.get('/api/admin/fraud-analytics', requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      // Add admin check here if needed
      
      const analytics = {
        totalPurchases: Array.from(purchaseHistory.values()).flat().length,
        suspiciousWallets: Array.from(walletHistory.entries()).filter(([_, users]) => users.length > 2).length,
        highVolumeIPs: Array.from(ipHistory.entries()).filter(([_, purchases]) => purchases.length > 10).length,
        rateLimitedUsers: Array.from(rateLimits.entries()).filter(([_, limit]) => limit.count >= 3).length,
        globalVccTokens: globalVccTokens
      };

      res.json(analytics);
    } catch (error) {
      console.error('Error fetching fraud analytics:', error);
      res.status(500).json({ message: 'Failed to fetch analytics' });
    }
  });

  // Daily usage limits for regular male users
  app.get('/api/daily-limits', requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      
      const videoCallLimits = await storage.checkDailyVideoCallLimit(userId);
      
      res.json({
        videoCall: videoCallLimits,
        message: 'Daily limits retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting daily limits:', error);
      res.status(500).json({ message: 'Failed to get daily limits' });
    }
  });

  app.post('/api/start-video-call', requireAuth, async (req, res) => {
    try {
      const { targetUserId } = req.body;
      const userId = req.session.userId!;
      
      // Check if users are matched for regular male users
      const user = await storage.getUser(userId);
      if (user && user.gender === 'male' && !user.isVip) {
        const isMatch = await storage.isUserMatch(userId, targetUserId);
        if (!isMatch) {
          return res.status(403).json({ 
            message: 'Video calls are only allowed with matched users for regular members' 
          });
        }
      }

      // Check daily limits for regular users
      const limits = await storage.checkDailyVideoCallLimit(userId);
      if (!limits.canCall) {
        return res.status(403).json({ 
          message: 'Daily video call limit reached',
          limits 
        });
      }

      // Create video call session with $1/minute pricing
      const session = await storage.createVideoCallSession({
        callerId: userId,
        receiverId: targetUserId,
        isMatch: await storage.isUserMatch(userId, targetUserId),
        costPerMinute: "1.00", // $1 per minute
        paymentMethod: user?.isVip ? "vip_free" : "pending"
      });

      res.json({ 
        message: 'Video call session created',
        sessionId: session.id,
        pricing: {
          costPerMinute: 1.00,
          currency: "USD",
          freeForVip: user?.isVip || false
        },
        limits 
      });
    } catch (error) {
      console.error('Error starting video call:', error);
      res.status(500).json({ message: 'Failed to start video call' });
    }
  });

  app.post('/api/end-video-call', requireAuth, async (req, res) => {
    try {
      const { sessionId, duration } = req.body;
      const userId = req.session.userId!;
      
      // End the video call session and calculate billing
      const billing = await storage.endVideoCallSession(sessionId, duration);
      
      // Update daily limits for regular users
      await storage.incrementVideoCallCount(userId, duration);
      
      res.json({ 
        message: 'Video call ended successfully',
        billing: {
          duration: duration,
          totalCost: billing.totalCost,
          costPerMinute: billing.costPerMinute,
          paymentRequired: !billing.isFreeForVip,
          paymentMethod: billing.paymentMethod
        }
      });
    } catch (error) {
      console.error('Error ending video call:', error);
      res.status(500).json({ message: 'Failed to end video call' });
    }
  });

  // Get video call billing history
  app.get('/api/video-call-billing', requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      
      const billingHistory = await storage.getVideoCallBilling(userId);
      
      res.json(billingHistory);
    } catch (error) {
      console.error('Error getting billing history:', error);
      res.status(500).json({ message: 'Failed to get billing history' });
    }
  });

  // Process video call payment
  app.post('/api/pay-video-call', requireAuth, async (req, res) => {
    try {
      const { sessionId, paymentMethod, walletAddress } = req.body;
      const userId = req.session.userId!;
      
      const result = await storage.processVideoCallPayment(sessionId, paymentMethod, walletAddress);
      
      if (result.success) {
        res.json({ 
          message: 'Payment processed successfully',
          transactionId: result.transactionId
        });
      } else {
        res.status(400).json({ 
          message: result.error || 'Payment failed'
        });
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      res.status(500).json({ message: 'Failed to process payment' });
    }
  });

  // User likes system
  app.post('/api/like-user', requireAuth, async (req, res) => {
    try {
      const { targetUserId } = req.body;
      const userId = req.session.userId!;
      
      if (userId === targetUserId) {
        return res.status(400).json({ message: 'Cannot like yourself' });
      }

      const success = await storage.likeUser(userId, targetUserId);
      
      if (success) {
        res.json({ message: 'User liked successfully' });
      } else {
        res.status(400).json({ message: 'User already liked' });
      }
    } catch (error) {
      console.error('Error liking user:', error);
      res.status(500).json({ message: 'Failed to like user' });
    }
  });

  // Monthly rewards system
  app.get('/api/monthly-rewards/:month', requireAuth, async (req, res) => {
    try {
      const { month } = req.params; // YYYY-MM format
      
      const rewards = await db
        .select({
          id: monthlyRewards.id,
          rewardType: monthlyRewards.rewardType,
          winnerId: monthlyRewards.winnerId,
          winnerUsername: users.username,
          rewardValue: monthlyRewards.rewardValue,
          criteriaValue: monthlyRewards.criteriaValue,
          status: monthlyRewards.status,
          awardedAt: monthlyRewards.awardedAt
        })
        .from(monthlyRewards)
        .leftJoin(users, eq(monthlyRewards.winnerId, users.id))
        .where(eq(monthlyRewards.month, month))
        .orderBy(desc(monthlyRewards.awardedAt));

      res.json(rewards);
    } catch (error) {
      console.error('Error getting monthly rewards:', error);
      res.status(500).json({ message: 'Failed to get monthly rewards' });
    }
  });

  app.get('/api/monthly-leaderboard/:month', requireAuth, async (req, res) => {
    try {
      const { month } = req.params;
      
      // Top token purchasers
      const topPurchasers = await db
        .select({
          userId: monthlyUserStats.userId,
          username: users.username,
          avatar: users.avatar,
          totalTokensPurchased: monthlyUserStats.totalTokensPurchased
        })
        .from(monthlyUserStats)
        .leftJoin(users, eq(monthlyUserStats.userId, users.id))
        .where(eq(monthlyUserStats.month, month))
        .orderBy(desc(monthlyUserStats.totalTokensPurchased))
        .limit(10);

      // Most liked females
      const mostLikedFemales = await db
        .select({
          userId: monthlyUserStats.userId,
          username: users.username,
          avatar: users.avatar,
          totalLikesReceived: monthlyUserStats.totalLikesReceived
        })
        .from(monthlyUserStats)
        .leftJoin(users, eq(monthlyUserStats.userId, users.id))
        .where(and(
          eq(monthlyUserStats.month, month),
          eq(users.gender, 'female')
        ))
        .orderBy(desc(monthlyUserStats.totalLikesReceived))
        .limit(10);

      res.json({
        topPurchasers,
        mostLikedFemales
      });
    } catch (error) {
      console.error('Error getting monthly leaderboard:', error);
      res.status(500).json({ message: 'Failed to get monthly leaderboard' });
    }
  });

  // Auto-reward system (run monthly via cron or manual trigger)
  app.post('/api/admin/process-monthly-rewards', requireAuth, async (req, res) => {
    try {
      const { month } = req.body; // YYYY-MM format
      const userId = req.session.userId!;
      
      // Check if user is admin (add proper admin check)
      
      // Get top purchaser
      const topPurchaser = await storage.getMonthlyTopPurchaser(month);
      if (topPurchaser && topPurchaser.amount > 0) {
        await storage.createMonthlyReward(
          month,
          'top_purchaser',
          topPurchaser.userId,
          '1_month_vip',
          topPurchaser.amount
        );
        
        // Grant VIP subscription
        await storage.createVipSubscription({
          userId: topPurchaser.userId,
          planType: 'monthly',
          duration: 30,
          price: '0',
          currency: 'USD',
          paymentMethod: 'reward',
          transactionId: `reward_${month}_top_purchaser`
        });
      }

      // Get most liked female
      const topFemale = await storage.getMonthlyMostLikedFemale(month);
      if (topFemale && topFemale.likes > 0) {
        await storage.createMonthlyReward(
          month,
          'most_liked_female',
          topFemale.userId,
          '500_tokens',
          topFemale.likes
        );
        
        // Award 500 tokens (implement token system integration)
      }

      res.json({ 
        message: 'Monthly rewards processed successfully',
        topPurchaser,
        topFemale
      });
    } catch (error) {
      console.error('Error processing monthly rewards:', error);
      res.status(500).json({ message: 'Failed to process monthly rewards' });
    }
  });

  // APK download endpoint - serve file directly
  app.get('/apk', (req, res) => {
    const path = require('path');
    const apkPath = path.join(__dirname, '../VideoCC-Mobile-App.apk');
    
    res.setHeader('Content-Type', 'application/vnd.android.package-archive');
    res.setHeader('Content-Disposition', 'attachment; filename="VideoCC-Mobile-App.apk"');
    res.sendFile(apkPath, (err) => {
      if (err) {
        console.error('APK serve error:', err);
        res.status(404).send('APK file not found');
      }
    });
  });

  // Alternative APK download endpoint
  app.get('/download/apk', (req, res) => {
    const path = require('path');
    const apkPath = path.join(__dirname, '../VideoCC-Mobile-App.apk');
    res.download(apkPath, 'VideoCC-Mobile-App.apk', (err) => {
      if (err) {
        console.error('APK download error:', err);
        res.status(404).send('APK file not found');
      }
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}