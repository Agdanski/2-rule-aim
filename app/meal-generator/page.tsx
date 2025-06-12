'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import { useSubscription } from '@/components/providers/subscription-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AlertCircle, 
  ArrowRight, 
  Check, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Loader2, 
  RefreshCw, 
  Save, 
  Sparkles,
  AlertTriangle,
  Utensils,
  BookmarkCheck
} from 'lucide-react';
import { 
  generateSingleMeal, 
  generateFullDay, 
  generateFullWeek,
  swapIngredient,
  MealGenerationOptions,
  GeneratedMeal,
  GeneratedFullDay,
  GeneratedFullWeek
} from '@/lib/meal-generation';
import { calculateNetCarbs } from '@/lib/utils';

export default function MealGeneratorPage() {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createBrowserClient();
  const { 
    isPremium, 
    canGenerateFullDay, 
    canGenerateFullWeek,
    canSaveMeal,
    incrementMealsGenerated,
    incrementMealsSaved
  } = useSubscription();
  
  // User profile state
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generatingMeal, setGeneratingMeal] = useState(false);
  const [savingMeal, setSavingMeal] = useState(false);
  
  // Generation options state
  const [generationType, setGenerationType] = useState<'single' | 'full_day' | 'full_week'>('single');
  const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner'>('dinner');
  const [portions, setPortions] = useState(1);
  const [includeSnacks, setIncludeSnacks] = useState(false);
  const [snacksCount, setSnacksCount] = useState(1);
  const [includeDessert, setIncludeDessert] = useState(false);
  const [includeInstructions, setIncludeInstructions] = useState(true);
  const [includeMacros, setIncludeMacros] = useState(true);
  const [includeHeavyMetals, setIncludeHeavyMetals] = useState(false);
  const [useProteinGoal, setUseProteinGoal] = useState(false);
  const [proteinGoal, setProteinGoal] = useState(0);
  const [proteinGoalPerDay, setProteinGoalPerDay] = useState(false);
  const [useGrassFed, setUseGrassFed] = useState(false);
  
  // Results state
  const [generatedSingleMeal, setGeneratedSingleMeal] = useState<GeneratedMeal | null>(null);
  const [generatedFullDay, setGeneratedFullDay] = useState<GeneratedFullDay | null>(null);
  const [generatedFullWeek, setGeneratedFullWeek] = useState<GeneratedFullWeek | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  
  // Ingredient swap state
  const [swappingIngredientIndex, setSwappingIngredientIndex] = useState<number | null>(null);
  const [swappingIngredient, setSwappingIngredient] = useState(false);
  
  // Fetch user profile on mount
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        
        // Get current session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user) {
          router.push('/');
          return;
        }
        
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
        
        // Set default protein goal based on weight
        if (profileData) {
          let defaultProteinGoal = 0;
          
          // Convert weight to kg if needed
          const weightInKg = profileData.weight_unit === 'lbs' 
            ? profileData.weight / 2.20462 
            : profileData.weight;
          
          // Set default protein goal (1.6g/kg for sedentary)
          defaultProteinGoal = Math.round(weightInKg * 1.6);
          
          setProteinGoal(defaultProteinGoal);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        toast({
          title: "Error loading profile",
          description: "Please try refreshing the page.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserProfile();
  }, [supabase, router, toast]);
  
  // Handle generation type change
  const handleGenerationTypeChange = (value: 'single' | 'full_day' | 'full_week') => {
    setGenerationType(value);
    
    // Reset results
    setGeneratedSingleMeal(null);
    setGeneratedFullDay(null);
    setGeneratedFullWeek(null);
    setGenerationError(null);
    
    // Check premium access
    if ((value === 'full_day' || value === 'full_week') && !isPremium) {
      toast({
        title: "Premium Feature",
        description: "Full day and week meal planning requires a premium subscription.",
        action: (
          <Button variant="outline" size="sm" onClick={() => router.push('/pricing')}>
            Upgrade
          </Button>
        ),
      });
      setGenerationType('single');
    }
  };
  
  // Handle meal generation
  const handleGenerateMeal = async () => {
    try {
      setGeneratingMeal(true);
      setGenerationError(null);
      setGeneratedSingleMeal(null);
      setGeneratedFullDay(null);
      setGeneratedFullWeek(null);
      
      // Check if user profile is loaded
      if (!profile) {
        throw new Error('User profile not loaded');
      }
      
      // Prepare generation options
      const options: MealGenerationOptions = {
        generationType,
        mealType: generationType === 'single' ? mealType : undefined,
        portions,
        includeSnacks: generationType !== 'single' ? (includeSnacks ? snacksCount : false) : undefined,
        includeDessert: generationType !== 'single' ? includeDessert : undefined,
        includeInstructions,
        includeMacros,
        includeHeavyMetals,
        proteinGoal: useProteinGoal ? proteinGoal : undefined,
        proteinGoalPerDay: proteinGoalPerDay,
        useGrassFed,
        userAllergies: profile.food_allergies || [],
        userDietaryPreferences: profile.dietary_preferences || [],
        userDietaryPreset: profile.dietary_preset || '2 Rule',
        userIronLevels: profile.iron_levels || 'normal',
        userMedications: profile.medications || [],
        userWeight: profile.weight || 70,
        userWeightUnit: profile.weight_unit || 'kg',
        userAge: profile.age || 30,
        userSex: profile.sex || 'male',
        userHasChronicCondition: profile.has_chronic_condition || false,
        userOmega3Supplement: profile.omega3_supplement,
      };
      
      // Generate meal based on type
      if (generationType === 'single') {
        const { meal, error } = await generateSingleMeal(options);
        
        if (error) {
          throw new Error(error);
        }
        
        setGeneratedSingleMeal(meal);
      } else if (generationType === 'full_day') {
        const { fullDay, error } = await generateFullDay(options);
        
        if (error) {
          throw new Error(error);
        }
        
        setGeneratedFullDay(fullDay);
      } else {
        const { fullWeek, error } = await generateFullWeek(options);
        
        if (error) {
          throw new Error(error);
        }
        
        setGeneratedFullWeek(fullWeek);
      }
      
      // Increment meals generated count
      await incrementMealsGenerated();
      
      toast({
        title: "Meal Generated",
        description: "Your meal has been successfully generated.",
      });
    } catch (error: any) {
      console.error('Error generating meal:', error);
      setGenerationError(error.message || 'Failed to generate meal');
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate meal. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGeneratingMeal(false);
    }
  };
  
  // Handle ingredient swap
  const handleSwapIngredient = async (ingredientIndex: number) => {
    try {
      if (!generatedSingleMeal) return;
      
      setSwappingIngredientIndex(ingredientIndex);
      setSwappingIngredient(true);
      
      // Prepare generation options
      const options: MealGenerationOptions = {
        generationType: 'single',
        mealType,
        portions,
        includeInstructions,
        includeMacros,
        includeHeavyMetals,
        proteinGoal: useProteinGoal ? proteinGoal : undefined,
        useGrassFed,
        userAllergies: profile.food_allergies || [],
        userDietaryPreferences: profile.dietary_preferences || [],
        userDietaryPreset: profile.dietary_preset || '2 Rule',
        userIronLevels: profile.iron_levels || 'normal',
        userMedications: profile.medications || [],
        userWeight: profile.weight || 70,
        userWeightUnit: profile.weight_unit || 'kg',
        userAge: profile.age || 30,
        userSex: profile.sex || 'male',
        userHasChronicCondition: profile.has_chronic_condition || false,
        userOmega3Supplement: profile.omega3_supplement,
      };
      
      const { meal, error } = await swapIngredient(generatedSingleMeal, ingredientIndex, options);
      
      if (error) {
        throw new Error(error);
      }
      
      setGeneratedSingleMeal(meal);
      
      toast({
        title: "Ingredient Swapped",
        description: "The ingredient has been successfully swapped.",
      });
    } catch (error: any) {
      console.error('Error swapping ingredient:', error);
      toast({
        title: "Swap Failed",
        description: error.message || "Failed to swap ingredient. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSwappingIngredientIndex(null);
      setSwappingIngredient(false);
    }
  };
  
  // Handle save meal
  const handleSaveMeal = async () => {
    try {
      setSavingMeal(true);
      
      // Check if there's a meal to save
      if (!generatedSingleMeal && !generatedFullDay && !generatedFullWeek) {
        throw new Error('No meal to save');
      }
      
      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        router.push('/');
        return;
      }
      
      if (generatedSingleMeal) {
        // Save single meal
        const { error } = await supabase
          .from('meals')
          .insert({
            user_id: session.user.id,
            name: generatedSingleMeal.name,
            type: 'single',
            meal_type: mealType,
            ingredients: generatedSingleMeal.ingredients,
            instructions: generatedSingleMeal.instructions,
            total_fructose: generatedSingleMeal.total_fructose,
            omega3: generatedSingleMeal.omega3,
            omega6: generatedSingleMeal.omega6,
            omega_ratio: generatedSingleMeal.omega_ratio,
            protein: generatedSingleMeal.protein,
            carbs: generatedSingleMeal.carbs,
            fat: generatedSingleMeal.fat,
            calories: generatedSingleMeal.calories,
            iron_content: generatedSingleMeal.iron_content,
            fiber: generatedSingleMeal.fiber,
            heavy_metal_content: generatedSingleMeal.heavy_metal_content,
            net_carbs: generatedSingleMeal.net_carbs,
            macronutrient_breakdown: generatedSingleMeal.macronutrient_breakdown,
            follows_2_rules: generatedSingleMeal.follows_2_rules,
            is_favorite: false,
            portions: portions
          });
        
        if (error) throw error;
      } else if (generatedFullDay) {
        // Save full day meals
        // This would be more complex in a real implementation
        // Would need to save each meal separately and then create a full_day_meals record
      } else if (generatedFullWeek) {
        // Save full week meals
        // This would be even more complex
        // Would need to save each day separately and then create a full_week_meals record
      }
      
      // Increment meals saved count
      await incrementMealsSaved();
      
      toast({
        title: "Meal Saved",
        description: "Your meal has been saved successfully.",
      });
      
      // Redirect to saved meals page
      router.push('/saved-meals');
    } catch (error: any) {
      console.error('Error saving meal:', error);
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save meal. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSavingMeal(false);
    }
  };
  
  // Handle regenerate meal
  const handleRegenerateMeal = () => {
    setGeneratedSingleMeal(null);
    setGeneratedFullDay(null);
    setGeneratedFullWeek(null);
    setGenerationError(null);
    handleGenerateMeal();
  };
  
  // Calculate default protein goal
  const calculateDefaultProteinGoal = () => {
    if (!profile) return 0;
    
    // Convert weight to kg if needed
    const weightInKg = profile.weight_unit === 'lbs' 
      ? profile.weight / 2.20462 
      : profile.weight;
    
    // Set default protein goal (1.6g/kg for sedentary, 1.87g/kg for weight training)
    return Math.round(weightInKg * 1.6);
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-text-secondary">Loading meal generator...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-2 text-primary">Meal Generator</h1>
      <p className="text-text-secondary mb-8">Create custom meals based on your preferences and dietary needs</p>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Options Panel */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Generation Options</CardTitle>
              <CardDescription>
                Customize your meal generation settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Generation Type */}
              <div className="space-y-2">
                <Label>What would you like to generate?</Label>
                <RadioGroup 
                  value={generationType} 
                  onValueChange={(value: 'single' | 'full_day' | 'full_week') => handleGenerationTypeChange(value)}
                  className="flex flex-col space-y-1"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="single" id="single" />
                    <Label htmlFor="single">Single Meal</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem 
                      value="full_day" 
                      id="full_day" 
                      disabled={!isPremium}
                    />
                    <Label htmlFor="full_day" className={!isPremium ? "text-gray-400" : ""}>
                      Full Day (3 meals)
                      {!isPremium && <span className="ml-2 text-xs text-accent-dark">Premium</span>}
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem 
                      value="full_week" 
                      id="full_week" 
                      disabled={!isPremium}
                    />
                    <Label htmlFor="full_week" className={!isPremium ? "text-gray-400" : ""}>
                      Full Week (21 meals)
                      {!isPremium && <span className="ml-2 text-xs text-accent-dark">Premium</span>}
                    </Label>
                  </div>
                </RadioGroup>
              </div>
              
              {/* Meal Type (for single meal only) */}
              {generationType === 'single' && (
                <div className="space-y-2">
                  <Label>Meal Type</Label>
                  <RadioGroup 
                    value={mealType} 
                    onValueChange={(value: 'breakfast' | 'lunch' | 'dinner') => setMealType(value)}
                    className="flex space-x-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="breakfast" id="breakfast" />
                      <Label htmlFor="breakfast">Breakfast</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="lunch" id="lunch" />
                      <Label htmlFor="lunch">Lunch</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="dinner" id="dinner" />
                      <Label htmlFor="dinner">Dinner</Label>
                    </div>
                  </RadioGroup>
                </div>
              )}
              
              {/* Portions */}
              <div className="space-y-2">
                <Label htmlFor="portions">Number of Portions</Label>
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setPortions(Math.max(1, portions - 1))}
                    disabled={portions <= 1}
                  >
                    -
                  </Button>
                  <div className="w-12 text-center">{portions}</div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setPortions(Math.min(10, portions + 1))}
                    disabled={portions >= 10}
                  >
                    +
                  </Button>
                </div>
              </div>
              
              {/* Snacks & Dessert (for full day and week only) */}
              {(generationType === 'full_day' || generationType === 'full_week') && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="include-snacks" 
                      checked={includeSnacks}
                      onCheckedChange={(checked) => setIncludeSnacks(checked === true)}
                    />
                    <Label htmlFor="include-snacks">Include Snacks</Label>
                  </div>
                  
                  {includeSnacks && (
                    <div className="pl-6 space-y-2">
                      <Label>How many snacks?</Label>
                      <RadioGroup 
                        value={snacksCount.toString()} 
                        onValueChange={(value) => setSnacksCount(parseInt(value))}
                        className="flex space-x-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="1" id="one-snack" />
                          <Label htmlFor="one-snack">1 Snack</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="2" id="two-snacks" />
                          <Label htmlFor="two-snacks">2 Snacks</Label>
                        </div>
                      </RadioGroup>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="include-dessert" 
                      checked={includeDessert}
                      onCheckedChange={(checked) => setIncludeDessert(checked === true)}
                    />
                    <Label htmlFor="include-dessert">Include Dessert</Label>
                  </div>
                </div>
              )}
              
              {/* Additional Options */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="include-instructions" 
                    checked={includeInstructions}
                    onCheckedChange={(checked) => setIncludeInstructions(checked === true)}
                  />
                  <Label htmlFor="include-instructions">Include Meal Prep Instructions</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="include-macros" 
                    checked={includeMacros}
                    onCheckedChange={(checked) => setIncludeMacros(checked === true)}
                  />
                  <Label htmlFor="include-macros">Include Macronutrient Breakdown</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="include-heavy-metals" 
                    checked={includeHeavyMetals}
                    onCheckedChange={(checked) => setIncludeHeavyMetals(checked === true)}
                  />
                  <Label htmlFor="include-heavy-metals">Include Heavy Metal Report</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="use-protein-goal" 
                    checked={useProteinGoal}
                    onCheckedChange={(checked) => setUseProteinGoal(checked === true)}
                  />
                  <Label htmlFor="use-protein-goal">Set Protein Goal</Label>
                </div>
                
                {useProteinGoal && (
                  <div className="pl-6 space-y-2">
                    <div className="flex items-center space-x-2">
                      <Input
                        type="number"
                        min="0"
                        value={proteinGoal}
                        onChange={(e) => setProteinGoal(parseInt(e.target.value) || 0)}
                        className="w-20"
                      />
                      <span>grams of protein</span>
                    </div>
                    
                    {(generationType === 'full_day' || generationType === 'full_week') && (
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="protein-goal-per-day" 
                          checked={proteinGoalPerDay}
                          onCheckedChange={(checked) => setProteinGoalPerDay(checked === true)}
                        />
                        <Label htmlFor="protein-goal-per-day">Per day (instead of per meal)</Label>
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setProteinGoal(calculateDefaultProteinGoal())}
                      >
                        Auto Calculate
                      </Button>
                      <span className="text-xs text-text-secondary">
                        Based on your weight
                      </span>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="use-grass-fed" 
                    checked={useGrassFed}
                    onCheckedChange={(checked) => setUseGrassFed(checked === true)}
                  />
                  <Label htmlFor="use-grass-fed">Only use grass-fed/pasture raised meat</Label>
                </div>
              </div>
              
              {/* Generate Button */}
              <Button 
                onClick={handleGenerateMeal} 
                disabled={generatingMeal}
                className="w-full"
              >
                {generatingMeal ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate {generationType === 'single' ? 'Meal' : generationType === 'full_day' ? 'Full Day' : 'Full Week'}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
        
        {/* Results Panel */}
        <div className="lg:col-span-2">
          {generationError && (
            <Card className="mb-6 border-error">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-error">
                  <AlertCircle className="mr-2 h-5 w-5" />
                  Generation Error
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p>{generationError}</p>
                <Button 
                  onClick={handleGenerateMeal} 
                  className="mt-4"
                  disabled={generatingMeal}
                >
                  Try Again
                </Button>
              </CardContent>
            </Card>
          )}
          
          {!generatedSingleMeal && !generatedFullDay && !generatedFullWeek && !generationError && !generatingMeal && (
            <div className="flex flex-col items-center justify-center h-96 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
              <Sparkles className="h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-text-primary mb-2">No Meals Generated Yet</h3>
              <p className="text-text-secondary text-center max-w-md mb-4">
                Configure your options and click the Generate button to create your personalized meal plan.
              </p>
              <Button 
                onClick={handleGenerateMeal}
                disabled={generatingMeal}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Now
              </Button>
            </div>
          )}
          
          {/* Single Meal Result */}
          {generatedSingleMeal && (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-2xl">{generatedSingleMeal.name}</CardTitle>
                    <CardDescription>
                      {mealType.charAt(0).toUpperCase() + mealType.slice(1)} • {portions} {portions === 1 ? 'portion' : 'portions'}
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    {generatedSingleMeal.follows_2_rules ? (
                      <span className="flex items-center text-xs px-2 py-1 bg-success/20 text-success rounded-full">
                        <Check className="mr-1 h-3 w-3" />
                        Follows 2 Rules
                      </span>
                    ) : (
                      <span className="flex items-center text-xs px-2 py-1 bg-error/20 text-error rounded-full">
                        <AlertTriangle className="mr-1 h-3 w-3" />
                        Doesn't Follow 2 Rules
                      </span>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Meal Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-xs text-text-secondary">Calories</p>
                    <p className="text-lg font-semibold">{generatedSingleMeal.calories} kcal</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-xs text-text-secondary">Fructose</p>
                    <p className="text-lg font-semibold">{generatedSingleMeal.total_fructose.toFixed(1)}g</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-xs text-text-secondary">Omega Ratio</p>
                    <p className="text-lg font-semibold">{generatedSingleMeal.omega_ratio}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-xs text-text-secondary">Net Carbs</p>
                    <p className="text-lg font-semibold">{generatedSingleMeal.net_carbs.toFixed(1)}g</p>
                  </div>
                </div>
                
                {/* Ingredients */}
                <div>
                  <h3 className="text-lg font-medium mb-2">Ingredients</h3>
                  <ul className="space-y-2">
                    {generatedSingleMeal.ingredients.map((ingredient, index) => (
                      <li key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded-md">
                        <span>
                          {ingredient.amount} {ingredient.unit} {ingredient.name}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSwapIngredient(index)}
                          disabled={swappingIngredient}
                          className="text-primary"
                        >
                          {swappingIngredientIndex === index ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCw className="h-4 w-4" />
                          )}
                          <span className="ml-1 hidden sm:inline">Swap</span>
                        </Button>
                      </li>
                    ))}
                  </ul>
                </div>
                
                {/* Instructions */}
                {includeInstructions && (
                  <div>
                    <h3 className="text-lg font-medium mb-2">Instructions</h3>
                    <div className="p-4 bg-gray-50 rounded-md">
                      <p className="whitespace-pre-line">{generatedSingleMeal.instructions}</p>
                    </div>
                  </div>
                )}
                
                {/* Macronutrients */}
                {includeMacros && (
                  <div>
                    <h3 className="text-lg font-medium mb-2">Macronutrients</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-3 bg-gray-50 rounded-md">
                        <p className="text-xs text-text-secondary">Protein</p>
                        <p className="text-lg font-semibold">{generatedSingleMeal.protein}g</p>
                        <p className="text-xs text-text-secondary">
                          {generatedSingleMeal.macronutrient_breakdown.protein_percentage}%
                        </p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-md">
                        <p className="text-xs text-text-secondary">Carbs</p>
                        <p className="text-lg font-semibold">{generatedSingleMeal.carbs}g</p>
                        <p className="text-xs text-text-secondary">
                          {generatedSingleMeal.macronutrient_breakdown.carbs_percentage}%
                        </p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-md">
                        <p className="text-xs text-text-secondary">Fat</p>
                        <p className="text-lg font-semibold">{generatedSingleMeal.fat}g</p>
                        <p className="text-xs text-text-secondary">
                          {generatedSingleMeal.macronutrient_breakdown.fat_percentage}%
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                      <div className="p-3 bg-gray-50 rounded-md">
                        <p className="text-xs text-text-secondary">Fiber</p>
                        <p className="text-lg font-semibold">{generatedSingleMeal.fiber}g</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-md">
                        <p className="text-xs text-text-secondary">Iron</p>
                        <p className="text-lg font-semibold">{generatedSingleMeal.iron_content}mg</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-md">
                        <p className="text-xs text-text-secondary">Omega-3</p>
                        <p className="text-lg font-semibold">{generatedSingleMeal.omega3.toFixed(1)}g</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-md">
                        <p className="text-xs text-text-secondary">Omega-6</p>
                        <p className="text-lg font-semibold">{generatedSingleMeal.omega6.toFixed(1)}g</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Heavy Metal Content */}
                {includeHeavyMetals && generatedSingleMeal.heavy_metal_content && (
                  <div>
                    <h3 className="text-lg font-medium mb-2">Heavy Metal Content</h3>
                    <div className="p-4 bg-gray-50 rounded-md">
                      {Object.entries(generatedSingleMeal.heavy_metal_content).length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          {Object.entries(generatedSingleMeal.heavy_metal_content).map(([metal, value]) => (
                            <div key={metal} className="text-center">
                              <p className="text-xs text-text-secondary capitalize">{metal}</p>
                              <p className="font-medium">{value}μg</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p>No significant heavy metal content detected.</p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
              
              <CardFooter className="flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={handleRegenerateMeal}
                  disabled={generatingMeal}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Regenerate
                </Button>
                
                <div className="space-x-2">
                  <Button 
                    onClick={handleSaveMeal}
                    disabled={savingMeal || !canSaveMeal}
                  >
                    {savingMeal ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Save Meal
                  </Button>
                </div>
              </CardFooter>
            </Card>
          )}
          
          {/* Full Day Result */}
          {generatedFullDay && (
            <Card>
              <CardHeader>
                <CardTitle>Full Day Meal Plan</CardTitle>
                <CardDescription>
                  {portions} {portions === 1 ? 'portion' : 'portions'} per meal
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <p>Full day meal generation is not fully implemented yet.</p>
              </CardContent>
              
              <CardFooter>
                <Button 
                  variant="outline" 
                  onClick={handleRegenerateMeal}
                  disabled={generatingMeal}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Regenerate
                </Button>
              </CardFooter>
            </Card>
          )}
          
          {/* Full Week Result */}
          {generatedFullWeek && (
            <Card>
              <CardHeader>
                <CardTitle>Full Week Meal Plan</CardTitle>
                <CardDescription>
                  {portions} {portions === 1 ? 'portion' : 'portions'} per meal
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <p>Full week meal generation is not fully implemented yet.</p>
              </CardContent>
              
              <CardFooter>
                <Button 
                  variant="outline" 
                  onClick={handleRegenerateMeal}
                  disabled={generatingMeal}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Regenerate
                </Button>
              </CardFooter>
            </Card>
          )}
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="mt-8 flex flex-wrap gap-4">
        <Button variant="outline" onClick={() => router.push('/dashboard')}>
          Back to Dashboard
        </Button>
        <Button variant="outline" onClick={() => router.push('/meal-builder')}>
          <Utensils className="mr-2 h-4 w-4" />
          Try Meal Builder
        </Button>
        <Button variant="outline" onClick={() => router.push('/saved-meals')}>
          <BookmarkCheck className="mr-2 h-4 w-4" />
          View Saved Meals
        </Button>
      </div>
    </div>
  );
}
