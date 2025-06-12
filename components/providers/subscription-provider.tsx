'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useSupabase } from './supabase-provider';
import { useToast } from '@/components/ui/use-toast';
import { subscriptionTiers } from '@/lib/constants';

// Define subscription tier types
export type SubscriptionTier = 'free' | 'premium';
export type SubscriptionInterval = 'month' | '3-month' | '6-month' | 'year';
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete';

// Define the subscription data type
export interface SubscriptionData {
  id: string;
  user_id: string;
  stripe_customer_id: string;
  stripe_subscription_id: string;
  status: SubscriptionStatus;
  tier: SubscriptionTier;
  price_id: string;
  interval: SubscriptionInterval;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  meals_generated_count: number;
  meals_saved_count: number;
  ingredient_swaps_count: number;
  additional_profiles: string[] | null;
}

// Define the context type
type SubscriptionContextType = {
  subscription: SubscriptionData | null;
  isLoading: boolean;
  isPremium: boolean;
  mealsGeneratedCount: number;
  mealsSavedCount: number;
  ingredientSwapsCount: number;
  canGenerateMeal: boolean;
  canSaveMeal: boolean;
  canSwapIngredient: boolean;
  canGenerateFullDay: boolean;
  canGenerateFullWeek: boolean;
  canUseMultipleDietaryFilters: boolean;
  canCreateGroceryList: boolean;
  remainingSavedMealsQuota: number;
  remainingSwapsQuota: number;
  incrementMealsGenerated: () => Promise<void>;
  incrementMealsSaved: () => Promise<void>;
  incrementIngredientSwaps: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
};

// Create the context with a default value
const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

// Provider props type
interface SubscriptionProviderProps {
  children: ReactNode;
}

