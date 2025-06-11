import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
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
  DollarSign,
  Gift,
  Coins,
  User,
  Phone,
  Mail,
  Calendar,
  Globe,
  Star,
  Camera,
  Users,
  UserPlus,
  PhoneCall,
  Shield
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function HomePage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State management
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isUserProfileDialogOpen, setIsUserProfileDialogOpen] = useState(false);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [isDailyGiftsOpen, setIsDailyGiftsOpen] = useState(false);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [messageContent, setMessageContent] = useState("");
  const [genderFilter, setGenderFilter] = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [currentView, setCurrentView] = useState("users"); // users, followers, following, calls, live
  const [profileData, setProfileData] = useState<any>({});
  const [hasClaimedToday, setHasClaimedToday] = useState(false);
  const [dailyGiftDay, setDailyGiftDay] = useState(1);

  // Daily gifts configuration
  const dailyGifts = [
    { day: 1, coins: 10 },
    { day: 2, coins: 20 },
    { day: 3, coins: 30 },
    { day: 4, coins: 40 },
    { day: 5, coins: 50 },
    { day: 6, coins: 60 },
    { day: 7, coins: 70 }
  ];

  // Fetch current user
  const { data: user } = useQuery({
    queryKey: ["/api/me"],
    refetchInterval: 5000,
  });

  // Fetch users list
  const { data: users = [] } = useQuery({
    queryKey: ["/api/users"],
    refetchInterval: 5000,
  });

  // Fetch notifications
  const { data: notifications = [] } = useQuery({
    queryKey: ["/api/notifications"],
    refetchInterval: 5000,
  });

  // Filter users based on selected filters
  const filteredUsers = useMemo(() => {
    return (users as any[]).filter((u: any) => {
      if (u.id === user?.id) return false;
      if (genderFilter && genderFilter !== "all" && u.gender !== genderFilter) return false;
      if (countryFilter && countryFilter !== "all" && u.country !== countryFilter) return false;
      return true;
    });
  }, [users, user?.id, genderFilter, countryFilter]);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (data: { receiverId: number; content: string }) => {
      return apiRequest("POST", "/api/messages", data);
    },
    onSuccess: () => {
      toast({
        title: "Message sent successfully!",
        description: "Your message has been delivered.",
      });
      setIsMessageDialogOpen(false);
      setMessageContent("");
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send message",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    }
  });

  // Report user mutation
  const reportUserMutation = useMutation({
    mutationFn: async (data: { reportedUserId: number; reason: string }) => {
      return apiRequest("POST", "/api/report-user", data);
    },
    onSuccess: () => {
      toast({
        title: "User reported",
        description: "Thank you for your report. We'll review it shortly.",
      });
      setIsReportDialogOpen(false);
      setReportReason("");
    }
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("PATCH", "/api/profile", data);
    },
    onSuccess: () => {
      toast({
        title: "Profile updated successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/me"] });
      setIsSettingsOpen(false);
    }
  });

  // Claim daily gift mutation
  const claimDailyGiftMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/claim-daily-gift", {});
    },
    onSuccess: (data) => {
      toast({
        title: "Daily Gift Claimed!",
        description: `You received ${data.coins} coins!`,
      });
      setHasClaimedToday(true);
      queryClient.invalidateQueries({ queryKey: ["/api/me"] });
    }
  });

  // Initialize profile data when user data loads
  useEffect(() => {
    if (user) {
      setProfileData({
        username: (user as any).username || "",
        email: (user as any).email || "",
        age: (user as any).age || "",
        gender: (user as any).gender || "",
        country: (user as any).country || "",
        city: (user as any).city || "",
        phone: (user as any).phone || "",
        occupation: (user as any).occupation || "",
        education: (user as any).education || "",
        relationshipStatus: (user as any).relationshipStatus || "",
        height: (user as any).height || "",
        weight: (user as any).weight || "",
        eyeColor: (user as any).eyeColor || "",
        hairColor: (user as any).hairColor || "",
        bio: (user as any).bio || "",
        interests: (user as any).interests || "",
        reasonForBeingHere: (user as any).reasonForBeingHere || ""
      });
    }
  }, [user]);

  // Handle sending messages
  const handleSendMessage = () => {
    if (!selectedUser || !messageContent.trim()) return;
    
    // Allow unlimited access for VIP users or user Rayan
    if (!(user as any)?.isVip && (user as any)?.username !== "Rayan") {
      toast({
        title: "VIP Feature Required",
        description: "Upgrade to VIP to send unlimited messages!",
        variant: "destructive",
      });
      return;
    }

    sendMessageMutation.mutate({
      receiverId: selectedUser.id,
      content: messageContent.trim()
    });
  };

  // Handle video calls
  const handleVideoCall = (targetUser: any) => {
    // Allow unlimited access for VIP users or user Rayan
    if (!(user as any)?.isVip && (user as any)?.username !== "Rayan") {
      toast({
        title: "VIP Feature Required", 
        description: "Upgrade to VIP to access video calls!",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "Video Call Starting",
      description: `Connecting to ${targetUser.username}...`,
    });
  };

  // Handle starting live stream (only for female users)
  const handleStartLiveStream = () => {
    if ((user as any)?.gender !== "Female" && (user as any)?.username !== "Rayan") {
      toast({
        title: "Feature Not Available",
        description: "Live streaming is only available for female users.",
        variant: "destructive",
      });
      return;
    }

    // Allow unlimited access for VIP users or user Rayan
    if (!(user as any)?.isVip && (user as any)?.username !== "Rayan") {
      toast({
        title: "VIP Feature Required",
        description: "Upgrade to VIP to start live streaming!",
        variant: "destructive",
      });
      return;
    }

    // Navigate to live streaming page with start parameter
    setLocation("/live?start=true");
  };

  // Handle profile updates
  const handleProfileUpdate = () => {
    updateProfileMutation.mutate(profileData);
  };

  // Handle daily gift claiming
  const handleClaimDailyGift = (day: number) => {
    claimDailyGiftMutation.mutate();
  };

  // Handle reporting users
  const handleReportUser = () => {
    if (!selectedUser || !reportReason.trim()) return;
    
    reportUserMutation.mutate({
      reportedUserId: selectedUser.id,
      reason: reportReason.trim()
    });
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/logout", {});
      setLocation("/auth");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 overflow-x-hidden">
      {/* Header */}
      <div className="border-b border-slate-800/50 bg-slate-900/80 backdrop-blur-lg sticky top-0 z-40">
        <div className="container mx-auto px-4 py-1">
          {/* Top Row - Video.C.C Title and Tokens */}
          <div className="relative flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-3xl font-black tracking-wider bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                Video.C.C
              </h1>
            </div>
            <div className="absolute right-0 mt-6">
              <div className="bg-slate-800/50 border border-slate-600 rounded-lg px-3 py-2 flex flex-col items-center">
                <div className="flex items-center space-x-1 mb-1">
                  <Coins className="w-4 h-4 text-yellow-400" />
                  <span className="text-slate-300 text-xs">Tokens</span>
                </div>
                <span className="text-yellow-400 font-semibold text-sm">
                  {user.tokens || 0}
                </span>
              </div>
            </div>
          </div>

          {/* Main Header Row */}
          <div className="flex items-center justify-between -mt-1">
            <div className="flex items-center space-x-3">
              <div className="-mt-5">
                <Avatar 
                  className="w-16 h-16 border-2 border-purple-500 shadow-lg cursor-pointer hover:border-purple-400 transition-colors"
                  onClick={() => setIsProfileDialogOpen(true)}
                >
                  <AvatarImage src={(user as any)?.avatar} />
                  <AvatarFallback className="bg-purple-600 text-white text-lg font-bold">
                    {(user as any)?.username?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>

            <div className="flex items-center -space-x-1 mt-8">
              {/* VIP Button */}
              <Button
                onClick={() => setLocation("/vip")}
                className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white px-2 py-1 mr-2 text-xs"
                size="sm"
              >
                <Crown className="w-3 h-3 mr-1" />
                VIP
              </Button>
              {/* Notifications (Item 2) */}
              <Button
                variant="ghost"
                size="sm"
                className="relative text-slate-300 hover:text-white"
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              >
                <Bell className="w-5 h-5" />
                {notifications.length > 0 && (
                  <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 bg-red-500 text-white text-xs flex items-center justify-center">
                    {notifications.length}
                  </Badge>
                )}
              </Button>

              {/* Settings (Item 4) */}
              <Sheet open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white">
                    <Settings className="w-5 h-5" />
                  </Button>
                </SheetTrigger>
              </Sheet>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full max-w-none px-3 py-1 overflow-x-hidden">
        {/* Filter Button */}
        <div className="flex justify-end mb-1">
          <Button
            variant="ghost"
            size="sm"
            className="text-slate-300 hover:text-white"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
          >
            <Filter className="w-5 h-5" />
          </Button>
        </div>

        {/* Filter Panel */}
        {isFilterOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-800/90 border border-slate-700 rounded-xl p-4 mb-6 backdrop-blur-sm"
          >
            <h3 className="text-white font-semibold mb-3">Filters</h3>
            <div className="flex flex-wrap gap-3">
              <Select value={genderFilter} onValueChange={setGenderFilter}>
                <SelectTrigger className="w-40 bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder="Filter by gender" />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  <SelectItem value="all">All Genders</SelectItem>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={countryFilter} onValueChange={setCountryFilter}>
                <SelectTrigger className="w-40 bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder="Filter by country" />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  <SelectItem value="all">All Countries</SelectItem>
                  <SelectItem value="Iran">Iran</SelectItem>
                  <SelectItem value="Turkey">Turkey</SelectItem>
                  <SelectItem value="Germany">Germany</SelectItem>
                  <SelectItem value="USA">USA</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
                onClick={() => {
                  setGenderFilter("");
                  setCountryFilter("");
                }}
              >
                Clear Filters
              </Button>
            </div>
          </motion.div>
        )}

        {/* Notifications Panel */}
        {isNotificationsOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-800/90 border border-slate-700 rounded-xl p-4 mb-6 backdrop-blur-sm"
          >
            <h3 className="text-white font-semibold mb-3">Notifications</h3>
            {notifications.length > 0 ? (
              <div className="space-y-2">
                {notifications.map((notification: any, index: number) => (
                  <div 
                    key={notification.id || index} 
                    className="bg-slate-700/50 rounded-lg p-3 hover:bg-slate-700/70 transition-colors cursor-pointer"
                    onClick={() => {
                      if (notification.type === 'message') {
                        // Find the sender user and open message dialog
                        const sender = users.find((u: any) => u.id === notification.relatedId);
                        if (sender) {
                          setSelectedUser(sender);
                          setIsMessageDialogOpen(true);
                          setIsNotificationsOpen(false);
                        }
                      }
                    }}
                  >
                    <h4 className="text-white text-sm font-semibold">{notification.title || "Notification"}</h4>
                    <p className="text-slate-300 text-sm">{notification.message || notification.content || "You have a new notification"}</p>
                    <p className="text-slate-400 text-xs mt-1">{new Date(notification.createdAt || Date.now()).toLocaleString()}</p>
                    {notification.type === 'message' && (
                      <div className="mt-2 flex items-center text-purple-400 text-xs">
                        <MessageCircle className="w-3 h-3 mr-1" />
                        Click to reply
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400">No notifications</p>
            )}
          </motion.div>
        )}

        {/* Navigation Buttons */}
        <div className="overflow-x-auto pb-1 mb-1">
          <div className="flex gap-1 min-w-max bg-slate-800/30 rounded-lg p-2">
          <Button
            variant="ghost"
            size="sm"
            className={currentView === "users" ? 
              "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg border-0 hover:from-purple-600 hover:to-pink-600" : 
              "bg-slate-700/50 text-slate-300 border-0 hover:bg-gradient-to-r hover:from-purple-400/20 hover:to-pink-400/20 hover:text-white"}
            onClick={() => setCurrentView("users")}
          >
            <Users className={`w-4 h-4 mr-2 ${currentView === "users" ? "text-white" : "text-pink-300"}`} />
            All Users
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className={currentView === "live" ? 
              "bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg border-0 hover:from-pink-600 hover:to-rose-600" : 
              "bg-slate-700/50 text-slate-300 border-0 hover:bg-gradient-to-r hover:from-pink-400/20 hover:to-rose-400/20 hover:text-white"}
            onClick={() => setCurrentView("live")}
          >
            <Video className={`w-4 h-4 mr-2 ${currentView === "live" ? "text-white" : "text-pink-300"}`} />
            Live Shows
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className={currentView === "followers" ? 
              "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg border-0 hover:from-blue-600 hover:to-purple-600" : 
              "bg-slate-700/50 text-slate-300 border-0 hover:bg-gradient-to-r hover:from-blue-400/20 hover:to-purple-400/20 hover:text-white"}
            onClick={() => setCurrentView("followers")}
          >
            <Users className={`w-4 h-4 mr-2 ${currentView === "followers" ? "text-white" : "text-pink-300"}`} />
            Followers
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className={currentView === "following" ? 
              "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg border-0 hover:from-emerald-600 hover:to-teal-600" : 
              "bg-slate-700/50 text-slate-300 border-0 hover:bg-gradient-to-r hover:from-emerald-400/20 hover:to-teal-400/20 hover:text-white"}
            onClick={() => setCurrentView("following")}
          >
            <UserPlus className={`w-4 h-4 mr-2 ${currentView === "following" ? "text-white" : "text-pink-300"}`} />
            Following
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className={currentView === "calls" ? 
              "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg border-0 hover:from-orange-600 hover:to-amber-600" : 
              "bg-slate-700/50 text-slate-300 border-0 hover:bg-gradient-to-r hover:from-orange-400/20 hover:to-amber-400/20 hover:text-white"}
            onClick={() => setCurrentView("calls")}
          >
            <PhoneCall className={`w-4 h-4 mr-2 ${currentView === "calls" ? "text-white" : "text-pink-300"}`} />
            Call History
          </Button>
          </div>
        </div>

        {/* Additional Filters for Users (Item 7) */}
        {currentView === "users" && (
          <div className="overflow-x-auto pb-0 mb-1 mt-1">
            <div className="flex gap-1 min-w-max bg-slate-800/30 rounded-lg p-2">
              <Button
                variant="ghost"
                size="sm"
                className="bg-slate-700/50 text-slate-300 border-0 hover:bg-gradient-to-r hover:from-purple-400/20 hover:to-pink-400/20 hover:text-white whitespace-nowrap"
                onClick={() => {
                  // Filter for new users logic
                  toast({
                    title: "New Users",
                    description: "Showing recently joined users",
                  });
                }}
              >
                <Star className="w-4 h-4 mr-2 text-pink-300" />
                New Users
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="bg-slate-700/50 text-slate-300 border-0 hover:bg-gradient-to-r hover:from-purple-400/20 hover:to-pink-400/20 hover:text-white whitespace-nowrap"
                onClick={() => {
                  // Filter for nearby users logic
                  toast({
                    title: "Nearby Users",
                    description: "Showing users in your area",
                  });
                }}
              >
                <MapPin className="w-4 h-4 mr-2 text-pink-300" />
                Nearby
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="bg-slate-700/50 text-slate-300 border-0 hover:bg-gradient-to-r hover:from-purple-400/20 hover:to-pink-400/20 hover:text-white whitespace-nowrap"
                onClick={() => {
                  // Filter for online users logic
                  toast({
                    title: "Online Users",
                    description: "Showing currently active users",
                  });
                }}
              >
                <CheckCircle className="w-4 h-4 mr-2 text-pink-300" />
                Online
              </Button>
            </div>
          </div>
        )}

        {/* Content Based on Current View */}
        {currentView === "users" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6 mt-3">
            {filteredUsers.map((otherUser: any) => (
              <motion.div
                key={otherUser.id}
                whileHover={{ scale: 1.02 }}
                className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700/50 rounded-xl backdrop-blur-sm hover:border-purple-500/50 transition-all duration-300 overflow-hidden h-32"
              >
                <div className="flex h-full">
                  {/* Left Half - User Photo */}
                  <div 
                    className="w-1/2 relative cursor-pointer group"
                    onClick={() => {
                      setSelectedUser(otherUser);
                      setIsUserProfileDialogOpen(true);
                    }}
                  >
                    <div className="w-full h-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-l-xl relative overflow-hidden">
                      {otherUser.avatar ? (
                        <img 
                          src={otherUser.avatar} 
                          alt={otherUser.username}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-600 to-pink-600">
                          <span className="text-white text-2xl font-bold">
                            {otherUser.username?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      
                      {/* VIP Badge */}
                      {otherUser.isVip && (
                        <div className="absolute top-2 left-2">
                          <Crown className="w-4 h-4 text-yellow-400" />
                        </div>
                      )}
                      
                      {/* Online Status */}
                      <div className="absolute bottom-2 left-2">
                        <div className={`w-3 h-3 rounded-full ${otherUser.isOnline ? 'bg-green-400' : 'bg-gray-400'}`}></div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Right Half - User Info and Buttons */}
                  <div className="w-1/2 p-3 flex flex-col justify-between">
                    {/* User Info */}
                    <div className="mb-2">
                      <h3 className="text-white font-semibold text-sm truncate">{otherUser.username}</h3>
                      <p className="text-slate-400 text-xs">{otherUser.age} years</p>
                      {otherUser.country && (
                        <p className="text-slate-500 text-xs truncate">{otherUser.country}</p>
                      )}
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="space-y-1">
                      <Button
                        onClick={() => {
                          setSelectedUser(otherUser);
                          setIsMessageDialogOpen(true);
                        }}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white h-7 text-xs"
                        size="sm"
                      >
                        <MessageCircle className="w-3 h-3 mr-1" />
                        Message
                      </Button>
                      <Button
                        onClick={() => handleVideoCall(otherUser)}
                        className="w-full bg-green-600 hover:bg-green-700 text-white h-7 text-xs"
                        size="sm"
                      >
                        <Video className="w-3 h-3 mr-1" />
                        Video Call
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {currentView === "live" && (
          <div className="text-center py-12">
            <Video className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-white text-xl font-semibold mb-2">Live Shows</h3>
            <p className="text-slate-400 mb-6">No live streams are currently active</p>
            <Button
              onClick={() => setLocation("/live")}
              className="bg-pink-600 hover:bg-pink-700 text-white"
            >
              <Video className="w-4 h-4 mr-2" />
              View Live Streams
            </Button>
          </div>
        )}

        {currentView === "followers" && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-white text-xl font-semibold mb-2">Your Followers</h3>
            <p className="text-slate-400 mb-6">Users who follow you will appear here</p>
            <Button
              onClick={() => setCurrentView("users")}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Users className="w-4 h-4 mr-2" />
              Browse Users
            </Button>
          </div>
        )}

        {currentView === "following" && (
          <div className="text-center py-12">
            <UserPlus className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-white text-xl font-semibold mb-2">Following</h3>
            <p className="text-slate-400 mb-6">Users you follow will appear here</p>
            <Button
              onClick={() => setCurrentView("users")}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Find People
            </Button>
          </div>
        )}

        {currentView === "calls" && (
          <div className="text-center py-12">
            <PhoneCall className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-white text-xl font-semibold mb-2">Call History</h3>
            <p className="text-slate-400 mb-6">Your video calls and voice calls will appear here</p>
            <Button
              onClick={() => setCurrentView("users")}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              <Video className="w-4 h-4 mr-2" />
              Start Video Call
            </Button>
          </div>
        )}



        {/* Settings Sheet */}
        <Sheet open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
          <SheetContent className="bg-slate-900 border-slate-700 w-full max-w-md overflow-y-auto max-h-screen">
            <SheetHeader>
              <SheetTitle className="text-white">Settings</SheetTitle>
            </SheetHeader>
            
            <div className="space-y-4 mt-6 pb-6">
              {/* Profile Settings Option */}
              <Button
                variant="ghost"
                className="w-full justify-start text-left h-auto p-4 border border-slate-700 hover:bg-slate-800"
                onClick={() => {
                  setIsSettingsOpen(false);
                  // Open profile editing dialog instead
                  setIsProfileDialogOpen(true);
                }}
              >
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-purple-400" />
                  <div>
                    <div className="text-white font-medium">Profile Settings</div>
                    <div className="text-slate-400 text-sm">Edit your profile information</div>
                  </div>
                </div>
              </Button>

              {/* Privacy Settings */}
              <Button
                variant="ghost"
                className="w-full justify-start text-left h-auto p-4 border border-slate-700 hover:bg-slate-800"
              >
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-blue-400" />
                  <div>
                    <div className="text-white font-medium">Privacy & Security</div>
                    <div className="text-slate-400 text-sm">Manage privacy settings</div>
                  </div>
                </div>
              </Button>

              {/* Notification Settings */}
              <Button
                variant="ghost"
                className="w-full justify-start text-left h-auto p-4 border border-slate-700 hover:bg-slate-800"
              >
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-yellow-400" />
                  <div>
                    <div className="text-white font-medium">Notifications</div>
                    <div className="text-slate-400 text-sm">Configure notification preferences</div>
                  </div>
                </div>
              </Button>

              {/* VIP Subscription */}
              <Button
                variant="ghost"
                className="w-full justify-start text-left h-auto p-4 border border-slate-700 hover:bg-slate-800"
                onClick={() => {
                  setIsSettingsOpen(false);
                  setLocation("/vip");
                }}
              >
                <div className="flex items-center gap-3">
                  <Crown className="w-5 h-5 text-yellow-400" />
                  <div>
                    <div className="text-white font-medium">VIP Subscription</div>
                    <div className="text-slate-400 text-sm">Manage your VIP membership</div>
                  </div>
                </div>
              </Button>

              {/* Earnings */}
              <Button
                variant="ghost"
                className="w-full justify-start text-left h-auto p-4 border border-slate-700 hover:bg-slate-800"
                onClick={() => {
                  setIsSettingsOpen(false);
                  setLocation("/earnings");
                }}
              >
                <div className="flex items-center gap-3">
                  <DollarSign className="w-5 h-5 text-green-400" />
                  <div>
                    <div className="text-white font-medium">Earnings</div>
                    <div className="text-slate-400 text-sm">View earnings and withdrawals</div>
                  </div>
                </div>
              </Button>

              {/* Admin Panel (if user is admin) */}
              <Button
                variant="ghost"
                className="w-full justify-start text-left h-auto p-4 border border-slate-700 hover:bg-slate-800"
                onClick={() => {
                  setIsSettingsOpen(false);
                  setLocation("/admin");
                }}
              >
                <div className="flex items-center gap-3">
                  <Settings className="w-5 h-5 text-red-400" />
                  <div>
                    <div className="text-white font-medium">Admin Panel</div>
                    <div className="text-slate-400 text-sm">Platform administration</div>
                  </div>
                </div>
              </Button>

              {/* Logout */}
              <Button
                variant="ghost"
                className="w-full justify-start text-left h-auto p-4 border border-slate-700 hover:bg-slate-800"
                onClick={() => {
                  localStorage.removeItem('sessionId');
                  setLocation("/auth");
                }}
              >
                <div className="flex items-center gap-3">
                  <LogOut className="w-5 h-5 text-red-400" />
                  <div>
                    <div className="text-white font-medium">Logout</div>
                    <div className="text-slate-400 text-sm">Sign out of your account</div>
                  </div>
                </div>
              </Button>
            </div>
          </SheetContent>
        </Sheet>

        {/* Profile Edit Dialog */}
        <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
          <DialogContent className="bg-slate-900 border-slate-700 max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white">Edit Profile</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 mt-6 pb-6">
              <div>
                <Label className="text-slate-200">Username</Label>
                <Input
                  value={profileData.username}
                  onChange={(e) => setProfileData(prev => ({ ...prev, username: e.target.value }))}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              
              <div>
                <Label className="text-slate-200">Email</Label>
                <Input
                  value={profileData.email}
                  onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              
              <div>
                <Label className="text-slate-200">Age</Label>
                <Input
                  type="number"
                  value={profileData.age}
                  onChange={(e) => setProfileData(prev => ({ ...prev, age: e.target.value }))}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              
              <div>
                <Label className="text-slate-200">Gender</Label>
                <Select value={profileData.gender} onValueChange={(value) => setProfileData(prev => ({ ...prev, gender: value }))}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="text-slate-200">Country</Label>
                <Input
                  value={profileData.country}
                  onChange={(e) => setProfileData(prev => ({ ...prev, country: e.target.value }))}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              
              <div>
                <Label className="text-slate-200">City</Label>
                <Input
                  value={profileData.city}
                  onChange={(e) => setProfileData(prev => ({ ...prev, city: e.target.value }))}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              
              <div>
                <Label className="text-slate-200">Phone</Label>
                <Input
                  value={profileData.phone}
                  onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              
              <div>
                <Label className="text-slate-200">Occupation</Label>
                <Input
                  value={profileData.occupation}
                  onChange={(e) => setProfileData(prev => ({ ...prev, occupation: e.target.value }))}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              
              <div>
                <Label className="text-slate-200">Education</Label>
                <Input
                  value={profileData.education}
                  onChange={(e) => setProfileData(prev => ({ ...prev, education: e.target.value }))}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              
              <div>
                <Label className="text-slate-200">Relationship Status</Label>
                <Select value={profileData.relationshipStatus} onValueChange={(value) => setProfileData(prev => ({ ...prev, relationshipStatus: value }))}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    <SelectItem value="Single">Single</SelectItem>
                    <SelectItem value="In a relationship">In a relationship</SelectItem>
                    <SelectItem value="Married">Married</SelectItem>
                    <SelectItem value="Divorced">Divorced</SelectItem>
                    <SelectItem value="Widowed">Widowed</SelectItem>
                    <SelectItem value="It's complicated">It's complicated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="text-slate-200">Height (cm)</Label>
                <Input
                  value={profileData.height}
                  onChange={(e) => setProfileData(prev => ({ ...prev, height: e.target.value }))}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              
              <div>
                <Label className="text-slate-200">Bio</Label>
                <textarea
                  value={profileData.bio}
                  onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                  className="w-full bg-slate-700 border-slate-600 text-white rounded-lg p-3"
                  rows={3}
                  placeholder="Tell us about yourself..."
                />
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleProfileUpdate}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                  disabled={updateProfileMutation.isPending}
                >
                  {updateProfileMutation.isPending ? "Updating..." : "Update Profile"}
                </Button>
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </div>

              {/* Admin Panel Access for Rayan */}
              {(user as any)?.username === "Rayan" && (
                <div className="mt-6 p-4 bg-red-600/10 border border-red-500/30 rounded-lg">
                  <Label className="text-red-300 text-sm font-bold flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Admin Management Panel
                  </Label>
                  <p className="text-slate-400 text-xs mt-1">Full system administration access</p>
                  <Button
                    onClick={() => setLocation("/admin")}
                    className="w-full mt-3 bg-red-600 hover:bg-red-700 text-white"
                    size="sm"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Open Admin Panel
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Daily Gifts Dialog */}
        <Dialog open={isDailyGiftsOpen} onOpenChange={setIsDailyGiftsOpen}>
          <DialogContent className="bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 border-2 border-yellow-500/30 max-w-lg sm:max-w-2xl mx-4">
            <DialogHeader className="text-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="mx-auto w-20 h-20 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mb-4"
              >
                <Gift className="w-10 h-10 text-white" />
              </motion.div>
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                🎁 Daily Gifts
              </DialogTitle>
              <DialogDescription className="text-slate-300 text-lg">
                Claim your daily rewards for 7 consecutive days!
              </DialogDescription>
            </DialogHeader>
            
            <div className="mt-6">
              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex justify-between text-sm text-slate-400 mb-2">
                  <span>Progress</span>
                  <span>{Math.max(0, dailyGiftDay - 1)}/7 days</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-yellow-500 to-orange-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${(Math.max(0, dailyGiftDay - 1) / 7) * 100}%` }}
                  />
                </div>
              </div>

              {/* Gift Cards */}
              <div className="grid grid-cols-7 gap-1 sm:gap-3">
                {dailyGifts.map((gift) => (
                  <motion.div
                    key={gift.day}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`relative p-2 sm:p-4 rounded-xl border-2 text-center transition-all duration-300 ${
                      gift.day === dailyGiftDay && !hasClaimedToday
                        ? 'bg-gradient-to-br from-yellow-500/30 to-orange-500/30 border-yellow-400 shadow-lg shadow-yellow-500/25'
                        : gift.day < dailyGiftDay
                        ? 'bg-gradient-to-br from-green-500/30 to-emerald-500/30 border-green-400 shadow-lg shadow-green-500/25'
                        : 'bg-gradient-to-br from-slate-700/50 to-slate-800/50 border-slate-600 hover:border-slate-500'
                    }`}
                  >
                    {/* Day number */}
                    <div className="text-white text-xs sm:text-sm font-bold mb-1 sm:mb-2">
                      Day {gift.day}
                    </div>
                    
                    {/* Coin amount with icon */}
                    <div className="text-yellow-400 text-sm sm:text-lg font-bold flex items-center justify-center mb-1 sm:mb-2">
                      <Coins className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                      {gift.coins}
                    </div>
                    
                    {/* Status indicator */}
                    {gift.day === dailyGiftDay && !hasClaimedToday ? (
                      <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                      >
                        <Button
                          onClick={() => handleClaimDailyGift(gift.day)}
                          size="sm"
                          className="w-full text-xs sm:text-sm px-1 sm:px-2 py-1 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold shadow-lg"
                        >
                          Claim
                        </Button>
                      </motion.div>
                    ) : gift.day < dailyGiftDay ? (
                      <div className="flex justify-center">
                        <CheckCircle className="w-4 h-4 sm:w-6 sm:h-6 text-green-400" />
                      </div>
                    ) : (
                      <div className="text-slate-500 text-xs">
                        Locked
                      </div>
                    )}
                    
                    {/* Sparkle effect for claimable */}
                    {gift.day === dailyGiftDay && !hasClaimedToday && (
                      <div className="absolute -top-1 -right-1">
                        <Star className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400 animate-pulse" />
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
              
              {/* Bonus info */}
              <div className="mt-6 p-4 bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-xl">
                <div className="text-center">
                  <p className="text-purple-300 text-sm font-semibold mb-1">
                    🏆 Complete all 7 days for a BONUS reward!
                  </p>
                  <p className="text-slate-400 text-xs">
                    Don't miss a day to keep your streak alive
                  </p>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Message Dialog */}
        <Dialog open={isMessageDialogOpen} onOpenChange={setIsMessageDialogOpen}>
          <DialogContent className="bg-slate-900 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white">Send Message</DialogTitle>
              <DialogDescription className="text-slate-400">
                Send a message to {selectedUser?.username}
              </DialogDescription>
            </DialogHeader>
            
            <div className="mt-4">
              <textarea
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                className="w-full bg-slate-700 border-slate-600 text-white rounded-lg p-3"
                rows={4}
                placeholder="Type your message..."
              />
            </div>
            
            <div className="flex gap-2 mt-4">
              <Button
                onClick={handleSendMessage}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                disabled={!messageContent.trim()}
              >
                Send Message
              </Button>
              <Button
                onClick={() => setIsMessageDialogOpen(false)}
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                Cancel
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* User Profile Dialog */}
        <Dialog open={isUserProfileDialogOpen} onOpenChange={setIsUserProfileDialogOpen}>
          <DialogContent className="bg-slate-900 border-slate-700 max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-white">User Profile</DialogTitle>
            </DialogHeader>
            
            {selectedUser && (
              <div className="mt-4">
                <div className="flex items-center space-x-4 mb-6">
                  <Avatar className="w-20 h-20 border-2 border-purple-500">
                    <AvatarImage src={selectedUser.avatar} />
                    <AvatarFallback className="bg-purple-600 text-white text-2xl font-bold">
                      {selectedUser.username?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-white text-xl font-semibold">{selectedUser.username}</h3>
                    <p className="text-slate-400">{selectedUser.age} years old</p>
                    {selectedUser.isVip && (
                      <Badge className="bg-yellow-500 text-black">
                        <Crown className="w-3 h-3 mr-1" />
                        VIP Member
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-400">Country:</span>
                    <span className="text-white ml-2">{selectedUser.country || "Not specified"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">City:</span>
                    <span className="text-white ml-2">{selectedUser.city || "Not specified"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Gender:</span>
                    <span className="text-white ml-2">{selectedUser.gender || "Not specified"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Status:</span>
                    <span className="text-white ml-2">{selectedUser.relationshipStatus || "Not specified"}</span>
                  </div>
                </div>
                
                {selectedUser.bio && (
                  <div className="mt-4">
                    <h4 className="text-slate-400 text-sm mb-2">Bio:</h4>
                    <p className="text-white text-sm">{selectedUser.bio}</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Report User Dialog */}
        <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
          <DialogContent className="bg-slate-900 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white">Report User</DialogTitle>
              <DialogDescription className="text-slate-400">
                Please select a reason for reporting {selectedUser?.username}
              </DialogDescription>
            </DialogHeader>
            
            <div className="mt-4">
              <Select value={reportReason} onValueChange={setReportReason}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  <SelectItem value="inappropriate_content">Inappropriate Content</SelectItem>
                  <SelectItem value="harassment">Harassment</SelectItem>
                  <SelectItem value="spam">Spam</SelectItem>
                  <SelectItem value="fake_profile">Fake Profile</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex gap-2 mt-4">
              <Button
                onClick={handleReportUser}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                disabled={!reportReason}
              >
                Submit Report
              </Button>
              <Button
                onClick={() => setIsReportDialogOpen(false)}
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                Cancel
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Floating Camera Button for Female Users */}
      {((user as any)?.gender === "Female" || (user as any)?.username === "Rayan") && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="fixed bottom-6 right-6 z-50"
        >
          <Button
            onClick={handleStartLiveStream}
            className="w-16 h-16 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 shadow-lg shadow-pink-500/25 border-2 border-pink-400/50"
          >
            <Camera className="w-8 h-8 text-white" />
          </Button>
        </motion.div>
      )}
    </div>
  );
}