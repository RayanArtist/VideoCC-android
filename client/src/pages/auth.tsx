import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, User, Lock, Eye, EyeOff, Mail, Key, RefreshCw, LogIn, UserPlus } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { FloatingShapes } from "@/components/floating-shapes";
import { PasswordStrength } from "@/components/password-strength";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { authApi } from "@/lib/auth";
import { insertUserSchema, loginSchema, type InsertUser, type LoginRequest } from "@shared/schema";

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [securityCode, setSecurityCode] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  // Load saved credentials on component mount
  useEffect(() => {
    const savedUsername = localStorage.getItem('savedUsername');
    const savedPassword = localStorage.getItem('savedPassword');
    const savedRememberMe = localStorage.getItem('rememberMe') === 'true';
    
    if (savedUsername && savedPassword && savedRememberMe) {
      loginForm.setValue('username', savedUsername);
      loginForm.setValue('password', savedPassword);
      setRememberMe(true);
    }
  }, []);

  // Forms
  const loginForm = useForm<LoginRequest>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm<InsertUser>({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
      email: "",
      securityCode: "",
    },
  });

  const forgotPasswordForm = useForm({
    defaultValues: {
      email: "",
    },
  });

  // Generate security code
  const { refetch: generateCode } = useQuery({
    queryKey: ['/api/security-code'],
    queryFn: authApi.generateSecurityCode,
    enabled: false,
  });

  // Generate security code on register mode open
  useEffect(() => {
    if (isRegisterMode) {
      generateCode().then((result) => {
        if (result.data?.code) {
          setSecurityCode(result.data.code);
        }
      });
    }
  }, [isRegisterMode, generateCode]);

  // Mutations
  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: () => {
      // Save credentials if remember me is checked
      if (rememberMe) {
        localStorage.setItem('savedUsername', loginForm.getValues('username'));
        localStorage.setItem('savedPassword', loginForm.getValues('password'));
        localStorage.setItem('rememberMe', 'true');
      } else {
        localStorage.removeItem('savedUsername');
        localStorage.removeItem('savedPassword');
        localStorage.removeItem('rememberMe');
      }
      
      toast({
        title: "Login Successful",
        description: "Welcome to your account",
      });
      setLocation("/home");
    },
    onError: (error: any) => {
      toast({
        title: "Login Error",
        description: error.message || "Invalid username or password",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: () => {
      toast({
        title: "Registration Successful",
        description: "Your account was created successfully",
      });
      setLocation("/home");
    },
    onError: (error: any) => {
      toast({
        title: "Registration Error",
        description: error.message || "An error occurred during registration",
        variant: "destructive",
      });
    },
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: authApi.forgotPassword,
    onSuccess: () => {
      toast({
        title: "Email Sent",
        description: "Recovery link sent to your email",
      });
      setIsForgotPasswordOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Errorیی رخ داد",
        variant: "destructive",
      });
    },
  });

  const handleLogin = (data: LoginRequest) => {
    loginMutation.mutate(data);
  };

  const handleRegister = (data: InsertUser) => {
    registerMutation.mutate({ ...data, securityCode });
  };

  const handleForgotPassword = (data: { email: string }) => {
    forgotPasswordMutation.mutate(data);
  };

  const refreshSecurityCode = () => {
    generateCode().then((result) => {
      if (result.data?.code) {
        setSecurityCode(result.data.code);
      }
    });
  };

  const watchPassword = registerForm.watch("password");

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <FloatingShapes />
      
      <div className="relative z-10 w-full max-w-md mx-4">
        <motion.div
          className="glass-effect rounded-2xl p-8 shadow-2xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Logo/Brand Section */}
          <div className="text-center mb-8">
            <div className="w-32 h-24 mx-auto mb-4 flex items-center justify-center">
              <img 
                src="/attached_assets/logo_1749411132787.png" 
                alt="Video Call Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Video.C.C</h1>
            <p className="text-slate-300 text-lg">Video Call Chat</p>
            <p className="text-slate-400 text-sm mt-2">Login to your account or register</p>
          </div>

          <AnimatePresence mode="wait">
            {!isRegisterMode ? (
              <motion.div
                key="login"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-6">
                  {/* Username Input */}
                  <div className="space-y-2">
                    <Label className="text-slate-200">Username</Label>
                    <div className="relative">
                      <User className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <Input
                        {...loginForm.register("username")}
                        type="text"
                        className="w-full pr-10 pl-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent input-focus transition-all"
                        placeholder="Username خود را وارد کنید"
                      />
                    </div>
                  </div>

                  {/* Password Input */}
                  <div className="space-y-2">
                    <Label className="text-slate-200">Password</Label>
                    <div className="relative">
                      <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <Input
                        {...loginForm.register("password")}
                        type={showPassword ? "text" : "password"}
                        className="w-full pr-10 pl-10 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent input-focus transition-all"
                        placeholder="Password خود را وارد کنید"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-200 p-0 h-auto"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>

                  {/* Remember Me Checkbox */}
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <input
                      type="checkbox"
                      id="rememberMe"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 bg-slate-700 border-slate-600 rounded focus:ring-indigo-500 focus:ring-2"
                    />
                    <Label htmlFor="rememberMe" className="text-slate-200 text-sm cursor-pointer">
                      Remember me
                    </Label>
                  </div>

                  {/* Forgot Password */}
                  <div className="text-left">
                    <Button
                      type="button"
                      variant="link"
                      className="text-indigo-400 hover:text-indigo-300 p-0 h-auto text-sm"
                      onClick={() => setIsForgotPasswordOpen(true)}
                    >
                      Forgot your password?
                    </Button>
                  </div>

                  {/* Login Button */}
                  <Button
                    type="submit"
                    disabled={loginMutation.isPending}
                    className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3 px-6 rounded-xl font-semibold hover:shadow-lg hover:shadow-indigo-500/25 transform hover:scale-105 transition-all duration-200"
                  >
                    {loginMutation.isPending ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2" />
                        Logging in...
                      </div>
                    ) : (
                      <>
                        <LogIn className="w-4 h-4 ml-2" />
                        Login
                      </>
                    )}
                  </Button>

                  {/* Register Toggle */}
                  <div className="text-center">
                    <p className="text-slate-300 text-sm">
                      Don't have an account?
                      <Button
                        type="button"
                        variant="link"
                        className="text-indigo-400 hover:text-indigo-300 p-0 h-auto text-sm mr-1"
                        onClick={() => setIsRegisterMode(true)}
                      >
                        Register now
                      </Button>
                    </p>
                  </div>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="register"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="text-center mb-6">
                  <h2 className="text-xl font-bold text-white">Register</h2>
                  <p className="text-slate-300 text-sm">حساب کاربری جدید ایجاد کنید</p>
                </div>

                <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-6">
                  {/* Username Input */}
                  <div className="space-y-2">
                    <Label className="text-slate-200">Username</Label>
                    <div className="relative">
                      <User className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <Input
                        {...registerForm.register("username")}
                        type="text"
                        className="w-full pr-10 pl-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent input-focus transition-all"
                        placeholder="Username مورد نظر خود را وارد کنید"
                      />
                    </div>
                  </div>

                  {/* Email Input */}
                  <div className="space-y-2">
                    <Label className="text-slate-200">Email (اختیاری)</Label>
                    <div className="relative">
                      <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <Input
                        {...registerForm.register("email")}
                        type="email"
                        className="w-full pr-10 pl-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent input-focus transition-all"
                        placeholder="آدرس Email خود را وارد کنید"
                      />
                    </div>
                  </div>

                  {/* Password Input */}
                  <div className="space-y-2">
                    <Label className="text-slate-200">Password</Label>
                    <div className="relative">
                      <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <Input
                        {...registerForm.register("password")}
                        type={showPassword ? "text" : "password"}
                        className="w-full pr-10 pl-10 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent input-focus transition-all"
                        placeholder="Password قوی Select"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-200 p-0 h-auto"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                    {watchPassword && <PasswordStrength password={watchPassword} />}
                  </div>

                  {/* Confirm Password Input */}
                  <div className="space-y-2">
                    <Label className="text-slate-200">تایید Password</Label>
                    <div className="relative">
                      <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <Input
                        {...registerForm.register("confirmPassword")}
                        type={showConfirmPassword ? "text" : "password"}
                        className="w-full pr-10 pl-10 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent input-focus transition-all"
                        placeholder="Password را مجدداً وارد کنید"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-200 p-0 h-auto"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>

                  {/* Security Code */}
                  <div className="space-y-2">
                    <Label className="text-slate-200">Security Code</Label>
                    <div className="flex space-x-3 space-x-reverse items-center">
                      <div className="flex-1">
                        <Input
                          {...registerForm.register("securityCode")}
                          type="text"
                          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent input-focus transition-all"
                          placeholder="کد را وارد کنید"
                        />
                      </div>
                      <div className="w-24 h-12 bg-gradient-to-r from-slate-700 to-slate-600 rounded-lg flex items-center justify-center border border-slate-500">
                        <span className="text-white font-mono font-bold text-lg">{securityCode}</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="p-3 bg-white/10 hover:bg-white/20 rounded-lg border border-white/20 transition-colors"
                        onClick={refreshSecurityCode}
                      >
                        <RefreshCw className="w-4 h-4 text-white" />
                      </Button>
                    </div>
                  </div>

                  {/* Register Button */}
                  <Button
                    type="submit"
                    disabled={registerMutation.isPending}
                    className="w-full bg-gradient-to-r from-green-500 to-indigo-500 text-white py-3 px-6 rounded-xl font-semibold hover:shadow-lg hover:shadow-green-500/25 transform hover:scale-105 transition-all duration-200"
                  >
                    {registerMutation.isPending ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2" />
                        Registering...
                      </div>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4 ml-2" />
                        تایید و Register
                      </>
                    )}
                  </Button>

                  {/* Back to Login */}
                  <div className="text-center">
                    <p className="text-slate-300 text-sm">
                      قبلاً Register کرده‌اید؟
                      <Button
                        type="button"
                        variant="link"
                        className="text-indigo-400 hover:text-indigo-300 p-0 h-auto text-sm mr-1"
                        onClick={() => setIsRegisterMode(false)}
                      >
                        Login
                      </Button>
                    </p>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Forgot Password Modal */}
        <AnimatePresence>
          {isForgotPasswordOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center px-4"
              onClick={() => setIsForgotPasswordOpen(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="glass-effect rounded-2xl p-8 w-full max-w-md"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-center mb-6">
                  <div className="w-12 h-12 bg-yellow-500/20 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <Key className="text-yellow-500 w-6 h-6" />
                  </div>
                  <h2 className="text-xl font-bold text-white mb-2">بازیابی Password</h2>
                  <p className="text-slate-300 text-sm">آدرس Email خود را وارد کنید</p>
                </div>

                <form onSubmit={forgotPasswordForm.handleSubmit(handleForgotPassword)} className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-slate-200">آدرس Email</Label>
                    <div className="relative">
                      <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <Input
                        {...forgotPasswordForm.register("email", { required: true })}
                        type="email"
                        className="w-full pr-10 pl-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent input-focus transition-all"
                        placeholder="example@email.com"
                      />
                    </div>
                  </div>

                  <div className="flex space-x-3 space-x-reverse">
                    <Button
                      type="button"
                      variant="secondary"
                      className="flex-1 px-4 py-3 bg-slate-600 hover:bg-slate-500 text-white rounded-xl transition-colors"
                      onClick={() => setIsForgotPasswordOpen(false)}
                    >
                      انصراف
                    </Button>
                    <Button
                      type="submit"
                      disabled={forgotPasswordMutation.isPending}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all"
                    >
                      {forgotPasswordMutation.isPending ? "در حال ارسال..." : "ارسال لینک"}
                    </Button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
