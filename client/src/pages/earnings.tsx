import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  DollarSign, 
  Video, 
  Users, 
  Gift, 
  Eye,
  Plus,
  Wallet,
  TrendingUp,
  Star,
  Play,
  X,
  ArrowLeft
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface EarningsData {
  vccBalance: number;
  lockedVcc: number;
  totalEarnedVcc: number;
  usdtEquivalent: number;
  canWithdrawToday: boolean;
  lastWithdrawal: string | null;
  streams: number;
  gifts: number;
  subscribers: number;
  exchangeRate: number;
}

interface ContentItem {
  id: number;
  title: string;
  type: string;
  price: number;
  subscribers: number;
  earnings: number;
}

interface UserData {
  user: {
    id: number;
    username: string;
    gender: string;
    email: string;
  };
}

export default function EarningsPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isStreamDialogOpen, setIsStreamDialogOpen] = useState(false);
  const [isContentDialogOpen, setIsContentDialogOpen] = useState(false);
  const [isWithdrawDialogOpen, setIsWithdrawDialogOpen] = useState(false);
  const [streamData, setStreamData] = useState({ title: "", description: "" });
  const [contentData, setContentData] = useState({ title: "", description: "", type: "photo", price: "" });
  const [withdrawData, setWithdrawData] = useState({ vccAmount: "", walletAddress: "" });
  const [purchaseData, setPurchaseData] = useState({ usdtAmount: "", transactionId: "" });

  // Fetch current user
  const { data: userData } = useQuery<UserData>({
    queryKey: ['/api/me'],
  });

  // Fetch earnings data
  const { data: earningsData } = useQuery<EarningsData>({
    queryKey: ['/api/earnings'],
  });

  // Fetch exclusive content
  const { data: userContent } = useQuery<{ content: ContentItem[] }>({
    queryKey: ['/api/my-content'],
  });

  // Mutations
  const startStreamMutation = useMutation({
    mutationFn: (data: { title: string; description: string }) =>
      apiRequest("POST", "/api/start-stream", data),
    onSuccess: () => {
      toast({ title: "Live stream started", description: "Your live stream started successfully" });
      setIsStreamDialogOpen(false);
      setStreamData({ title: "", description: "" });
      queryClient.invalidateQueries({ queryKey: ['/api/earnings'] });
    },
    onError: () => {
      toast({ title: "خطا", description: "Error starting live stream", variant: "destructive" });
    }
  });

  const createContentMutation = useMutation({
    mutationFn: (data: { title: string; description: string; type: string; price: string }) =>
      apiRequest("POST", "/api/create-content", data),
    onSuccess: () => {
      toast({ title: "محتوا ایجاد شد", description: "محتوای اختصاصی شما با موفقیت ایجاد شد" });
      setIsContentDialogOpen(false);
      setContentData({ title: "", description: "", type: "photo", price: "" });
      queryClient.invalidateQueries({ queryKey: ['/api/my-content'] });
    },
    onError: () => {
      toast({ title: "خطا", description: "خطا در ایجاد محتوا", variant: "destructive" });
    }
  });

  const withdrawMutation = useMutation({
    mutationFn: (data: { vccAmount: string; walletAddress: string }) =>
      apiRequest("POST", "/api/request-withdrawal", data),
    onSuccess: () => {
      toast({ title: "درخواست Withdrawal ثبت شد", description: "درخواست Withdrawal شما با موفقیت ثبت شد" });
      setIsWithdrawDialogOpen(false);
      setWithdrawData({ vccAmount: "", walletAddress: "" });
      queryClient.invalidateQueries({ queryKey: ['/api/earnings'] });
    },
    onError: (error: any) => {
      toast({ title: "خطا", description: error.message || "خطا در ثبت درخواست Withdrawal", variant: "destructive" });
    }
  });

  const purchaseTokensMutation = useMutation({
    mutationFn: (data: { usdtAmount: string; transactionId: string }) =>
      apiRequest("POST", "/api/purchase-tokens", data),
    onSuccess: (response: any) => {
      toast({ title: "Purchase موفق", description: response.message });
      setPurchaseData({ usdtAmount: "", transactionId: "" });
      queryClient.invalidateQueries({ queryKey: ['/api/earnings'] });
    },
    onError: (error: any) => {
      toast({ title: "خطا", description: error.message || "خطا در Purchase توکن", variant: "destructive" });
    }
  });

  // Check if user is female (earnings system is only for female users)
  if (!userData?.user || userData.user.gender !== "female") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-slate-800/50 border-slate-700">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <X className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">دسترسی محدود</h2>
            <p className="text-slate-300">
              سیستم کسب Earnings فقط برای کاربران خانم در دسترس است
            </p>
            <Button 
              onClick={() => setLocation("/home")}
              className="mt-4 bg-slate-700 hover:bg-slate-600"
            >
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-6xl mx-auto">
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
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-white">💰 سیستم کسب Earnings</h1>
              <p className="text-slate-300">مدیریت Earnings و محتوای اختصاصی</p>
            </div>
          </div>
        </div>

        {/* VCC Token Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-yellow-500/20 to-orange-600/20 border-yellow-500/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-yellow-300">Balance VCC</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                🪙 {earningsData?.vccBalance?.toLocaleString() || '1,000,000'}
              </div>
              <p className="text-xs text-yellow-300 mt-1">توکن VCC</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500/20 to-emerald-600/20 border-green-500/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-green-300">معادل USDT</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                ${earningsData?.usdtEquivalent?.toFixed(2) || '10,000.00'}
              </div>
              <p className="text-xs text-green-300 mt-1">نرخ: ۱۰۰ VCC = ۱ USDT</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-blue-500/20 to-cyan-600/20 border-blue-500/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-blue-300">توکن قفل شده</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                🔒 {earningsData?.lockedVcc?.toLocaleString() || '0'}
              </div>
              <p className="text-xs text-blue-300 mt-1">در انتظار Withdrawal</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500/20 to-pink-600/20 border-purple-500/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-purple-300">کل کسب شده</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                ⭐ {earningsData?.totalEarnedVcc?.toLocaleString() || '0'}
              </div>
              <p className="text-xs text-purple-300 mt-1">مجموع Earnings</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-slate-800 border-slate-700">
            <TabsTrigger value="overview" className="data-[state=active]:bg-slate-700">نمای کلی</TabsTrigger>
            <TabsTrigger value="purchase" className="data-[state=active]:bg-slate-700">Purchase توکن</TabsTrigger>
            <TabsTrigger value="streams" className="data-[state=active]:bg-slate-700">پخش femaleده</TabsTrigger>
            <TabsTrigger value="content" className="data-[state=active]:bg-slate-700">محتوای اختصاصی</TabsTrigger>
            <TabsTrigger value="withdraw" className="data-[state=active]:bg-slate-700">Withdrawal</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-300">پخش‌های femaleده</CardTitle>
                  <Video className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{earningsData?.streams || 0}</div>
                  <p className="text-xs text-slate-400">جلسات پخش femaleده</p>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-300">هدایا دریافتی</CardTitle>
                  <Gift className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{earningsData?.gifts || 0}</div>
                  <p className="text-xs text-slate-400">هدایای مجازی</p>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-300">دنبال‌کنندگان</CardTitle>
                  <Users className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{earningsData?.subscribers || 0}</div>
                  <p className="text-xs text-slate-400">مشترکین فعال</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="purchase" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    🪙 Purchase توکن VCC
                  </CardTitle>
                  <CardDescription className="text-slate-300">
                    نرخ تبدیل: ۱ USDT = ۱۰۰ توکن VCC
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-slate-200">مبلغ USDT</Label>
                    <Input
                      type="number"
                      value={purchaseData.usdtAmount}
                      onChange={(e) => setPurchaseData(prev => ({ ...prev, usdtAmount: e.target.value }))}
                      className="bg-slate-700 border-slate-600 text-white"
                      placeholder="مبلغ تتر مورد نظر"
                      min="1"
                    />
                    {purchaseData.usdtAmount && (
                      <p className="text-xs text-green-300 mt-1">
                        شما {(parseFloat(purchaseData.usdtAmount) * 100).toLocaleString()} توکن VCC دریافت خواهید کرد
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <Label className="text-slate-200">شناسه تراکنش (اختیاری)</Label>
                    <Input
                      value={purchaseData.transactionId}
                      onChange={(e) => setPurchaseData(prev => ({ ...prev, transactionId: e.target.value }))}
                      className="bg-slate-700 border-slate-600 text-white"
                      placeholder="شناسه تراکنش USDT"
                    />
                  </div>

                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                    <h4 className="text-blue-300 font-medium mb-2">آدرس کیف پول پلتفرم</h4>
                    <p className="text-sm text-slate-300 font-mono bg-slate-700 p-2 rounded">
                      TVk9SSNT2XWaYW3pPbpZaAcsLecHEwhHn3
                    </p>
                    <p className="text-xs text-slate-400 mt-2">
                      Send your USDT to this address to add VCC tokens to your wallet
                    </p>
                  </div>

                  <Button
                    onClick={() => purchaseTokensMutation.mutate(purchaseData)}
                    disabled={purchaseTokensMutation.isPending || !purchaseData.usdtAmount}
                    className="w-full bg-yellow-600 hover:bg-yellow-700"
                  >
                    <DollarSign className="w-4 h-4 mr-2" />
                    {purchaseTokensMutation.isPending ? "در حال پردازش..." : "Confirm Token Purchase"}
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">راهنمای Purchase</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center text-black text-sm font-bold flex-shrink-0">1</div>
                      <div>
                        <h4 className="text-white font-medium">Send USDT</h4>
                        <p className="text-sm text-slate-300">Send your USDT to the platform address</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center text-black text-sm font-bold flex-shrink-0">2</div>
                      <div>
                        <h4 className="text-white font-medium">وارد کردن مبلغ</h4>
                        <p className="text-sm text-slate-300">Enter the amount of USDT sent in the form above</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center text-black text-sm font-bold flex-shrink-0">3</div>
                      <div>
                        <h4 className="text-white font-medium">Confirm Purchase</h4>
                        <p className="text-sm text-slate-300">After confirmation, VCC tokens will be added to your wallet</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                    <h4 className="text-green-300 font-medium mb-2">مزایای توکن VCC</h4>
                    <ul className="text-sm text-slate-300 space-y-1">
                      <li>• Purchase محتوای اختصاصی</li>
                      <li>• Send virtual gifts</li>
                      <li>• حمایت از استریمرها</li>
                      <li>• قابلیت تبدیل به USDT</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="streams" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold text-white">مدیریت پخش femaleده</h3>
              <Dialog open={isStreamDialogOpen} onOpenChange={setIsStreamDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-red-600 hover:bg-red-700">
                    <Play className="w-4 h-4 mr-2" />
                    شروع پخش femaleده
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-800 border-slate-700">
                  <DialogHeader>
                    <DialogTitle className="text-white">شروع پخش femaleده جدید</DialogTitle>
                    <DialogDescription className="text-slate-300">
                      اطلاعات پخش femaleده خود را وارد کنید
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-slate-200">عنوان پخش</Label>
                      <Input
                        value={streamData.title}
                        onChange={(e) => setStreamData(prev => ({ ...prev, title: e.target.value }))}
                        className="bg-slate-700 border-slate-600 text-white"
                        placeholder="عنوان جذاب برای پخش femaleده"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-200">توضیحات</Label>
                      <Textarea
                        value={streamData.description}
                        onChange={(e) => setStreamData(prev => ({ ...prev, description: e.target.value }))}
                        className="bg-slate-700 border-slate-600 text-white"
                        placeholder="توضیح کوتاهی از محتوای پخش"
                      />
                    </div>
                    <Button
                      onClick={() => startStreamMutation.mutate(streamData)}
                      disabled={startStreamMutation.isPending}
                      className="w-full bg-red-600 hover:bg-red-700"
                    >
                      {startStreamMutation.isPending ? "Starting..." : "شروع پخش femaleده"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">آمار پخش‌های femaleده</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Video className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">هنوز پخش femaleده‌ای شروع نکرده‌اید</p>
                  <p className="text-sm text-slate-500 mt-2">
                    با شروع اولین پخش femaleده خود، Earningsزایی را آغاز کنید
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="content" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold text-white">محتوای اختصاصی</h3>
              <Dialog open={isContentDialogOpen} onOpenChange={setIsContentDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-purple-600 hover:bg-purple-700">
                    <Plus className="w-4 h-4 mr-2" />
                    ایجاد محتوا
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-800 border-slate-700">
                  <DialogHeader>
                    <DialogTitle className="text-white">ایجاد محتوای اختصاصی</DialogTitle>
                    <DialogDescription className="text-slate-300">
                      محتوای پریمیوم خود را ایجاد کنید
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-slate-200">عنوان محتوا</Label>
                      <Input
                        value={contentData.title}
                        onChange={(e) => setContentData(prev => ({ ...prev, title: e.target.value }))}
                        className="bg-slate-700 border-slate-600 text-white"
                        placeholder="عنوان محتوای اختصاصی"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-200">نوع محتوا</Label>
                      <Select value={contentData.type} onValueChange={(value) => setContentData(prev => ({ ...prev, type: value }))}>
                        <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                          <SelectItem value="photo">عکس</SelectItem>
                          <SelectItem value="video">ویدیو</SelectItem>
                          <SelectItem value="text">متن</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-slate-200">قیمت (دلار)</Label>
                      <Input
                        type="number"
                        value={contentData.price}
                        onChange={(e) => setContentData(prev => ({ ...prev, price: e.target.value }))}
                        className="bg-slate-700 border-slate-600 text-white"
                        placeholder="قیمت دسترسی"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-200">توضیحات</Label>
                      <Textarea
                        value={contentData.description}
                        onChange={(e) => setContentData(prev => ({ ...prev, description: e.target.value }))}
                        className="bg-slate-700 border-slate-600 text-white"
                        placeholder="توضیح محتوا"
                      />
                    </div>
                    <Button
                      onClick={() => createContentMutation.mutate(contentData)}
                      disabled={createContentMutation.isPending}
                      className="w-full bg-purple-600 hover:bg-purple-700"
                    >
                      {createContentMutation.isPending ? "در حال ایجاد..." : "ایجاد محتوا"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userContent?.content?.map((item) => (
                <Card key={item.id} className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white text-lg">{item.title}</CardTitle>
                    <CardDescription className="text-slate-400">
                      نوع: {item.type === 'photo' ? 'عکس' : item.type === 'video' ? 'ویدیو' : 'متن'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-300">قیمت:</span>
                        <span className="text-green-400">${item.price}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-300">مشترکین:</span>
                        <span className="text-blue-400">{item.subscribers}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-300">Earnings:</span>
                        <span className="text-yellow-400">${item.earnings}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )) || (
                <Card className="bg-slate-800/50 border-slate-700 col-span-full">
                  <CardContent className="p-8 text-center">
                    <Star className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400">هنوز محتوای اختصاصی ایجاد نکرده‌اید</p>
                    <p className="text-sm text-slate-500 mt-2">
                      با ایجاد محتوای ویژه، Earnings بیشتری کسب کنید
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="withdraw" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">درخواست Withdrawal توکن VCC</CardTitle>
                  <CardDescription className="text-slate-300">
                    حداقل Withdrawal: ۱۰۰۰ VCC (۱۰ USDT) | محدودیت: یک بار در روز
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-slate-200">مقدار توکن VCC</Label>
                    <Input
                      type="number"
                      value={withdrawData.vccAmount}
                      onChange={(e) => setWithdrawData(prev => ({ ...prev, vccAmount: e.target.value }))}
                      className="bg-slate-700 border-slate-600 text-white"
                      placeholder="مقدار توکن VCC"
                      min="1000"
                    />
                    {withdrawData.vccAmount && (
                      <div className="text-xs text-slate-300 mt-1 space-y-1">
                        <p>معادل USDT: {(parseFloat(withdrawData.vccAmount) * 0.01).toFixed(2)} تتر</p>
                        <p className="text-orange-300">کارمزد ۵٪: {(parseFloat(withdrawData.vccAmount) * 0.05).toFixed(0)} VCC</p>
                        <p className="text-green-300">مبلغ نهایی: {((parseFloat(withdrawData.vccAmount) * 0.95) * 0.01).toFixed(2)} USDT</p>
                      </div>
                    )}
                  </div>
                  <div>
                    <Label className="text-slate-200">آدرس کیف پول USDT</Label>
                    <Input
                      value={withdrawData.walletAddress}
                      onChange={(e) => setWithdrawData(prev => ({ ...prev, walletAddress: e.target.value }))}
                      className="bg-slate-700 border-slate-600 text-white"
                      placeholder="آدرس کیف پول USDT (TRC20)"
                    />
                  </div>

                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                    <h4 className="text-yellow-300 font-medium mb-2">⚠️ محدودیت‌های Withdrawal</h4>
                    <ul className="text-xs text-slate-300 space-y-1">
                      <li>• حداقل مبلغ: ۱۰۰۰ توکن VCC (۱۰ USDT)</li>
                      <li>• محدودیت روزانه: یک بار در روز</li>
                      <li>• کارمزد پلتفرم: ۵٪ از مبلغ کل</li>
                      <li>• زمان پردازش: ۲۴-۴۸ ساعت</li>
                    </ul>
                  </div>

                  <Button
                    onClick={() => withdrawMutation.mutate(withdrawData)}
                    disabled={withdrawMutation.isPending || !withdrawData.vccAmount || !withdrawData.walletAddress || parseFloat(withdrawData.vccAmount) < 1000}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <Wallet className="w-4 h-4 mr-2" />
                    {withdrawMutation.isPending ? "در حال ثبت..." : "درخواست Withdrawal"}
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">تاریخچه Withdrawal</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <TrendingUp className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400">هیچ درخواست Withdrawalی ثبت نشده</p>
                    <p className="text-sm text-slate-500 mt-2">
                      درخواست‌های Withdrawal شما اینجا نمایش داده می‌شود
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}