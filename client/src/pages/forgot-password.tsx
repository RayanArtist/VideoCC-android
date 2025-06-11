import { useState } from "react";
import { motion } from "framer-motion";
import { Key, Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { authApi } from "@/lib/auth";
import { forgotPasswordSchema, type ForgotPasswordRequest } from "@shared/schema";
import { FloatingShapes } from "@/components/floating-shapes";

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<ForgotPasswordRequest>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const mutation = useMutation({
    mutationFn: authApi.forgotPassword,
    onSuccess: () => {
      setIsSuccess(true);
      toast({
        title: "Email sent",
        description: "Recovery link has been sent to your email",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Errorیی رخ داد",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: ForgotPasswordRequest) => {
    mutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <FloatingShapes />
      
      <div className="relative z-10 w-full max-w-md mx-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="glass-effect border-white/20">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                <Key className="text-white w-8 h-8" />
              </div>
              <CardTitle className="text-2xl font-bold text-white">
                Password Recovery
              </CardTitle>
              <p className="text-slate-300">
                Enter your email address to receive a recovery link
              </p>
            </CardHeader>
            
            <CardContent>
              {!isSuccess ? (
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-slate-200">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <Input
                        {...form.register("email")}
                        type="email"
                        className="w-full pr-10 pl-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent input-focus transition-all"
                        placeholder="example@email.com"
                      />
                    </div>
                    {form.formState.errors.email && (
                      <p className="text-red-400 text-sm">
                        {form.formState.errors.email.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-4">
                    <Button
                      type="submit"
                      disabled={mutation.isPending}
                      className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white py-3 px-6 rounded-xl font-semibold hover:shadow-lg hover:shadow-yellow-500/25 transform hover:scale-105 transition-all duration-200"
                    >
                      {mutation.isPending ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2" />
                          Sending...
                        </div>
                      ) : (
                        "Send Recovery Link"
                      )}
                    </Button>

                    <Link href="/">
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20"
                      >
                        <ArrowLeft className="w-4 h-4 ml-2" />
                        Back to Login
                      </Button>
                    </Link>
                  </div>
                </form>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center space-y-6"
                >
                  <div className="w-16 h-16 bg-green-500/20 rounded-full mx-auto flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-green-400" />
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">
                      Email Sent!
                    </h3>
                    <p className="text-slate-300 text-sm">
                      Recovery link has been sent to your email. Please check your inbox.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <p className="text-slate-400 text-xs">
                      Did not receive the email? Check your spam folder.
                    </p>
                    
                    <Link href="/">
                      <Button
                        variant="outline"
                        className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20"
                      >
                        <ArrowLeft className="w-4 h-4 ml-2" />
                        Back to Login
                      </Button>
                    </Link>
                  </div>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
