'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function Home() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  const router = useRouter();
  const { toast } = useToast();
  
  // Debug environment variables
  useEffect(() => {
    console.log('Environment check:', {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing'
    });
  }, []);
  
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Login attempt with:', { email, password });
    setLoading(true);

    try {
      console.log('Creating Supabase client...');
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log('Supabase response:', { data, error });

      if (error) {
        throw error;
      }

      if (data?.user) {
        console.log('Login successful, user:', data.user);
        // Check if user has seen disclaimer recently
        const { data: profile } = await supabase
          .from('profiles')
          .select('last_disclaimer_shown, disclaimer_dont_show')
          .eq('id', data.user.id)
          .single();

        const now = new Date();
        const lastShown = profile?.last_disclaimer_shown 
          ? new Date(profile.last_disclaimer_shown) 
          : null;
        
        // Show disclaimer if never shown or last shown more than 30 days ago
        const showDisclaimer = !lastShown || 
          !profile?.disclaimer_dont_show || 
          now.getTime() - lastShown.getTime() > 30 * 24 * 60 * 60 * 1000;

        if (showDisclaimer) {
          router.push('/disclaimer');
        } else {
          router.push('/dashboard');
        }
      }
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: "Login Failed",
        description: error.message || "Please check your credentials and try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Check if username already exists
      const { data: existingUsers, error: searchError } = await supabase
        .from('profiles')
        .select('id')
        .eq('name', username);

      if (searchError) throw searchError;

      if (existingUsers && existingUsers.length > 0) {
        throw new Error('Username already exists. Please choose another one.');
      }

      // Create new user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            name: username,
          },
        },
      });

      if (error) throw error;

      if (data?.user) {
        toast({
          title: "Account created!",
          description: "Please verify your email to continue.",
        });
        
        // Redirect to profile setup
        router.push('/profile-setup');
      }
    } catch (error: any) {
      toast({
        title: "Sign Up Failed",
        description: error.message || "An error occurred during sign up.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const testButtonClick = () => {
    console.log('Test button clicked!');
    alert('Button interaction works!');
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
      {/* Temporarily comment out background images to test button functionality */}
      {/* <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-background/95 z-10"></div>
        <div className="grid grid-cols-6 grid-rows-6 gap-4 w-full h-full opacity-20">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="relative">
              <Image 
                src={`/images/food-${(i % 12) + 1}.jpg`} 
                alt="Food background" 
                fill 
                className="object-cover rounded-lg"
                priority={i < 4}
              />
            </div>
          ))}
        </div>
      </div> */}

      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Image 
            src="/images/logo.png" 
            alt="2-Rule AIM Logo" 
            width={120} 
            height={120} 
            className="mx-auto" 
          />
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-primary">
            What to Eat?
          </h1>
          <h2 className="mt-1 text-xl font-semibold text-text-primary">
            The 2-Rule AIM
          </h2>
          <p className="mt-2 text-text-secondary">
            Anti-inflammatory Meal Generator, Builder, and Planner
          </p>
          
          {/* Test button to check if button interactions work */}
          <Button 
            onClick={testButtonClick}
            className="mt-4 bg-red-500 hover:bg-red-600"
          >
            Test Button (Click me!)
          </Button>
        </div>

        <Card className="border-2 border-primary/20 shadow-lg">
          <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleLogin}>
                <CardHeader>
                  <CardTitle>Welcome Back</CardTitle>
                  <CardDescription>
                    Enter your credentials to access your account
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
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
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Password</Label>
                      <Link 
                        href="/forgot-password" 
                        className="text-sm text-primary hover:underline"
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    type="submit" 
                    className="w-full bg-primary hover:bg-primary-dark"
                    disabled={loading}
                  >
                    {loading ? "Logging in..." : "Login"}
                  </Button>
                </CardFooter>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignUp}>
                <CardHeader>
                  <CardTitle>Create an Account</CardTitle>
                  <CardDescription>
                    Start your journey to better nutrition
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      type="text"
                      placeholder="Your name"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <p className="text-xs text-text-secondary">
                      Password must be at least 8 characters long
                    </p>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    type="submit" 
                    className="w-full bg-primary hover:bg-primary-dark"
                    disabled={loading}
                  >
                    {loading ? "Creating Account..." : "Sign Up"}
                  </Button>
                </CardFooter>
              </form>
            </TabsContent>
          </Tabs>
        </Card>

        <div className="text-center text-sm text-text-secondary">
          <p>
            By continuing, you agree to our{" "}
            <Link href="/terms" className="font-medium text-primary hover:underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="font-medium text-primary hover:underline">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
