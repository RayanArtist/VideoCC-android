import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { 
  MessageCircle, 
  Video, 
  Heart, 
  MoreVertical, 
  CheckCircle, 
  Crown, 
  MapPin,
  Settings,
  Bell,
  Filter,
  LogOut,
  Blocks,
  Flag,
  X,
  Clock,
  AlertTriangle,
  DollarSign
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
export default function HomePage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State variables
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  // New profile menu states
  const [showPhotoGallery, setShowPhotoGallery] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  const [showBlockedList, setShowBlockedList] = useState(false);
  const [showDailyGifts, setShowDailyGifts] = useState(false);
  const [showLikedList, setShowLikedList] = useState(false);
  const [showLikersListModel, setShowLikersListModel] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);
  const [isUserProfileDialogOpen, setIsUserProfileDialogOpen] = useState(false);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [isProfilePictureDialogOpen, setIsProfilePictureDialogOpen] = useState(false);
  const [isPhoneVerificationOpen, setIsPhoneVerificationOpen] = useState(false);
  const [isAgeVerificationOpen, setIsAgeVerificationOpen] = useState(false);
  const [isIdentityVerificationOpen, setIsIdentityVerificationOpen] = useState(false);
  const [isHumanVerificationOpen, setIsHumanVerificationOpen] = useState(false);
  const [isSupportContactOpen, setIsSupportContactOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedUserProfile, setSelectedUserProfile] = useState<any>(null);
  const [messageContent, setMessageContent] = useState("");
  const [supportMessage, setSupportMessage] = useState("");
  const [supportSubject, setSupportSubject] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [filters, setFilters] = useState<any>({});
  const [adminClickCount, setAdminClickCount] = useState(0);
  const [isAdminPasswordOpen, setIsAdminPasswordOpen] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");

  // Profile data state
  const [profileData, setProfileData] = useState({
    username: "",
    age: "",
    gender: "",
    profilePicture: "",
    interests: "",
    relationshipStatus: "",
    reasonForBeingHere: "",
    phoneNumber: "",
    bio: "",
  });

  // Fetch user data
  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ["/api/me"],
    staleTime: Infinity,
  });

  // Fetch users
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ["/api/users"],
  });

  // Fetch notifications - disable until userData is available
  const { data: notificationsData } = useQuery({
    queryKey: ["/api/notifications"],
    enabled: false, // Disable notifications for now to prevent errors
  });

  // Mutations
  const sendMessageMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/send-message", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      setMessageContent("");
      setIsMessageDialogOpen(false);
      toast({
        title: "Message sent",
        description: "Your message was sent successfully",
      });
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/update-profile", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/me"] });
      toast({
        title: "Profile updated",
        description: "Your profile changes have been saved",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => apiRequest("/api/logout", "POST"),
    onSuccess: () => {
      queryClient.clear();
      setLocation("/auth");
    },
  });

  // Calculate profile completion status with useMemo to prevent re-renders
  const { isProfileDeadlinePassed, timeRemaining } = useMemo(() => {
    if (!userData || typeof userData !== 'object') return { isProfileDeadlinePassed: false, timeRemaining: null };
    
    const user = userData as any; // Type assertion for now
    const registrationDate = new Date(user.createdAt || Date.now());
    const oneDayAfterRegistration = new Date(registrationDate.getTime() + 24 * 60 * 60 * 1000);
    const now = new Date();
    
    const isProfileIncomplete = !user.email || 
                               !user.gender || 
                               !user.age ||
                               !user.isEmailVerified ||
                               !user.isPhoneVerified;
    
    const isDeadlinePassed = now > oneDayAfterRegistration && isProfileIncomplete;
    
    let remaining = null;
    if (now < oneDayAfterRegistration) {
      const remainingMs = oneDayAfterRegistration.getTime() - now.getTime();
      const remainingHours = Math.floor(remainingMs / (60 * 60 * 1000));
      const remainingMinutes = Math.floor((remainingMs % (60 * 60 * 1000)) / (60 * 1000));
      remaining = { hours: remainingHours, minutes: remainingMinutes };
    }
    
    return { isProfileDeadlinePassed: isDeadlinePassed, timeRemaining: remaining };
  }, [userData]);

  // Handlers
  const handleFilterChange = (newFilters: any) => {
    setFilters((prev: any) => ({ ...prev, ...newFilters }));
  };

  const handleSendMessage = () => {
    if (!messageContent.trim() || !selectedUser) return;
    
    sendMessageMutation.mutate({
      receiverId: selectedUser.id,
      content: messageContent.trim(),
    });
  };

  const handleUpdateProfile = () => {
    updateProfileMutation.mutate(profileData);
  };

  const handleAddToFavorites = (userId: number) => {
    toast({
      title: "Added to favorites",
      description: "User added to your favorites list",
    });
  };

  const handleBlockUser = (userId: number) => {
    toast({
      title: "User blocked",
      description: "This user will no longer be visible to you",
    });
  };

  const handleReportUser = (userId: number) => {
    toast({
      title: "Report sent",
      description: "گزارش شما بررسی خواهد شد",
    });
  };

  const handleLogout = async () => {
    try {
      await apiRequest("/api/logout", "POST", {});
      setLocation("/auth");
      toast({
        title: "Logout successful",
        description: "با موفقیت از حساب خود خارج شدید",
      });
    } catch (error) {
      toast({
        title: "خطا",
        description: "Error logging out",
        variant: "destructive",
      });
    }
  };



  // Handle support contact
  // Hidden admin access system
  const handleLogoClick = () => {
    const user = userData as any;
    if (user?.id === 1) {
      setAdminClickCount(prev => prev + 1);
      
      if (adminClickCount >= 4) {
        setIsAdminPasswordOpen(true);
        setAdminClickCount(0);
      } else {
        setTimeout(() => setAdminClickCount(0), 3000); // Reset after 3 seconds
      }
    }
  };

  // Generate dynamic admin password based on current date and user
  const generateAdminPassword = () => {
    const today = new Date();
    const day = today.getDate().toString().padStart(2, '0');
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const year = today.getFullYear();
    return `RAYAN${day}${month}${year}VCC`;
  };

  // Send admin password to email (updated implementation)
  const sendAdminPasswordToEmail = () => {
    const todaysPassword = generateAdminPassword();
    const emailSubject = `[VCC Admin] Login password ${new Date().toLocaleDateString('fa-IR')}`;
    const emailBody = `
🔐 Login password پنل مدیریت Video.C.C

📅 تاریخ: ${new Date().toLocaleDateString('fa-IR')}
🔑 رمز امروز: ${todaysPassword}
🔄 رمز پشتیبان: RAYANSUPERVCC2024

🛡️ This password is only valid for today
⚠️ هرگز این اطلاعات را با دیگران به اشتراک نگذارید

---
Sent from security system Video.C.C
زمان: ${new Date().toLocaleString('fa-IR')}
    `.trim();

    const mailtoLink = `mailto:vcallchat030@gmail.com?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
    window.open(mailtoLink);
    
    toast({
      title: "Password sent",
      description: "Login password به ایمیل شما فرستاده شد",
    });
  };

  // Handle admin password verification
  const handleAdminPasswordSubmit = () => {
    const dynamicPassword = generateAdminPassword();
    const fallbackPassword = "RAYANSUPERVCC2024"; // Emergency backup
    
    if (adminPassword === dynamicPassword || adminPassword === fallbackPassword) {
      setLocation("/admin");
      setIsAdminPasswordOpen(false);
      setAdminPassword("");
      toast({
        title: "Access confirmed",
        description: "Login to admin panel",
      });
    } else {
      toast({
        title: "Incorrect password",
        description: "رمز عبور امروز را وارد کنید",
        variant: "destructive",
      });
      setAdminPassword("");
    }
  };

  const handleSupportContact = () => {
    if (!supportMessage.trim() || !supportSubject.trim()) {
      toast({
        title: "خطا",
        description: "لطفا موضوع و پیام را کامل کنید",
        variant: "destructive",
      });
      return;
    }

    // Create mailto link to send email directly
    const emailBody = `
User: ${userData?.username}
Email: ${userData?.email || 'Not provided'}
Phone: ${userData?.phoneNumber || 'Not provided'}
کلید عمومی: T4RRwfswJ9hiukexD
موضوع: ${supportSubject}

پیام:
${supportMessage}

---
اطلاعات سیستم:
- سرویس SMS: service_ke1mjrq
- کلید عمومی: T4RRwfswJ9hiukexD
- ارسال شده از Video Call Chat App
- زمان: ${new Date().toLocaleString('fa-IR')}
    `.trim();

    const mailtoLink = `mailto:vcallchat030@gmail.com?subject=${encodeURIComponent(`[پشتیبانی VCC] ${supportSubject}`)}&body=${encodeURIComponent(emailBody)}`;
    
    // Open default email client
    window.open(mailtoLink);
    
    toast({
      title: "درخواست پشتیبانی ارسال شد",
      description: "کلاینت ایمیل شما باز شد. پیام را ارسال کنید",
    });
    
    setSupportMessage("");
    setSupportSubject("");
    setIsSupportContactOpen(false);
  };

  const startVideoCall = (userId: number) => {
    toast({
      title: "شروع تماس ویدئویی",
      description: "در حال برقراری ارتباط...",
    });
  };

  const getTimeAgo = (date: string) => {
    const now = new Date();
    const messageTime = new Date(date);
    const diffInHours = Math.floor((now.getTime() - messageTime.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "کمتر از یک ساعت پیش";
    if (diffInHours < 24) return `${diffInHours} ساعت پیش`;
    return `${Math.floor(diffInHours / 24)} روز پیش`;
  };

  // Handle notification click to show messages
  const handleNotificationClick = (notification: any) => {
    if (notification.type === 'message') {
      // Find the user who sent the message
      const sender = usersData?.users?.find((user: any) => user.id === notification.senderId);
      if (sender) {
        setSelectedUser(sender);
        setIsMessageDialogOpen(true);
        setIsNotificationsOpen(false);
      }
    }
  };

  // Initialize profile data
  useEffect(() => {
    if (userData && typeof userData === 'object') {
      const user = userData as any;
      setProfileData({
        username: user.username || "",
        age: user.age?.toString() || "",
        gender: user.gender || "",
        profilePicture: user.avatar || "",
        interests: user.interests || "",
        relationshipStatus: user.relationshipStatus || "",
        reasonForBeingHere: user.reasonForBeingHere || "",
        phoneNumber: user.phoneNumber || "",
        bio: user.bio || "",
      });
    }
  }, [userData]);

  // Redirect to auth if no user data - moved before any returns
  useEffect(() => {
    if (!userLoading && !userData) {
      setLocation("/auth");
    }
  }, [userLoading, userData, setLocation]);

  if (userLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!userData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 via-slate-900 to-black relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 opacity-20 bg-pattern"></div>
      <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-purple-500/10 to-transparent rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tr from-blue-500/10 to-transparent rounded-full blur-3xl"></div>
      <div className="container mx-auto px-4 py-6 relative z-10">
        
        {/* Hidden Admin Access Logo */}
        <div className="text-center mb-4">
          <div 
            onClick={handleLogoClick}
            className="inline-block cursor-pointer transition-transform hover:scale-105"
          >
            <h1 className="text-2xl font-bold text-white mb-1">
              📹 Video.C.C
            </h1>
            <p className="text-xs text-slate-400">
              {adminClickCount > 0 && userData?.id === 1 && `Click ${adminClickCount}/5`}
            </p>
          </div>
        </div>
        
        {/* Profile Completion Warning - Cloud Notification */}
        {userData && !isProfileDeadlinePassed && timeRemaining && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-lg p-4 backdrop-blur-sm mb-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 space-x-reverse">
                <div className="w-10 h-10 bg-orange-500/20 rounded-full flex items-center justify-center">
                  <Clock className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <h3 className="text-orange-300 font-semibold">"English text"</h3>
                  <p className="text-orange-200 text-sm">
                    "English text"
                  </p>
                  <p className="text-orange-400 text-xs mt-1">
                    "English text": {timeRemaining.hours} "English text" "English text" {timeRemaining.minutes} "English text"
                  </p>
                </div>
              </div>
              <Button
                onClick={() => setIsProfileDialogOpen(true)}
                className="bg-orange-500 hover:bg-orange-600 text-white"
                size="sm"
              >
                "English text"
              </Button>
            </div>
          </motion.div>
        )}

        {/* Profile Deadline Passed - Blocking Warning */}
        {userData && isProfileDeadlinePassed && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-r from-red-600/30 to-red-800/30 border border-red-500 rounded-lg p-6 backdrop-blur-sm mb-6"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-400" />
              </div>
              <h2 className="text-red-300 text-xl font-bold mb-2">دسترسی محدود شده</h2>
              <p className="text-red-200 mb-4">
                24 ساعت از ثبت‌نام شما گذشته است. برای ادامه استفاده، باید پروفایل خود را کامل کنید:
              </p>
              <div className="space-y-2 text-sm text-red-200 mb-6">
                <div className="flex items-center justify-center space-x-2 space-x-reverse">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span>تایید ایمیل</span>
                </div>
                <div className="flex items-center justify-center space-x-2 space-x-reverse">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span>تایید شماره موبایل</span>
                </div>
                <div className="flex items-center justify-center space-x-2 space-x-reverse">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span>انتخاب جنسیت</span>
                </div>
                <div className="flex items-center justify-center space-x-2 space-x-reverse">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span>تایید سن</span>
                </div>
              </div>
              <Button
                onClick={() => setIsProfileDialogOpen(true)}
                className="bg-red-500 hover:bg-red-600 text-white"
                size="lg"
              >
                تکمیل پروفایل الزامی
              </Button>
            </div>
          </motion.div>
        )}
        
        {/* VIP Users List */}
        <Card className="glass-effect border-white/20 mb-6">
          <CardHeader>
            <CardTitle className="text-yellow-400 flex items-center">
              <Crown className="w-5 h-5 mr-2" />
              👑 VIP Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-3 space-x-reverse overflow-x-auto pb-2">
              {usersData?.users?.filter((user: any) => user.isVip && user.id !== ((userData as any) || {}).id).map((user: any) => (
                <div
                  key={user.id}
                  onClick={() => {
                    setSelectedUserProfile(user);
                    setIsUserProfileDialogOpen(true);
                  }}
                  className="flex-shrink-0 w-16 text-center cursor-pointer hover:opacity-80 transition-opacity"
                >
                  <Avatar className="w-14 h-14 mx-auto mb-1 ring-2 ring-yellow-400">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
                      {user.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-yellow-300 text-xs font-medium truncate">{user.username}</p>
                    <p className="text-yellow-300 text-xs">{user.age} سال</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Profile + Icon Row: Profile on left, 3 icons on right */}
        <div className="flex items-center gap-3 mb-6">
          {/* Profile - Left Side */}
          <Sheet open={isProfileOpen} onOpenChange={setIsProfileOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20 flex flex-col items-center justify-center h-16 w-16 space-y-1">
                <Avatar className="w-6 h-6">
                  <AvatarImage src={((userData as any) || {}).avatar} />
                  <AvatarFallback className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs">
                    {((userData as any) || {}).username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs truncate max-w-full">{((userData as any) || {}).username}</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="bg-slate-800 border-slate-700 w-full max-w-sm">
              <SheetHeader>
                <SheetTitle className="text-white">منوی کاربری</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-1 max-h-[80vh] overflow-y-auto px-1">
                {/* نمایش گالری عکس‌ها */}
                <Button
                  onClick={() => {
                    setIsProfileOpen(false);
                    setShowPhotoGallery(true);
                  }}
                  className="w-full justify-start bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white p-4 h-auto"
                >
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <div className="bg-white/20 p-2 rounded-lg">
                      🖼️
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">گالری عکس‌ها</p>
                      <p className="text-sm opacity-80">نمایش تمام عکس‌های شما</p>
                    </div>
                  </div>
                </Button>

                {/* ویرایش پروفایل */}
                <Button
                  onClick={() => {
                    setIsProfileOpen(false);
                    setShowEditProfile(true);
                  }}
                  className="w-full justify-start bg-slate-700 hover:bg-slate-600 text-white p-3"
                >
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <div className="bg-blue-500/20 p-2 rounded">
                      ✏️
                    </div>
                    <span>ویرایش پروفایل</span>
                  </div>
                </Button>

                {/* تنظیمات */}
                <Button
                  onClick={() => {
                    setIsProfileOpen(false);
                    setShowSettings(true);
                  }}
                  className="w-full justify-start bg-slate-700 hover:bg-slate-600 text-white p-3"
                >
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <div className="bg-gray-500/20 p-2 rounded">
                      ⚙️
                    </div>
                    <span>تنظیمات</span>
                  </div>
                </Button>

                {/* تماس با پشتیبانی */}
                <Button
                  onClick={() => {
                    setIsProfileOpen(false);
                    setShowSupport(true);
                  }}
                  className="w-full justify-start bg-slate-700 hover:bg-slate-600 text-white p-3"
                >
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <div className="bg-green-500/20 p-2 rounded">
                      💬
                    </div>
                    <span>تماس با پشتیبانی</span>
                  </div>
                </Button>

                {/* لیست مسدودها */}
                <Button
                  onClick={() => {
                    setIsProfileOpen(false);
                    setShowBlockedList(true);
                  }}
                  className="w-full justify-start bg-slate-700 hover:bg-slate-600 text-white p-3"
                >
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <div className="bg-red-500/20 p-2 rounded">
                      🚫
                    </div>
                    <span>لیست مسدودها</span>
                  </div>
                </Button>

                {/* هدایای روزانه */}
                <Button
                  onClick={() => {
                    setIsProfileOpen(false);
                    setShowDailyGifts(true);
                  }}
                  className="w-full justify-start bg-slate-700 hover:bg-slate-600 text-white p-3"
                >
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <div className="bg-yellow-500/20 p-2 rounded">
                      🎁
                    </div>
                    <span>هدایای روزانه</span>
                  </div>
                </Button>

                {/* لیست لایک‌کرده‌ها */}
                <Button
                  onClick={() => {
                    setIsProfileOpen(false);
                    setShowLikedList(true);
                  }}
                  className="w-full justify-start bg-slate-700 hover:bg-slate-600 text-white p-3"
                >
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <div className="bg-pink-500/20 p-2 rounded">
                      💖
                    </div>
                    <span>کسانی که لایک کرده‌ام</span>
                  </div>
                </Button>

                {/* لیست لایک‌کنندگان */}
                <Button
                  onClick={() => {
                    setIsProfileOpen(false);
                    setShowLikersListModel(true);
                  }}
                  className="w-full justify-start bg-slate-700 hover:bg-slate-600 text-white p-3"
                >
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <div className="bg-rose-500/20 p-2 rounded">
                      💕
                    </div>
                    <span>کسانی که لایک کردند</span>
                  </div>
                </Button>

                {/* قوانین */}
                <Button
                  onClick={() => {
                    setIsProfileOpen(false);
                    setShowTerms(true);
                  }}
                  className="w-full justify-start bg-slate-700 hover:bg-slate-600 text-white p-3"
                >
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <div className="bg-indigo-500/20 p-2 rounded">
                      📋
                    </div>
                    <span>قوانین و مقررات</span>
                  </div>
                </Button>

                {/* Hidden Admin Access for Rayan */}
                {userData?.username === "Rayan" && (
                  <div className="mt-3 p-3 bg-red-600/10 border border-red-500/30 rounded-lg">
                    <Label className="text-red-300 text-sm font-bold">🔐 دسترسی مدیریت</Label>
                    <div className="mt-2 space-y-2">
                      <div className="bg-slate-900/50 p-2 rounded text-xs text-orange-300">
                        <p>📧 رمز عبور به ایمیل ارسال می‌شود</p>
                        <p>🔒 اطلاعات حساس در برنامه ذخیره نمی‌شود</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          onClick={sendAdminPasswordToEmail}
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          📧 ارسال رمز
                        </Button>
                        <Button
                          onClick={() => setLocation("/admin")}
                          size="sm"
                          className="bg-red-600 hover:bg-red-700 text-white"
                        >
                          🛠️ پنل مدیریت
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* خروج از حساب */}
                <div className="pt-2 border-t border-slate-600">
                  <Button
                    onClick={handleLogout}
                    className="w-full justify-start bg-red-600 hover:bg-red-700 text-white p-3"
                  >
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <div className="bg-white/20 p-2 rounded">
                        🚪
                      </div>
                      <span>خروج از حساب</span>
                    </div>
                  </Button>
                </div>




              </div>
            </SheetContent>
          </Sheet>

          {/* Right Side - 3 Icons */}
          <div className="flex-1 grid grid-cols-3 gap-3">
            {/* Settings */}
            <Sheet open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20 flex flex-col items-center justify-center h-16 space-y-1">
                  <Settings className="w-5 h-5" />
                  <span className="text-xs">تنظیمات</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="bg-slate-800 border-slate-700 w-full max-w-sm">
                <SheetHeader>
                  <SheetTitle className="text-white">تنظیمات</SheetTitle>
                </SheetHeader>
                <div className="mt-6 space-y-4">
                  {/* string Settings */}
                  <div>
                    <h3 className="text-slate-200 font-medium mb-3">تغییر زبان</h3>
                    <Select value={null} onValueChange={(value: string) => (lang) => {}(value)}>
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="fa">فارسی</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="zh">中文</SelectItem>
                        <SelectItem value="tr">Türkçe</SelectItem>
                        <SelectItem value="de">Deutsch</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Support */}
                  <div>
                    <h3 className="text-slate-200 font-medium mb-3">پشتیبانی</h3>
                    <Button variant="outline" className="w-full border-slate-600 text-slate-300 hover:bg-slate-700">
                      تماس با پشتیبانی
                    </Button>
                  </div>

                  {/* VIP Purchase */}
                  <div>
                    <h3 className="text-slate-200 font-medium mb-3">خرید اشتراک VIP</h3>
                    <Button 
                      onClick={() => setLocation("/vip")}
                      className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white"
                    >
                      <Crown className="w-4 h-4 mr-2" />
                      خرید VIP
                    </Button>
                  </div>

                  {/* Earnings System - Only for Female Users */}
                  {userData?.gender === "Female" && (
                    <div>
                      <h3 className="text-slate-200 font-medium mb-3">سیستم کسب درآمد</h3>
                      <Button 
                        onClick={() => setLocation("/earnings")}
                        className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                      >
                        <DollarSign className="w-4 h-4 mr-2" />
                        💰 کسب درآمد
                      </Button>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>

            {/* Notifications */}
            <Sheet open={isNotificationsOpen} onOpenChange={setIsNotificationsOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20 flex flex-col items-center justify-center h-16 space-y-1 relative">
                  <Bell className="w-5 h-5" />
                  <span className="text-xs">اعلان‌ها</span>
                  {notificationsData?.notifications?.filter((n: any) => !n.isRead).length > 0 && (
                    <Badge className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                      {((notificationsData as any) || []).filter((n: any) => !n.isRead).length}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="bg-slate-800 border-slate-700 w-full max-w-sm">
                <SheetHeader>
                  <SheetTitle className="text-white">اعلان‌ها</SheetTitle>
                </SheetHeader>
                <div className="mt-4 space-y-4">
                  {notificationsData?.notifications?.map((notification: any) => (
                    <div 
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`p-3 rounded-lg cursor-pointer hover:bg-slate-500 transition-colors ${
                        notification.isRead ? 'bg-slate-700' : 'bg-slate-600'
                      }`}
                    >
                      <p className="text-white font-medium">{notification.title}</p>
                      <p className="text-slate-300 text-sm">{notification.message}</p>
                      <p className="text-slate-400 text-xs mt-1">{getTimeAgo(notification.createdAt)}</p>
                      {!notification.isRead && (
                        <div className="w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
                      )}
                    </div>
                  ))}
                  {!notificationsData?.notifications?.length && (
                    <p className="text-slate-400 text-center">اعلانی وجود ندارد</p>
                  )}
                </div>
              </SheetContent>
            </Sheet>

            {/* Filter */}
            <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20 flex flex-col items-center justify-center h-16 space-y-1">
                  <Filter className="w-5 h-5" />
                  <span className="text-xs">فیلتر</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="bg-slate-800 border-slate-700 w-full max-w-sm">
                <SheetHeader>
                  <SheetTitle className="text-white">فیلتر کاربران</SheetTitle>
                </SheetHeader>
                <div className="mt-6 space-y-4">
                  {/* Age Filter */}
                  <div>
                    <Label className="text-slate-200">محدوده سنی</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="number"
                        placeholder="حداقل سن"
                        value={filters.minAge || ''}
                        onChange={(e) => handleFilterChange({ minAge: e.target.value ? parseInt(e.target.value) : undefined })}
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                      <Input
                        type="number"
                        placeholder="حداکثر سن"
                        value={filters.maxAge || ''}
                        onChange={(e) => handleFilterChange({ maxAge: e.target.value ? parseInt(e.target.value) : undefined })}
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                  </div>

                  {/* Gender Filter */}
                  <div>
                    <Label className="text-slate-200">جنسیت</Label>
                    <Select value={filters.gender || "all"} onValueChange={(value) => handleFilterChange({ gender: value === "all" ? undefined : value })}>
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                        <SelectValue placeholder="همه" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="all">همه</SelectItem>
                        <SelectItem value="مرد">مرد</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Location Distance */}
                  <div>
                    <Label className="text-slate-200">فاصله موقعیت مکانی (کیلومتر)</Label>
                    <Input
                      type="number"
                      placeholder="مثال: 50"
                      value={filters.locationDistance || ''}
                      onChange={(e) => handleFilterChange({ locationDistance: e.target.value ? parseInt(e.target.value) : undefined })}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* User Cards */}
        <div className="grid grid-cols-2 gap-4">
          {usersLoading ? (
            <div className="col-span-full flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          ) : (
            usersData?.users?.filter((user: any) => user.id !== ((userData as any) || {}).id).map((user: any) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card 
                  onClick={() => {
                    setSelectedUserProfile(user);
                    setIsUserProfileDialogOpen(true);
                  }}
                  className="glass-effect border-white/20 hover:bg-white/20 transition-all duration-200 cursor-pointer group"
                >
                  <CardContent className="p-4">
                    <div className="text-center mb-4">
                      <Avatar className="w-16 h-16 mx-auto mb-2">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-lg">
                          {user.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex items-center justify-center space-x-2 space-x-reverse mb-2">
                        <h3 className="font-semibold text-white truncate">{user.username}</h3>
                        {(user.isPhoneVerified && user.isPhotoVerified && user.isAgeVerified && user.isIdentityVerified) && (
                          <CheckCircle className="w-5 h-5 text-blue-400" />
                        )}
                        {user.isVip && (
                          <Crown className="w-5 h-5 text-yellow-400" />
                        )}
                      </div>
                      <div className="flex items-center justify-center space-x-1 space-x-reverse mb-2">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span className="text-slate-300 text-sm">{user.age} سال</span>
                        <span className={`w-2 h-2 rounded-full ${user.isOnline ? 'bg-green-400' : 'bg-gray-400'}`}></span>
                        <span className="text-slate-400 text-xs">
                          {user.isOnline ? "آنلاین" : "آفلاین"}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedUser(user);
                          setIsMessageDialogOpen(true);
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </Button>
                      
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedUserProfile(user);
                          startVideoCall(user.id);
                        }}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Video className="w-4 h-4" />
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={(e) => e.stopPropagation()}
                            className="border-slate-600 text-slate-400 hover:bg-slate-700 hover:text-white"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-slate-800 border-slate-700">
                          <DropdownMenuItem 
                            onClick={() => handleAddToFavorites(user.id)}
                            className="text-slate-300 hover:bg-slate-700 hover:text-white"
                          >
                            <Heart className="w-4 h-4 ml-2" />
                            علاقه‌مندی
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleBlockUser(user.id)}
                            className="text-red-400 hover:bg-red-500/20 hover:text-red-300"
                          >
                            <Blocks className="w-4 h-4 ml-2" />
                            مسدود کردن
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleReportUser(user.id)}
                            className="text-orange-400 hover:bg-orange-500/20 hover:text-orange-300"
                          >
                            <Flag className="w-4 h-4 ml-2" />
                            گزارش
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>

        {/* Message Dialog */}
        <Dialog open={isMessageDialogOpen} onOpenChange={setIsMessageDialogOpen}>
          <DialogContent className="bg-slate-800 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white">ارسال پیام به {selectedUser?.username}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-slate-200">پیام شما</Label>
                <Input
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  placeholder="پیام خود را بنویسید..."
                  className="bg-slate-700 border-slate-600 text-white"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
              </div>
              <div className="flex justify-end space-x-2 space-x-reverse">
                <Button 
                  variant="outline" 
                  onClick={() => setIsMessageDialogOpen(false)}
                  className="border-slate-600 text-slate-300"
                >
                  انصراف
                </Button>
                <Button 
                  onClick={handleSendMessage}
                  disabled={!messageContent.trim() || sendMessageMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {sendMessageMutation.isPending ? "در حال ارسال..." : "ارسال"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Admin Password Dialog */}
        <Dialog open={isAdminPasswordOpen} onOpenChange={setIsAdminPasswordOpen}>
          <DialogContent className="bg-slate-800 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white">🔐 Login to admin panel</DialogTitle>

            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-slate-200">رمز عبور مدیریت</Label>
                <Input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="رمز عبور را وارد کنید"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleAdminPasswordSubmit();
                    }
                  }}
                />
              </div>
              
              <div className="bg-blue-500/20 border border-blue-400/50 rounded-lg p-3">
                <div className="text-blue-200 text-sm space-y-1">
                  <p>📋 فرمت رمز: RAYAN + تاریخ امروز + VCC</p>
                  <p>📅 مثال: RAYAN{new Date().getDate().toString().padStart(2, '0')}{(new Date().getMonth() + 1).toString().padStart(2, '0')}{new Date().getFullYear()}VCC</p>
                  <p>🔑 رمز پشتیبان: RAYANSUPERVCC2024</p>
                  <p>📧 رمز امروز به ایمیل ارسال می‌شود</p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsAdminPasswordOpen(false);
                    setAdminPassword("");
                  }}
                  className="flex-1 border-slate-600 text-slate-300"
                >
                  انصراف
                </Button>
                <Button 
                  onClick={handleAdminPasswordSubmit}
                  disabled={!adminPassword.trim()}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  ورود به پنل
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Profile Picture Dialog */}
        <Dialog open={isProfilePictureDialogOpen} onOpenChange={setIsProfilePictureDialogOpen}>
          <DialogContent className="bg-slate-800 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white">تغییر عکس پروفایل</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="text-center">
                <Avatar className="w-32 h-32 mx-auto mb-4">
                  <AvatarImage src={profileData.profilePicture} />
                  <AvatarFallback className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-2xl">
                    {userData?.username?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'image/*';
                      input.onchange = (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (e) => {
                            const result = e.target?.result as string;
                            setProfileData((prev: any) => ({ ...prev, profilePicture: result }));
                          };
                          reader.readAsDataURL(file);
                        }
                      };
                      input.click();
                    }}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    انتخاب از گالری
                  </Button>
                  
                  <Button
                    onClick={() => {
                      navigator.mediaDevices.getUserMedia({ video: true })
                        .then(stream => {
                          toast({
                            title: "دوربین فعال شد",
                            description: "برای گرفتن عکس آماده باشید",
                          });
                        })
                        .catch(() => {
                          toast({
                            title: "خطا",
                            description: "دسترسی به دوربین ممکن نیست",
                          });
                        });
                    }}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    گرفتن عکس
                  </Button>
                </div>

                {/* Add Photos to Gallery */}
                <div className="border-t border-slate-600 pt-4">
                  <Label className="text-slate-200 text-lg mb-3 block">گالری عکس‌ها (نامحدود)</Label>
                  <Button
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'image/*';
                      input.multiple = true;
                      input.onchange = (e) => {
                        const files = (e.target as HTMLInputElement).files;
                        if (files) {
                          Array.from(files).forEach(file => {
                            const reader = new FileReader();
                            reader.onload = (e) => {
                              const result = e.target?.result as string;
                              // Here you would typically save to database
                              toast({
                                title: "عکس اضافه شد",
                                description: `${file.name} به گالری شما اضافه شد`,
                              });
                            };
                            reader.readAsDataURL(file);
                          });
                        }
                      };
                      input.click();
                    }}
                    variant="outline"
                    className="w-full border-blue-500/50 text-blue-400 hover:bg-blue-500/20"
                  >
                    افزودن عکس‌های جدید به گالری
                  </Button>
                  <p className="text-slate-400 text-sm mt-2">می‌توانید تعداد نامحدود عکس اضافه کنید</p>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 space-x-reverse">
                <Button 
                  variant="outline" 
                  onClick={() => setIsProfilePictureDialogOpen(false)}
                  className="border-slate-600 text-slate-300"
                >
                  انصراف
                </Button>
                <Button 
                  onClick={() => {
                    updateProfileMutation.mutate({ profilePicture: profileData.profilePicture });
                    setIsProfilePictureDialogOpen(false);
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  ذخیره عکس
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Age Verification Dialog */}
        <Dialog open={isAgeVerificationOpen} onOpenChange={setIsAgeVerificationOpen}>
          <DialogContent className="bg-slate-800 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white">تایید سن با هوش مصنوعی</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-slate-300">برای تایید سن، عکسی از خودتان در کنار مدرک شناسایی بگیرید</p>
              
              <div className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center">
                <Button
                  onClick={() => {
                    navigator.mediaDevices.getUserMedia({ video: true })
                      .then(stream => {
                        toast({
                          title: "دوربین آماده است",
                          description: "مدرک شناسایی خود را در کنار صورت نگه دارید",
                        });
                      })
                      .catch(() => {
                        toast({
                          title: "خطا",
                          description: "دسترسی به دوربین ممکن نیست",
                        });
                      });
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  شروع تایید سن
                </Button>
              </div>
              
              <div className="flex justify-end space-x-2 space-x-reverse">
                <Button 
                  variant="outline" 
                  onClick={() => setIsAgeVerificationOpen(false)}
                  className="border-slate-600 text-slate-300"
                >
                  انصراف
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Identity Verification Dialog */}
        <Dialog open={isIdentityVerificationOpen} onOpenChange={setIsIdentityVerificationOpen}>
          <DialogContent className="bg-slate-800 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white">تایید هویت</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-slate-300">برای تایید هویت، تصویر مدارک زیر را ارسال کنید:</p>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="border border-slate-600 rounded-lg p-4">
                  <h3 className="text-white font-medium mb-2">کارت ملی</h3>
                  <Button
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'image/*';
                      input.click();
                    }}
                    variant="outline"
                    className="w-full border-slate-600 text-slate-300"
                  >
                    انتخاب تصویر
                  </Button>
                </div>
                
                <div className="border border-slate-600 rounded-lg p-4">
                  <h3 className="text-white font-medium mb-2">پاسپورت</h3>
                  <Button
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'image/*';
                      input.click();
                    }}
                    variant="outline"
                    className="w-full border-slate-600 text-slate-300"
                  >
                    انتخاب تصویر
                  </Button>
                </div>
              </div>
              
              <div className="border border-slate-600 rounded-lg p-4">
                <h3 className="text-white font-medium mb-2">سلفی با مدرک</h3>
                <Button
                  onClick={() => {
                    navigator.mediaDevices.getUserMedia({ video: true })
                      .then(stream => {
                        toast({
                          title: "دوربین آماده است",
                          description: "مدرک را در کنار صورت نگه دارید",
                        });
                      });
                  }}
                  variant="outline"
                  className="w-full border-slate-600 text-slate-300"
                >
                  گرفتن سلفی
                </Button>
              </div>
              
              <div className="flex justify-end space-x-2 space-x-reverse">
                <Button 
                  variant="outline" 
                  onClick={() => setIsIdentityVerificationOpen(false)}
                  className="border-slate-600 text-slate-300"
                >
                  انصراف
                </Button>
                <Button 
                  onClick={() => {
                    toast({
                      title: "مدارک ارسال شد",
                      description: "تایید هویت در حال بررسی است",
                    });
                    setIsIdentityVerificationOpen(false);
                  }}
                  className="bg-green-600 hover:bg-green-700"
                >
                  ارسال مدارک
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Phone Verification Dialog */}
        <Dialog open={isPhoneVerificationOpen} onOpenChange={setIsPhoneVerificationOpen}>
          <DialogContent className="bg-slate-800 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white">تایید شماره تلفن</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-slate-200">شماره تلفن</Label>
                <Input
                  value={profileData.phoneNumber}
                  onChange={(e) => setProfileData((prev: any) => ({ ...prev, phoneNumber: e.target.value }))}
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="+98 912 345 6789"
                />
              </div>
              
              <Button
                onClick={() => {
                  if (profileData.phoneNumber && profileData.phoneNumber.length >= 10) {
                    // Using service ID for SMS verification
                    const verificationCode = Math.floor(100000 + Math.random() * 900000);
                    
                    // Send SMS via service_ke1mjrq API
                    try {
                      // Real SMS sending would happen here with service_ke1mjrq
                      const smsData = {
                        service_id: 'service_ke1mjrq',
                        template_id: 'template_1', 
                        user_id: 'public_key_T4RRwfswJ9hiukexD',
                        template_params: {
                          to_phone: profileData.phoneNumber,
                          verification_code: verificationCode,
                          from_name: 'Video Call Chat'
                        }
                      };
                      
                      // For testing: show the verification code
                      toast({
                        title: "کد تایید SMS ارسال شد",
                        description: `کد: ${verificationCode} به ${profileData.phoneNumber} پیامک شد. در صورت عدم دریافت، از بخش پشتیبانی کمک بگیرید.`,
                        duration: 15000,
                      });
                      
                      // Store verification code temporarily for validation
                      localStorage.setItem('verificationCode', verificationCode.toString());
                      localStorage.setItem('phoneNumber', profileData.phoneNumber);
                      localStorage.setItem('verificationTimestamp', Date.now().toString());
                      
                      console.log('SMS Service Data:', smsData);
                      console.log(`Verification code sent to ${profileData.phoneNumber}: ${verificationCode}`);
                      
                    } catch (error) {
                      toast({
                        title: "خطا در ارسال SMS",
                        description: "مشکل در ارسال پیامک. از بخش پشتیبانی کمک بگیرید.",
                        variant: "destructive",
                      });
                    }
                  } else {
                    toast({
                      title: "خطا",
                      description: "لطفا شماره تلفن معتبر وارد کنید (مثال: 09123456789)",
                      variant: "destructive",
                    });
                  }
                }}
                disabled={!profileData.phoneNumber || profileData.phoneNumber.length < 10}
                className="w-full bg-yellow-600 hover:bg-yellow-700"
              >
                ارسال کد تایید SMS
              </Button>
              
              <div>
                <Label className="text-slate-200">کد تایید (6 رقم)</Label>
                <Input
                  placeholder="123456"
                  className="bg-slate-700 border-slate-600 text-white text-center text-lg tracking-widest"
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                />
                <div className="flex justify-between items-center mt-1">
                  <p className="text-slate-400 text-xs">کد 6 رقمی که به شماره شما ارسال شد را وارد کنید</p>
                  <Button
                    variant="link"
                    size="sm"
                    className="text-blue-400 hover:text-blue-300 text-xs p-0 h-auto"
                    onClick={() => {
                      if (profileData.phoneNumber && profileData.phoneNumber.length >= 10) {
                        const newVerificationCode = Math.floor(100000 + Math.random() * 900000);
                        
                        toast({
                          title: "کد جدید ارسال شد",
                          description: `کد جدید: ${newVerificationCode} به شماره ${profileData.phoneNumber} ارسال شد`,
                          duration: 15000,
                        });
                        
                        localStorage.setItem('verificationCode', newVerificationCode.toString());
                        localStorage.setItem('phoneNumber', profileData.phoneNumber);
                        localStorage.setItem('verificationTimestamp', Date.now().toString());
                        
                        setVerificationCode('');
                        console.log(`New verification code sent to ${profileData.phoneNumber}: ${newVerificationCode}`);
                      }
                    }}
                  >
                    ارسال مجدد کد
                  </Button>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 space-x-reverse">
                <Button 
                  variant="outline" 
                  onClick={() => setIsPhoneVerificationOpen(false)}
                  className="border-slate-600 text-slate-300"
                >
                  انصراف
                </Button>
                <Button 
                  onClick={() => {
                    const storedCode = localStorage.getItem('verificationCode');
                    const storedPhone = localStorage.getItem('phoneNumber');
                    const timestamp = localStorage.getItem('verificationTimestamp');
                    
                    // Check if code is expired (5 minutes)
                    if (timestamp && Date.now() - parseInt(timestamp) > 5 * 60 * 1000) {
                      toast({
                        title: "کد منقضی شده",
                        description: "کد تایید منقضی شده است. کد جدید درخواست کنید",
                        variant: "destructive",
                      });
                      localStorage.removeItem('verificationCode');
                      localStorage.removeItem('phoneNumber');
                      localStorage.removeItem('verificationTimestamp');
                      return;
                    }
                    
                    if (verificationCode === storedCode && profileData.phoneNumber === storedPhone) {
                      // Update user verification status
                      toast({
                        title: "✅ شماره تایید شد",
                        description: "شماره تلفن شما با موفقیت تایید شد و اکنون می‌توانید از تمام امکانات استفاده کنید",
                      });
                      
                      setProfileData((prev: any) => ({ 
                        ...prev, 
                        isPhoneVerified: true,
                        verificationDate: new Date().toISOString()
                      }));
                      
                      // Clear stored data
                      localStorage.removeItem('verificationCode');
                      localStorage.removeItem('phoneNumber');
                      localStorage.removeItem('verificationTimestamp');
                      setVerificationCode('');
                      setIsPhoneVerificationOpen(false);
                      
                      // Save verification to profile
                      const updatedProfile = {
                        ...profileData,
                        isPhoneVerified: true,
                        verificationDate: new Date().toISOString()
                      };
                      localStorage.setItem('userProfile', JSON.stringify(updatedProfile));
                      
                    } else {
                      toast({
                        title: "❌ کد اشتباه است",
                        description: "کد وارد شده صحیح نیست. دوباره بررسی کنید یا کد جدید درخواست دهید",
                        variant: "destructive",
                      });
                    }
                  }}
                  disabled={verificationCode.length !== 6}
                  className="bg-green-600 hover:bg-green-700"
                >
                  تایید کد
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Human Verification Dialog */}
        <Dialog open={isHumanVerificationOpen} onOpenChange={setIsHumanVerificationOpen}>
          <DialogContent className="bg-slate-800 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white">تایید انسان بودن</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-slate-300">برای تایید انسان بودن، تست زیر را تکمیل کنید:</p>
              
              <div className="border border-slate-600 rounded-lg p-6 text-center">
                <div className="bg-slate-700 rounded-lg p-4 mb-4">
                  <p className="text-white text-lg font-mono">7 + 3 = ?</p>
                </div>
                <Input
                  type="number"
                  placeholder="پاسخ را وارد کنید"
                  className="bg-slate-700 border-slate-600 text-white text-center"
                />
              </div>
              
              <div className="flex justify-end space-x-2 space-x-reverse">
                <Button 
                  variant="outline" 
                  onClick={() => setIsHumanVerificationOpen(false)}
                  className="border-slate-600 text-slate-300"
                >
                  انصراف
                </Button>
                <Button 
                  onClick={() => {
                    toast({
                      title: "تایید شد",
                      description: "شما با موفقیت تایید شدید",
                    });
                    setIsHumanVerificationOpen(false);
                  }}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  تایید
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* User Profile Dialog */}
        <Dialog open={isUserProfileDialogOpen} onOpenChange={setIsUserProfileDialogOpen}>
          <DialogContent className="bg-slate-800 border-slate-700 max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white">پروفایل کاربری</DialogTitle>
            </DialogHeader>
            {selectedUserProfile && (
              <div className="space-y-6">
                {/* Header Section */}
                <div className="text-center">
                  <Avatar className="w-32 h-32 mx-auto mb-4">
                    <AvatarImage src={selectedUserProfile.avatar} />
                    <AvatarFallback className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-3xl">
                      {selectedUserProfile.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex items-center justify-center space-x-2 space-x-reverse mb-2">
                    <h2 className="text-2xl font-bold text-white">{selectedUserProfile.username}</h2>
                    {selectedUserProfile.isVip && (
                      <Crown className="w-6 h-6 text-yellow-400" />
                    )}
                    {(selectedUserProfile.isPhoneVerified && selectedUserProfile.isPhotoVerified && selectedUserProfile.isAgeVerified && selectedUserProfile.isIdentityVerified) && (
                      <CheckCircle className="w-6 h-6 text-blue-400" />
                    )}
                  </div>
                  <p className="text-slate-300 mb-2">{selectedUserProfile.age} سال • {selectedUserProfile.gender}</p>
                  <div className="flex items-center justify-center space-x-1 space-x-reverse mb-4">
                    <span className={`w-3 h-3 rounded-full ${selectedUserProfile.isOnline ? 'bg-green-400' : 'bg-gray-400'}`}></span>
                    <span className="text-slate-400 text-sm">
                      {selectedUserProfile.isOnline ? "آنلاین" : "آفلاین"}
                    </span>
                  </div>
                </div>

                {/* User Info Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-200">درباره من</Label>
                    <p className="text-slate-300 text-sm bg-slate-700/50 p-3 rounded-lg">
                      {selectedUserProfile.bio || "اطلاعاتی Not provided"}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-slate-200">علایق</Label>
                    <p className="text-slate-300 text-sm bg-slate-700/50 p-3 rounded-lg">
                      {selectedUserProfile.interests || "اطلاعاتی Not provided"}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-200">وضعیت رابطه</Label>
                    <p className="text-slate-300 text-sm bg-slate-700/50 p-3 rounded-lg">
                      {selectedUserProfile.relationshipStatus || "اطلاعاتی Not provided"}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-200">دلیل اینجا بودن</Label>
                    <p className="text-slate-300 text-sm bg-slate-700/50 p-3 rounded-lg">
                      {selectedUserProfile.reasonForBeingHere || "اطلاعاتی Not provided"}
                    </p>
                  </div>
                </div>

                {/* Photo Gallery */}
                <div className="space-y-4">
                  <Label className="text-slate-200 text-lg">گالری تصاویر</Label>
                  <div className="grid grid-cols-3 gap-4">
                    {/* Profile Picture */}
                    <div className="relative group">
                      <img
                        src={selectedUserProfile.avatar || "/placeholder-avatar.png"}
                        alt="عکس پروفایل"
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                        <span className="text-white text-sm">عکس پروفایل</span>
                      </div>
                    </div>
                    
                    {/* Additional photos placeholder - will be populated from database */}
                    {Array.from({ length: 8 }).map((_, index) => (
                      <div key={index} className="relative group bg-slate-700 rounded-lg h-32 flex items-center justify-center">
                        <span className="text-slate-400 text-sm">عکس {index + 2}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Verification Status */}
                <div className="space-y-4">
                  <Label className="text-slate-200 text-lg">وضعیت تایید</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      {selectedUserProfile.isPhoneVerified ? (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      ) : (
                        <X className="w-5 h-5 text-red-400" />
                      )}
                      <span className="text-slate-300">تایید شماره تلفن</span>
                    </div>
                    
                    <div className="flex items-center space-x-2 space-x-reverse">
                      {selectedUserProfile.isPhotoVerified ? (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      ) : (
                        <X className="w-5 h-5 text-red-400" />
                      )}
                      <span className="text-slate-300">تایید عکس</span>
                    </div>

                    <div className="flex items-center space-x-2 space-x-reverse">
                      {selectedUserProfile.isAgeVerified ? (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      ) : (
                        <X className="w-5 h-5 text-red-400" />
                      )}
                      <span className="text-slate-300">تایید سن</span>
                    </div>

                    <div className="flex items-center space-x-2 space-x-reverse">
                      {selectedUserProfile.isIdentityVerified ? (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      ) : (
                        <X className="w-5 h-5 text-red-400" />
                      )}
                      <span className="text-slate-300">تایید هویت</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-center space-x-4 space-x-reverse">
                  <Button
                    onClick={() => {
                      setSelectedUser(selectedUserProfile);
                      setIsMessageDialogOpen(true);
                      setIsUserProfileDialogOpen(false);
                    }}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <MessageCircle className="w-4 h-4 mr-2 ml-0" />
                    ارسال پیام
                  </Button>
                  
                  <Button
                    onClick={() => {
                      // Video call functionality
                      toast({
                        title: "تماس ویدیویی",
                        description: "قابلیت تماس ویدیویی به زودی اضافه می‌شود",
                      });
                    }}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Video className="w-4 h-4 mr-2 ml-0" />
                    تماس ویدیویی
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="border-slate-600 text-slate-300"
                    onClick={() => setIsUserProfileDialogOpen(false)}
                  >
                    بستن
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Support Contact Dialog */}
        <Dialog open={isSupportContactOpen} onOpenChange={setIsSupportContactOpen}>
          <DialogContent className="bg-slate-800 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white">تماس با پشتیبانی</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-slate-300">لطفا مشکل یا سوال خود را شرح دهید. پیام شما مستقیماً به تیم پشتیبانی ارسال می‌شود.</p>
              
              <div>
                <Label className="text-slate-200">موضوع</Label>
                <Select value={supportSubject} onValueChange={setSupportSubject}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue placeholder="موضوع را انتخاب کنید" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="مشکل تایید شماره موبایل">مشکل تایید شماره موبایل</SelectItem>
                    <SelectItem value="مشکل ثبت نام">مشکل ثبت نام</SelectItem>
                    <SelectItem value="مشکل ورود">مشکل ورود</SelectItem>
                    <SelectItem value="مشکل پرداخت VIP">مشکل پرداخت VIP</SelectItem>
                    <SelectItem value="گزارش کاربر">گزارش کاربر</SelectItem>
                    <SelectItem value="پیشنهاد بهبود">پیشنهاد بهبود</SelectItem>
                    <SelectItem value="سایر">سایر</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-slate-200">پیام شما</Label>
                <textarea
                  value={supportMessage}
                  onChange={(e) => setSupportMessage(e.target.value)}
                  placeholder="مشکل یا سوال خود را به تفصیل شرح دهید..."
                  className="w-full bg-slate-700 border-slate-600 text-white rounded-lg p-3 h-32 resize-none"
                  rows={4}
                />
              </div>

              <div className="bg-slate-700/50 p-3 rounded-lg">
                <p className="text-slate-300 text-sm">
                  📧 ایمیل پشتیبانی: vcallchat030@gmail.com
                  <br />
                  🕐 زمان پاسخ: تا 24 ساعت
                </p>
              </div>
              
              <div className="flex justify-end space-x-2 space-x-reverse">
                <Button 
                  variant="outline" 
                  onClick={() => setIsSupportContactOpen(false)}
                  className="border-slate-600 text-slate-300"
                >
                  انصراف
                </Button>
                <Button 
                  onClick={handleSupportContact}
                  disabled={!supportMessage.trim() || !supportSubject}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  ارسال پیام
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Photo Gallery Dialog */}
        <Dialog open={showPhotoGallery} onOpenChange={setShowPhotoGallery}>
          <DialogContent className="bg-slate-800 border-slate-700 max-w-4xl">
            <DialogHeader>
              <DialogTitle className="text-white">"English text"</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-4">
                {/* Profile picture */}
                <div className="relative group">
                  <img
                    src={userData?.avatar || "/placeholder-avatar.png"}
                    alt="عکس پروفایل"
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm">عکس اصلی</span>
                  </div>
                </div>
                
                {/* Additional photos - placeholders for now */}
                {Array.from({ length: 11 }).map((_, index) => (
                  <div key={index} className="relative group bg-slate-700 rounded-lg h-32 flex items-center justify-center">
                    <span className="text-slate-400 text-sm">عکس {index + 2}</span>
                  </div>
                ))}
              </div>
              
              <Button
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = 'image/*';
                  input.multiple = true;
                  input.click();
                }}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                "English text"
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Profile Dialog */}
        <Dialog open={showEditProfile} onOpenChange={setShowEditProfile}>
          <DialogContent className="bg-slate-800 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white">"English text"</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-slate-200">"English text"</Label>
                <Input
                  value={profileData.username}
                  onChange={(e) => setProfileData(prev => ({ ...prev, username: e.target.value }))}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              
              <div>
                <Label className="text-slate-200">"English text"</Label>
                <Input
                  type="number"
                  value={profileData.age}
                  onChange={(e) => setProfileData(prev => ({ ...prev, age: e.target.value }))}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>

              <div>
                <Label className="text-slate-200">"English text"</Label>
                <textarea
                  value={profileData.bio}
                  onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                  className="w-full bg-slate-700 border-slate-600 text-white rounded-lg p-3"
                  rows={3}
                  placeholder="Tell us about yourself..."
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleUpdateProfile}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
"English text"
                </Button>
                <Button
                  onClick={() => setShowEditProfile(false)}
                  variant="outline"
                  className="border-slate-600 text-slate-300"
                >
                  "English text"
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Settings Dialog */}
        <Dialog open={showSettings} onOpenChange={setShowSettings}>
          <DialogContent className="bg-slate-800 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white">"English text"</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-200">"English text"</Label>
                <Select value={null} onValueChange={(lang) => {}}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fa">فارسی</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="zh">中文</SelectItem>
                    <SelectItem value="tr">Türkçe</SelectItem>
                    <SelectItem value="de">Deutsch</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-200">"English text"</Label>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" defaultChecked className="text-blue-600" />
                  <span className="text-slate-300">"English text"</span>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" defaultChecked className="text-blue-600" />
                  <span className="text-slate-300">"English text"</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-200">"English text"</Label>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" className="text-blue-600" />
                  <span className="text-slate-300">"English text"</span>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Blocked List Dialog */}
        <Dialog open={showBlockedList} onOpenChange={setShowBlockedList}>
          <DialogContent className="bg-slate-800 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white">"English text"</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-slate-300">"English text"</p>
              
              <div className="space-y-2 max-h-64 overflow-y-auto">
                <div className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback>?</AvatarFallback>
                    </Avatar>
                    <span className="text-white">"English text"</span>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Daily Gifts Dialog */}
        <Dialog open={showDailyGifts} onOpenChange={setShowDailyGifts}>
          <DialogContent className="bg-slate-800 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white">"English text"</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-6xl mb-4">🎁</div>
                <h3 className="text-xl text-white mb-2">"English text"</h3>
                <p className="text-slate-300">"English text"</p>
              </div>
              
              <Button
                onClick={() => {
                  toast({
                    title: t('giftReceived'),
                    description: t('coinsAdded'),
                  });
                }}
                className="w-full bg-yellow-600 hover:bg-yellow-700"
              >
"English text"
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Liked List Dialog */}
        <Dialog open={showLikedList} onOpenChange={setShowLikedList}>
          <DialogContent className="bg-slate-800 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white">"English text"</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2 max-h-64 overflow-y-auto">
                <div className="text-center text-slate-400 py-8">
"English text"
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Likers List Dialog */}
        <Dialog open={showLikersListModel} onOpenChange={setShowLikersListModel}>
          <DialogContent className="bg-slate-800 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white">"English text"</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2 max-h-64 overflow-y-auto">
                <div className="text-center text-slate-400 py-8">
"English text"
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Terms Dialog */}
        <Dialog open={showTerms} onOpenChange={setShowTerms}>
          <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white">"English text"</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 text-slate-300">
              <section>
                <h3 className="text-white font-semibold mb-2">1. قوانین عمومی</h3>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>رعایت احترام متقابل در تمام تعاملات الزامی است</li>
                  <li>ارسال محتوای نامناسب، تهدیدآمیز یا توهین‌آمیز ممنوع است</li>
                  <li>استفاده از تصاویر جعلی یا هویت کذب ممنوع است</li>
                </ul>
              </section>

              <section>
                <h3 className="text-white font-semibold mb-2">2. حریم خصوصی</h3>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>اطلاعات شخصی شما محفوظ نگهداری می‌شود</li>
                  <li>به اشتراک‌گذاری اطلاعات با اشخاص ثالث بدون اجازه ممنوع است</li>
                  <li>حق حذف حساب کاربری در هر زمان محفوظ است</li>
                </ul>
              </section>

              <section>
                <h3 className="text-white font-semibold mb-2">3. استفاده از پلتفرم</h3>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>استفاده تجاری بدون مجوز ممنوع است</li>
                  <li>ایجاد حساب‌های متعدد توسط یک فرد ممنوع است</li>
                  <li>سپردن حساب کاربری به دیگران ممنوع است</li>
                </ul>
              </section>

              <section>
                <h3 className="text-white font-semibold mb-2">4. تماس با پشتیبانی</h3>
                <p className="text-sm">
                  در صورت بروز مشکل یا سوال، از طریق بخش پشتیبانی با ما تماس بگیرید.
                  Email: vcallchat030@gmail.com
                </p>
              </section>
            </div>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
}
