'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { mealRules } from '@/lib/constants';
import { formatDate } from '@/lib/utils';
import { 
  LayoutDashboard, Sparkles, Utensils, BookmarkCheck, Calendar, ShoppingCart, 
  Apple, BookOpen, HelpCircle, Info, Settings, CreditCard, LifeBuoy, Mail,
  PlusCircle, AlertTriangle, CheckCircle, ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import GaugeChart from 'react-gauge-chart';

export default function DashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createBrowserClient();
  
  // User state
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Meal metrics state
  const [fructoseTotal, setFructoseTotal] = useState(0);
  const [omega3Total, setOmega3Total] = useState(0);
  const [omega6Total, setOmega6Total] = useState(0);
  const [omegaRatio, setOmegaRatio] = useState('1:0');
  const [hasMealsToday, setHasMealsToday] = useState(false);
  
  // Subscription state
  const [isPremium, setIsPremium] = useState(false);
  const [mealsGenerated, setMealsGenerated] = useState(0);
  const [mealsSaved, setMealsSaved] = useState(0);
  
  // Fetch user data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        
        // Get current session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user) {
          router.push('/');
          return;
        }
        
        setUser(session.user);
        
        // Get user profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        if (profileError) {
          throw profileError;
        }
        
        setProfile(profileData);
        
        // Get subscription status
        const { data: subscriptionData } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', session.user.id)
          .eq('status', 'active')
          .single();
        
        setIsPremium(!!subscriptionData && subscriptionData.tier === 'premium');
        
        if (subscriptionData) {
          setMealsGenerated(subscriptionData.meals_generated_count || 0);
          setMealsSaved(subscriptionData.meals_saved_count || 0);
        }
        
        // Get today's meals from calendar
        const today = new Date().toISOString().split('T')[0];
        const { data: calendarEntry } = await supabase
          .from('calendar_entries')
          .select(`
            date,
            daily_fructose,
            daily_omega_ratio,
            breakfast_id,
            lunch_id,
            dinner_id,
            snack1_id,
            snack2_id,
            dessert_id,
            full_day_id
          `)
          .eq('user_id', session.user.id)
          .eq('date', today)
          .single();
        
        if (calendarEntry) {
          setFructoseTotal(calendarEntry.daily_fructose || 0);
          
          // Parse omega ratio (format: "1:X.XX")
          if (calendarEntry.daily_omega_ratio) {
            setOmegaRatio(calendarEntry.daily_omega_ratio);
            const ratio = parseFloat(calendarEntry.daily_omega_ratio.split(':')[1]);
            // Calculate back the totals (approximate)
            if (ratio > 0) {
              setOmega3Total(10); // Arbitrary base value
              setOmega6Total(10 * ratio);
            }
          }
          
          // Check if there are any meals today
          const hasMeals = !!(
            calendarEntry.breakfast_id || 
            calendarEntry.lunch_id || 
            calendarEntry.dinner_id || 
            calendarEntry.snack1_id || 
            calendarEntry.snack2_id || 
            calendarEntry.dessert_id ||
            calendarEntry.full_day_id
          );
          
          setHasMealsToday(hasMeals);
        } else {
          setHasMealsToday(false);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast({
          title: "Error loading dashboard",
          description: "Please try refreshing the page.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
    
    // Set up a timer to check if we need to reset the meters at wake-up time
    const checkWakeUpTime = () => {
      if (!profile?.wake_up_time) return;
      
      const now = new Date();
      const [wakeHours, wakeMinutes] = profile.wake_up_time.split(':').map(Number);
      
      if (now.getHours() === wakeHours && now.getMinutes() === wakeMinutes) {
        // Reset meters at wake-up time
        setFructoseTotal(0);
        setOmega3Total(0);
        setOmega6Total(0);
        setOmegaRatio('1:0');
        setHasMealsToday(false);
      }
    };
    
    const wakeUpInterval = setInterval(checkWakeUpTime, 60000); // Check every minute
    
    return () => clearInterval(wakeUpInterval);
  }, [supabase, router, toast]);
  
  // Calculate fructose limit based on user's health condition
  const fructoseLimit = profile?.has_chronic_condition 
    ? mealRules.fructoseLimits.withChronicCondition 
    : mealRules.fructoseLimits.withoutChronicCondition;
  
  // Calculate fructose percentage for the progress bar
  const fructosePercentage = Math.min((fructoseTotal / fructoseLimit) * 100, 100);
  
  // Determine fructose indicator color
  const getFructoseIndicatorColor = () => {
    if (fructosePercentage < 70) return "success";
    if (fructosePercentage < 90) return "warning";
    return "danger";
  };
  
  // Parse omega ratio for the gauge
  const getOmegaRatioValue = () => {
    if (!omegaRatio || omegaRatio === '1:0') return 0.5; // Center position when no data
    
    const ratio = parseFloat(omegaRatio.split(':')[1]);
    
    // Map the ratio to a 0-1 scale for the gauge
    // Min acceptable: 1:1.5, Max acceptable: 1:2.9
    // We want these to map to about 0.25 and 0.75 on the gauge
    if (ratio < 1.5) {
      // Below minimum - map 0 to 1.5 to range 0 to 0.25
      return Math.max(0, ratio / 1.5 * 0.25);
    } else if (ratio > 2.9) {
      // Above maximum - map 2.9 to infinity to range 0.75 to 1
      return Math.min(1, 0.75 + (ratio - 2.9) / 10 * 0.25);
    } else {
      // Within range - map 1.5 to 2.9 to range 0.25 to 0.75
      return 0.25 + (ratio - 1.5) / 1.4 * 0.5;
    }
  };
  
  // Determine if omega ratio is in acceptable range
  const isOmegaRatioValid = () => {
    if (!omegaRatio || omegaRatio === '1:0') return false;
    
    const ratio = parseFloat(omegaRatio.split(':')[1]);
    return ratio >= mealRules.omegaRatioRange.min && ratio <= mealRules.omegaRatioRange.max;
  };
  
  // Navigation items
  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, current: true },
    { name: 'Meal Generator', href: '/meal-generator', icon: Sparkles, current: false },
    { name: 'Meal Builder', href: '/meal-builder', icon: Utensils, current: false },
    { name: 'Saved Meals', href: '/saved-meals', icon: BookmarkCheck, current: false },
    { name: 'Calendar', href: '/calendar', icon: Calendar, current: false },
    { name: 'Grocery Lists', href: '/grocery-lists', icon: ShoppingCart, current: false },
    { name: 'My Foods', href: '/my-foods', icon: Apple, current: false },
    { name: 'Resources', href: '/resources', icon: BookOpen, current: false },
    { name: 'FAQ', href: '/faq', icon: HelpCircle, current: false },
  ];
  
  const secondaryNavItems = [
    { name: 'About', href: '/about', icon: Info, current: false },
    { name: 'Profile Settings', href: '/profile-settings', icon: Settings, current: false },
    { name: 'Pricing', href: '/pricing', icon: CreditCard, current: false },
    { name: 'Help', href: '/help', icon: LifeBuoy, current: false },
    { name: 'Contact Us', href: '/contact', icon: Mail, current: false },
  ];
  
  // Quick action buttons
  const quickActions = [
    {
      name: 'Generate a Meal',
      description: 'Create a single meal based on your preferences',
      href: '/meal-generator',
      icon: Sparkles,
      color: 'bg-primary/10 text-primary',
    },
    {
      name: 'Build a Meal',
      description: 'Manually build a meal with your ingredients',
      href: '/meal-builder',
      icon: Utensils,
      color: 'bg-accent/10 text-accent-dark',
    },
    {
      name: 'Plan Your Week',
      description: 'Set up your meal calendar for the week',
      href: '/calendar',
      icon: Calendar,
      color: 'bg-success/10 text-success',
    },
  ];
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-text-secondary">Loading your dashboard...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar Navigation */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex flex-col flex-grow border-r border-gray-200 bg-white pt-5 pb-4 overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-4">
            <h1 className="text-xl font-bold text-primary">2-Rule AIM</h1>
          </div>
          <div className="mt-5 flex-grow flex flex-col">
            <nav className="flex-1 px-2 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                    item.current
                      ? 'bg-primary/10 text-primary'
                      : 'text-text-secondary hover:bg-gray-50 hover:text-primary'
                  }`}
                >
                  <item.icon
                    className={`mr-3 flex-shrink-0 h-5 w-5 ${
                      item.current ? 'text-primary' : 'text-text-secondary group-hover:text-primary'
                    }`}
                    aria-hidden="true"
                  />
                  {item.name}
                </Link>
              ))}
            </nav>
            
            <div className="mt-6 pt-6 border-t border-gray-200">
              <nav className="px-2 space-y-1">
                {secondaryNavItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-text-secondary hover:bg-gray-50 hover:text-primary"
                  >
                    <item.icon
                      className="mr-3 flex-shrink-0 h-5 w-5 text-text-secondary group-hover:text-primary"
                      aria-hidden="true"
                    />
                    {item.name}
                  </Link>
                ))}
              </nav>
            </div>
            
            {/* Subscription status */}
            <div className="mt-6 px-4">
              <div className={`p-3 rounded-lg ${isPremium ? 'bg-success/10' : 'bg-accent/10'}`}>
                <p className="text-sm font-medium">
                  {isPremium ? (
                    <span className="flex items-center text-success">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Premium Plan
                    </span>
                  ) : (
                    <span className="flex items-center text-accent-dark">
                      <AlertTriangle className="w-4 h-4 mr-1" />
                      Free Plan
                    </span>
                  )}
                </p>
                {!isPremium && (
                  <Link href="/pricing">
                    <Button variant="outline" size="sm" className="mt-2 w-full">
                      Upgrade
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="md:pl-64 flex flex-col flex-1">
        <main className="flex-1">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {/* Welcome header */}
              <div className="mb-8">
                <h1 className="text-2xl font-semibold text-text-primary">
                  Welcome, {profile?.name?.split(' ')[0] || 'there'}!
                </h1>
                <p className="text-text-secondary">
                  Your personalized anti-inflammatory meal planning system
                </p>
                <p className="text-sm text-text-secondary mt-1">
                  Today is {formatDate(new Date(), 'EEEE, MMMM d, yyyy')}
                </p>
              </div>
              
              {/* Health metrics */}
              <div className="mb-8">
                <h2 className="text-lg font-medium mb-4 text-text-primary">Today's Health Metrics</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Fructose meter */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Daily Fructose</CardTitle>
                      <CardDescription>
                        {profile?.has_chronic_condition 
                          ? 'Limit: 15g per day (for chronic conditions)'
                          : 'Limit: 25g per day'
                        }
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{fructoseTotal.toFixed(1)}g</span>
                          <span>{fructoseLimit}g</span>
                        </div>
                        <Progress 
                          value={fructosePercentage} 
                          indicatorColor={getFructoseIndicatorColor()}
                          className="h-3"
                        />
                        {!hasMealsToday && (
                          <p className="text-sm text-text-secondary mt-2">
                            No meals added for today. Add meals to track your fructose intake.
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Omega ratio meter */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Omega 3:6 Ratio</CardTitle>
                      <CardDescription>
                        Target range: 1:1.5 - 1:2.9
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col items-center">
                        <GaugeChart
                          id="omega-ratio-gauge"
                          nrOfLevels={3}
                          colors={["#E57373", "#FFD54F", "#81C784"]}
                          arcWidth={0.3}
                          percent={getOmegaRatioValue()}
                          hideText={true}
                          animate={false}
                        />
                        <div className="flex justify-between w-full text-sm -mt-4">
                          <span>Too Low</span>
                          <span className="font-medium">{omegaRatio}</span>
                          <span>Too High</span>
                        </div>
                        {!hasMealsToday && (
                          <p className="text-sm text-text-secondary mt-2">
                            No meals added for today. Add meals to track your omega ratio.
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
              
              {/* Quick actions */}
              <div className="mb-8">
                <h2 className="text-lg font-medium mb-4 text-text-primary">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {quickActions.map((action) => (
                    <Link key={action.name} href={action.href}>
                      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                        <CardContent className="pt-6">
                          <div className="flex items-start">
                            <div className={`p-2 rounded-md ${action.color}`}>
                              <action.icon className="h-6 w-6" />
                            </div>
                            <div className="ml-4">
                              <h3 className="font-medium">{action.name}</h3>
                              <p className="text-sm text-text-secondary">{action.description}</p>
                            </div>
                          </div>
                        </CardContent>
                        <CardFooter className="pt-0 flex justify-end">
                          <div className="text-primary text-sm flex items-center">
                            Get started <ArrowRight className="ml-1 h-4 w-4" />
                          </div>
                        </CardFooter>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
              
              {/* Usage stats */}
              {isPremium && (
                <div className="mb-8">
                  <h2 className="text-lg font-medium mb-4 text-text-primary">Your Usage</h2>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-text-secondary">Meals Generated</p>
                          <div className="flex items-center">
                            <Sparkles className="h-5 w-5 text-primary mr-2" />
                            <span className="text-2xl font-semibold">{mealsGenerated}</span>
                            <span className="text-sm text-text-secondary ml-2">/ unlimited</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-text-secondary">Meals Saved</p>
                          <div className="flex items-center">
                            <BookmarkCheck className="h-5 w-5 text-primary mr-2" />
                            <span className="text-2xl font-semibold">{mealsSaved}</span>
                            <span className="text-sm text-text-secondary ml-2">/ 42 per month</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
              
              {/* Recent meals or tips */}
              <div>
                <Tabs defaultValue="tips">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-medium text-text-primary">Resources</h2>
                    <TabsList>
                      <TabsTrigger value="tips">Tips</TabsTrigger>
                      <TabsTrigger value="recent">Recent Meals</TabsTrigger>
                    </TabsList>
                  </div>
                  
                  <TabsContent value="tips">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="space-y-4">
                          <div className="flex items-start">
                            <div className="bg-primary/10 p-2 rounded-md text-primary">
                              <Info className="h-5 w-5" />
                            </div>
                            <div className="ml-4">
                              <h3 className="font-medium">Omega-3 Supplements</h3>
                              <p className="text-sm text-text-secondary">
                                Taking a high-quality omega-3 supplement can help balance your omega ratio
                                and allow for greater variety in your meals.
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-start">
                            <div className="bg-accent/10 p-2 rounded-md text-accent-dark">
                              <AlertTriangle className="h-5 w-5" />
                            </div>
                            <div className="ml-4">
                              <h3 className="font-medium">Alcohol and Fructose</h3>
                              <p className="text-sm text-text-secondary">
                                Alcohol has very similar effects as fructose. For best results,
                                consider eliminating alcohol consumption.
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-start">
                            <div className="bg-success/10 p-2 rounded-md text-success">
                              <CheckCircle className="h-5 w-5" />
                            </div>
                            <div className="ml-4">
                              <h3 className="font-medium">Consistency Matters</h3>
                              <p className="text-sm text-text-secondary">
                                Significant health changes may happen in as little as 2 weeks, but 
                                generally it takes about 3 months of consistent lifestyle changes 
                                to see significant effects.
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Link href="/resources">
                          <Button variant="outline">
                            View all resources
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </Link>
                      </CardFooter>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="recent">
                    <Card>
                      <CardContent className="pt-6">
                        {hasMealsToday ? (
                          <div className="space-y-4">
                            <p className="text-text-secondary">
                              Your meals for today are set! Check the calendar to view details.
                            </p>
                            <div className="flex justify-center">
                              <Link href="/calendar">
                                <Button>
                                  View Today's Meals
                                  <Calendar className="ml-2 h-4 w-4" />
                                </Button>
                              </Link>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <p className="text-text-secondary">
                              You haven't added any meals for today yet. Get started by generating a meal
                              or adding one from your saved meals.
                            </p>
                            <div className="flex justify-center space-x-4">
                              <Link href="/meal-generator">
                                <Button>
                                  Generate a Meal
                                  <Sparkles className="ml-2 h-4 w-4" />
                                </Button>
                              </Link>
                              <Link href="/saved-meals">
                                <Button variant="outline">
                                  Saved Meals
                                  <BookmarkCheck className="ml-2 h-4 w-4" />
                                </Button>
                              </Link>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
