import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { PageLoader } from '@/components/ui/page-loader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Lock, Mail, Eye, EyeOff } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requiredRole?: string;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ 
  children, 
  requireAuth = true, 
  requiredRole 
}) => {
  const { user, isLoading } = useAuth();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [checkingRole, setCheckingRole] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (user && requiredRole) {
      setCheckingRole(true);
      supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single()
        .then(({ data, error }) => {
          if (data) {
            setUserRole(data.role);
          }
          setCheckingRole(false);
        });
    }
  }, [user, requiredRole]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);

    try {
      if (authMode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast({
          title: "Welcome back!",
          description: "You have been signed in successfully.",
        });
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        toast({
          title: "Account created!",
          description: "Please check your email to verify your account.",
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: error.message,
      });
    } finally {
      setAuthLoading(false);
    }
  };

  // Show loading while checking auth
  if (isLoading || checkingRole) {
    return <PageLoader />;
  }

  // Show auth form if auth is required but user is not logged in
  if (requireAuth && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="text-center mb-6">
              <Lock className="h-12 w-12 text-primary mx-auto mb-4" />
              <h1 className="text-2xl font-bold">
                {authMode === 'signin' ? 'Sign In' : 'Create Account'}
              </h1>
              <p className="text-muted-foreground">
                {authMode === 'signin' 
                  ? 'Welcome back! Please sign in to continue.' 
                  : 'Join us today! Create your account to get started.'
                }
              </p>
            </div>

            <form onSubmit={handleAuth} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={authLoading}>
                {authLoading ? 'Loading...' : (authMode === 'signin' ? 'Sign In' : 'Create Account')}
              </Button>
            </form>

            <div className="text-center mt-4">
              <button
                onClick={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')}
                className="text-sm text-primary hover:underline"
              >
                {authMode === 'signin' 
                  ? "Don't have an account? Sign up" 
                  : "Already have an account? Sign in"
                }
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check role requirements
  if (requiredRole && userRole !== requiredRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <Card>
          <CardContent className="text-center p-8">
            <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">
              You don't have permission to access this area.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // All checks passed, render children
  return <>{children}</>;
};