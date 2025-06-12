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
  Plus,
  RefreshCw, 
  Save, 
  Search,
  Sparkles,
  AlertTriangle,
  Utensils,
  BookmarkCheck,
  Trash2,
  Calendar
} from 'lucide-react';
import { 
  buildMealFromIngredients,
  MealGenerationOptions,
  GeneratedMeal,
  MealType
} from '@/lib/meal-generation';
import { 
  searchFoods, 
  searchFoodsWithNutrients, 
  FoodSearchResult,
  NutrientSummary
} from '@/lib/cnf-integration';
import { calculateNetCarbs } from '@/lib/utils';

export default function MealBuilderPage() {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createBrowserClient();
  const { 
    isPremium, 
    canSaveMeal,
    incrementMealsGenerated,
    incrementMealsSaved
  } = useSubscription();
  
  // User profile state
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generatingMeal, setGeneratingMeal] = useState(false);
  const [savingMeal, setSavingMeal] = useState(false);
  
  // Meal builder options
  const [follow2Rules, setFollow2Rules] = useState(true);
  const [mealType, setMealType] = useState<MealType>('dinner');
  const [portions, setPortions] = useState(1);
  const [includeInstructions, setIncludeInstructions] = useState(true);
  const [includeMacros, setIncludeMacros] = useState(true);
  const [includeHeavyMetals, setIncludeHeavyMetals] = useState(false);
  const [useGrassFed, setUseGrassFed] = useState(false);
  
  // Ingredient selection state
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<(FoodSearchResult & Partial<NutrientSummary>)[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [myFoods, setMyFoods] = useState<any[]>([]);
  const [loadingMyFoods, setLoadingMyFoods] = useState(false);
  
  // Generated meal state
  const [generatedMeal, setGeneratedMeal] = useState<GeneratedMeal | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  
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
        
        // Fetch user's saved foods
        await fetchMyFoods(session.user.id);
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
  
  // Fetch user's saved foods
  const fetchMyFoods = async (userId: string) => {
    try {
      setLoadingMyFoods(true);
      
      const { data, error } = await supabase
        .from('my_foods')
        .select('*')
        .eq('user_id', userId)
        .order('name');
      
      if (error) throw error;
      
      setMyFoods(data || []);
    } catch (error) {
      console.error('Error fetching my foods:', error);
      toast({
        title: "Error loading saved foods",
        description: "Please try refreshing the page.",
        variant: "destructive",
      });
    } finally {
      setLoadingMyFoods(false);
    }
  };
  
  // Handle ingredient search
  const handleSearch = async () => {
    if (!searchTerm.trim() || searchTerm.length < 3) {
      toast({
        title: "Search term too short",
        description: "Please enter at least 3 characters.",
      });
      return;
    }
    
    try {
      setSearching(true);
      
      // Determine which database to search based on user's country
      const isCanadian = profile?.country === 'Canada';
      
      // Search for foods with nutrient data
      const results = await searchFoodsWithNutrients(searchTerm);
      
      setSearchResults(results);
      
      if (results.length === 0) {
        toast({
          title: "No results found",
          description: "Try a different search term.",
        });
      }
    } catch (error: any) {
      console.error('Error searching foods:', error);
      toast({
        title: "Search Failed",
        description: error.message || "Failed to search for foods. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSearching(false);
    }
  };
  
  // Add ingredient to selected list
  const addIngredient = (ingredient: string) => {
    if (!selectedIngredients.includes(ingredient)) {
      setSelectedIngredients([...selectedIngredients, ingredient]);
      setSearchTerm('');
      setSearchResults([]);
      
      toast({
        title: "Ingredient Added",
        description: `${ingredient} added to your meal.`,
      });
    }
  };
  
  // Remove ingredient from selected list
  const removeIngredient = (index: number) => {
    const newIngredients = [...selectedIngredients];
    newIngredients.splice(index, 1);
    setSelectedIngredients(newIngredients);
  };
  
  // Handle meal generation
  const handleBuildMeal = async () => {
    if (selectedIngredients.length === 0) {
      toast({
        title: "No ingredients selected",
        description: "Please select at least one ingredient.",
      });
      return;
    }
    
    try {
      setGeneratingMeal(true);
      setGenerationError(null);
      setGeneratedMeal(null);
      
      // Check if user profile is loaded
      if (!profile) {
        throw new Error('User profile not loaded');
      }
      
      // Prepare generation options
      const options: MealGenerationOptions = {
        generationType: 'single',
        mealType,
        portions,
        includeInstructions,
        includeMacros,
        includeHeavyMetals,
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
      
      // Build meal from ingredients
      const { meal, error } = await buildMealFromIngredients(
        selectedIngredients,
        options,
        follow2Rules
      );
      
      if (error) {
        throw new Error(error);
      }
      
      setGeneratedMeal(meal);
      
      // Increment meals generated count
      await incrementMealsGenerated();
      
      toast({
        title: "Meal Built",
        description: "Your meal has been successfully created.",
      });
    } catch (error: any) {
      console.error('Error building meal:', error);
      setGenerationError(error.message || 'Failed to build meal');
      toast({
        title: "Meal Building Failed",
        description: error.message || "Failed to build meal. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGeneratingMeal(false);
    }
  };
  
  // Handle save meal
  const handleSaveMeal = async () => {
    try {
      setSavingMeal(true);
      
      // Check if there's a meal to save
      if (!generatedMeal) {
        throw new Error('No meal to save');
      }
      
      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        router.push('/');
        return;
      }
      
      // Save meal
      const { error } = await supabase
        .from('meals')
        .insert({
          user_id: session.user.id,
          name: generatedMeal.name,
          type: 'single',
          meal_type: mealType,
          ingredients: generatedMeal.ingredients,
          instructions: generatedMeal.instructions,
          total_fructose: generatedMeal.total_fructose,
          omega3: generatedMeal.omega3,
          omega6: generatedMeal.omega6,
          omega_ratio: generatedMeal.omega_ratio,
          protein: generatedMeal.protein,
          carbs: generatedMeal.carbs,
          fat: generatedMeal.fat,
          calories: generatedMeal.calories,
          iron_content: generatedMeal.iron_content,
          fiber: generatedMeal.fiber,
          heavy_metal_content: generatedMeal.heavy_metal_content,
          net_carbs: generatedMeal.net_carbs,
          macronutrient_breakdown: generatedMeal.macronutrient_breakdown,
          follows_2_rules: generatedMeal.follows_2_rules,
          is_favorite: false,
          portions
        });
      
      if (error) throw error;
      
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
  
  // Handle add to calendar
  const handleAddToCalendar = () => {
    toast({
      title: "Save Required",
      description: "Please save the meal first before adding to calendar.",
    });
  };
  
  // Clear all ingredients
  const clearIngredients = () => {
    setSelectedIngredients([]);
    toast({
      title: "Ingredients Cleared",
      description: "All ingredients have been removed.",
    });
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-text-secondary">Loading meal builder...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-2 text-primary">Meal Builder</h1>
      <p className="text-text-secondary mb-8">Create custom meals using your own ingredients</p>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Ingredient Selection Panel */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Build Your Meal</CardTitle>
              <CardDescription>
                Select ingredients and create your custom meal
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 2 Rules Toggle */}
              <div className="space-y-2">
                <Label>Build meal:</Label>
                <RadioGroup 
                  value={follow2Rules ? "with-rules" : "without-rules"} 
                  onValueChange={(value) => setFollow2Rules(value === "with-rules")}
                  className="flex flex-col space-y-1"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="with-rules" id="with-rules" />
                    <Label htmlFor="with-rules">According to the 2 Rules</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="without-rules" id="without-rules" />
                    <Label htmlFor="without-rules">Without the 2 Rules</Label>
                  </div>
                </RadioGroup>
              </div>
              
              {/* Meal Type */}
              <div className="space-y-2">
                <Label>Meal Type</Label>
                <RadioGroup 
                  value={mealType} 
                  onValueChange={(value: MealType) => setMealType(value)}
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
                    id="use-grass-fed" 
                    checked={useGrassFed}
                    onCheckedChange={(checked) => setUseGrassFed(checked === true)}
                  />
                  <Label htmlFor="use-grass-fed">Only use grass-fed/pasture raised meat</Label>
                </div>
              </div>
              
              {/* Selected Ingredients */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>Selected Ingredients</Label>
                  {selectedIngredients.length > 0 && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={clearIngredients}
                    >
                      Clear All
                    </Button>
                  )}
                </div>
                
                {selectedIngredients.length === 0 ? (
                  <div className="p-4 border border-dashed rounded-md text-center text-text-secondary">
                    No ingredients selected yet
                  </div>
                ) : (
                  <ul className="space-y-2 max-h-60 overflow-y-auto">
                    {selectedIngredients.map((ingredient, index) => (
                      <li key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded-md">
                        <span>{ingredient}</span>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => removeIngredient(index)}
                        >
                          <Trash2 className="h-4 w-4 text-error" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              
              {/* Build Meal Button */}
              <Button 
                onClick={handleBuildMeal} 
                disabled={generatingMeal || selectedIngredients.length === 0}
                className="w-full"
              >
                {generatingMeal ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Building Meal...
                  </>
                ) : (
                  <>
                    <Utensils className="mr-2 h-4 w-4" />
                    Build Meal
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
        
        {/* Ingredient Search Panel */}
        <div className="lg:col-span-2">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Add Ingredients</CardTitle>
              <CardDescription>
                Search for ingredients or select from your saved foods
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="search">
                <TabsList className="mb-4">
                  <TabsTrigger value="search">Search Database</TabsTrigger>
                  <TabsTrigger value="my-foods">My Foods</TabsTrigger>
                </TabsList>
                
                <TabsContent value="search">
                  <div className="space-y-4">
                    <div className="flex space-x-2">
                      <Input
                        placeholder="Search for ingredients..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="flex-1"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleSearch();
                          }
                        }}
                      />
                      <Button 
                        onClick={handleSearch}
                        disabled={searching || !searchTerm.trim() || searchTerm.length < 3}
                      >
                        {searching ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Search className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    
                    {searching ? (
                      <div className="text-center p-4">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
                        <p>Searching for ingredients...</p>
                      </div>
                    ) : searchResults.length > 0 ? (
                      <div className="space-y-2 max-h-80 overflow-y-auto">
                        {searchResults.map((result, index) => (
                          <div 
                            key={index} 
                            className="flex justify-between items-center p-3 bg-gray-50 rounded-md hover:bg-gray-100 cursor-pointer"
                            onClick={() => addIngredient(result.FoodDescription)}
                          >
                            <div>
                              <p className="font-medium">{result.FoodDescription}</p>
                              <p className="text-xs text-text-secondary">
                                {result.FoodGroupName}
                                {result.fructose !== undefined && ` • Fructose: ${result.fructose.toFixed(1)}g`}
                                {result.omega3 !== undefined && result.omega6 !== undefined && 
                                  ` • Omega Ratio: 1:${(result.omega6 / (result.omega3 || 1)).toFixed(1)}`
                                }
                              </p>
                            </div>
                            <Button variant="ghost" size="sm">
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : searchTerm && !searching ? (
                      <div className="text-center p-4 border border-dashed rounded-md">
                        <p>No results found. Try a different search term.</p>
                      </div>
                    ) : null}
                  </div>
                </TabsContent>
                
                <TabsContent value="my-foods">
                  {loadingMyFoods ? (
                    <div className="text-center p-4">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
                      <p>Loading your saved foods...</p>
                    </div>
                  ) : myFoods.length > 0 ? (
                    <div className="space-y-2 max-h-80 overflow-y-auto">
                      {myFoods.map((food, index) => (
                        <div 
                          key={index} 
                          className="flex justify-between items-center p-3 bg-gray-50 rounded-md hover:bg-gray-100 cursor-pointer"
                          onClick={() => addIngredient(food.name)}
                        >
                          <div>
                            <p className="font-medium">{food.name}</p>
                            <p className="text-xs text-text-secondary">
                              {food.amount} {food.unit}
                              {` • Fructose: ${food.fructose.toFixed(1)}g`}
                              {` • Omega Ratio: 1:${(food.omega6 / (food.omega3 || 1)).toFixed(1)}`}
                            </p>
                          </div>
                          <Button variant="ghost" size="sm">
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center p-4 border border-dashed rounded-md">
                      <p>You don't have any saved foods yet.</p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-2"
                        onClick={() => router.push('/my-foods')}
                      >
                        Go to My Foods
                      </Button>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
          
          {/* Results Panel */}
          {generationError && (
            <Card className="mb-6 border-error">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-error">
                  <AlertCircle className="mr-2 h-5 w-5" />
                  Meal Building Error
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p>{generationError}</p>
                <Button 
                  onClick={handleBuildMeal} 
                  className="mt-4"
                  disabled={generatingMeal}
                >
                  Try Again
                </Button>
              </CardContent>
            </Card>
          )}
          
          {!generatedMeal && !generationError && !generatingMeal && selectedIngredients.length > 0 && (
            <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
              <Utensils className="h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-text-primary mb-2">Ready to Build Your Meal</h3>
              <p className="text-text-secondary text-center max-w-md mb-4">
                Click the "Build Meal" button to create a meal with your selected ingredients.
              </p>
              <Button 
                onClick={handleBuildMeal}
                disabled={generatingMeal}
              >
                <Utensils className="mr-2 h-4 w-4" />
                Build Now
              </Button>
            </div>
          )}
          
          {!generatedMeal && !generationError && !generatingMeal && selectedIngredients.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
              <Search className="h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-text-primary mb-2">Select Ingredients</h3>
              <p className="text-text-secondary text-center max-w-md">
                Search for ingredients or select from your saved foods to start building your meal.
              </p>
            </div>
          )}
          
          {/* Generated Meal Result */}
          {generatedMeal && (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-2xl">{generatedMeal.name}</CardTitle>
                    <CardDescription>
                      {mealType.charAt(0).toUpperCase() + mealType.slice(1)} • {portions} {portions === 1 ? 'portion' : 'portions'}
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    {generatedMeal.follows_2_rules ? (
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
                    <p className="text-lg font-semibold">{generatedMeal.calories} kcal</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-xs text-text-secondary">Fructose</p>
                    <p className="text-lg font-semibold">{generatedMeal.total_fructose.toFixed(1)}g</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-xs text-text-secondary">Omega Ratio</p>
                    <p className="text-lg font-semibold">{generatedMeal.omega_ratio}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-xs text-text-secondary">Net Carbs</p>
                    <p className="text-lg font-semibold">{generatedMeal.net_carbs.toFixed(1)}g</p>
                  </div>
                </div>
                
                {/* Ingredients */}
                <div>
                  <h3 className="text-lg font-medium mb-2">Ingredients</h3>
                  <ul className="space-y-2">
                    {generatedMeal.ingredients.map((ingredient, index) => (
                      <li key={index} className="p-2 bg-gray-50 rounded-md">
                        {ingredient.amount} {ingredient.unit} {ingredient.name}
                      </li>
                    ))}
                  </ul>
                </div>
                
                {/* Instructions */}
                {includeInstructions && (
                  <div>
                    <h3 className="text-lg font-medium mb-2">Instructions</h3>
                    <div className="p-4 bg-gray-50 rounded-md">
                      <p className="whitespace-pre-line">{generatedMeal.instructions}</p>
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
                        <p className="text-lg font-semibold">{generatedMeal.protein}g</p>
                        <p className="text-xs text-text-secondary">
                          {generatedMeal.macronutrient_breakdown.protein_percentage}%
                        </p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-md">
                        <p className="text-xs text-text-secondary">Carbs</p>
                        <p className="text-lg font-semibold">{generatedMeal.carbs}g</p>
                        <p className="text-xs text-text-secondary">
                          {generatedMeal.macronutrient_breakdown.carbs_percentage}%
                        </p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-md">
                        <p className="text-xs text-text-secondary">Fat</p>
                        <p className="text-lg font-semibold">{generatedMeal.fat}g</p>
                        <p className="text-xs text-text-secondary">
                          {generatedMeal.macronutrient_breakdown.fat_percentage}%
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                      <div className="p-3 bg-gray-50 rounded-md">
                        <p className="text-xs text-text-secondary">Fiber</p>
                        <p className="text-lg font-semibold">{generatedMeal.fiber}g</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-md">
                        <p className="text-xs text-text-secondary">Iron</p>
                        <p className="text-lg font-semibold">{generatedMeal.iron_content}mg</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-md">
                        <p className="text-xs text-text-secondary">Omega-3</p>
                        <p className="text-lg font-semibold">{generatedMeal.omega3.toFixed(1)}g</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-md">
                        <p className="text-xs text-text-secondary">Omega-6</p>
                        <p className="text-lg font-semibold">{generatedMeal.omega6.toFixed(1)}g</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Heavy Metal Content */}
                {includeHeavyMetals && generatedMeal.heavy_metal_content && (
                  <div>
                    <h3 className="text-lg font-medium mb-2">Heavy Metal Content</h3>
                    <div className="p-4 bg-gray-50 rounded-md">
                      {Object.entries(generatedMeal.heavy_metal_content).length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          {Object.entries(generatedMeal.heavy_metal_content).map(([metal, value]) => (
                            <div key={metal} className="text-center">
                              <p className="text-xs text-text-secondary capitalize">{metal}</p>
                              <p className="font-medium">{value as number}μg</p>
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
                  onClick={handleBuildMeal}
                  disabled={generatingMeal}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Rebuild
                </Button>
                
                <div className="space-x-2">
                  <Button 
                    variant="outline"
                    onClick={handleAddToCalendar}
                    disabled={savingMeal}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    Add to Calendar
                  </Button>
                  
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
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="mt-8 flex flex-wrap gap-4">
        <Button variant="outline" onClick={() => router.push('/dashboard')}>
          Back to Dashboard
        </Button>
        <Button variant="outline" onClick={() => router.push('/meal-generator')}>
          <Sparkles className="mr-2 h-4 w-4" />
          Try Meal Generator
        </Button>
        <Button variant="outline" onClick={() => router.push('/saved-meals')}>
          <BookmarkCheck className="mr-2 h-4 w-4" />
          View Saved Meals
        </Button>
      </div>
    </div>
  );
}
