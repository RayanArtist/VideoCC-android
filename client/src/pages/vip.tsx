import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Crown, Star, Check, ArrowRight, Copy, Wallet, ArrowLeft, CreditCard, DollarSign, Coins, Gift } from "lucide-react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_51234567890abcdef');

interface VipPlan {
  id: string;
  name: string;
  duration: number;
  price: number;
  currency: string;
  originalPrice?: number;
  features: string[];
}

interface TokenPackage {
  id: string;
  name: string;
  tokens: number;
  price: number;
  bonus?: number;
  popular?: boolean;
}

interface CoinPackage {
  id: string;
  name: string;
  coins: number;
  price: number;
  bonus?: number;
  popular?: boolean;
  icon: string;
}

interface VipCoinBundle {
  id: string;
  name: string;
  vipDuration: number;
  coins: number;
  price: number;
  originalPrice?: number;
  features: string[];
  popular?: boolean;
}

const CheckoutForm = ({ plan, onSuccess }: { plan: VipPlan; onSuccess: () => void }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) return;

    setIsProcessing(true);

    try {
      const response = await apiRequest('POST', '/api/create-payment-intent', {
        planId: plan.id,
        amount: plan.price
      });
      const { clientSecret } = await response.json();

      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
        }
      });

      if (result.error) {
        toast({
          title: "Payment Failed",
          description: result.error.message,
          variant: "destructive",
        });
      } else {
        await apiRequest('POST', '/api/confirm-vip-purchase', {
          paymentIntentId: result.paymentIntent.id,
          planId: plan.id
        });
        
        toast({
          title: "Success!",
          description: "VIP subscription activated successfully",
        });
        onSuccess();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Payment processing failed",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="p-4 border border-slate-600 rounded-lg bg-slate-800">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#ffffff',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
            },
          }}
        />
      </div>
      
      <Button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
      >
        {isProcessing ? 'Processing...' : `Pay $${plan.price}`}
      </Button>
    </form>
  );
};

