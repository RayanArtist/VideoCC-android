import { apiRequest } from "./queryClient";
import type { LoginRequest, ForgotPasswordRequest, InsertUser, UpdateProfile, InsertMessage, UserFilter } from "@shared/schema";

export const authApi = {
  login: async (data: LoginRequest) => {
    const response = await apiRequest('POST', '/api/login', data);
    return response.json();
  },

  register: async (data: InsertUser) => {
    const response = await apiRequest('POST', '/api/register', data);
    return response.json();
  },

  logout: async () => {
    const response = await apiRequest('POST', '/api/logout');
    return response.json();
  },

  getCurrentUser: async () => {
    const response = await apiRequest('GET', '/api/me');
    return response.json();
  },

  forgotPassword: async (data: ForgotPasswordRequest) => {
    const response = await apiRequest('POST', '/api/forgot-password', data);
    return response.json();
  },

  generateSecurityCode: async () => {
    const response = await apiRequest('POST', '/api/security-code');
    return response.json();
  },

  updateProfile: async (data: UpdateProfile) => {
    const response = await apiRequest('PUT', '/api/profile', data);
    return response.json();
  },

  getUsers: async (filter?: UserFilter) => {
    const params = new URLSearchParams();
    if (filter?.minAge) params.append('minAge', filter.minAge.toString());
    if (filter?.maxAge) params.append('maxAge', filter.maxAge.toString());
    if (filter?.location) params.append('location', filter.location);
    if (filter?.search) params.append('search', filter.search);
    
    const response = await apiRequest('GET', `/api/users?${params.toString()}`);
    return response.json();
  },

  sendMessage: async (data: InsertMessage) => {
    const response = await apiRequest('POST', '/api/messages', data);
    return response.json();
  },

  getMessages: async (userId: number) => {
    const response = await apiRequest('GET', `/api/messages/${userId}`);
    return response.json();
  },

  getNotifications: async () => {
    const response = await apiRequest('GET', '/api/notifications');
    return response.json();
  },

  markNotificationAsRead: async (notificationId: number) => {
    const response = await apiRequest('PUT', `/api/notifications/${notificationId}/read`);
    return response.json();
  },

  sendVerificationCode: async (phoneNumber: string) => {
    const response = await apiRequest('POST', '/api/send-verification-code', { phoneNumber });
    return response.json();
  },

  verifyPhone: async (phoneNumber: string, verificationCode: string) => {
    const response = await apiRequest('POST', '/api/verify-phone', { phoneNumber, verificationCode });
    return response.json();
  },

  verifyPhoto: async (photo: string) => {
    const response = await apiRequest('POST', '/api/verify-photo', { photo });
    return response.json();
  },

  verifyAge: async (data: { birthDate: string; documentPhoto: string }) => {
    const response = await apiRequest('POST', '/api/verify-age', data);
    return response.json();
  },

  verifyIdentity: async (data: { idCardPhoto: string; passportPhoto: string; selfiePhoto: string }) => {
    const response = await apiRequest('POST', '/api/verify-identity', data);
    return response.json();
  },

  // VIP and social features
  getVipPlans: async () => {
    const response = await apiRequest('GET', '/api/vip-plans');
    return response.json();
  },

  purchaseVip: async (planType: string, transactionId: string) => {
    const response = await apiRequest('POST', '/api/purchase-vip', { planType, transactionId });
    return response.json();
  },

  purchaseVipWithCode: async (specialCode: string) => {
    const response = await apiRequest('POST', '/api/purchase-vip', { specialCode });
    return response.json();
  },

  reportUser: async (reportedUserId: number, reason: string, description?: string) => {
    const response = await apiRequest('POST', '/api/report-user', { reportedUserId, reason, description });
    return response.json();
  },

  blockUser: async (userId: number) => {
    const response = await apiRequest('POST', '/api/block-user', { userId });
    return response.json();
  },

  unblockUser: async (userId: number) => {
    const response = await apiRequest('POST', '/api/unblock-user', { userId });
    return response.json();
  },

  addToFavorites: async (userId: number) => {
    const response = await apiRequest('POST', '/api/add-favorite', { userId });
    return response.json();
  },

  removeFromFavorites: async (userId: number) => {
    const response = await apiRequest('DELETE', `/api/remove-favorite/${userId}`);
    return response.json();
  },

  getFavorites: async () => {
    const response = await apiRequest('GET', '/api/favorites');
    return response.json();
  },
};
