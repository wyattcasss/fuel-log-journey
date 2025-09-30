import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { Apple, Dumbbell, Mail, CheckCircle } from "lucide-react";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is coming back from email verification
    const checkEmailVerification = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email_confirmed_at) {
        toast.success("Email verified successfully! Welcome!");
        navigate("/onboarding");
      }
    };
    
    checkEmailVerification();
  }, [navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) throw error;
        
        // For development - allow sign in without email verification
        // if (!data.user?.email_confirmed_at) {
        //   toast.error("Please verify your email before signing in. Check your inbox!");
        //   setLoading(false);
        //   return;
        // }
        
        toast.success("Welcome back!");
        navigate("/");
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth`,
            // Disable email confirmation for development
            data: {
              email_confirm: false
            }
          },
        });
        
        if (error) throw error;
        
        // For development - skip email verification
        toast.success("Account created! Welcome to Fitify!");
        navigate("/onboarding");
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const resendVerification = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: verificationEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/auth`,
        }
      });
      
      if (error) throw error;
      toast.success("Verification email sent! Check your inbox.");
    } catch (error: any) {
      toast.error(error.message || "Failed to resend verification email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--gradient-hero)" }}>
      <Card className="w-full max-w-md shadow-lg">
        {showVerification ? (
          // Email Verification Screen
          <>
            <CardHeader className="space-y-1 text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <Mail className="w-8 h-8 text-primary" />
                </div>
              </div>
              <CardTitle className="text-3xl font-bold">
                Check Your Email
              </CardTitle>
              <CardDescription>
                We've sent a verification link to {verificationEmail}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Click the verification link in your email to activate your account and start tracking your fitness journey!
                </AlertDescription>
              </Alert>
              
              <div className="space-y-3">
                <Button 
                  onClick={resendVerification} 
                  variant="outline" 
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? "Sending..." : "Resend Verification Email"}
                </Button>
                
                <Button 
                  onClick={() => {
                    setShowVerification(false);
                    setIsLogin(true);
                  }} 
                  variant="ghost" 
                  className="w-full"
                >
                  Back to Sign In
                </Button>
              </div>
            </CardContent>
          </>
        ) : (
          // Login/Sign Up Screen
          <>
            <CardHeader className="space-y-1 text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <Apple className="w-8 h-8 text-primary" />
                </div>
              </div>
              <CardTitle className="text-3xl font-bold">
                {isLogin ? "Welcome Back" : "Start Your Journey"}
              </CardTitle>
              <CardDescription>
                {isLogin
                  ? "Sign in to track your fitness progress"
                  : "Create an account to begin tracking"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAuth} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                
                {!isLogin && (
                  <Alert>
                    <Mail className="h-4 w-4" />
                    <AlertDescription>
                      Account will be created instantly for development. Email verification disabled.
                    </AlertDescription>
                  </Alert>
                )}
                
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Loading..." : isLogin ? "Sign In" : "Create Account"}
                </Button>
              </form>

              <div className="mt-6 text-center text-sm">
                <button
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-primary hover:underline font-medium"
                >
                  {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                </button>
              </div>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
};

export default Auth;