export default function VipPage() {
  const [selectedPlan, setSelectedPlan] = useState<VipPlan | null>(null);
  const [selectedTokenPackage, setSelectedTokenPackage] = useState<TokenPackage | null>(null);
  const [selectedCoinPackage, setSelectedCoinPackage] = useState<CoinPackage | null>(null);
  const [selectedBundle, setSelectedBundle] = useState<VipCoinBundle | null>(null);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isTokenPaymentOpen, setIsTokenPaymentOpen] = useState(false);
  const [isCoinPaymentOpen, setIsCoinPaymentOpen] = useState(false);
  const [isBundlePaymentOpen, setIsBundlePaymentOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState<'vip' | 'coins' | 'bundles' | 'tokens'>('coins');
  const [walletAddress, setWalletAddress] = useState("");
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data: plansData, isLoading: plansLoading } = useQuery({
    queryKey: ['/api/vip-plans'],
  });

  const { data: userData } = useQuery({
    queryKey: ['/api/me'],
  });

  const { data: vipStatus } = useQuery({
    queryKey: ['/api/vip-status'],
  });

  const { data: coinPackagesData } = useQuery({
    queryKey: ['/api/coin-packages'],
  });

  const { data: vipBundlesData } = useQuery({
    queryKey: ['/api/vip-coin-bundles'],
  });

  const { data: vccBalance, refetch: refetchVccBalance } = useQuery({
    queryKey: ['/api/vcc-tokens-balance'],
  });

  const tokenPackages: TokenPackage[] = [
    {
      id: 'tokens_100',
      name: '100 VCC Tokens',
      tokens: 100,
      price: 10,
      bonus: 0
    },
    {
      id: 'tokens_500',
      name: '500 VCC Tokens',
      tokens: 500,
      price: 45,
      bonus: 50,
      popular: true
    },
    {
      id: 'tokens_1000',
      name: '1000 VCC Tokens',
      tokens: 1000,
      price: 80,
      bonus: 200
    },
    {
      id: 'tokens_5000',
      name: '5000 VCC Tokens',
      tokens: 5000,
      price: 350,
      bonus: 1500
    }
  ];

  // Tether USDT wallet address
  const tetherWalletAddress = "TVk9SSNT2XWaYW3pPbpZaAcsLecHEwhHn3";

  const handlePurchaseVip = (plan: VipPlan) => {
    setSelectedPlan(plan);
    setIsPaymentDialogOpen(true);
  };

  const handlePurchaseTokens = (tokenPackage: TokenPackage) => {
    setSelectedTokenPackage(tokenPackage);
    setIsTokenPaymentOpen(true);
  };

  const handlePurchaseCoins = (coinPackage: CoinPackage) => {
    setSelectedCoinPackage(coinPackage);
    setIsCoinPaymentOpen(true);
  };

  const handlePurchaseBundle = (bundle: VipCoinBundle) => {
    setSelectedBundle(bundle);
    setIsBundlePaymentOpen(true);
  };

  const copyWalletAddress = () => {
    navigator.clipboard.writeText(tetherWalletAddress);
    toast({
      title: "Copied!",
      description: "Wallet address copied to clipboard",
    });
  };

  const handleTokenPurchaseSubmit = async () => {
    if (!selectedTokenPackage || !walletAddress.trim()) {
      toast({
        title: "Error",
        description: "Please provide your wallet address",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await apiRequest('POST', '/api/purchase-tokens', {
        packageId: selectedTokenPackage.id,
        amount: selectedTokenPackage.price,
        walletAddress: walletAddress.trim(),
        tokens: selectedTokenPackage.tokens + (selectedTokenPackage.bonus || 0)
      });

      toast({
        title: "Request Submitted!",
        description: "Your token purchase request has been submitted for review",
      });
      
      setIsTokenPaymentOpen(false);
      setWalletAddress("");
      setSelectedTokenPackage(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit token purchase request",
        variant: "destructive",
      });
    }
  };

  const handleVipPurchaseSubmit = async () => {
    if (!selectedPlan || !walletAddress.trim()) {
      toast({
        title: "Error",
        description: "Please provide your wallet address",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await apiRequest('POST', '/api/purchase-vip-crypto', {
        planId: selectedPlan.id,
        amount: selectedPlan.price,
        walletAddress: walletAddress.trim(),
        duration: selectedPlan.duration
      });

      toast({
        title: "Request Submitted!",
        description: "Your VIP purchase request has been submitted for review",
      });
      
      setIsPaymentDialogOpen(false);
      setWalletAddress("");
      setSelectedPlan(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit VIP purchase request",
        variant: "destructive",
      });
    }
  };

  const handleCoinPurchaseSubmit = async () => {
    if (!selectedCoinPackage || !walletAddress.trim()) {
      toast({
        title: "Error",
        description: "Please provide your wallet address",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await apiRequest('POST', '/api/purchase-coins-crypto', {
        packageId: selectedCoinPackage.id,
        amount: selectedCoinPackage.price,
        walletAddress: walletAddress.trim(),
        coins: selectedCoinPackage.coins + (selectedCoinPackage.bonus || 0)
      });

      toast({
        title: "Request Submitted!",
        description: "Your coin purchase request has been submitted for review",
      });
      
      // Refresh VCC balance
      refetchVccBalance();
      
      setIsCoinPaymentOpen(false);
      setWalletAddress("");
      setSelectedCoinPackage(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit coin purchase request",
        variant: "destructive",
      });
    }
  };

  const handleBundlePurchaseSubmit = async () => {
    if (!selectedBundle || !walletAddress.trim()) {
      toast({
        title: "Error",
        description: "Please provide your wallet address",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await apiRequest('POST', '/api/purchase-bundle-crypto', {
        bundleId: selectedBundle.id,
        amount: selectedBundle.price,
        walletAddress: walletAddress.trim(),
        vipDuration: selectedBundle.vipDuration,
        coins: selectedBundle.coins
      });

      toast({
        title: "Request Submitted!",
        description: "Your VIP + Coins bundle request has been submitted for review",
      });
      
      // Refresh VCC balance
      refetchVccBalance();
      
      setIsBundlePaymentOpen(false);
      setWalletAddress("");
      setSelectedBundle(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit bundle purchase request",
        variant: "destructive",
      });
    }
  };

  if (plansLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
      {/* Header */}
      <div className="bg-slate-800/50 border-b border-slate-700 sticky top-0 z-10 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-3">
          {/* Top Row - Back Button and VCC Balance */}
          <div className="flex items-center justify-between mb-3">
            <Button
              variant="ghost"
              onClick={() => setLocation("/")}
              className="text-slate-300 hover:text-white"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back
            </Button>
            
            {/* VCC Token Balance */}
            {vccBalance && (
              <div className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 border border-green-500/30 rounded-full px-4 py-2">
                <div className="flex items-center">
                  <Star className="w-4 h-4 text-green-400 mr-2" />
                  <span className="text-green-400 font-semibold text-sm">
                    VCC Pool: {vccBalance.formatted || vccBalance.balance?.toLocaleString()} tokens
                  </span>
                </div>
              </div>
            )}
          </div>
          
          {/* Bottom Row - Navigation Tabs */}
          <div className="flex justify-center space-x-2 overflow-x-auto">
            <Button
              variant={currentTab === 'coins' ? 'default' : 'ghost'}
              onClick={() => setCurrentTab('coins')}
              className={currentTab === 'coins' ? 'bg-blue-600' : 'text-slate-300'}
            >
              <Coins className="w-4 h-4 mr-2" />
              Buy Coins
            </Button>
            <Button
              variant={currentTab === 'vip' ? 'default' : 'ghost'}
              onClick={() => setCurrentTab('vip')}
              className={currentTab === 'vip' ? 'bg-purple-600' : 'text-slate-300'}
            >
              <Crown className="w-4 h-4 mr-2" />
              VIP Plans
            </Button>
            <Button
              variant={currentTab === 'bundles' ? 'default' : 'ghost'}
              onClick={() => setCurrentTab('bundles')}
              className={currentTab === 'bundles' ? 'bg-gradient-to-r from-purple-600 to-blue-600' : 'text-slate-300'}
            >
              <Gift className="w-4 h-4 mr-2" />
              VIP + Coins
            </Button>
            <Button
              variant={currentTab === 'tokens' ? 'default' : 'ghost'}
              onClick={() => setCurrentTab('tokens')}
              className={currentTab === 'tokens' ? 'bg-green-600' : 'text-slate-300'}
            >
              <DollarSign className="w-4 h-4 mr-2" />
              Buy Tokens
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {currentTab === 'vip' && (
          <>
            {/* VIP Hero Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-12"
            >
              <div className="inline-flex items-center bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-full px-6 py-2 mb-6">
                <Crown className="w-5 h-5 text-yellow-400 mr-2" />
                <span className="text-yellow-400 font-semibold">VIP Membership</span>
              </div>
              
              <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 bg-clip-text text-transparent mb-4">
                Unlock Premium Features
              </h1>
              
              <p className="text-xl text-slate-300 max-w-2xl mx-auto">
                Join our exclusive VIP community and enjoy unlimited access to premium features
              </p>
            </motion.div>

            {/* VIP Plans */}
            <div className="grid md:grid-cols-3 gap-8 mb-12">
              {plansData && plansData.map((plan: VipPlan, index: number) => (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className={`relative bg-slate-800/50 border-slate-700 hover:border-purple-500/50 transition-all duration-300 ${
                    plan.id === 'vip_3_months' ? 'ring-2 ring-purple-500/50 transform scale-105' : ''
                  }`}>
                    {plan.id === 'vip_3_months' && (
                      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                        <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-1">
                          Most Popular
                        </Badge>
                      </div>
                    )}
                    
                    <CardHeader className="text-center pb-4">
                      <CardTitle className="text-white text-xl mb-2">{plan.name}</CardTitle>
                      <div className="space-y-1">
                        {plan.originalPrice && (
                          <div className="text-slate-400 line-through text-sm">
                            ${plan.originalPrice}
                          </div>
                        )}
                        <div className="text-3xl font-bold text-white">
                          ${plan.price}
                          <span className="text-sm text-slate-400 font-normal">/{plan.duration}d</span>
                        </div>
                        {plan.originalPrice && (
                          <div className="text-green-400 text-sm font-semibold">
                            Save {Math.round(((plan.originalPrice - plan.price) / plan.originalPrice) * 100)}%
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        {plan.features.map((feature, idx) => (
                          <div key={idx} className="flex items-center">
                            <Check className="w-4 h-4 text-green-400 mr-3 flex-shrink-0" />
                            <span className="text-slate-300 text-sm">{feature}</span>
                          </div>
                        ))}
                      </div>
                      
                      <Button
                        onClick={() => handlePurchaseVip(plan)}
                        className={`w-full mt-6 ${
                          plan.id === 'vip_3_months'
                            ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
                            : 'bg-slate-700 hover:bg-slate-600'
                        }`}
                      >
                        <CreditCard className="w-4 h-4 mr-2" />
                        Choose Plan
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </>
        )}

        {currentTab === 'coins' && (
          <>
            {/* Coin Purchase Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-12"
            >
              <div className="inline-flex items-center bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-full px-6 py-2 mb-6">
                <Coins className="w-5 h-5 text-blue-400 mr-2" />
                <span className="text-blue-400 font-semibold">VCC Coins</span>
              </div>
              
              <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent mb-4">
                Purchase VCC Coins
              </h1>
              
              <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-6">
                Buy VCC coins to unlock premium features and enhance your experience
              </p>

              {/* Wallet Address Display */}
              <div className="bg-slate-800/50 border border-slate-600 rounded-lg p-4 max-w-md mx-auto">
                <Label className="text-slate-300 text-sm">Send USDT (TRC20) to:</Label>
                <div className="flex items-center mt-2">
                  <Input
                    value={tetherWalletAddress}
                    readOnly
                    className="bg-slate-700 border-slate-600 text-white text-sm"
                  />
                  <Button
                    onClick={copyWalletAddress}
                    size="sm"
                    variant="outline"
                    className="ml-2 border-slate-600 text-slate-300"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </motion.div>

            {/* Coin Packages */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {coinPackagesData && coinPackagesData.map((pkg: CoinPackage, index: number) => (
                <motion.div
                  key={pkg.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className={`relative bg-slate-800/50 border-slate-700 hover:border-blue-500/50 transition-all duration-300 ${
                    pkg.popular ? 'ring-2 ring-blue-500/50 transform scale-105' : ''
                  }`}>
                    {pkg.popular && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <Badge className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-3 py-1">
                          Popular
                        </Badge>
                      </div>
                    )}
                    
                    <CardHeader className="text-center pb-4">
                      <div className="text-4xl mb-2">{pkg.icon}</div>
                      <CardTitle className="text-white text-lg mb-2">{pkg.name}</CardTitle>
                      <div className="text-2xl font-bold text-white">
                        ${pkg.price}
                      </div>
                      <div className="text-blue-400 text-sm">
                        {pkg.coins} coins
                        {pkg.bonus && (
                          <span className="text-green-400 ml-1">
                            +{pkg.bonus} bonus
                          </span>
                        )}
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <Button
                        onClick={() => handlePurchaseCoins(pkg)}
                        className={`w-full ${
                          pkg.popular
                            ? 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700'
                            : 'bg-slate-700 hover:bg-slate-600'
                        }`}
                      >
                        <Wallet className="w-4 h-4 mr-2" />
                        Buy Coins
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </>
        )}

        {currentTab === 'coins' && (
          <>
            {/* Coins Hero Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-12"
            >
              <div className="inline-flex items-center bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-full px-6 py-2 mb-6">
                <Coins className="w-5 h-5 text-blue-400 mr-2" />
                <span className="text-blue-400 font-semibold">Buy Coins</span>
              </div>
              
              <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent mb-4">
                Purchase Coins
              </h1>
              
              <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-6">
                Buy coins to unlock premium features and enhance your experience
              </p>

              {/* Wallet Address Display */}
              <div className="bg-slate-800/50 border border-slate-600 rounded-lg p-4 max-w-md mx-auto">
                <Label className="text-slate-300 text-sm">Send USDT (TRC20) to:</Label>
                <div className="flex items-center mt-2">
                  <Input
                    value={tetherWalletAddress}
                    readOnly
                    className="bg-slate-700 border-slate-600 text-white text-sm"
                  />
                  <Button
                    onClick={copyWalletAddress}
                    size="sm"
                    variant="outline"
                    className="ml-2 border-slate-600 text-slate-300"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </motion.div>

            {/* Coin Packages */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {coinPackagesData && coinPackagesData.map((pkg: CoinPackage, index: number) => (
                <motion.div
                  key={pkg.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className={`relative bg-slate-800/50 border-slate-700 hover:border-blue-500/50 transition-all duration-300 ${
                    pkg.popular ? 'ring-2 ring-blue-500/50 transform scale-105' : ''
                  }`}>
                    {pkg.popular && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <Badge className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-3 py-1">
                          Popular
                        </Badge>
                      </div>
                    )}
                    
                    <CardHeader className="text-center pb-4">
                      <div className="text-4xl mb-2">{pkg.icon}</div>
                      <CardTitle className="text-white text-lg mb-2">{pkg.name}</CardTitle>
                      <div className="text-2xl font-bold text-white">
                        ${pkg.price}
                      </div>
                      <div className="text-blue-400 text-sm">
                        {pkg.coins} coins
                        {pkg.bonus && (
                          <span className="text-green-400 ml-1">
                            +{pkg.bonus} bonus
                          </span>
                        )}
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <Button
                        onClick={() => handlePurchaseCoins(pkg)}
                        className={`w-full ${
                          pkg.popular
                            ? 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700'
                            : 'bg-slate-700 hover:bg-slate-600'
                        }`}
                      >
                        <Wallet className="w-4 h-4 mr-2" />
                        Buy Coins
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </>
        )}

        {currentTab === 'bundles' && (
          <>
            {/* VIP + Coins Bundle Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-12"
            >
              <div className="inline-flex items-center bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-cyan-500/20 border border-purple-500/30 rounded-full px-6 py-2 mb-6">
                <Gift className="w-5 h-5 text-purple-400 mr-2" />
                <span className="text-purple-400 font-semibold">VIP + Coins Bundle</span>
              </div>
              
              <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent mb-4">
                Best Value Bundles
              </h1>
              
              <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-6">
                Get VIP membership + bonus coins in one amazing package
              </p>

              {/* Wallet Address Display */}
              <div className="bg-slate-800/50 border border-slate-600 rounded-lg p-4 max-w-md mx-auto">
                <Label className="text-slate-300 text-sm">Send USDT (TRC20) to:</Label>
                <div className="flex items-center mt-2">
                  <Input
                    value={tetherWalletAddress}
                    readOnly
                    className="bg-slate-700 border-slate-600 text-white text-sm"
                  />
                  <Button
                    onClick={copyWalletAddress}
                    size="sm"
                    variant="outline"
                    className="ml-2 border-slate-600 text-slate-300"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </motion.div>

            {/* VIP + Coin Bundles */}
            <div className="grid md:grid-cols-3 gap-8 mb-12">
              {vipBundlesData && vipBundlesData.map((bundle: VipCoinBundle, index: number) => (
                <motion.div
                  key={bundle.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className={`relative bg-slate-800/50 border-slate-700 hover:border-purple-500/50 transition-all duration-300 ${
                    bundle.popular ? 'ring-2 ring-purple-500/50 transform scale-105' : ''
                  }`}>
                    {bundle.popular && (
                      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                        <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-1">
                          Best Value
                        </Badge>
                      </div>
                    )}
                    
                    <CardHeader className="text-center pb-4">
                      <CardTitle className="text-white text-xl mb-2">{bundle.name}</CardTitle>
                      <div className="space-y-1">
                        {bundle.originalPrice && (
                          <div className="text-slate-400 line-through text-sm">
                            ${bundle.originalPrice}
                          </div>
                        )}
                        <div className="text-3xl font-bold text-white">
                          ${bundle.price}
                        </div>
                        <div className="text-purple-400 text-sm">
                          VIP {bundle.vipDuration} days + {bundle.coins} coins
                        </div>
                        {bundle.originalPrice && (
                          <div className="text-green-400 text-sm font-semibold">
                            Save {Math.round(((bundle.originalPrice - bundle.price) / bundle.originalPrice) * 100)}%
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        {bundle.features.map((feature, idx) => (
                          <div key={idx} className="flex items-center">
                            <Check className="w-4 h-4 text-green-400 mr-3 flex-shrink-0" />
                            <span className="text-slate-300 text-sm">{feature}</span>
                          </div>
                        ))}
                      </div>
                      
                      <Button
                        onClick={() => handlePurchaseBundle(bundle)}
                        className={`w-full mt-6 ${
                          bundle.popular
                            ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700'
                            : 'bg-slate-700 hover:bg-slate-600'
                        }`}
                      >
                        <Gift className="w-4 h-4 mr-2" />
                        Get Bundle
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </>
        )}

        {currentTab === 'tokens' && (
          <>
            {/* Token Purchase Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-12"
            >
              <div className="inline-flex items-center bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-full px-6 py-2 mb-6">
                <Coins className="w-5 h-5 text-blue-400 mr-2" />
                <span className="text-blue-400 font-semibold">VCC Tokens</span>
              </div>
              
              <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent mb-4">
                Purchase VCC Tokens
              </h1>
              
              <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-6">
                Buy VCC tokens to use for withdrawals and premium features
              </p>

              {/* Wallet Address Display */}
              <div className="bg-slate-800/50 border border-slate-600 rounded-lg p-4 max-w-md mx-auto">
                <Label className="text-slate-300 text-sm">Send USDT (TRC20) to:</Label>
                <div className="flex items-center mt-2">
                  <Input
                    value={tetherWalletAddress}
                    readOnly
                    className="bg-slate-700 border-slate-600 text-white text-sm"
                  />
                  <Button
                    onClick={copyWalletAddress}
                    size="sm"
                    variant="outline"
                    className="ml-2 border-slate-600 text-slate-300"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </motion.div>

            {/* Token Packages */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {tokenPackages.map((pkg, index) => (
                <motion.div
                  key={pkg.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className={`relative bg-slate-800/50 border-slate-700 hover:border-blue-500/50 transition-all duration-300 ${
                    pkg.popular ? 'ring-2 ring-blue-500/50 transform scale-105' : ''
                  }`}>
                    {pkg.popular && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <Badge className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-3 py-1">
                          Popular
                        </Badge>
                      </div>
                    )}
                    
                    <CardHeader className="text-center pb-4">
                      <CardTitle className="text-white text-lg mb-2">{pkg.name}</CardTitle>
                      <div className="text-2xl font-bold text-white">
                        ${pkg.price}
                      </div>
                      <div className="text-blue-400 text-sm">
                        {pkg.tokens} tokens
                        {pkg.bonus && (
                          <span className="text-green-400 ml-1">
                            +{pkg.bonus} bonus
                          </span>
                        )}
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <Button
                        onClick={() => handlePurchaseTokens(pkg)}
                        className={`w-full ${
                          pkg.popular
                            ? 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700'
                            : 'bg-slate-700 hover:bg-slate-600'
                        }`}
                      >
                        <Wallet className="w-4 h-4 mr-2" />
                        Buy Tokens
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* VIP Crypto Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">VIP Subscription Payment</DialogTitle>
            <DialogDescription className="text-slate-400">
              {selectedPlan && `${selectedPlan.name} - $${selectedPlan.price} USDT`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label className="text-slate-200">Send USDT to this address:</Label>
              <div className="flex items-center mt-2">
                <Input
                  value={tetherWalletAddress}
                  readOnly
                  className="bg-slate-700 border-slate-600 text-white text-sm"
                />
                <Button
                  onClick={copyWalletAddress}
                  size="sm"
                  variant="outline"
                  className="ml-2 border-slate-600 text-slate-300"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <div>
              <Label className="text-slate-200">Your USDT Wallet Address:</Label>
              <Input
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                placeholder="Enter your USDT wallet address..."
                className="bg-slate-700 border-slate-600 text-white mt-2"
              />
            </div>

            <div className="bg-slate-800 border border-slate-600 rounded-lg p-4 text-sm text-slate-300">
              <p className="font-semibold mb-2">Instructions:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Send exactly ${selectedPlan?.price} USDT (TRC20) to our wallet</li>
                <li>Enter your wallet address above</li>
                <li>Click submit to complete your VIP purchase</li>
                <li>VIP access will be activated within 24 hours after verification</li>
              </ol>
            </div>
            
            <Button
              onClick={handleVipPurchaseSubmit}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              disabled={!walletAddress.trim()}
            >
              <Crown className="w-4 h-4 mr-2" />
              Submit VIP Purchase Request
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Token Payment Dialog */}
      <Dialog open={isTokenPaymentOpen} onOpenChange={setIsTokenPaymentOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Purchase Tokens</DialogTitle>
            <DialogDescription className="text-slate-400">
              {selectedTokenPackage && `${selectedTokenPackage.name} - $${selectedTokenPackage.price} USDT`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label className="text-slate-200">Send USDT to this address:</Label>
              <div className="flex items-center mt-2">
                <Input
                  value={tetherWalletAddress}
                  readOnly
                  className="bg-slate-700 border-slate-600 text-white text-sm"
                />
                <Button
                  onClick={copyWalletAddress}
                  size="sm"
                  variant="outline"
                  className="ml-2 border-slate-600 text-slate-300"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <div>
              <Label className="text-slate-200">Your USDT Wallet Address:</Label>
              <Input
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                placeholder="Enter your USDT wallet address..."
                className="bg-slate-700 border-slate-600 text-white mt-2"
              />
            </div>

            <div className="bg-slate-800 border border-slate-600 rounded-lg p-4 text-sm text-slate-300">
              <p className="font-semibold mb-2">Instructions:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Send exactly ${selectedTokenPackage?.price} USDT (TRC20) to our wallet</li>
                <li>Enter your wallet address above</li>
                <li>Click submit to complete your purchase</li>
                <li>Tokens will be added within 24 hours after verification</li>
              </ol>
            </div>
            
            <Button
              onClick={handleTokenPurchaseSubmit}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
              disabled={!walletAddress.trim()}
            >
              <Coins className="w-4 h-4 mr-2" />
              Submit Purchase Request
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Coin Payment Dialog */}
      <Dialog open={isCoinPaymentOpen} onOpenChange={setIsCoinPaymentOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Purchase Coins</DialogTitle>
            <DialogDescription className="text-slate-400">
              {selectedCoinPackage && `${selectedCoinPackage.name} - $${selectedCoinPackage.price} USDT`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label className="text-slate-200">Send USDT to this address:</Label>
              <div className="flex items-center mt-2">
                <Input
                  value={tetherWalletAddress}
                  readOnly
                  className="bg-slate-700 border-slate-600 text-white text-sm"
                />
                <Button
                  onClick={copyWalletAddress}
                  size="sm"
                  variant="outline"
                  className="ml-2 border-slate-600 text-slate-300"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <div>
              <Label className="text-slate-200">Your USDT Wallet Address:</Label>
              <Input
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                placeholder="Enter your USDT wallet address..."
                className="bg-slate-700 border-slate-600 text-white mt-2"
              />
            </div>

            <div className="bg-slate-800 border border-slate-600 rounded-lg p-4 text-sm text-slate-300">
              <p className="font-semibold mb-2">Instructions:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Send exactly ${selectedCoinPackage?.price} USDT (TRC20) to our wallet</li>
                <li>Enter your wallet address above</li>
                <li>Click submit to complete your coin purchase</li>
                <li>Coins will be added within 24 hours after verification</li>
              </ol>
            </div>
            
            <Button
              onClick={handleCoinPurchaseSubmit}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
              disabled={!walletAddress.trim()}
            >
              <Coins className="w-4 h-4 mr-2" />
              Submit Coin Purchase Request
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bundle Payment Dialog */}
      <Dialog open={isBundlePaymentOpen} onOpenChange={setIsBundlePaymentOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Purchase VIP + Coins Bundle</DialogTitle>
            <DialogDescription className="text-slate-400">
              {selectedBundle && `${selectedBundle.name} - $${selectedBundle.price} USDT`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label className="text-slate-200">Send USDT to this address:</Label>
              <div className="flex items-center mt-2">
                <Input
                  value={tetherWalletAddress}
                  readOnly
                  className="bg-slate-700 border-slate-600 text-white text-sm"
                />
                <Button
                  onClick={copyWalletAddress}
                  size="sm"
                  variant="outline"
                  className="ml-2 border-slate-600 text-slate-300"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <div>
              <Label className="text-slate-200">Your USDT Wallet Address:</Label>
              <Input
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                placeholder="Enter your USDT wallet address..."
                className="bg-slate-700 border-slate-600 text-white mt-2"
              />
            </div>

            <div className="bg-slate-800 border border-slate-600 rounded-lg p-4 text-sm text-slate-300">
              <p className="font-semibold mb-2">Bundle Includes:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>VIP access for {selectedBundle?.vipDuration} days</li>
                <li>{selectedBundle?.coins} bonus coins</li>
                <li>All premium features unlocked</li>
              </ul>
              <p className="font-semibold mt-3 mb-2">Instructions:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Send exactly ${selectedBundle?.price} USDT (TRC20) to our wallet</li>
                <li>Enter your wallet address above</li>
                <li>Click submit to complete your bundle purchase</li>
                <li>VIP + coins will be activated within 24 hours after verification</li>
              </ol>
            </div>
            
            <Button
              onClick={handleBundlePurchaseSubmit}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              disabled={!walletAddress.trim()}
            >
              <Gift className="w-4 h-4 mr-2" />
              Submit Bundle Purchase Request
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}