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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { sampleMeals } from '@/lib/constants';
import { 
  AlertCircle, 
  BookmarkCheck,
  Calendar,
  ChevronDown,
  ChevronUp,
  Clock, 
  Filter,
  Heart,
  Loader2, 
  MoreHorizontal,
  Plus,
  Search,
  Share2,
  Star,
  Trash2,
  Utensils
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function SavedMealsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createBrowserClient();
  const { 
    isPremium, 
    remainingSavedMealsQuota
  } = useSubscription();
  
  // State
  const [loading, setLoading] = useState(true);
  const [meals, setMeals] = useState<any[]>([]);
  const [singleMeals, setSingleMeals] = useState<any[]>([]);
  const [fullDayMeals, setFullDayMeals] = useState<any[]>([]);
  const [fullWeekMeals, setFullWeekMeals] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string | null>(null);
  const [filterMealType, setFilterMealType] = useState<string | null>(null);
  const [filterFavorites, setFilterFavorites] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<any | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [deletingMealId, setDeletingMealId] = useState<string | null>(null);
  const [updatingFavorite, setUpdatingFavorite] = useState<string | null>(null);
  
  // Fetch meals on component mount
  useEffect(() => {
    const fetchMeals = async () => {
      try {
        setLoading(true);
        
        // Get current session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user) {
          router.push('/');
          return;
        }
        
        // Fetch user's saved meals
        const { data: userMeals, error: mealsError } = await supabase
          .from('meals')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false });
        
        if (mealsError) throw mealsError;
        
        // Fetch user's saved full day meals
        const { data: userFullDayMeals, error: fullDayError } = await supabase
          .from('full_day_meals')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false });
        
        if (fullDayError) throw fullDayError;
        
        // Fetch user's saved full week meals
        const { data: userFullWeekMeals, error: fullWeekError } = await supabase
          .from('full_week_meals')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false });
        
        if (fullWeekError) throw fullWeekError;
        
        // Add sample meals (converting to match our database structure)
        const formattedSampleMeals = sampleMeals.map(meal => ({
          ...meal,
          user_id: session.user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          isSample: true
        }));
        
        // Combine all meals
        const allMeals = [
          ...(userMeals || []),
          ...formattedSampleMeals
        ];
        
        // Set meals state
        setMeals(allMeals);
        setSingleMeals(allMeals.filter(meal => meal.type === 'single'));
        setFullDayMeals(userFullDayMeals || []);
        setFullWeekMeals(userFullWeekMeals || []);
      } catch (error) {
        console.error('Error fetching saved meals:', error);
        toast({
          title: "Error loading meals",
          description: "Please try refreshing the page.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchMeals();
  }, [supabase, router, toast]);
  
  // Filter meals based on search term and filters
  const filteredSingleMeals = singleMeals.filter(meal => {
    // Search term filter
    const matchesSearch = searchTerm === '' || 
      meal.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      meal.ingredients.some((ing: any) => 
        ing.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    
    // Meal type filter
    const matchesMealType = filterMealType === null || meal.meal_type === filterMealType;
    
    // Favorites filter
    const matchesFavorites = !filterFavorites || meal.is_favorite;
    
    return matchesSearch && matchesMealType && matchesFavorites;
  });
  
  const filteredFullDayMeals = fullDayMeals.filter(meal => {
    // Search term filter
    const matchesSearch = searchTerm === '' || 
      meal.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Favorites filter
    const matchesFavorites = !filterFavorites || meal.is_favorite;
    
    return matchesSearch && matchesFavorites;
  });
  
  const filteredFullWeekMeals = fullWeekMeals.filter(meal => {
    // Search term filter
    const matchesSearch = searchTerm === '' || 
      meal.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Favorites filter
    const matchesFavorites = !filterFavorites || meal.is_favorite;
    
    return matchesSearch && matchesFavorites;
  });
  
  // Group single meals by type
  const breakfastMeals = filteredSingleMeals.filter(meal => meal.meal_type === 'breakfast');
  const lunchMeals = filteredSingleMeals.filter(meal => meal.meal_type === 'lunch');
  const dinnerMeals = filteredSingleMeals.filter(meal => meal.meal_type === 'dinner');
  const snackMeals = filteredSingleMeals.filter(meal => meal.meal_type === 'snack');
  const dessertMeals = filteredSingleMeals.filter(meal => meal.meal_type === 'dessert');
  
  // Handle delete meal
  const handleDeleteMeal = async (mealId: string) => {
    try {
      setDeletingMealId(mealId);
      
      // Check if it's a sample meal
      const mealToDelete = meals.find(meal => meal.id === mealId);
      if (mealToDelete?.isSample) {
        toast({
          title: "Cannot Delete Sample Meal",
          description: "Sample meals cannot be deleted.",
          variant: "destructive",
        });
        return;
      }
      
      // Delete meal from database
      const { error } = await supabase
        .from('meals')
        .delete()
        .eq('id', mealId);
      
      if (error) throw error;
      
      // Update state
      setMeals(meals.filter(meal => meal.id !== mealId));
      setSingleMeals(singleMeals.filter(meal => meal.id !== mealId));
      
      toast({
        title: "Meal Deleted",
        description: "The meal has been successfully deleted.",
      });
    } catch (error: any) {
      console.error('Error deleting meal:', error);
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete meal. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeletingMealId(null);
    }
  };
  
  // Handle toggle favorite
  const handleToggleFavorite = async (meal: any) => {
    try {
      setUpdatingFavorite(meal.id);
      
      // Check if it's a sample meal
      if (meal.isSample) {
        // For sample meals, just update the local state
        const updatedMeals = meals.map(m => 
          m.id === meal.id ? { ...m, is_favorite: !m.is_favorite } : m
        );
        setMeals(updatedMeals);
        setSingleMeals(updatedMeals.filter(m => m.type === 'single'));
        
        toast({
          title: meal.is_favorite ? "Removed from Favorites" : "Added to Favorites",
          description: `${meal.name} has been ${meal.is_favorite ? 'removed from' : 'added to'} your favorites.`,
        });
        return;
      }
      
      // Update meal in database
      const { error } = await supabase
        .from('meals')
        .update({ is_favorite: !meal.is_favorite })
        .eq('id', meal.id);
      
      if (error) throw error;
      
      // Update state
      const updatedMeals = meals.map(m => 
        m.id === meal.id ? { ...m, is_favorite: !m.is_favorite } : m
      );
      setMeals(updatedMeals);
      setSingleMeals(updatedMeals.filter(m => m.type === 'single'));
      
      toast({
        title: meal.is_favorite ? "Removed from Favorites" : "Added to Favorites",
        description: `${meal.name} has been ${meal.is_favorite ? 'removed from' : 'added to'} your favorites.`,
      });
    } catch (error: any) {
      console.error('Error updating favorite status:', error);
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update favorite status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUpdatingFavorite(null);
    }
  };
  
  // Handle view details
  const handleViewDetails = (meal: any) => {
    setSelectedMeal(meal);
    setShowDetails(true);
  };
  
  // Handle add to calendar
  const handleAddToCalendar = (meal: any) => {
    // Store the meal ID in session storage to be used by the calendar page
    sessionStorage.setItem('mealToAdd', JSON.stringify({
      id: meal.id,
      type: meal.type,
      meal_type: meal.meal_type
    }));
    
    // Redirect to calendar page
    router.push('/calendar');
  };
  
  // Handle share meal
  const handleShareMeal = (meal: any) => {
    // In a real app, this would open a share dialog or generate a shareable link
    toast({
      title: "Share Feature",
      description: "Meal sharing functionality would be implemented here.",
    });
  };
  
  // Render meal card
  const renderMealCard = (meal: any) => (
    <Card key={meal.id} className={`meal-card ${meal.is_favorite ? 'meal-card-highlight' : ''} ${!meal.follows_2_rules ? 'meal-card-warning' : ''}`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{meal.name}</CardTitle>
            <CardDescription>
              {meal.meal_type && meal.meal_type.charAt(0).toUpperCase() + meal.meal_type.slice(1)} • {meal.portions} {meal.portions === 1 ? 'portion' : 'portions'}
            </CardDescription>
          </div>
          <div className="flex items-center space-x-1">
            {meal.isSample && (
              <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                Sample
              </span>
            )}
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => handleToggleFavorite(meal)}
              disabled={updatingFavorite === meal.id}
              className={meal.is_favorite ? 'text-primary' : ''}
            >
              {updatingFavorite === meal.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Star className={`h-4 w-4 ${meal.is_favorite ? 'fill-primary' : ''}`} />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="grid grid-cols-3 gap-2 mb-4 text-xs text-text-secondary">
          <div>
            <p>Calories</p>
            <p className="font-medium text-text-primary">{meal.calories} kcal</p>
          </div>
          <div>
            <p>Fructose</p>
            <p className="font-medium text-text-primary">{meal.total_fructose.toFixed(1)}g</p>
          </div>
          <div>
            <p>Omega Ratio</p>
            <p className="font-medium text-text-primary">{meal.omega_ratio}</p>
          </div>
        </div>
        
        <div className="text-sm line-clamp-2 text-text-secondary mb-2">
          {meal.ingredients.slice(0, 3).map((ing: any) => ing.name).join(', ')}
          {meal.ingredients.length > 3 && '...'}
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between pt-0">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => handleViewDetails(meal)}
        >
          View Details
        </Button>
        
        <div className="flex items-center space-x-1">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => handleAddToCalendar(meal)}
          >
            <Calendar className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => handleShareMeal(meal)}
          >
            <Share2 className="h-4 w-4" />
          </Button>
          {!meal.isSample && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => handleDeleteMeal(meal.id)}
              disabled={deletingMealId === meal.id}
            >
              {deletingMealId === meal.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 text-error" />
              )}
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
  
  // Render meal details modal
  const renderMealDetailsModal = () => {
    if (!selectedMeal) return null;
    
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-bold">{selectedMeal.name}</h2>
                <p className="text-text-secondary">
                  {selectedMeal.meal_type && selectedMeal.meal_type.charAt(0).toUpperCase() + selectedMeal.meal_type.slice(1)} • {selectedMeal.portions} {selectedMeal.portions === 1 ? 'portion' : 'portions'}
                </p>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowDetails(false)}
              >
                ✕
              </Button>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-xs text-text-secondary">Calories</p>
                <p className="text-lg font-semibold">{selectedMeal.calories} kcal</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-xs text-text-secondary">Fructose</p>
                <p className="text-lg font-semibold">{selectedMeal.total_fructose.toFixed(1)}g</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-xs text-text-secondary">Omega Ratio</p>
                <p className="text-lg font-semibold">{selectedMeal.omega_ratio}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-xs text-text-secondary">Net Carbs</p>
                <p className="text-lg font-semibold">{selectedMeal.net_carbs.toFixed(1)}g</p>
              </div>
            </div>
            
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2">Ingredients</h3>
              <ul className="space-y-1">
                {selectedMeal.ingredients.map((ingredient: any, index: number) => (
                  <li key={index} className="p-2 bg-gray-50 rounded-md">
                    {ingredient.amount} {ingredient.unit} {ingredient.name}
                  </li>
                ))}
              </ul>
            </div>
            
            {selectedMeal.instructions && (
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-2">Instructions</h3>
                <div className="p-4 bg-gray-50 rounded-md">
                  <p className="whitespace-pre-line">{selectedMeal.instructions}</p>
                </div>
              </div>
            )}
            
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2">Macronutrients</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-3 bg-gray-50 rounded-md">
                  <p className="text-xs text-text-secondary">Protein</p>
                  <p className="text-lg font-semibold">{selectedMeal.protein}g</p>
                  <p className="text-xs text-text-secondary">
                    {selectedMeal.macronutrient_breakdown.protein_percentage}%
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded-md">
                  <p className="text-xs text-text-secondary">Carbs</p>
                  <p className="text-lg font-semibold">{selectedMeal.carbs}g</p>
                  <p className="text-xs text-text-secondary">
                    {selectedMeal.macronutrient_breakdown.carbs_percentage}%
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded-md">
                  <p className="text-xs text-text-secondary">Fat</p>
                  <p className="text-lg font-semibold">{selectedMeal.fat}g</p>
                  <p className="text-xs text-text-secondary">
                    {selectedMeal.macronutrient_breakdown.fat_percentage}%
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                <div className="p-3 bg-gray-50 rounded-md">
                  <p className="text-xs text-text-secondary">Fiber</p>
                  <p className="text-lg font-semibold">{selectedMeal.fiber}g</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-md">
                  <p className="text-xs text-text-secondary">Iron</p>
                  <p className="text-lg font-semibold">{selectedMeal.iron_content}mg</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-md">
                  <p className="text-xs text-text-secondary">Omega-3</p>
                  <p className="text-lg font-semibold">{selectedMeal.omega3.toFixed(1)}g</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-md">
                  <p className="text-xs text-text-secondary">Omega-6</p>
                  <p className="text-lg font-semibold">{selectedMeal.omega6.toFixed(1)}g</p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={() => handleToggleFavorite(selectedMeal)}
                disabled={updatingFavorite === selectedMeal.id}
              >
                {updatingFavorite === selectedMeal.id ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Star className={`mr-2 h-4 w-4 ${selectedMeal.is_favorite ? 'fill-primary' : ''}`} />
                )}
                {selectedMeal.is_favorite ? 'Remove from Favorites' : 'Add to Favorites'}
              </Button>
              
              <div className="space-x-2">
                <Button 
                  variant="outline"
                  onClick={() => handleShareMeal(selectedMeal)}
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </Button>
                
                <Button 
                  onClick={() => {
                    handleAddToCalendar(selectedMeal);
                    setShowDetails(false);
                  }}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  Add to Calendar
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-text-secondary">Loading your saved meals...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-2 text-primary">Saved Meals</h1>
      <p className="text-text-secondary mb-8">
        {isPremium 
          ? `You have saved ${meals.length - sampleMeals.length} of 42 meals (${remainingSavedMealsQuota} remaining)`
          : `You have saved ${meals.length - sampleMeals.length} of 2 meals (${remainingSavedMealsQuota} remaining)`
        }
      </p>
      
      {/* Search and Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex space-x-2 flex-1">
          <Input
            placeholder="Search meals..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1"
          />
          <Button variant="outline" onClick={() => setSearchTerm('')} disabled={!searchTerm}>
            Clear
          </Button>
        </div>
        
        <div className="flex space-x-2">
          <Select value={filterMealType || ''} onValueChange={(value) => setFilterMealType(value || null)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Meal Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Types</SelectItem>
              <SelectItem value="breakfast">Breakfast</SelectItem>
              <SelectItem value="lunch">Lunch</SelectItem>
              <SelectItem value="dinner">Dinner</SelectItem>
              <SelectItem value="snack">Snack</SelectItem>
              <SelectItem value="dessert">Dessert</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="flex items-center space-x-2 bg-white border rounded-md px-3">
            <Checkbox 
              id="filter-favorites" 
              checked={filterFavorites}
              onCheckedChange={(checked) => setFilterFavorites(checked === true)}
            />
            <Label htmlFor="filter-favorites" className="cursor-pointer">
              Favorites
            </Label>
          </div>
        </div>
      </div>
      
      {/* Tabs for meal types */}
      <Tabs defaultValue="single" className="mb-8">
        <TabsList>
          <TabsTrigger value="single">Single Meals</TabsTrigger>
          <TabsTrigger value="full-day" disabled={fullDayMeals.length === 0}>Full Day Plans</TabsTrigger>
          <TabsTrigger value="full-week" disabled={fullWeekMeals.length === 0}>Full Week Plans</TabsTrigger>
        </TabsList>
        
        {/* Single Meals Tab */}
        <TabsContent value="single">
          {filteredSingleMeals.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <p className="text-text-secondary mb-4">No meals found matching your search criteria.</p>
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('');
                  setFilterMealType(null);
                  setFilterFavorites(false);
                }}
              >
                Clear Filters
              </Button>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Breakfast Meals */}
              {breakfastMeals.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">Breakfast</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {breakfastMeals.map(meal => renderMealCard(meal))}
                  </div>
                </div>
              )}
              
              {/* Lunch Meals */}
              {lunchMeals.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">Lunch</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {lunchMeals.map(meal => renderMealCard(meal))}
                  </div>
                </div>
              )}
              
              {/* Dinner Meals */}
              {dinnerMeals.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">Dinner</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {dinnerMeals.map(meal => renderMealCard(meal))}
                  </div>
                </div>
              )}
              
              {/* Snack Meals */}
              {snackMeals.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">Snacks</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {snackMeals.map(meal => renderMealCard(meal))}
                  </div>
                </div>
              )}
              
              {/* Dessert Meals */}
              {dessertMeals.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">Desserts</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {dessertMeals.map(meal => renderMealCard(meal))}
                  </div>
                </div>
              )}
            </div>
          )}
        </TabsContent>
        
        {/* Full Day Plans Tab */}
        <TabsContent value="full-day">
          {filteredFullDayMeals.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <p className="text-text-secondary mb-4">No full day meal plans found.</p>
              <Button 
                variant="outline" 
                onClick={() => router.push('/meal-generator')}
              >
                Generate Full Day Plan
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredFullDayMeals.map(meal => (
                <Card key={meal.id} className={`meal-card ${meal.is_favorite ? 'meal-card-highlight' : ''}`}>
                  <CardHeader>
                    <CardTitle>{meal.name}</CardTitle>
                    <CardDescription>Full Day • {formatDate(meal.created_at, 'PP')}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p>Full day meal details would be displayed here.</p>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="ghost" size="sm">
                      View Details
                    </Button>
                    <Button variant="outline" size="sm">
                      <Calendar className="mr-2 h-4 w-4" />
                      Add to Calendar
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        {/* Full Week Plans Tab */}
        <TabsContent value="full-week">
          {filteredFullWeekMeals.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <p className="text-text-secondary mb-4">No full week meal plans found.</p>
              <Button 
                variant="outline" 
                onClick={() => router.push('/meal-generator')}
              >
                Generate Full Week Plan
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredFullWeekMeals.map(meal => (
                <Card key={meal.id} className={`meal-card ${meal.is_favorite ? 'meal-card-highlight' : ''}`}>
                  <CardHeader>
                    <CardTitle>{meal.name}</CardTitle>
                    <CardDescription>Full Week • {formatDate(meal.created_at, 'PP')}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p>Full week meal details would be displayed here.</p>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="ghost" size="sm">
                      View Details
                    </Button>
                    <Button variant="outline" size="sm">
                      <Calendar className="mr-2 h-4 w-4" />
                      Add to Calendar
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Quick Actions */}
      <div className="mt-8 flex flex-wrap gap-4">
        <Button variant="outline" onClick={() => router.push('/dashboard')}>
          Back to Dashboard
        </Button>
        <Button variant="outline" onClick={() => router.push('/meal-generator')}>
          <Sparkles className="mr-2 h-4 w-4" />
          Generate New Meal
        </Button>
        <Button variant="outline" onClick={() => router.push('/calendar')}>
          <Calendar className="mr-2 h-4 w-4" />
          View Calendar
        </Button>
      </div>
      
      {/* Meal Details Modal */}
      {showDetails && renderMealDetailsModal()}
    </div>
  );
}
