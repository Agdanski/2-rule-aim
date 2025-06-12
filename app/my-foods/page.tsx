'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import { useSubscription } from '@/components/providers/subscription-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertCircle,
  ArrowRight,
  Barcode,
  BookmarkCheck,
  Calendar,
  Loader2,
  Plus,
  Search,
  ShoppingCart,
  Trash2,
  Utensils,
  Apple
} from 'lucide-react';
import {
  searchFoodsWithNutrients,
  FoodSearchResult,
  NutrientSummary,
  getKeyNutrients,
  getAvailableMeasures
} from '@/lib/cnf-integration';
import { calculateOmegaRatio } from '@/lib/utils';

export default function MyFoodsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createBrowserClient();
  const { isPremium } = useSubscription();

  // State
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [myFoods, setMyFoods] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<(FoodSearchResult & Partial<NutrientSummary>)[]>([]);
  const [searching, setSearching] = useState(false);
  const [addingFood, setAddingFood] = useState(false);
  const [deletingFoodId, setDeletingFoodId] = useState<string | null>(null);
  const [selectedFoodForAdd, setSelectedFoodForAdd] = useState<FoodSearchResult | null>(null);
  const [foodAmount, setFoodAmount] = useState<number>(100);
  const [foodUnit, setFoodUnit] = useState<string>('g');
  const [availableMeasures, setAvailableMeasures] = useState<any[]>([]);

  // Fetch user data and my foods on component mount
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

        // Get user profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileError) throw profileError;

        setProfile(profileData);

        // Fetch user's saved foods
        await fetchMyFoods(session.user.id);
      } catch (error) {
        console.error('Error fetching user data:', error);
        toast({
          title: "Error loading page",
          description: "Please try refreshing the page.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [supabase, router, toast]);

  // Fetch user's saved foods
  const fetchMyFoods = async (userId: string) => {
    try {
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
        description: "Failed to load your saved foods. Please try again.",
        variant: "destructive",
      });
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
      setSearchResults([]);

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

  // Handle selecting a food to add
  const handleSelectFood = async (food: FoodSearchResult & Partial<NutrientSummary>) => {
    try {
      setSelectedFoodForAdd(food);
      
      // Get available measures for this food
      const measures = await getAvailableMeasures(food.FoodID);
      setAvailableMeasures(measures);
      
      // Reset to default amount and unit
      setFoodAmount(100);
      setFoodUnit('g');
    } catch (error) {
      console.error('Error getting food measures:', error);
      toast({
        title: "Error",
        description: "Failed to get food measures. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle adding food to my foods
  const handleAddFood = async () => {
    if (!selectedFoodForAdd || !profile) return;

    try {
      setAddingFood(true);

      // Get complete nutrient data for the selected food
      const nutrients = await getKeyNutrients(selectedFoodForAdd.FoodID);

      // Calculate nutrient values based on amount
      // This is a simplified calculation - in a real app, you'd need proper unit conversion
      const amountMultiplier = foodAmount / 100; // Assuming nutrients are per 100g
      
      // Create new food entry
      const newFood = {
        user_id: profile.id,
        name: selectedFoodForAdd.FoodDescription,
        amount: foodAmount,
        unit: foodUnit,
        fructose: nutrients.fructose * amountMultiplier,
        omega3: nutrients.omega3 * amountMultiplier,
        omega6: nutrients.omega6 * amountMultiplier,
        protein: nutrients.protein * amountMultiplier,
        carbs: nutrients.carbs * amountMultiplier,
        fat: nutrients.fat * amountMultiplier,
        calories: nutrients.calories * amountMultiplier,
        iron: nutrients.iron * amountMultiplier,
        fiber: nutrients.fiber * amountMultiplier,
        source: 'CNF', // Or 'USDA' depending on the source
        source_id: selectedFoodForAdd.FoodID.toString(),
        barcode: null
      };

      // Save to database
      const { error } = await supabase
        .from('my_foods')
        .insert(newFood);

      if (error) throw error;

      // Refresh my foods list
      await fetchMyFoods(profile.id);

      // Reset state
      setSelectedFoodForAdd(null);
      setSearchResults([]);
      setSearchTerm('');

      toast({
        title: "Food Added",
        description: `${selectedFoodForAdd.FoodDescription} has been added to your foods.`,
      });
    } catch (error: any) {
      console.error('Error adding food:', error);
      toast({
        title: "Error Adding Food",
        description: error.message || "Failed to add food to your list. Please try again.",
        variant: "destructive",
      });
    } finally {
      setAddingFood(false);
    }
  };

  // Handle deleting food from my foods
  const handleDeleteFood = async (foodId: string) => {
    try {
      setDeletingFoodId(foodId);

      const { error } = await supabase
        .from('my_foods')
        .delete()
        .eq('id', foodId);

      if (error) throw error;

      // Update state
      setMyFoods(myFoods.filter(food => food.id !== foodId));

      toast({
        title: "Food Deleted",
        description: "The food has been removed from your list.",
      });
    } catch (error: any) {
      console.error('Error deleting food:', error);
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete food. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeletingFoodId(null);
    }
  };

  // Handle barcode scan (placeholder)
  const handleBarcodeScan = () => {
    toast({
      title: "Barcode Scanning",
      description: "This feature is available in the mobile app version.",
    });
  };

  // Cancel adding food
  const handleCancelAddFood = () => {
    setSelectedFoodForAdd(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-text-secondary">Loading your foods...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-2 text-primary">My Foods</h1>
      <p className="text-text-secondary mb-8">
        Manage your favorite foods and ingredients for meal building
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* My Foods List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>My Saved Foods</CardTitle>
              <CardDescription>
                {myFoods.length} foods in your collection
              </CardDescription>
            </CardHeader>
            <CardContent>
              {myFoods.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed rounded-md">
                  <Apple className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-text-secondary">
                    You don't have any saved foods yet.
                  </p>
                  <p className="text-text-secondary text-sm">
                    Search for foods to add them to your list.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2">
                  {myFoods.map((food) => (
                    <div
                      key={food.id}
                      className="flex justify-between items-center p-3 bg-gray-50 rounded-md hover:bg-gray-100"
                    >
                      <div>
                        <p className="font-medium">{food.name}</p>
                        <p className="text-xs text-text-secondary">
                          {food.amount} {food.unit} • F: {food.fructose.toFixed(1)}g • Ω: 1:{(food.omega6 / (food.omega3 || 1)).toFixed(1)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteFood(food.id)}
                        disabled={deletingFoodId === food.id}
                      >
                        {deletingFoodId === food.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4 text-error" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter>
              <div className="w-full flex justify-between">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleBarcodeScan}
                >
                  <Barcode className="mr-2 h-4 w-4" />
                  Scan Barcode
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => router.push('/meal-builder')}
                >
                  <Utensils className="mr-2 h-4 w-4" />
                  Build Meal
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>

        {/* Food Search and Add */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Add Foods</CardTitle>
              <CardDescription>
                Search for foods to add to your collection
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="search">
                <TabsList className="mb-4">
                  <TabsTrigger value="search">Search Database</TabsTrigger>
                  <TabsTrigger value="manual" disabled>Manual Entry</TabsTrigger>
                </TabsList>

                <TabsContent value="search">
                  {selectedFoodForAdd ? (
                    <div className="space-y-4">
                      <div className="bg-gray-50 p-4 rounded-md">
                        <h3 className="font-medium mb-2">{selectedFoodForAdd.FoodDescription}</h3>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div>
                            <p className="text-text-secondary">Fructose</p>
                            <p>{selectedFoodForAdd.fructose?.toFixed(1) || '0'} g</p>
                          </div>
                          <div>
                            <p className="text-text-secondary">Omega-3</p>
                            <p>{selectedFoodForAdd.omega3?.toFixed(1) || '0'} g</p>
                          </div>
                          <div>
                            <p className="text-text-secondary">Omega-6</p>
                            <p>{selectedFoodForAdd.omega6?.toFixed(1) || '0'} g</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="amount">Amount</Label>
                        <div className="flex space-x-2">
                          <Input
                            id="amount"
                            type="number"
                            min="0"
                            step="0.1"
                            value={foodAmount}
                            onChange={(e) => setFoodAmount(parseFloat(e.target.value) || 0)}
                            className="w-24"
                          />
                          <select
                            value={foodUnit}
                            onChange={(e) => setFoodUnit(e.target.value)}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <option value="g">grams (g)</option>
                            <option value="ml">milliliters (ml)</option>
                            <option value="oz">ounces (oz)</option>
                            <option value="cup">cups</option>
                            <option value="tbsp">tablespoons</option>
                            <option value="tsp">teaspoons</option>
                            {availableMeasures.map((measure) => (
                              <option key={measure.measureId} value={measure.measureDescription}>
                                {measure.measureDescription}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          onClick={handleCancelAddFood}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleAddFood}
                          disabled={addingFood}
                        >
                          {addingFood ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Adding...
                            </>
                          ) : (
                            <>
                              <Plus className="mr-2 h-4 w-4" />
                              Add to My Foods
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex space-x-2">
                        <Input
                          placeholder="Search for foods..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleSearch();
                            }
                          }}
                          className="flex-1"
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
                        <div className="text-center py-8">
                          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
                          <p>Searching for foods...</p>
                        </div>
                      ) : searchResults.length > 0 ? (
                        <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                          {searchResults.map((result, index) => (
                            <div
                              key={index}
                              className="flex justify-between items-center p-3 bg-gray-50 rounded-md hover:bg-gray-100 cursor-pointer"
                              onClick={() => handleSelectFood(result)}
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
                        <div className="text-center py-8 border-2 border-dashed rounded-md">
                          <p>No results found. Try a different search term.</p>
                        </div>
                      ) : (
                        <div className="text-center py-8 border-2 border-dashed rounded-md">
                          <Search className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                          <p className="text-text-secondary">
                            Search for foods to add to your collection
                          </p>
                          <p className="text-text-secondary text-sm">
                            Enter at least 3 characters to search
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Database Info */}
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-2">Food Database Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Canadian Nutrient File (CNF)</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-text-secondary">
                    The Canadian Nutrient File is Canada's official nutrient database, containing average values for nutrients in foods available in Canada.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">USDA FoodData Central</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-text-secondary">
                    The USDA FoodData Central database provides comprehensive nutrient data for foods available in the United States.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 flex flex-wrap gap-4">
        <Button variant="outline" onClick={() => router.push('/dashboard')}>
          Back to Dashboard
        </Button>
        <Button variant="outline" onClick={() => router.push('/meal-builder')}>
          <Utensils className="mr-2 h-4 w-4" />
          Build a Meal
        </Button>
      </div>
    </div>
  );
}
