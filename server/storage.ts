import { users, sessions, securityCodes, notifications, messages, userReports, userBlocks, userFavorites, vipSubscriptions, dailyMessageLimits, dailyVideoCallLimits, videoCallSessions, monthlyUserStats, monthlyRewards, userLikes, conversationStates, liveStreams, type User, type InsertUser, type Session, type SecurityCode, type Message, type Notification, type UpdateProfile, type UserFilter, type InsertMessage, type InsertNotification, type UserReport, type InsertUserReport, type UserBlock, type UserFavorite, type VipSubscription, type InsertVipSubscription, type DailyMessageLimit, type DailyVideoCallLimit, type VideoCallSession, type MonthlyUserStats, type MonthlyReward, type UserLike, type ConversationState } from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, ilike, or, desc, sql } from "drizzle-orm";
import bcrypt from "bcrypt";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: Omit<InsertUser, 'confirmPassword' | 'securityCode'>): Promise<User>;
  validateUser(username: string, password: string): Promise<User | null>;
  createSession(userId: number): Promise<Session>;
  getSession(sessionId: string): Promise<Session | undefined>;
  deleteSession(sessionId: string): Promise<void>;
  generateSecurityCode(): Promise<SecurityCode>;
  validateSecurityCode(code: string): Promise<boolean>;
  getUserByEmail(email: string): Promise<User | undefined>;
  updateProfile(userId: number, profile: Partial<UpdateProfile>): Promise<User>;
  getUsers(filter?: UserFilter): Promise<User[]>;
  updateUserOnlineStatus(userId: number, isOnline: boolean): Promise<void>;
  sendMessage(senderId: number, message: InsertMessage): Promise<Message>;
  getMessages(userId1: number, userId2: number): Promise<Message[]>;
  getNotifications(userId: number): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(notificationId: number): Promise<void>;
  markMessageAsRead(messageId: number): Promise<void>;
  // VIP and social features
  reportUser(report: InsertUserReport): Promise<UserReport>;
  blockUser(blockerId: number, blockedUserId: number): Promise<UserBlock>;
  unblockUser(blockerId: number, blockedUserId: number): Promise<void>;
  addToFavorites(userId: number, favoriteUserId: number): Promise<UserFavorite>;
  removeFromFavorites(userId: number, favoriteUserId: number): Promise<void>;
  getFavorites(userId: number): Promise<User[]>;
  isBlocked(userId: number, targetUserId: number): Promise<boolean>;
  createVipSubscription(subscription: InsertVipSubscription): Promise<VipSubscription>;
  activateVip(userId: number, subscriptionId: number): Promise<void>;
  checkVipStatus(userId: number): Promise<boolean>;
  // Message restrictions
  checkDailyMessageLimit(userId: number): Promise<boolean>;
  incrementDailyMessageCount(userId: number): Promise<void>;
  canSendMessageToUser(senderId: number, receiverId: number): Promise<boolean>;
  updateConversationState(senderId: number, receiverId: number): Promise<void>;
  // Ban/unban functionality
  banUser(userId: number): Promise<void>;
  unbanUser(userId: number): Promise<void>;
  getBannedUsers(): Promise<User[]>;
  
  // Daily usage limits for regular male users
  checkDailyVideoCallLimit(userId: number): Promise<{ canCall: boolean, callsLeft: number, durationLeft: number }>;
  incrementVideoCallCount(userId: number, duration: number): Promise<void>;
  checkDailyMessageContactLimit(userId: number, targetUserId: number): Promise<{ canMessage: boolean, contactsLeft: number }>;
  incrementMessageContact(userId: number, targetUserId: number): Promise<void>;
  isUserMatch(userId1: number, userId2: number): Promise<boolean>;
  
  // Video call pricing system ($1/minute)
  createVideoCallSession(session: any): Promise<VideoCallSession>;
  endVideoCallSession(sessionId: number, duration: number): Promise<any>;
  getVideoCallBilling(userId: number): Promise<any[]>;
  processVideoCallPayment(sessionId: number, paymentMethod: string, walletAddress?: string): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string | null | undefined): Promise<User | undefined> {
    if (!email) return undefined;
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: Omit<InsertUser, 'confirmPassword' | 'securityCode'>): Promise<User> {
    const hashedPassword = await bcrypt.hash(insertUser.password, 12);
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        password: hashedPassword,
      })
      .returning();
    return user;
  }

  async validateUser(username: string, password: string): Promise<User | null> {
    const user = await this.getUserByUsername(username);
    if (!user) return null;
    
    const isValid = await bcrypt.compare(password, user.password);
    return isValid ? user : null;
  }

  async createSession(userId: number): Promise<Session> {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    const [session] = await db
      .insert(sessions)
      .values({
        id: sessionId,
        userId,
        expiresAt,
      })
      .returning();
    
    return session;
  }

  async getSession(sessionId: string): Promise<Session | undefined> {
    const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId));
    if (!session) return undefined;
    
    if (session.expiresAt < new Date()) {
      await db.delete(sessions).where(eq(sessions.id, sessionId));
      return undefined;
    }
    
    return session;
  }

  async deleteSession(sessionId: string): Promise<void> {
    await db.delete(sessions).where(eq(sessions.id, sessionId));
  }

  async generateSecurityCode(): Promise<SecurityCode> {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    
    const [securityCode] = await db
      .insert(securityCodes)
      .values({
        code,
        isUsed: "false",
      })
      .returning();
    
    return securityCode;
  }

  async validateSecurityCode(code: string): Promise<boolean> {
    const [securityCode] = await db
      .select()
      .from(securityCodes)
      .where(and(eq(securityCodes.code, code), eq(securityCodes.isUsed, "false")));
    
    if (!securityCode) return false;
    
    // Mark as used
    await db
      .update(securityCodes)
      .set({ isUsed: "true" })
      .where(eq(securityCodes.id, securityCode.id));
    
    return true;
  }

  async updateProfile(userId: number, profile: UpdateProfile): Promise<User> {
    const [user] = await db
      .update(users)
      .set(profile)
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async getUsers(filter?: UserFilter): Promise<User[]> {
    let conditions = [];
    
    if (filter) {
      if (filter.minAge) {
        conditions.push(gte(users.age, filter.minAge));
      }
      
      if (filter.maxAge) {
        conditions.push(lte(users.age, filter.maxAge));
      }
      
      if (filter.location) {
        conditions.push(
          or(
            ilike(users.country, `%${filter.location}%`),
            ilike(users.city, `%${filter.location}%`)
          )
        );
      }
      
      if (filter.search) {
        conditions.push(
          or(
            ilike(users.username, `%${filter.search}%`),
            ilike(users.bio, `%${filter.search}%`)
          )
        );
      }
    }
    
    if (conditions.length > 0) {
      return await db
        .select()
        .from(users)
        .where(and(...conditions))
        .orderBy(desc(users.lastSeen));
    }
    
    return await db
      .select()
      .from(users)
      .orderBy(desc(users.lastSeen));
  }

  async updateUserOnlineStatus(userId: number, isOnline: boolean): Promise<void> {
    await db
      .update(users)
      .set({ 
        isOnline, 
        lastSeen: new Date() 
      })
      .where(eq(users.id, userId));
  }

  async sendMessage(senderId: number, message: InsertMessage): Promise<Message> {
    // Check if sender can send message to receiver
    const canSend = await this.canSendMessageToUser(senderId, message.receiverId);
    if (!canSend) {
      throw new Error("Message sending is restricted");
    }

    const [newMessage] = await db
      .insert(messages)
      .values({
        senderId,
        ...message,
      })
      .returning();
    
    // Update conversation state and daily message count
    await this.updateConversationState(senderId, message.receiverId);
    await this.incrementDailyMessageCount(senderId);
    
    // Create notification for receiver
    await this.createNotification({
      userId: message.receiverId,
      title: "پیام جدید",
      message: "شما پیام جدیدی دریافت کرده‌اید",
      type: "info",
    });
    
    return newMessage;
  }

  async getMessages(userId1: number, userId2: number): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(
        or(
          and(eq(messages.senderId, userId1), eq(messages.receiverId, userId2)),
          and(eq(messages.senderId, userId2), eq(messages.receiverId, userId1))
        )
      )
      .orderBy(messages.createdAt);
  }

  async getNotifications(userId: number): Promise<Notification[]> {
    try {
      return await db
        .select()
        .from(notifications)
        .where(eq(notifications.userId, userId))
        .orderBy(desc(notifications.createdAt));
    } catch (error) {
      console.error('Error getting notifications:', error);
      return [];
    }
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db
      .insert(notifications)
      .values(notification)
      .returning();
    return newNotification;
  }

  async markNotificationAsRead(notificationId: number): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, notificationId));
  }

  async markMessageAsRead(messageId: number): Promise<void> {
    await db
      .update(messages)
      .set({ isRead: true })
      .where(eq(messages.id, messageId));
  }

  // VIP and social features implementation
  async reportUser(report: InsertUserReport): Promise<UserReport> {
    const reportData = {
      reporterId: (report as any).reporterId,
      reportedUserId: report.reportedUserId,
      reason: report.reason,
      description: report.description || null,
    };
    
    const [newReport] = await db
      .insert(userReports)
      .values(reportData)
      .returning();
    
    // Get current total reports and increment
    const [currentUser] = await db.select({ totalReports: users.totalReports }).from(users).where(eq(users.id, report.reportedUserId));
    const newTotal = (currentUser?.totalReports || 0) + 1;
    
    await db
      .update(users)
      .set({ totalReports: newTotal })
      .where(eq(users.id, report.reportedUserId));
    
    return newReport;
  }

  async blockUser(blockerId: number, blockedUserId: number): Promise<UserBlock> {
    const [block] = await db
      .insert(userBlocks)
      .values({ blockerId, blockedUserId })
      .returning();
    return block;
  }

  async unblockUser(blockerId: number, blockedUserId: number): Promise<void> {
    await db
      .delete(userBlocks)
      .where(and(
        eq(userBlocks.blockerId, blockerId),
        eq(userBlocks.blockedUserId, blockedUserId)
      ));
  }

  async addToFavorites(userId: number, favoriteUserId: number): Promise<UserFavorite> {
    const [favorite] = await db
      .insert(userFavorites)
      .values({ userId, favoriteUserId })
      .returning();
    return favorite;
  }

  async removeFromFavorites(userId: number, favoriteUserId: number): Promise<void> {
    await db
      .delete(userFavorites)
      .where(and(
        eq(userFavorites.userId, userId),
        eq(userFavorites.favoriteUserId, favoriteUserId)
      ));
  }

  async getFavorites(userId: number): Promise<User[]> {
    const favorites = await db
      .select({
        user: users
      })
      .from(userFavorites)
      .innerJoin(users, eq(userFavorites.favoriteUserId, users.id))
      .where(eq(userFavorites.userId, userId));
    
    return favorites.map(f => f.user);
  }

  async isBlocked(userId: number, targetUserId: number): Promise<boolean> {
    const block = await db
      .select()
      .from(userBlocks)
      .where(or(
        and(eq(userBlocks.blockerId, userId), eq(userBlocks.blockedUserId, targetUserId)),
        and(eq(userBlocks.blockerId, targetUserId), eq(userBlocks.blockedUserId, userId))
      ))
      .limit(1);
    
    return block.length > 0;
  }

  async createVipSubscription(subscription: InsertVipSubscription): Promise<VipSubscription> {
    const subscriptionData = {
      userId: subscription.userId,
      planType: subscription.planType,
      duration: subscription.duration,
      price: subscription.price,
      currency: subscription.currency,
      paymentMethod: subscription.paymentMethod,
      transactionId: subscription.transactionId || null,
      startDate: new Date(),
      endDate: new Date(Date.now() + subscription.duration * 24 * 60 * 60 * 1000),
    };
    
    const [newSubscription] = await db
      .insert(vipSubscriptions)
      .values(subscriptionData)
      .returning();
    return newSubscription;
  }

  async activateVip(userId: number, subscriptionId: number): Promise<void> {
    const subscription = await db
      .select()
      .from(vipSubscriptions)
      .where(eq(vipSubscriptions.id, subscriptionId))
      .limit(1);
    
    if (subscription.length > 0) {
      const sub = subscription[0];
      const startDate = new Date();
      const endDate = new Date(startDate.getTime() + sub.duration * 24 * 60 * 60 * 1000);
      
      // Update subscription
      await db
        .update(vipSubscriptions)
        .set({
          status: 'completed',
          startDate,
          endDate
        })
        .where(eq(vipSubscriptions.id, subscriptionId));
      
      // Update user VIP status
      await db
        .update(users)
        .set({
          isVip: true,
          vipExpiryDate: endDate
        })
        .where(eq(users.id, userId));
    }
  }

  async checkVipStatus(userId: number): Promise<boolean> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    
    if (!user || !user.isVip || !user.vipExpiryDate) {
      return false;
    }
    
    // Check if VIP is still valid
    if (new Date() > user.vipExpiryDate) {
      // Expire VIP status
      await db
        .update(users)
        .set({ isVip: false, vipExpiryDate: null })
        .where(eq(users.id, userId));
      return false;
    }
    
    return true;
  }

  async checkDailyMessageLimit(userId: number): Promise<boolean> {
    const isVip = await this.checkVipStatus(userId);
    if (isVip) return true; // VIP users have no daily limit

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    const [dailyLimit] = await db
      .select()
      .from(dailyMessageLimits)
      .where(
        and(
          eq(dailyMessageLimits.userId, userId),
          eq(dailyMessageLimits.date, today)
        )
      )
      .limit(1);

    if (!dailyLimit) return true; // No record means no messages sent today
    
    return (dailyLimit.messagesSent || 0) < 4; // Regular users can send 4 messages per day
  }

  async incrementDailyMessageCount(userId: number): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    
    const [existingLimit] = await db
      .select()
      .from(dailyMessageLimits)
      .where(
        and(
          eq(dailyMessageLimits.userId, userId),
          eq(dailyMessageLimits.date, today)
        )
      )
      .limit(1);

    if (existingLimit) {
      await db
        .update(dailyMessageLimits)
        .set({ messagesSent: (existingLimit.messagesSent || 0) + 1 })
        .where(eq(dailyMessageLimits.id, existingLimit.id));
    } else {
      await db
        .insert(dailyMessageLimits)
        .values({
          userId,
          date: today,
          messagesSent: 1,
        });
    }
  }

  async canSendMessageToUser(senderId: number, receiverId: number): Promise<boolean> {
    const sender = await this.getUser(senderId);
    const receiver = await this.getUser(receiverId);
    
    if (!sender || !receiver) return false;

    // Check if sender is blocked by receiver
    const isBlocked = await this.isBlocked(receiverId, senderId);
    if (isBlocked) return false;

    // Check daily message limit for non-VIP users
    const canSendDaily = await this.checkDailyMessageLimit(senderId);
    if (!canSendDaily) return false;

    // Gender-based restriction: men can't send multiple messages to women until they respond
    if (sender.gender === 'Male' && receiver.gender === 'Female') {
      const [conversationState] = await db
        .select()
        .from(conversationStates)
        .where(
          and(
            eq(conversationStates.senderId, senderId),
            eq(conversationStates.receiverId, receiverId)
          )
        )
        .limit(1);

      if (conversationState && !conversationState.canSenderMessage) {
        return false; // Male sender must wait for female receiver to respond
      }
    }

    return true;
  }

  async updateConversationState(senderId: number, receiverId: number): Promise<void> {
    const sender = await this.getUser(senderId);
    const receiver = await this.getUser(receiverId);
    
    if (!sender || !receiver) return;

    const now = new Date();

    // Check if conversation state exists
    const [existingState] = await db
      .select()
      .from(conversationStates)
      .where(
        and(
          eq(conversationStates.senderId, senderId),
          eq(conversationStates.receiverId, receiverId)
        )
      )
      .limit(1);

    if (existingState) {
      // Update existing conversation state
      const updateData: any = {
        lastMessageBySender: now,
        updatedAt: now,
      };

      // If male sending to female, restrict further messages until response
      if (sender.gender === 'Male' && receiver.gender === 'Female') {
        updateData.canSenderMessage = false;
      }

      await db
        .update(conversationStates)
        .set(updateData)
        .where(eq(conversationStates.id, existingState.id));
    } else {
      // Create new conversation state
      const canSenderMessage = !(sender.gender === 'Male' && receiver.gender === 'Female');
      
      await db
        .insert(conversationStates)
        .values({
          senderId,
          receiverId,
          lastMessageBySender: now,
          lastMessageByReceiver: null,
          canSenderMessage,
        });
    }

    // Also check reverse conversation state (receiver to sender)
    const [reverseState] = await db
      .select()
      .from(conversationStates)
      .where(
        and(
          eq(conversationStates.senderId, receiverId),
          eq(conversationStates.receiverId, senderId)
        )
      )
      .limit(1);

    if (reverseState) {
      // If female is responding to male, allow male to message again
      if (receiver.gender === 'Male' && sender.gender === 'Female') {
        await db
          .update(conversationStates)
          .set({
            canSenderMessage: true,
            lastMessageByReceiver: now,
            updatedAt: now,
          })
          .where(eq(conversationStates.id, reverseState.id));
      }
    }
  }

  async banUser(userId: number): Promise<void> {
    await db
      .update(users)
      .set({ 
        isBanned: true,
        bannedAt: new Date()
      })
      .where(eq(users.id, userId));
  }

  async unbanUser(userId: number): Promise<void> {
    await db
      .update(users)
      .set({ 
        isBanned: false,
        bannedAt: null
      })
      .where(eq(users.id, userId));
  }

  async getBannedUsers(): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(eq(users.isBanned, true));
  }

  // Live streaming methods
  async startLiveStream(userId: number, title: string, description?: string): Promise<any> {
    try {
      const [stream] = await db
        .insert(liveStreams)
        .values({
          streamerId: userId,
          title,
          description,
          isActive: true,
          viewerCount: 0,
        })
        .returning();
      return stream;
    } catch (error) {
      console.error('Error starting live stream:', error);
      throw error;
    }
  }

  async stopLiveStream(userId: number): Promise<void> {
    try {
      await db
        .update(liveStreams)
        .set({ 
          isActive: false,
          endedAt: new Date(),
        })
        .where(and(eq(liveStreams.streamerId, userId), eq(liveStreams.isActive, true)));
    } catch (error) {
      console.error('Error stopping live stream:', error);
      throw error;
    }
  }

  async getLiveStreams(): Promise<any[]> {
    try {
      return await db
        .select({
          id: liveStreams.id,
          title: liveStreams.title,
          description: liveStreams.description,
          viewerCount: liveStreams.viewerCount,
          startedAt: liveStreams.startedAt,
          streamer: {
            id: users.id,
            username: users.username,
            avatar: users.avatar,
            isVip: users.isVip,
          }
        })
        .from(liveStreams)
        .leftJoin(users, eq(liveStreams.streamerId, users.id))
        .where(eq(liveStreams.isActive, true))
        .orderBy(desc(liveStreams.startedAt));
    } catch (error) {
      console.error('Error getting live streams:', error);
      return [];
    }
  }

  async joinLiveStream(streamId: number, userId: number): Promise<void> {
    try {
      await db
        .update(liveStreams)
        .set({ 
          viewerCount: sql`${liveStreams.viewerCount} + 1`
        })
        .where(eq(liveStreams.id, streamId));
    } catch (error) {
      console.error('Error joining live stream:', error);
      throw error;
    }
  }

  // Daily usage limits for regular male users (women have no limits)
  async checkDailyVideoCallLimit(userId: number): Promise<{ canCall: boolean, callsLeft: number, durationLeft: number }> {
    try {
      const user = await this.getUser(userId);
      
      // Women and VIP users have no limits
      if (!user || user.gender === 'female' || user.isVip) {
        return { canCall: true, callsLeft: 999, durationLeft: 999 };
      }

      const today = new Date().toISOString().split('T')[0];
      
      const [limitRecord] = await db
        .select()
        .from(dailyVideoCallLimits)
        .where(and(
          eq(dailyVideoCallLimits.userId, userId),
          eq(dailyVideoCallLimits.date, today)
        ));

      const currentCalls = limitRecord?.callCount || 0;
      const currentDuration = limitRecord?.totalDuration || 0;
      
      const maxCalls = 3;
      const maxDuration = 60; // 3 calls × 20 seconds each
      
      const canCall = currentCalls < maxCalls && currentDuration < maxDuration;
      const callsLeft = Math.max(0, maxCalls - currentCalls);
      const durationLeft = Math.max(0, maxDuration - currentDuration);

      return { canCall, callsLeft, durationLeft };
    } catch (error) {
      console.error('Error checking video call limit:', error);
      return { canCall: false, callsLeft: 0, durationLeft: 0 };
    }
  }

  async incrementVideoCallCount(userId: number, duration: number): Promise<void> {
    try {
      const user = await this.getUser(userId);
      
      // Skip for women and VIP users
      if (!user || user.gender === 'female' || user.isVip) {
        return;
      }

      const today = new Date().toISOString().split('T')[0];
      
      const [existingRecord] = await db
        .select()
        .from(dailyVideoCallLimits)
        .where(and(
          eq(dailyVideoCallLimits.userId, userId),
          eq(dailyVideoCallLimits.date, today)
        ));

      if (existingRecord) {
        await db
          .update(dailyVideoCallLimits)
          .set({
            callCount: existingRecord.callCount + 1,
            totalDuration: existingRecord.totalDuration + duration
          })
          .where(eq(dailyVideoCallLimits.id, existingRecord.id));
      } else {
        await db
          .insert(dailyVideoCallLimits)
          .values({
            userId,
            date: today,
            callCount: 1,
            totalDuration: duration
          });
      }
    } catch (error) {
      console.error('Error incrementing video call count:', error);
    }
  }

  async checkDailyMessageContactLimit(userId: number, targetUserId: number): Promise<{ canMessage: boolean, contactsLeft: number }> {
    try {
      const user = await this.getUser(userId);
      
      // Women and VIP users have no limits
      if (!user || user.gender === 'female' || user.isVip) {
        return { canMessage: true, contactsLeft: 999 };
      }

      const today = new Date().toISOString().split('T')[0];
      
      const [limitRecord] = await db
        .select()
        .from(dailyMessageLimits)
        .where(and(
          eq(dailyMessageLimits.userId, userId),
          eq(dailyMessageLimits.date, today)
        ));

      const contactedUserIds = limitRecord?.contactedUserIds || [];
      const maxContacts = 2;
      
      // If already contacted this user today, allow messaging
      if (contactedUserIds.includes(targetUserId.toString())) {
        return { canMessage: true, contactsLeft: Math.max(0, maxContacts - contactedUserIds.length) };
      }
      
      // Check if can contact new user
      const canMessage = contactedUserIds.length < maxContacts;
      const contactsLeft = Math.max(0, maxContacts - contactedUserIds.length);

      return { canMessage, contactsLeft };
    } catch (error) {
      console.error('Error checking message contact limit:', error);
      return { canMessage: false, contactsLeft: 0 };
    }
  }

  async incrementMessageContact(userId: number, targetUserId: number): Promise<void> {
    try {
      const user = await this.getUser(userId);
      
      // Skip for women and VIP users
      if (!user || user.gender === 'female' || user.isVip) {
        return;
      }

      const today = new Date().toISOString().split('T')[0];
      
      const [existingRecord] = await db
        .select()
        .from(dailyMessageLimits)
        .where(and(
          eq(dailyMessageLimits.userId, userId),
          eq(dailyMessageLimits.date, today)
        ));

      const targetUserIdStr = targetUserId.toString();

      if (existingRecord) {
        const contactedUserIds = existingRecord.contactedUserIds || [];
        if (!contactedUserIds.includes(targetUserIdStr)) {
          await db
            .update(dailyMessageLimits)
            .set({
              contactedUserIds: [...contactedUserIds, targetUserIdStr],
              messagesSent: existingRecord.messagesSent + 1
            })
            .where(eq(dailyMessageLimits.id, existingRecord.id));
        }
      } else {
        await db
          .insert(dailyMessageLimits)
          .values({
            userId,
            date: today,
            contactedUserIds: [targetUserIdStr],
            messagesSent: 1
          });
      }
    } catch (error) {
      console.error('Error incrementing message contact:', error);
    }
  }

  async isUserMatch(userId1: number, userId2: number): Promise<boolean> {
    try {
      // Check if both users have added each other to favorites (mutual match)
      const [user1Fav] = await db
        .select()
        .from(userFavorites)
        .where(and(
          eq(userFavorites.userId, userId1),
          eq(userFavorites.favoriteUserId, userId2)
        ));

      const [user2Fav] = await db
        .select()
        .from(userFavorites)
        .where(and(
          eq(userFavorites.userId, userId2),
          eq(userFavorites.favoriteUserId, userId1)
        ));

      return !!(user1Fav && user2Fav);
    } catch (error) {
      console.error('Error checking user match:', error);
      return false;
    }
  }

  // Monthly rewards system methods
  async updateMonthlyStats(userId: number, tokensPurchased: number = 0, likesReceived: number = 0): Promise<void> {
    try {
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
      
      const [existingStats] = await db
        .select()
        .from(monthlyUserStats)
        .where(and(
          eq(monthlyUserStats.userId, userId),
          eq(monthlyUserStats.month, currentMonth)
        ));

      if (existingStats) {
        await db
          .update(monthlyUserStats)
          .set({
            totalTokensPurchased: (parseFloat(existingStats.totalTokensPurchased) + tokensPurchased).toString(),
            totalLikesReceived: existingStats.totalLikesReceived + likesReceived,
            updatedAt: new Date()
          })
          .where(eq(monthlyUserStats.id, existingStats.id));
      } else {
        await db
          .insert(monthlyUserStats)
          .values({
            userId,
            month: currentMonth,
            totalTokensPurchased: tokensPurchased.toString(),
            totalLikesReceived: likesReceived,
          });
      }
    } catch (error) {
      console.error('Error updating monthly stats:', error);
    }
  }

  async getMonthlyTopPurchaser(month: string): Promise<{ userId: number, amount: number } | null> {
    try {
      const [topPurchaser] = await db
        .select()
        .from(monthlyUserStats)
        .where(eq(monthlyUserStats.month, month))
        .orderBy(desc(monthlyUserStats.totalTokensPurchased))
        .limit(1);

      return topPurchaser ? {
        userId: topPurchaser.userId,
        amount: parseFloat(topPurchaser.totalTokensPurchased)
      } : null;
    } catch (error) {
      console.error('Error getting top purchaser:', error);
      return null;
    }
  }

  async getMonthlyMostLikedFemale(month: string): Promise<{ userId: number, likes: number } | null> {
    try {
      const [topFemale] = await db
        .select({
          userId: monthlyUserStats.userId,
          totalLikesReceived: monthlyUserStats.totalLikesReceived,
          gender: users.gender
        })
        .from(monthlyUserStats)
        .innerJoin(users, eq(monthlyUserStats.userId, users.id))
        .where(and(
          eq(monthlyUserStats.month, month),
          eq(users.gender, 'female')
        ))
        .orderBy(desc(monthlyUserStats.totalLikesReceived))
        .limit(1);

      return topFemale ? {
        userId: topFemale.userId,
        likes: topFemale.totalLikesReceived
      } : null;
    } catch (error) {
      console.error('Error getting most liked female:', error);
      return null;
    }
  }

  async createMonthlyReward(month: string, rewardType: string, winnerId: number, rewardValue: string, criteriaValue: number): Promise<void> {
    try {
      await db
        .insert(monthlyRewards)
        .values({
          month,
          rewardType,
          winnerId,
          rewardValue,
          criteriaValue: criteriaValue.toString(),
          status: 'pending'
        });
    } catch (error) {
      console.error('Error creating monthly reward:', error);
    }
  }

  async likeUser(likerId: number, likedUserId: number): Promise<boolean> {
    try {
      // Check if already liked
      const [existingLike] = await db
        .select()
        .from(userLikes)
        .where(and(
          eq(userLikes.likerId, likerId),
          eq(userLikes.likedUserId, likedUserId)
        ));

      if (existingLike) {
        return false; // Already liked
      }

      // Add like
      await db
        .insert(userLikes)
        .values({
          likerId,
          likedUserId
        });

      // Update monthly stats for liked user if female
      const likedUser = await this.getUser(likedUserId);
      if (likedUser && likedUser.gender === 'female') {
        await this.updateMonthlyStats(likedUserId, 0, 1);
      }

      return true;
    } catch (error) {
      console.error('Error liking user:', error);
      return false;
    }
  }

  // Video call pricing system - $1 per minute
  async createVideoCallSession(sessionData: any): Promise<VideoCallSession> {
    try {
      const [session] = await db
        .insert(videoCallSessions)
        .values({
          callerId: sessionData.callerId,
          receiverId: sessionData.receiverId,
          isMatch: sessionData.isMatch || false,
          costPerMinute: sessionData.costPerMinute || "1.00",
          paymentMethod: sessionData.paymentMethod || "pending",
          status: "active"
        })
        .returning();

      return session;
    } catch (error) {
      console.error('Error creating video call session:', error);
      throw error;
    }
  }

  async endVideoCallSession(sessionId: number, duration: number): Promise<any> {
    try {
      const [session] = await db
        .select()
        .from(videoCallSessions)
        .where(eq(videoCallSessions.id, sessionId));

      if (!session) {
        throw new Error('Video call session not found');
      }

      const durationMinutes = Math.ceil(duration / 60);
      const costPerMinute = parseFloat(session.costPerMinute);
      const totalCost = (durationMinutes * costPerMinute).toFixed(2);

      // Check if user is VIP (free calls)
      const caller = await this.getUser(session.callerId);
      const isFreeForVip = caller?.isVip || false;
      const finalCost = isFreeForVip ? "0.00" : totalCost;

      await db
        .update(videoCallSessions)
        .set({
          duration,
          totalCost: finalCost,
          status: "ended",
          endedAt: new Date(),
          paymentStatus: isFreeForVip ? "paid" : "pending",
          billedAt: new Date()
        })
        .where(eq(videoCallSessions.id, sessionId));

      return {
        totalCost: finalCost,
        costPerMinute: session.costPerMinute,
        duration,
        durationMinutes,
        isFreeForVip,
        paymentMethod: session.paymentMethod
      };
    } catch (error) {
      console.error('Error ending video call session:', error);
      throw error;
    }
  }

  async getVideoCallBilling(userId: number): Promise<any[]> {
    try {
      const billing = await db
        .select({
          id: videoCallSessions.id,
          receiverId: videoCallSessions.receiverId,
          receiverUsername: users.username,
          duration: videoCallSessions.duration,
          totalCost: videoCallSessions.totalCost,
          costPerMinute: videoCallSessions.costPerMinute,
          paymentStatus: videoCallSessions.paymentStatus,
          paymentMethod: videoCallSessions.paymentMethod,
          startedAt: videoCallSessions.startedAt,
          endedAt: videoCallSessions.endedAt,
          billedAt: videoCallSessions.billedAt
        })
        .from(videoCallSessions)
        .leftJoin(users, eq(videoCallSessions.receiverId, users.id))
        .where(eq(videoCallSessions.callerId, userId))
        .orderBy(desc(videoCallSessions.startedAt));

      return billing;
    } catch (error) {
      console.error('Error getting video call billing:', error);
      return [];
    }
  }

  async processVideoCallPayment(sessionId: number, paymentMethod: string, walletAddress?: string): Promise<any> {
    try {
      const [session] = await db
        .select()
        .from(videoCallSessions)
        .where(eq(videoCallSessions.id, sessionId));

      if (!session) {
        return { success: false, error: 'Session not found' };
      }

      if (session.paymentStatus === 'paid') {
        return { success: false, error: 'Payment already processed' };
      }

      const totalCost = parseFloat(session.totalCost);
      if (totalCost === 0) {
        return { success: false, error: 'No payment required' };
      }

      const transactionId = `vcall_${sessionId}_${Date.now()}`;

      await db
        .update(videoCallSessions)
        .set({
          paymentStatus: 'paid',
          paymentMethod,
          transactionId
        })
        .where(eq(videoCallSessions.id, sessionId));

      return {
        success: true,
        transactionId,
        amount: totalCost,
        currency: 'USD'
      };
    } catch (error) {
      console.error('Error processing video call payment:', error);
      return { success: false, error: 'Payment processing failed' };
    }
  }
}

export const storage = new DatabaseStorage();
