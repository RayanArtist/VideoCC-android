import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/lib/languageContext";
import AuthPage from "@/pages/auth";
import HomePage from "@/pages/home";
import ForgotPasswordPage from "@/pages/forgot-password";
import VipPage from "@/pages/vip";
import EarningsPage from "@/pages/earnings";
import AdminPage from "@/pages/admin";
import LivePage from "@/pages/live";
import DownloadPage from "@/pages/download";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={AuthPage} />
      <Route path="/home" component={HomePage} />
      <Route path="/forgot-password" component={ForgotPasswordPage} />
      <Route path="/vip" component={VipPage} />
      <Route path="/earnings" component={EarningsPage} />
      <Route path="/admin" component={AdminPage} />
      <Route path="/live" component={LivePage} />
      <Route path="/download" component={DownloadPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
