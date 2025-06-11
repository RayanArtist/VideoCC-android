import { pgTable, text, serial, timestamp, integer, boolean, date, decimal, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
  age: integer("age"),
  gender: text("gender"),
  country: text("country"),
  city: text("city"),
  interests: text("interests"),
  relationshipStatus: text("relationship_status"),
  reasonForBeingHere: text("reason_for_being_here"),
  phoneNumber: text("phone_number"),
  phone: text("phone"),
  isPhoneVerified: boolean("is_phone_verified").default(false),
  avatar: text("avatar"),
  isPhotoVerified: boolean("is_photo_verified").default(false),
  isAgeVerified: boolean("is_age_verified").default(false),
  isIdentityVerified: boolean("is_identity_verified").default(false),
  bio: text("bio"),
  location: text("location"),
  isOnline: boolean("is_online").default(false),
  lastSeen: timestamp("last_seen").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  isVip: boolean("is_vip").default(false),
  vipExpiryDate: timestamp("vip_expiry_date"),
  trustScore: integer("trust_score").default(50),
  totalReports: integer("total_reports").default(0),
  isBlocked: boolean("is_blocked").default(false),
  isBanned: boolean("is_banned").default(false),
  bannedAt: timestamp("banned_at"),
  isAdmin: boolean("is_admin").default(false),
});

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: serial("user_id").references(() => users.id),
  expiresAt: timestamp("expires_at").notNull(),
});