export function SubscriptionProvider({ children }: SubscriptionProviderProps) {
  const { supabase, user, isLoading: isLoadingAuth } = useSupabase();
  const { toast } = useToast();

  // State for subscription data and loading
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Derived state
  const isPremium = subscription?.tier === 'premium' && subscription?.status === 'active';
  const mealsGeneratedCount = subscription?.meals_generated_count || 0;
  const mealsSavedCount = subscription?.meals_saved_count || 0;
  const ingredientSwapsCount = subscription?.ingredient_swaps_count || 0;

  // Feature flags based on subscription tier
  const canGenerateMeal = true; // Available to all tiers
  const canSaveMeal = isPremium ? mealsSavedCount < 42 : mealsSavedCount < 2;
  const canSwapIngredient = isPremium && ingredientSwapsCount < 12;
  const canGenerateFullDay = isPremium;
  const canGenerateFullWeek = isPremium;
  const canUseMultipleDietaryFilters = isPremium;
  const canCreateGroceryList = isPremium;

  // Calculate remaining quotas
  const remainingSavedMealsQuota = isPremium ? 42 - mealsSavedCount : 2 - mealsSavedCount;
  const remainingSwapsQuota = isPremium ? 12 - ingredientSwapsCount : 0;

  // Fetch subscription data
  const fetchSubscription = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      
      // Check for active subscription
      const { data: activeSubscription, error: activeError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (activeSubscription) {
        setSubscription(activeSubscription);
        return;
      }

      // If no active subscription, check for any subscription
      const { data: anySubscription, error: anyError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (anySubscription) {
        setSubscription(anySubscription);
        return;
      }

      // If no subscription at all, create a free tier entry
      const { data: newSubscription, error: createError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: user.id,
          stripe_customer_id: '',
          stripe_subscription_id: '',
          status: 'active',
          tier: 'free',
          price_id: '',
          interval: 'month',
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
          cancel_at_period_end: false,
          meals_generated_count: 0,
          meals_saved_count: 0,
          ingredient_swaps_count: 0,
          additional_profiles: null
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating free subscription:', createError);
        return;
      }

      setSubscription(newSubscription);
    } catch (error) {
      console.error('Error fetching subscription:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh subscription data
  const refreshSubscription = async () => {
    await fetchSubscription();
  };

  // Increment meals generated count
  const incrementMealsGenerated = async () => {
    if (!user || !subscription) return;

    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({ 
          meals_generated_count: (subscription.meals_generated_count || 0) + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', subscription.id);

      if (error) throw error;

      // Update local state
      setSubscription({
        ...subscription,
        meals_generated_count: (subscription.meals_generated_count || 0) + 1
      });
    } catch (error) {
      console.error('Error incrementing meals generated count:', error);
      toast({
        title: "Error updating usage",
        description: "Failed to update your usage metrics. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Increment meals saved count
  const incrementMealsSaved = async () => {
    if (!user || !subscription) return;

    // Check if user has reached their limit
    if (!canSaveMeal) {
      toast({
        title: "Limit Reached",
        description: isPremium 
          ? "You've reached your monthly limit of 42 saved meals." 
          : "Free users can only save 2 meals. Upgrade to Premium for more.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({ 
          meals_saved_count: (subscription.meals_saved_count || 0) + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', subscription.id);

      if (error) throw error;

      // Update local state
      setSubscription({
        ...subscription,
        meals_saved_count: (subscription.meals_saved_count || 0) + 1
      });
    } catch (error) {
      console.error('Error incrementing meals saved count:', error);
      toast({
        title: "Error updating usage",
        description: "Failed to update your usage metrics. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Increment ingredient swaps count
  const incrementIngredientSwaps = async () => {
    if (!user || !subscription) return;

    // Check if user has reached their limit
    if (!canSwapIngredient) {
      toast({
        title: "Limit Reached",
        description: isPremium 
          ? "You've reached your monthly limit of 12 ingredient swaps." 
          : "Ingredient swapping is a Premium feature.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({ 
          ingredient_swaps_count: (subscription.ingredient_swaps_count || 0) + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', subscription.id);

      if (error) throw error;

      // Update local state
      setSubscription({
        ...subscription,
        ingredient_swaps_count: (subscription.ingredient_swaps_count || 0) + 1
      });
    } catch (error) {
      console.error('Error incrementing ingredient swaps count:', error);
      toast({
        title: "Error updating usage",
        description: "Failed to update your usage metrics. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Initialize subscription on mount or when user changes
  useEffect(() => {
    if (!isLoadingAuth && user) {
      fetchSubscription();
    } else if (!isLoadingAuth && !user) {
      setSubscription(null);
      setIsLoading(false);
    }
  }, [isLoadingAuth, user]);

  // Listen for subscription changes (e.g., from Stripe webhook)
  useEffect(() => {
    if (!user) return;

    const subscriptionChannel = supabase
      .channel(`subscription-${user.id}`)
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'subscriptions',
        filter: `user_id=eq.${user.id}`
      }, () => {
        fetchSubscription();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscriptionChannel);
    };
  }, [user, supabase]);

  // Reset usage counters at the start of a new billing period
  useEffect(() => {
    if (!subscription) return;

    const checkBillingPeriod = () => {
      const now = new Date();
      const periodEnd = new Date(subscription.current_period_end);
      
      if (now > periodEnd) {
        // Period has ended, refresh subscription from the server
        refreshSubscription();
      }
    };

    // Check immediately
    checkBillingPeriod();

    // Set up interval to check periodically
    const intervalId = setInterval(checkBillingPeriod, 60 * 60 * 1000); // Check hourly
    
    return () => clearInterval(intervalId);
  }, [subscription]);

  // Create the value for the context
  const value: SubscriptionContextType = {
    subscription,
    isLoading,
    isPremium,
    mealsGeneratedCount,
    mealsSavedCount,
    ingredientSwapsCount,
    canGenerateMeal,
    canSaveMeal,
    canSwapIngredient,
    canGenerateFullDay,
    canGenerateFullWeek,
    canUseMultipleDietaryFilters,
    canCreateGroceryList,
    remainingSavedMealsQuota,
    remainingSwapsQuota,
    incrementMealsGenerated,
    incrementMealsSaved,
    incrementIngredientSwaps,
    refreshSubscription,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

// Custom hook to use the Subscription context
export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}
