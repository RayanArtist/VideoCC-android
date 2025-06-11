// Translation system for the app
export type Language = 'en' | 'fa' | 'zh' | 'tr' | 'de' | 'es' | 'fr' | 'ru' | 'ar' | 'ja';

export const languages = {
  en: 'English',
  fa: 'فارسی',
  zh: '中文',
  tr: 'Türkçe', 
  de: 'Deutsch',
  es: 'Español',
  fr: 'Français',
  ru: 'Русский',
  ar: 'العربية',
  ja: '日本語'
};

export const translations = {
  en: {
    // App name
    appName: 'Video.C.C',
    
    // Common UI elements
    ok: 'OK',
    cancel: 'Cancel',
    close: 'Close',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    add: 'Add',
    remove: 'Remove',
    confirm: 'Confirm',
    yes: 'Yes',
    no: 'No',
    back: 'Back',
    next: 'Next',
    finish: 'Finish',
    continue: 'Continue',
    search: 'Search',
    filter: 'Filter',
    sort: 'Sort',
    refresh: 'Refresh',
    
    // Navigation
    home: 'Home',
    profile: 'Profile',
    settings: 'Settings',
    notifications: 'Notifications',
    messages: 'Messages',
    favorites: 'Favorites',
    help: 'Help',
    about: 'About',
    logout: 'Logout',
    
    // Authentication
    login: 'Login',
    register: 'Register',
    username: 'Username',
    password: 'Password',
    email: 'Email',
    confirmPassword: 'Confirm Password',
    forgotPassword: 'Forgot Password?',
    rememberMe: 'Remember Me',
    loginSuccess: 'Login successful',
    loginError: 'Login failed',
    registerSuccess: 'Registration successful',
    registerError: 'Registration failed',
    
    // User profile
    age: 'Age',
    gender: 'Gender',
    male: 'Male',
    female: 'Female',
    country: 'Country',
    city: 'City',
    bio: 'Bio',
    interests: 'Interests',
    photos: 'Photos',
    
    // VIP features
    vip: 'VIP',
    vipMembership: 'VIP Membership',
    upgradeToVip: 'Upgrade to VIP',
    vipFeatures: 'VIP Features',
    vipPrice: 'VIP Price',
    purchaseVip: 'Purchase VIP',
    
    // Messaging
    sendMessage: 'Send Message',
    typeMessage: 'Type a message...',
    messageHistory: 'Message History',
    onlineNow: 'Online Now',
    lastSeen: 'Last seen',
    
    // General status
    online: 'Online',
    offline: 'Offline',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    
    // Profile menu translations
    photoGallery: 'Photo Gallery',
    dailyGifts: 'Daily Gifts',
    todaysGift: "Today's Gift",
    clickToReceiveGift: 'Click to receive daily gift',
    receiveDailyGift: 'Receive Daily Gift',
    likedUsers: 'Users I Liked',
    usersWhoLikedMe: 'Users Who Liked Me',
    usersILiked: 'Users I Liked',
    noLikedUsers: 'No liked users yet',
    noOneLikedMe: 'No one has liked you yet',
    termsAndConditions: 'Terms and Conditions',
    blockList: 'Block List',
    blockedUsers: 'Users you have blocked:',
    noBlockedUsers: 'No blocked users',
    saveChanges: 'Save Changes',
    receiveNewMessages: 'Receive new messages',
    systemNotifications: 'System notifications',
    privacy: 'Privacy',
    hideOnlineStatus: 'Hide online status',
    giftReceived: 'Gift Received!',
    coinsAdded: '10 VCC coins have been added to your account',
    
    // Profile completion translations
    profileCompletionWarning: 'Profile Completion Warning',
    completeProfileToContinue: 'Complete your profile to continue using the app',
    timeRemaining: 'Time remaining',
    hours: 'hours',
    and: 'and',
    minutes: 'minutes',
    completeProfile: 'Complete Profile',
    
    // Message translations
    messageSent: 'Message sent successfully',
    messageReceived: 'New message received',
    typingIndicator: 'is typing...',
    messageDelivered: 'Message delivered',
    messageRead: 'Message read',
    noMessages: 'No messages yet',
    startConversation: 'Start a conversation',
    messageDeleted: 'Message deleted',
    messageEdited: 'Message edited',
    replyToMessage: 'Reply to message',
    forwardMessage: 'Forward message',
    copyMessage: 'Copy message',
    selectMessage: 'Select message',
    deleteForEveryone: 'Delete for everyone',
    deleteForMe: 'Delete for me',
    messageOptions: 'Message options',
    chatInfo: 'Chat info',
    muteChat: 'Mute chat',
    unmuteChat: 'Unmute chat',
    clearChat: 'Clear chat',
    blockUser: 'Block user',
    unblockUser: 'Unblock user',
    reportUser: 'Report user',
    addToFavorites: 'Add to favorites',
    removeFromFavorites: 'Remove from favorites',
    
    // Additional UI translations
    submit: 'Submit',
    upload: 'Upload',
    download: 'Download',
    share: 'Share',
    like: 'Like',
    comment: 'Comment',
    follow: 'Follow',
    unfollow: 'Unfollow',
    
    // Profile and user interface
    editProfile: 'Edit Profile',
    viewProfile: 'View Profile',
    changeLanguage: 'Change Language',
    contactSupport: 'Contact Support',
    supportEmail: 'Support Email',
    responseTime: 'Response Time',
    phoneVerificationIssue: 'Phone Verification Issue',
    registrationIssue: 'Registration Issue',
    loginIssue: 'Login Issue',
    vipPaymentIssue: 'VIP Payment Issue',
    improvementSuggestion: 'Improvement Suggestion',
    other: 'Other',
    selectSubject: 'Select Subject',
    mainPhoto: 'Main Photo',
    additionalPhotos: 'Additional Photos',
    uploadPhoto: 'Upload Photo',
    
    // Translation system specific
    translateMessage: 'Translate Message',
    originalText: 'Original Text',
    translatedText: 'Translated Text',
    autoTranslate: 'Auto Translate',
    translateAll: 'Translate All',
    languageDetected: 'Language Detected',
    translationComplete: 'Translation Complete',
    translationFailed: 'Translation Failed',
    
    // Support interface
    pleaseDescribeProblem: 'Please describe your problem or question. Your message will be sent directly to the support team.',
    yourMessage: 'Your Message',
    describeIssueInDetail: 'Describe your issue or question in detail...',
    upTo24Hours: 'Up to 24 hours',
    
    // Missing translation keys found in console
    aboutMe: 'About Me',
    languageSettings: 'Language Settings',
    selectLanguage: 'Select Language',
    appSlogan: 'Professional Video Communication Platform'
  }
};

export const useTranslation = (language: Language) => {
  return (key: string): string => {
    // Always use English for now since we only have English translations
    const translation = translations.en;
    
    const value = translation[key as keyof typeof translation];
    if (value === undefined) {
      console.warn(`Translation key not found: ${key} for language: ${language}`);
      return key;
    }
    
    return value as string;
  };
};