export const securityCodes = pgTable("security_codes", {
  id: serial("id").primaryKey(),
  code: text("code").notNull(),
  isUsed: text("is_used").default("false"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  content: text("content"),
  type: text("type").default("info"),
  relatedId: integer("related_id"),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").references(() => users.id).notNull(),
  receiverId: integer("receiver_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  messageType: text("message_type").default("text"), // text, image, voice, video
  fileUrl: text("file_url"),
  isRead: boolean("is_read").default(false),
  isDisappearing: boolean("is_disappearing").default(false),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// User reports table
export const userReports = pgTable("user_reports", {
  id: serial("id").primaryKey(),
  reporterId: integer("reporter_id").references(() => users.id).notNull(),
  reportedUserId: integer("reported_user_id").references(() => users.id).notNull(),
  reason: text("reason").notNull(), // spam, inappropriate, fake, harassment
  description: text("description"),
  status: text("status").default("pending"), // pending, reviewed, resolved
  createdAt: timestamp("created_at").defaultNow(),
});

// User blocks table
export const userBlocks = pgTable("user_blocks", {
  id: serial("id").primaryKey(),
  blockerId: integer("blocker_id").references(() => users.id).notNull(),
  blockedUserId: integer("blocked_user_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Favorites/Wishlist table
export const userFavorites = pgTable("user_favorites", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  favoriteUserId: integer("favorite_user_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// VIP subscriptions table
export const vipSubscriptions = pgTable("vip_subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  planType: text("plan_type").notNull(), // monthly, quarterly, yearly
  duration: integer("duration").notNull(), // in days
  price: integer("price").notNull(), // in cents
  currency: text("currency").notNull(), // USDT, IRT
  paymentMethod: text("payment_method").notNull(), // crypto, toman
  transactionId: text("transaction_id"),
  status: text("status").default("pending"), // pending, completed, expired, cancelled
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const dailyMessageLimits = pgTable("daily_message_limits", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  date: text("date").notNull(), // YYYY-MM-DD format
  messagesSent: integer("messages_sent").default(0),
  contactedUserIds: text("contacted_user_ids").array().default([]), // Track unique users messaged
  createdAt: timestamp("created_at").defaultNow(),
});

// Daily Video Call Limits (only for regular male users)
export const dailyVideoCallLimits = pgTable("daily_video_call_limits", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  date: text("date").notNull(), // YYYY-MM-DD format
  callCount: integer("call_count").default(0),
  totalDuration: integer("total_duration").default(0), // in seconds
  createdAt: timestamp("created_at").defaultNow(),
});

// Video Call Sessions Tracking
export const videoCallSessions = pgTable("video_call_sessions", {
  id: serial("id").primaryKey(),
  callerId: integer("caller_id").references(() => users.id).notNull(),
  receiverId: integer("receiver_id").references(() => users.id).notNull(),
  duration: integer("duration").default(0), // in seconds
  status: text("status").notNull().default("pending"), // pending, active, ended, rejected
  isMatch: boolean("is_match").default(false), // Only matches can make calls for regular users
  costPerMinute: decimal("cost_per_minute", { precision: 5, scale: 2 }).default("1.00"), // $1 per minute
  totalCost: decimal("total_cost", { precision: 10, scale: 2 }).default("0.00"),
  paymentStatus: text("payment_status").default("pending"), // pending, paid, failed
  paymentMethod: text("payment_method"), // crypto, tokens, vip_free
  transactionId: text("transaction_id"),
  startedAt: timestamp("started_at").defaultNow(),
  endedAt: timestamp("ended_at"),
  billedAt: timestamp("billed_at"),
});

// Monthly User Statistics
export const monthlyUserStats = pgTable("monthly_user_stats", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  month: text("month").notNull(), // YYYY-MM format
  totalTokensPurchased: decimal("total_tokens_purchased", { precision: 15, scale: 2 }).default("0.00"),
  totalLikesReceived: integer("total_likes_received").default(0),
  totalProfileViews: integer("total_profile_views").default(0),
  vipPurchases: integer("vip_purchases").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Monthly Rewards System
export const monthlyRewards = pgTable("monthly_rewards", {
  id: serial("id").primaryKey(),
  month: text("month").notNull(), // YYYY-MM format
  rewardType: text("reward_type").notNull(), // "top_purchaser", "most_liked_female"
  winnerId: integer("winner_id").references(() => users.id).notNull(),
  rewardValue: text("reward_value").notNull(), // "1_month_vip", "500_tokens"
  criteriaValue: decimal("criteria_value", { precision: 15, scale: 2 }).notNull(), // Amount that won
  status: text("status").default("pending"), // pending, awarded, claimed
  awardedAt: timestamp("awarded_at").defaultNow(),
  claimedAt: timestamp("claimed_at"),
});

// User Likes Tracking
export const userLikes = pgTable("user_likes", {
  id: serial("id").primaryKey(),
  likerId: integer("liker_id").references(() => users.id).notNull(),
  likedUserId: integer("liked_user_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const conversationStates = pgTable("conversation_states", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").references(() => users.id).notNull(),
  receiverId: integer("receiver_id").references(() => users.id).notNull(),
  lastMessageBySender: timestamp("last_message_by_sender"),
  lastMessageByReceiver: timestamp("last_message_by_receiver"),
  canSenderMessage: boolean("can_sender_message").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const userPhotos = pgTable("user_photos", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  photoUrl: text("photo_url").notNull(),
  isProfilePicture: boolean("is_profile_picture").default(false),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  sentMessages: many(messages, { relationName: "sender" }),
  receivedMessages: many(messages, { relationName: "receiver" }),
  notifications: many(notifications),
  reportsSubmitted: many(userReports, { relationName: "reporter" }),
  reportsReceived: many(userReports, { relationName: "reported" }),
  blocksInitiated: many(userBlocks, { relationName: "blocker" }),
  blocksReceived: many(userBlocks, { relationName: "blocked" }),
  favorites: many(userFavorites, { relationName: "user" }),
  favoritedBy: many(userFavorites, { relationName: "favorite" }),
  vipSubscriptions: many(vipSubscriptions),
  dailyMessageLimits: many(dailyMessageLimits),
  dailyVideoCallLimits: many(dailyVideoCallLimits),
  videoCallSessionsAsCaller: many(videoCallSessions, { relationName: "caller" }),
  videoCallSessionsAsReceiver: many(videoCallSessions, { relationName: "receiver" }),
  monthlyStats: many(monthlyUserStats),
  rewardsWon: many(monthlyRewards),
  likesGiven: many(userLikes, { relationName: "liker" }),
  likesReceived: many(userLikes, { relationName: "liked" }),
  conversationsAsSender: many(conversationStates, { relationName: "sender" }),
  conversationsAsReceiver: many(conversationStates, { relationName: "receiver" }),
  photos: many(userPhotos),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
    relationName: "sender",
  }),
  receiver: one(users, {
    fields: [messages.receiverId],
    references: [users.id],
    relationName: "receiver",
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const userReportsRelations = relations(userReports, ({ one }) => ({
  reporter: one(users, { fields: [userReports.reporterId], references: [users.id], relationName: "reporter" }),
  reportedUser: one(users, { fields: [userReports.reportedUserId], references: [users.id], relationName: "reported" }),
}));

export const userBlocksRelations = relations(userBlocks, ({ one }) => ({
  blocker: one(users, { fields: [userBlocks.blockerId], references: [users.id], relationName: "blocker" }),
  blockedUser: one(users, { fields: [userBlocks.blockedUserId], references: [users.id], relationName: "blocked" }),
}));

export const userFavoritesRelations = relations(userFavorites, ({ one }) => ({
  user: one(users, { fields: [userFavorites.userId], references: [users.id], relationName: "user" }),
  favoriteUser: one(users, { fields: [userFavorites.favoriteUserId], references: [users.id], relationName: "favorite" }),
}));

export const vipSubscriptionsRelations = relations(vipSubscriptions, ({ one }) => ({
  user: one(users, { fields: [vipSubscriptions.userId], references: [users.id] }),
}));

export const dailyMessageLimitsRelations = relations(dailyMessageLimits, ({ one }) => ({
  user: one(users, { fields: [dailyMessageLimits.userId], references: [users.id] }),
}));

export const dailyVideoCallLimitsRelations = relations(dailyVideoCallLimits, ({ one }) => ({
  user: one(users, { fields: [dailyVideoCallLimits.userId], references: [users.id] }),
}));

export const videoCallSessionsRelations = relations(videoCallSessions, ({ one }) => ({
  caller: one(users, { fields: [videoCallSessions.callerId], references: [users.id], relationName: "caller" }),
  receiver: one(users, { fields: [videoCallSessions.receiverId], references: [users.id], relationName: "receiver" }),
}));

export const monthlyUserStatsRelations = relations(monthlyUserStats, ({ one }) => ({
  user: one(users, { fields: [monthlyUserStats.userId], references: [users.id] }),
}));

export const monthlyRewardsRelations = relations(monthlyRewards, ({ one }) => ({
  winner: one(users, { fields: [monthlyRewards.winnerId], references: [users.id] }),
}));

export const userLikesRelations = relations(userLikes, ({ one }) => ({
  liker: one(users, { fields: [userLikes.likerId], references: [users.id], relationName: "liker" }),
  likedUser: one(users, { fields: [userLikes.likedUserId], references: [users.id], relationName: "liked" }),
}));

export const conversationStatesRelations = relations(conversationStates, ({ one }) => ({
  sender: one(users, { fields: [conversationStates.senderId], references: [users.id], relationName: "sender" }),
  receiver: one(users, { fields: [conversationStates.receiverId], references: [users.id], relationName: "receiver" }),
}));

// Live Streaming System
export const liveStreams = pgTable("live_streams", {
  id: serial("id").primaryKey(),
  streamerId: integer("streamer_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  thumbnailUrl: text("thumbnail_url"),
  isActive: boolean("is_active").default(true),
  viewerCount: integer("viewer_count").default(0),
  totalEarnings: decimal("total_earnings", { precision: 10, scale: 2 }).default("0"),
  startedAt: timestamp("started_at").defaultNow(),
  endedAt: timestamp("ended_at"),
});

// Virtual Gifts System
export const virtualGifts = pgTable("virtual_gifts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  icon: text("icon").notNull(), // emoji or icon name
  price: decimal("price", { precision: 8, scale: 2 }).notNull(), // price in USD
  animationEffect: text("animation_effect"), // for special effects
  rarity: text("rarity").notNull().default("common"), // common, rare, epic, legendary
});

// Gift Transactions
export const giftTransactions = pgTable("gift_transactions", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").notNull().references(() => users.id),
  receiverId: integer("receiver_id").notNull().references(() => users.id),
  streamId: integer("stream_id").references(() => liveStreams.id),
  giftId: integer("gift_id").notNull().references(() => virtualGifts.id),
  quantity: integer("quantity").default(1),
  totalAmount: decimal("total_amount", { precision: 8, scale: 2 }).notNull(),
  sentAt: timestamp("sent_at").defaultNow(),
});

// Exclusive Content
export const exclusiveContent = pgTable("exclusive_content", {
  id: serial("id").primaryKey(),
  creatorId: integer("creator_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  contentType: text("content_type").notNull(), // video, photo, audio, text
  contentUrl: text("content_url"),
  thumbnailUrl: text("thumbnail_url"),
  price: decimal("price", { precision: 8, scale: 2 }).notNull(),
  isActive: boolean("is_active").default(true),
  purchaseCount: integer("purchase_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Content Purchases
export const contentPurchases = pgTable("content_purchases", {
  id: serial("id").primaryKey(),
  buyerId: integer("buyer_id").notNull().references(() => users.id),
  contentId: integer("content_id").notNull().references(() => exclusiveContent.id),
  amount: decimal("amount", { precision: 8, scale: 2 }).notNull(),
  purchasedAt: timestamp("purchased_at").defaultNow(),
});

// Earnings Tracking
export const earnings = pgTable("earnings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  source: text("source").notNull(), // gifts, content, subscriptions
  sourceId: integer("source_id"), // reference to transaction
  earnedAt: timestamp("earned_at").defaultNow(),
  status: text("status").default("pending"), // pending, paid, withdrawn
});

// Withdrawal Requests (VCC Token System)
export const vccWithdrawalRequests = pgTable("vcc_withdrawal_requests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  vccAmount: decimal("vcc_amount", { precision: 15, scale: 2 }).notNull(), // VCC tokens to withdraw
  usdtAmount: decimal("usdt_amount", { precision: 10, scale: 2 }).notNull(), // USDT equivalent
  feeVcc: decimal("fee_vcc", { precision: 15, scale: 2 }).notNull(), // 30% platform fee in VCC (women keep 70%)
  feeUsdt: decimal("fee_usdt", { precision: 10, scale: 2 }).notNull(), // Fee in USDT
  finalUsdt: decimal("final_usdt", { precision: 10, scale: 2 }).notNull(), // Final USDT after fee (70% for women)
  walletAddress: text("wallet_address").notNull(),
  exchangeRate: decimal("exchange_rate", { precision: 10, scale: 6 }).notNull(),
  status: text("status").notNull().default("pending"), // 'pending', 'approved', 'completed', 'rejected'
  transactionHash: text("transaction_hash"),
  requestedAt: timestamp("requested_at").defaultNow(),
  processedAt: timestamp("processed_at"),
  rejectionReason: text("rejection_reason"),
});

// Relations for new tables
export const liveStreamsRelations = relations(liveStreams, ({ one, many }) => ({
  streamer: one(users, { fields: [liveStreams.streamerId], references: [users.id] }),
  giftTransactions: many(giftTransactions),
}));

export const giftTransactionsRelations = relations(giftTransactions, ({ one }) => ({
  sender: one(users, { fields: [giftTransactions.senderId], references: [users.id], relationName: "giftSender" }),
  receiver: one(users, { fields: [giftTransactions.receiverId], references: [users.id], relationName: "giftReceiver" }),
  stream: one(liveStreams, { fields: [giftTransactions.streamId], references: [liveStreams.id] }),
  gift: one(virtualGifts, { fields: [giftTransactions.giftId], references: [virtualGifts.id] }),
}));

export const exclusiveContentRelations = relations(exclusiveContent, ({ one, many }) => ({
  creator: one(users, { fields: [exclusiveContent.creatorId], references: [users.id] }),
  purchases: many(contentPurchases),
}));

export const contentPurchasesRelations = relations(contentPurchases, ({ one }) => ({
  buyer: one(users, { fields: [contentPurchases.buyerId], references: [users.id] }),
  content: one(exclusiveContent, { fields: [contentPurchases.contentId], references: [exclusiveContent.id] }),
}));

export const earningsRelations = relations(earnings, ({ one }) => ({
  user: one(users, { fields: [earnings.userId], references: [users.id] }),
}));

// VCC Token System
export const userTokens = pgTable("user_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  balance: decimal("balance", { precision: 15, scale: 2 }).default("0.00"), // No initial tokens for users
  lockedBalance: decimal("locked_balance", { precision: 15, scale: 2 }).default("0.00"), // Locked for pending withdrawals
  totalEarned: decimal("total_earned", { precision: 15, scale: 2 }).default("0.00"), // Lifetime earnings
  lastWithdrawalDate: date("last_withdrawal_date"), // Daily withdrawal limit tracking
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Platform Token Reserve (1 Billion Total)
export const platformTokens = pgTable("platform_tokens", {
  id: serial("id").primaryKey(),
  totalSupply: decimal("total_supply", { precision: 15, scale: 2 }).default("1000000000.00"), // 1 Billion VCC total
  circulating: decimal("circulating", { precision: 15, scale: 2 }).default("0.00"), // Tokens in user wallets
  reserved: decimal("reserved", { precision: 15, scale: 2 }).default("1000000000.00"), // Available for distribution
  burned: decimal("burned", { precision: 15, scale: 2 }).default("0.00"), // Burned tokens
  lastUpdated: timestamp("last_updated").defaultNow(),
});

// Token Transaction History
export const tokenTransactions = pgTable("token_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  type: text("type").notNull(), // 'initial', 'earn', 'spend', 'withdraw', 'gift_received', 'stream_income', 'content_sale'
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  balanceAfter: decimal("balance_after", { precision: 15, scale: 2 }).notNull(),
  description: text("description").notNull(),
  relatedId: integer("related_id"), // ID of related entity
  relatedType: text("related_type"), // 'stream', 'gift', 'content', 'withdrawal'
  createdAt: timestamp("created_at").defaultNow(),
});

// VCC to USDT Exchange Rate
export const exchangeRates = pgTable("exchange_rates", {
  id: serial("id").primaryKey(),
  vccToUsdt: decimal("vcc_to_usdt", { precision: 10, scale: 6 }).notNull().default("0.010000"), // 100 VCC = 1 USDT
  isActive: boolean("is_active").default(true),
  updatedBy: integer("updated_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const vccWithdrawalRequestsRelations = relations(vccWithdrawalRequests, ({ one }) => ({
  user: one(users, { fields: [vccWithdrawalRequests.userId], references: [users.id] }),
}));

export const userTokensRelations = relations(userTokens, ({ one, many }) => ({
  user: one(users, { fields: [userTokens.userId], references: [users.id] }),
  transactions: many(tokenTransactions),
}));

export const tokenTransactionsRelations = relations(tokenTransactions, ({ one }) => ({
  user: one(users, { fields: [tokenTransactions.userId], references: [users.id] }),
}));

export const exchangeRatesRelations = relations(exchangeRates, ({ one }) => ({
  updatedBy: one(users, { fields: [exchangeRates.updatedBy], references: [users.id] }),
}));

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  age: true,
  gender: true,
  country: true,
  city: true,
  phone: true,
  bio: true,
}).extend({
  confirmPassword: z.string().min(1, "Confirm password is required"),
  securityCode: z.string().min(1, "Security code is required"),
});

export const updateProfileSchema = createInsertSchema(users).pick({
  username: true,
  age: true,
  gender: true,
  country: true,
  city: true,
  interests: true,
  relationshipStatus: true,
  reasonForBeingHere: true,
  phoneNumber: true,
  isPhoneVerified: true,
  isPhotoVerified: true,
  isAgeVerified: true,
  isIdentityVerified: true,
  bio: true,
  avatar: true,
}).partial();

export const verificationUpdateSchema = createInsertSchema(users).pick({
  phoneNumber: true,
  isPhoneVerified: true,
  avatar: true,
  isPhotoVerified: true,
  isAgeVerified: true,
  isIdentityVerified: true,
}).partial();

export const verificationSchema = z.object({
  phoneNumber: z.string().min(1, "شماره تماس الزامی است"),
  verificationCode: z.string().min(4, "کد تایید باید حداقل ۴ رقم باشد"),
});

export const photoUploadSchema = z.object({
  photo: z.string().min(1, "انتخاب عکس الزامی است"),
});

export const loginSchema = z.object({
  username: z.string().min(1, "نام کاربری الزامی است"),
  password: z.string().min(1, "رمز عبور الزامی است"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("آدرس ایمیل معتبر نیست"),
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  receiverId: true,
  content: true,
  messageType: true,
  fileUrl: true,
  isDisappearing: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).pick({
  userId: true,
  title: true,
  message: true,
  content: true,
  type: true,
  relatedId: true,
});

export const userFilterSchema = z.object({
  minAge: z.number().optional(),
  maxAge: z.number().optional(),
  location: z.string().optional(),
  search: z.string().optional(),
  gender: z.string().optional(),
  relationshipStatus: z.string().optional(),
  isVerified: z.boolean().optional(),
  vipOnly: z.boolean().optional(),
});

export const userReportSchema = createInsertSchema(userReports).pick({
  reporterId: true,
  reportedUserId: true,
  reason: true,
  description: true,
});

export const vipSubscriptionSchema = createInsertSchema(vipSubscriptions).pick({
  userId: true,
  planType: true,
  duration: true,
  price: true,
  currency: true,
  paymentMethod: true,
  transactionId: true,
});

export const insertPhotoSchema = createInsertSchema(userPhotos).pick({
  photoUrl: true,
  isProfilePicture: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpdateProfile = z.infer<typeof updateProfileSchema>;
export type User = typeof users.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type SecurityCode = typeof securityCodes.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type UserReport = typeof userReports.$inferSelect;
export type UserBlock = typeof userBlocks.$inferSelect;
export type UserFavorite = typeof userFavorites.$inferSelect;
export type VipSubscription = typeof vipSubscriptions.$inferSelect;
export type LoginRequest = z.infer<typeof loginSchema>;
export type ForgotPasswordRequest = z.infer<typeof forgotPasswordSchema>;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type InsertUserReport = z.infer<typeof userReportSchema>;
export type InsertVipSubscription = z.infer<typeof vipSubscriptionSchema>;
export type UserFilter = z.infer<typeof userFilterSchema>;
export type DailyMessageLimit = typeof dailyMessageLimits.$inferSelect;
export type DailyVideoCallLimit = typeof dailyVideoCallLimits.$inferSelect;
export type VideoCallSession = typeof videoCallSessions.$inferSelect;
export type MonthlyUserStats = typeof monthlyUserStats.$inferSelect;
export type MonthlyReward = typeof monthlyRewards.$inferSelect;
export type UserLike = typeof userLikes.$inferSelect;
export type ConversationState = typeof conversationStates.$inferSelect;
export type UserPhoto = typeof userPhotos.$inferSelect;
export type InsertPhoto = z.infer<typeof insertPhotoSchema>;
