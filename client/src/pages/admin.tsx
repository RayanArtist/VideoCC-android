import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Users, 
  DollarSign, 
  Settings, 
  BarChart3, 
  Shield, 
  AlertTriangle,
  Crown,
  Coins,
  UserCheck,
  UserX,
  ArrowLeft,
  Trash2,
  Edit,
  Ban,
  Eye
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface AdminStats {
  totalUsers: number;
  maleUsers: number;
  femaleUsers: number;
  totalVccTokens: number;
  totalUsdtValue: number;
  activeStreams: number;
  pendingWithdrawals: number;
  vipUsers: number;
  todayRegistrations: number;
}

interface UserData {
  id: number;
  username: string;
  email: string;
  gender: string;
  age: number;
  country: string;
  vccBalance: number;
  isVip: boolean;
  isVerified: boolean;
  createdAt: string;
  lastActive: string;
}

export default function AdminPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [tokenAmount, setTokenAmount] = useState("");
  const [exchangeRate, setExchangeRate] = useState("0.01");

  // Fetch admin statistics
  const { data: stats } = useQuery<AdminStats>({
    queryKey: ['/api/admin/stats'],
  });

  // Fetch all users
  const { data: users } = useQuery<UserData[]>({
    queryKey: ['/api/admin/users'],
  });

  // Fetch pending withdrawals
  const { data: withdrawals } = useQuery({
    queryKey: ['/api/admin/withdrawals'],
  });

  // Fetch banned users
  const { data: bannedUsers } = useQuery<UserData[]>({
    queryKey: ['/api/admin/banned-users'],
  });

  // Admin mutations
  const updateTokensMutation = useMutation({
    mutationFn: (data: { userId: number; amount: string; type: 'add' | 'remove' }) =>
      apiRequest("POST", "/api/admin/update-tokens", data),
    onSuccess: () => {
      toast({ title: "موجودی توکن به‌روزرسانی شد" });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
    }
  });

  const banUserMutation = useMutation({
    mutationFn: (userId: number) =>
      apiRequest("POST", "/api/admin/ban-user", { userId }),
    onSuccess: () => {
      toast({ title: "User banned" });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/banned-users'] });
    }
  });

  const unbanUserMutation = useMutation({
    mutationFn: (userId: number) =>
      apiRequest("POST", "/api/admin/unban-user", { userId }),
    onSuccess: () => {
      toast({ title: "User unbanned" });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/banned-users'] });
    }
  });

  const updateExchangeRateMutation = useMutation({
    mutationFn: (rate: string) =>
      apiRequest("POST", "/api/admin/exchange-rate", { rate }),
    onSuccess: () => {
      toast({ title: "نرخ تبدیل به‌روزرسانی شد" });
    }
  });

  const approveWithdrawalMutation = useMutation({
    mutationFn: (withdrawalId: number) =>
      apiRequest("POST", "/api/admin/approve-withdrawal", { withdrawalId }),
    onSuccess: () => {
      toast({ title: "Withdrawal request approved" });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/withdrawals'] });
    }
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-slate-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => setLocation("/home")}
              variant="outline"
              size="sm"
              className="bg-slate-800/50 border-slate-600 text-white hover:bg-slate-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              بازگشت
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-white">🔧 پنل مدیریت سیستم</h1>
              <p className="text-slate-300">مدیریت کامل پلتفرم Video.C.C</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="w-8 h-8 text-red-500" />
            <span className="text-red-400 font-bold">ADMIN ACCESS</span>
          </div>
        </div>

        {/* Statistics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-slate-800 border-slate-600 shadow-lg">
            <CardHeader className="pb-3 bg-blue-600 text-white rounded-t-lg">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            </CardHeader>
            <CardContent className="bg-white text-slate-900">
              <div className="text-2xl font-bold text-blue-700 mt-2">
                👥 {stats?.totalUsers?.toLocaleString() || '0'}
              </div>
              <p className="text-xs text-slate-600 mt-1">
                male: {stats?.maleUsers || 0} | female: {stats?.femaleUsers || 0}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-600 shadow-lg">
            <CardHeader className="pb-3 bg-yellow-500 text-white rounded-t-lg">
              <CardTitle className="text-sm font-medium">کل توکن‌ها</CardTitle>
            </CardHeader>
            <CardContent className="bg-white text-slate-900">
              <div className="text-2xl font-bold text-yellow-700 mt-2">
                🪙 {stats?.totalVccTokens?.toLocaleString() || '0'}
              </div>
              <p className="text-xs text-slate-600 mt-1">
                ارزش: ${stats?.totalUsdtValue?.toFixed(2) || '0.00'} USDT
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-600 shadow-lg">
            <CardHeader className="pb-3 bg-purple-600 text-white rounded-t-lg">
              <CardTitle className="text-sm font-medium">VIP Users</CardTitle>
            </CardHeader>
            <CardContent className="bg-white text-slate-900">
              <div className="text-2xl font-bold text-purple-700 mt-2">
                👑 {stats?.vipUsers?.toLocaleString() || '0'}
              </div>
              <p className="text-xs text-slate-600 mt-1">اعضای ویژه</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-600 shadow-lg">
            <CardHeader className="pb-3 bg-green-600 text-white rounded-t-lg">
              <CardTitle className="text-sm font-medium">ثبت‌نام امروز</CardTitle>
            </CardHeader>
            <CardContent className="bg-white text-slate-900">
              <div className="text-2xl font-bold text-green-700 mt-2">
                ⭐ {stats?.todayRegistrations || '0'}
              </div>
              <p className="text-xs text-slate-600 mt-1">New user</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <div className="overflow-x-auto pb-2">
            <TabsList className="bg-slate-800 border-slate-700 flex w-max min-w-full">
              <TabsTrigger value="users" className="data-[state=active]:bg-slate-700 whitespace-nowrap">User Management</TabsTrigger>
              <TabsTrigger value="banned" className="data-[state=active]:bg-slate-700 whitespace-nowrap">Banned Users</TabsTrigger>
              <TabsTrigger value="tokens" className="data-[state=active]:bg-slate-700 whitespace-nowrap">مدیریت توکن</TabsTrigger>
              <TabsTrigger value="withdrawals" className="data-[state=active]:bg-slate-700 whitespace-nowrap">درخواست‌های برداشت</TabsTrigger>
              <TabsTrigger value="settings" className="data-[state=active]:bg-slate-700 whitespace-nowrap">System Settings</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="users" className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">User List</CardTitle>
                <CardDescription className="text-slate-300">
                  Manage and control all platform users
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                    {users?.map((user) => (
                      <Card key={user.id} className="bg-slate-700/80 border-slate-500 shadow-md">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${user.gender === 'female' ? 'bg-pink-400' : 'bg-blue-400'}`} />
                              <span className="font-medium text-white">{user.username}</span>
                              {user.isVip && <Crown className="w-4 h-4 text-yellow-400" />}
                            </div>
                            <Button
                              onClick={() => {
                                setSelectedUser(user);
                                setIsUserDialogOpen(true);
                              }}
                              size="sm"
                              variant="outline"
                              className="bg-slate-600 border-slate-400 text-slate-200 hover:bg-slate-500"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="text-sm text-slate-200 space-y-1">
                            <p>Age: {user.age} | {user.country}</p>
                            <p>موجودی: {user.vccBalance?.toLocaleString()} VCC</p>
                            <p>تاریخ عضویت: {new Date(user.createdAt).toLocaleDateString('fa-IR')}</p>
                          </div>
                        </CardContent>
                      </Card>
                    )) || (
                      <div className="col-span-full text-center py-8">
                        <Users className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                        <p className="text-slate-400">No users found</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="banned" className="space-y-6">
            <Card className="bg-slate-800/70 border-slate-600 shadow-lg">
              <CardHeader>
                <CardTitle className="text-white">لیست Banned Users شده</CardTitle>
                <CardDescription className="text-slate-200">
                  مدیریت و بازگردانی Banned Users شده
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                    {bannedUsers?.map((user) => (
                      <Card key={user.id} className="bg-red-900/30 border-red-500/50 shadow-md">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-red-500" />
                              <span className="font-medium text-white">{user.username}</span>
                              <UserX className="w-4 h-4 text-red-400" />
                            </div>
                            <Button
                              onClick={() => unbanUserMutation.mutate(user.id)}
                              disabled={unbanUserMutation.isPending}
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              <UserCheck className="w-4 h-4 mr-1" />
                              رفع مسدودیت
                            </Button>
                          </div>
                          <div className="text-sm text-slate-200 space-y-1">
                            <p>Age: {user.age} | {user.country}</p>
                            <p>موجودی: {user.vccBalance?.toLocaleString()} VCC</p>
                            <p>تاریخ مسدودیت: {new Date(user.bannedAt || user.createdAt).toLocaleDateString('fa-IR')}</p>
                          </div>
                        </CardContent>
                      </Card>
                    )) || (
                      <div className="col-span-full text-center py-8">
                        <Shield className="w-16 h-16 text-slate-500 mx-auto mb-4" />
                        <p className="text-slate-300">No banned users found</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tokens" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-slate-800/70 border-slate-600 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-white">User Token Management</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-slate-100">Select User</Label>
                    <Select onValueChange={(value) => setSelectedUser(users?.find(u => u.id === parseInt(value)) || null)}>
                      <SelectTrigger className="bg-slate-700 border-slate-500 text-white">
                        <SelectValue placeholder="Select the desired user" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-600">
                        {users?.map((user) => (
                          <SelectItem key={user.id} value={user.id.toString()} className="text-slate-100">
                            {user.username} - {user.vccBalance?.toLocaleString()} VCC
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-slate-100">مقدار توکن</Label>
                    <Input
                      type="number"
                      value={tokenAmount}
                      onChange={(e) => setTokenAmount(e.target.value)}
                      className="bg-slate-700 border-slate-500 text-white placeholder:text-slate-400"
                      placeholder="مقدار توکن VCC"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => selectedUser && updateTokensMutation.mutate({
                        userId: selectedUser.id,
                        amount: tokenAmount,
                        type: 'add'
                      })}
                      disabled={!selectedUser || !tokenAmount || updateTokensMutation.isPending}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      <Coins className="w-4 h-4 mr-2" />
                      Add
                    </Button>
                    <Button
                      onClick={() => selectedUser && updateTokensMutation.mutate({
                        userId: selectedUser.id,
                        amount: tokenAmount,
                        type: 'remove'
                      })}
                      disabled={!selectedUser || !tokenAmount || updateTokensMutation.isPending}
                      className="flex-1 bg-red-600 hover:bg-red-700"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      کم کردن
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/70 border-slate-600 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-white">آمار توکن‌های VCC</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="bg-yellow-500/20 border border-yellow-400/50 rounded-lg p-4">
                      <h4 className="text-yellow-200 font-medium mb-2">توزیع توکن‌ها</h4>
                      <div className="text-sm text-slate-200 space-y-2">
                        <div className="flex justify-between">
                          <span>کل توکن‌ها:</span>
                          <span className="font-mono text-white">{stats?.totalVccTokens?.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>ارزش کل (USDT):</span>
                          <span className="font-mono text-white">${stats?.totalUsdtValue?.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Average per user:</span>
                          <span className="font-mono text-white">
                            {stats?.totalUsers ? Math.round(stats.totalVccTokens / stats.totalUsers).toLocaleString() : '0'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-blue-500/20 border border-blue-400/50 rounded-lg p-4">
                      <h4 className="text-blue-200 font-medium mb-2">Top Users</h4>
                      <div className="text-sm text-slate-200">
                        <p>User Listی با بیشترین موجودی توکن</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="withdrawals" className="space-y-6">
            <Card className="bg-slate-800/70 border-slate-600 shadow-lg">
              <CardHeader>
                <CardTitle className="text-white">درخواست‌های برداشت در انتظار</CardTitle>
                <CardDescription className="text-slate-200">
                  Review and approve user withdrawal requests
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {withdrawals?.length > 0 ? (
                    withdrawals.map((withdrawal: any) => (
                      <Card key={withdrawal.id} className="bg-slate-700/80 border-slate-500 shadow-md">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-white font-medium">{withdrawal.username}</p>
                              <p className="text-sm text-slate-200">
                                {withdrawal.vccAmount?.toLocaleString()} VCC → {withdrawal.finalUsdt} USDT
                              </p>
                              <p className="text-xs text-slate-300">
                                کیف پول: {withdrawal.walletAddress}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                onClick={() => approveWithdrawalMutation.mutate(withdrawal.id)}
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                <UserCheck className="w-4 h-4" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="bg-red-600 hover:bg-red-700 border-red-500 text-white"
                              >
                                <UserX className="w-4 h-4" />
                                رد
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <DollarSign className="w-16 h-16 text-slate-500 mx-auto mb-4" />
                      <p className="text-slate-300">درخواست برداشتی در انتظار نیست</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-slate-800/70 border-slate-600 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-white">Exchange Rate Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-slate-100">نرخ VCC به USDT</Label>
                    <Input
                      type="number"
                      step="0.000001"
                      value={exchangeRate}
                      onChange={(e) => setExchangeRate(e.target.value)}
                      className="bg-slate-700 border-slate-500 text-white placeholder:text-slate-400"
                      placeholder="0.01"
                    />
                    <p className="text-xs text-slate-300 mt-1">
                      نرخ فعلی: ۱ VCC = {exchangeRate} USDT
                    </p>
                  </div>
                  <Button
                    onClick={() => updateExchangeRateMutation.mutate(exchangeRate)}
                    disabled={updateExchangeRateMutation.isPending}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    به‌روزرسانی نرخ
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/70 border-slate-600 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-white">عملیات خطرناک</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-red-500/20 border border-red-400/50 rounded-lg p-4">
                    <h4 className="text-red-200 font-medium mb-2">⚠️ هشدار</h4>
                    <p className="text-sm text-slate-200 mb-3">
                      These operations are irreversible and affect the entire system
                    </p>
                    <div className="space-y-2">
                      <Button className="w-full bg-red-600 hover:bg-red-700 text-white" disabled>
                        <Trash2 className="w-4 h-4 mr-2" />
                        پاک کردن تمام داده‌ها
                      </Button>
                      <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white" disabled>
                        <AlertTriangle className="w-4 h-4 mr-2" />
                        Reset all user tokens
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* User Details Dialog */}
        <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
          <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-white">User Details</DialogTitle>
              <DialogDescription className="text-slate-300">
                Complete information for user {selectedUser?.username}
              </DialogDescription>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-6">
                {/* Header Section */}
                <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-lg">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <User className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{selectedUser.username}</h3>
                    <div className="flex items-center gap-3 text-sm text-slate-300">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${selectedUser.gender === 'female' ? 'bg-pink-500/20 text-pink-300' : 'bg-blue-500/20 text-blue-300'}`}>
                        <div className={`w-2 h-2 rounded-full ${selectedUser.gender === 'female' ? 'bg-pink-400' : 'bg-blue-400'}`} />
                        {selectedUser.gender}
                      </span>
                      {selectedUser.isVip && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-500/20 text-yellow-300 rounded-full text-xs">
                          <Crown className="w-3 h-3" />
                          VIP
                        </span>
                      )}
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${selectedUser.isVerified ? 'bg-green-500/20 text-green-300' : 'bg-gray-500/20 text-gray-300'}`}>
                        {selectedUser.isVerified ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                        {selectedUser.isVerified ? 'Approve شده' : 'Approve نشده'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Profile Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <h4 className="text-lg font-medium text-white border-b border-slate-600 pb-2">اطلاعات شخصی</h4>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-slate-700/50 rounded-lg">
                        <span className="text-slate-300">Username:</span>
                        <span className="text-white font-medium">{selectedUser.username}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-slate-700/50 rounded-lg">
                        <span className="text-slate-300">Email:</span>
                        <span className="text-white font-medium">{selectedUser.email || 'وارد نشده'}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-slate-700/50 rounded-lg">
                        <span className="text-slate-300">Age:</span>
                        <span className="text-white font-medium">{selectedUser.age} سال</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-slate-700/50 rounded-lg">
                        <span className="text-slate-300">کشور:</span>
                        <span className="text-white font-medium">{selectedUser.country}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-lg font-medium text-white border-b border-slate-600 pb-2">اطلاعات مالی</h4>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                        <span className="text-yellow-300">موجودی VCC:</span>
                        <span className="text-white font-bold">{selectedUser.vccBalance?.toLocaleString() || '0'}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-slate-700/50 rounded-lg">
                        <span className="text-slate-300">تاریخ عضویت:</span>
                        <span className="text-white font-medium">{new Date(selectedUser.createdAt).toLocaleDateString('fa-IR')}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-slate-700/50 rounded-lg">
                        <span className="text-slate-300">آخرین فعالیت:</span>
                        <span className="text-white font-medium">{selectedUser.lastActive ? new Date(selectedUser.lastActive).toLocaleDateString('fa-IR') : 'نامشخص'}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-slate-700/50 rounded-lg">
                        <span className="text-slate-300">وضعیت:</span>
                        <span className={`font-medium ${selectedUser.isBanned ? 'text-red-400' : 'text-green-400'}`}>
                          {selectedUser.isBanned ? 'مسدود' : 'فعال'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-600">
                  {selectedUser.isBanned ? (
                    <Button
                      onClick={() => unbanUserMutation.mutate(selectedUser.id)}
                      disabled={unbanUserMutation.isPending}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <UserCheck className="w-4 h-4 mr-2" />
                      رفع مسدودیت
                    </Button>
                  ) : (
                    <Button
                      onClick={() => banUserMutation.mutate(selectedUser.id)}
                      disabled={banUserMutation.isPending}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      <Ban className="w-4 h-4 mr-2" />
                      مسدود کردن
                    </Button>
                  )}
                  
                  <Button variant="outline" className="bg-slate-700 border-slate-500 text-slate-200 hover:bg-slate-600">
                    <Edit className="w-4 h-4 mr-2" />
                    ویرایش اطلاعات
                  </Button>
                  
                  <Button variant="outline" className="bg-slate-700 border-slate-500 text-slate-200 hover:bg-slate-600">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    ارسال پیام
                  </Button>
                  
                  <Button variant="outline" className="bg-slate-700 border-slate-500 text-slate-200 hover:bg-slate-600">
                    <Coins className="w-4 h-4 mr-2" />
                    مدیریت توکن
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}