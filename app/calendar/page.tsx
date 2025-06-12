'use client';

import { useState, useEffect, useRef } from 'react';
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
import { 
  AlertCircle, 
  ArrowLeft, 
  ArrowRight, 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Loader2, 
  Plus,
  ShoppingCart,
  Trash2,
  X
} from 'lucide-react';
import { format, addDays, subDays, startOfWeek, endOfWeek, isSameDay, parseISO, isValid } from 'date-fns';
import { dirtyDozenFoods } from '@/lib/constants';

export default function CalendarPage() {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createBrowserClient();
  const { isPremium, remainingSavedMealsQuota } = useSubscription();
  
  // State
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [weekDates, setWeekDates] = useState<Date[]>([]);
  const [calendarEntries, setCalendarEntries] = useState<any[]>([]);
  const [savedMeals, setSavedMeals] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedMealType, setSelectedMealType] = useState<string | null>(null);
  const [showAddMealModal, setShowAddMealModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [mealBeingMoved, setMealBeingMoved] = useState<any | null>(null);
  const [movingMeal, setMovingMeal] = useState(false);
  const [showGroceryListModal, setShowGroceryListModal] = useState(false);
  const [groceryListDateRange, setGroceryListDateRange] = useState<{ start: Date; end: Date } | null>(null);
  const [generatingGroceryList, setGeneratingGroceryList] = useState(false);
  const [groceryList, setGroceryList] = useState<any | null>(null);
  const [useOrganicProduce, setUseOrganicProduce] = useState(false);
  const [totalMealsInCalendar, setTotalMealsInCalendar] = useState(0);
  
  // Refs
  const draggedMealRef = useRef<any>(null);
  
  // Fetch user data and initialize calendar on component mount
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
        setUseOrganicProduce(profileData.buy_organic || false);
        
        // Initialize week dates
        initializeWeekDates(new Date());
        
        // Fetch calendar entries
        await fetchCalendarEntries(session.user.id);
        
        // Fetch saved meals
        await fetchSavedMeals(session.user.id);
        
        // Check for meal to add from session storage (from saved meals page)
        const mealToAddString = sessionStorage.getItem('mealToAdd');
        if (mealToAddString) {
          const mealToAdd = JSON.parse(mealToAddString);
          sessionStorage.removeItem('mealToAdd');
          
          // Find the meal in saved meals
          const meal = savedMeals.find(m => m.id === mealToAdd.id);
          if (meal) {
            setSelectedDate(new Date());
            setSelectedMealType(mealToAdd.meal_type);
            setShowAddMealModal(true);
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        toast({
          title: "Error loading calendar",
          description: "Please try refreshing the page.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [supabase, router, toast]);
  
  // Initialize week dates based on current date
  const initializeWeekDates = (date: Date) => {
    const days = [];
    const startDay = startOfWeek(date, { weekStartsOn: 1 }); // Start on Monday
    
    for (let i = 0; i < 7; i++) {
      days.push(addDays(startDay, i));
    }
    
    setWeekDates(days);
  };
  
  // Fetch calendar entries for the user
  const fetchCalendarEntries = async (userId: string) => {
    try {
      // Get start and end dates for the current week
      const startDate = format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');
      const endDate = format(endOfWeek(currentDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');
      
      // Fetch calendar entries
      const { data, error } = await supabase
        .from('calendar_entries')
        .select('*')
        .eq('user_id', userId)
        .gte('date', startDate)
        .lte('date', endDate);
      
      if (error) throw error;
      
      setCalendarEntries(data || []);
      
      // Count total meals in calendar for quota tracking
      const { data: countData, error: countError } = await supabase
        .from('calendar_entries')
        .select('id')
        .eq('user_id', userId);
      
      if (countError) throw countError;
      
      setTotalMealsInCalendar(countData?.length || 0);
    } catch (error) {
      console.error('Error fetching calendar entries:', error);
      toast({
        title: "Error loading calendar",
        description: "Failed to load your meal calendar.",
        variant: "destructive",
      });
    }
  };
  
  // Fetch saved meals for the user
  const fetchSavedMeals = async (userId: string) => {
    try {
      // Fetch user's saved meals
      const { data, error } = await supabase
        .from('meals')
        .select('*')
        .eq('user_id', userId);
      
      if (error) throw error;
      
      setSavedMeals(data || []);
    } catch (error) {
      console.error('Error fetching saved meals:', error);
      toast({
        title: "Error loading meals",
        description: "Failed to load your saved meals.",
        variant: "destructive",
      });
    }
  };
  
  // Navigate to previous week
  const goToPreviousWeek = () => {
    const newDate = subDays(currentDate, 7);
    setCurrentDate(newDate);
    initializeWeekDates(newDate);
    fetchCalendarEntries(profile.id);
  };
  
  // Navigate to next week
  const goToNextWeek = () => {
    const newDate = addDays(currentDate, 7);
    setCurrentDate(newDate);
    initializeWeekDates(newDate);
    fetchCalendarEntries(profile.id);
  };
  
  // Go to current week
  const goToCurrentWeek = () => {
    const today = new Date();
    setCurrentDate(today);
    initializeWeekDates(today);
    fetchCalendarEntries(profile.id);
  };
  
  // Handle meal slot click to show add meal modal
  const handleMealSlotClick = (date: Date, mealType: string) => {
    // Check if there's already a meal in this slot
    const dateString = format(date, 'yyyy-MM-dd');
    const existingEntry = calendarEntries.find(entry => 
      entry.date === dateString && entry[`${mealType}_id`] !== null
    );
    
    if (existingEntry) {
      // Show options for existing meal (view, remove, etc.)
      toast({
        title: "Meal Already Added",
        description: "This slot already has a meal. You can remove it first if you want to add a different meal.",
      });
      return;
    }
    
    // Open add meal modal
    setSelectedDate(date);
    setSelectedMealType(mealType);
    setShowAddMealModal(true);
  };
  
  // Add meal to calendar
  const handleAddMealToCalendar = async (meal: any) => {
    if (!selectedDate || !selectedMealType) return;
    
    try {
      // Check meal limit for non-premium users
      if (!isPremium && totalMealsInCalendar >= 42) {
        toast({
          title: "Meal Limit Reached",
          description: "You've reached the maximum number of meals in your calendar. Upgrade to Premium for unlimited meals.",
          action: (
            <Button variant="outline" size="sm" onClick={() => router.push('/pricing')}>
              Upgrade
            </Button>
          ),
        });
        return;
      }
      
      const dateString = format(selectedDate, 'yyyy-MM-dd');
      
      // Check if there's already an entry for this date
      const existingEntry = calendarEntries.find(entry => entry.date === dateString);
      
      if (existingEntry) {
        // Update existing entry
        const { error } = await supabase
          .from('calendar_entries')
          .update({ 
            [`${selectedMealType}_id`]: meal.id,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingEntry.id);
        
        if (error) throw error;
      } else {
        // Create new entry
        const newEntry = {
          user_id: profile.id,
          date: dateString,
          [`${selectedMealType}_id`]: meal.id,
          daily_fructose: meal.total_fructose, // This will be updated when more meals are added
          daily_omega_ratio: meal.omega_ratio // This will be updated when more meals are added
        };
        
        const { error } = await supabase
          .from('calendar_entries')
          .insert(newEntry);
        
        if (error) throw error;
      }
      
      // Refresh calendar entries
      await fetchCalendarEntries(profile.id);
      
      toast({
        title: "Meal Added",
        description: `${meal.name} added to your calendar for ${format(selectedDate, 'EEEE, MMMM d')}`,
      });
      
      // Close modal
      setShowAddMealModal(false);
      setSelectedDate(null);
      setSelectedMealType(null);
      setSearchTerm('');
    } catch (error: any) {
      console.error('Error adding meal to calendar:', error);
      toast({
        title: "Error Adding Meal",
        description: error.message || "Failed to add meal to calendar.",
        variant: "destructive",
      });
    }
  };
  
  // Remove meal from calendar
  const handleRemoveMealFromCalendar = async (date: Date, mealType: string) => {
    try {
      const dateString = format(date, 'yyyy-MM-dd');
      
      // Find the entry for this date
      const existingEntry = calendarEntries.find(entry => entry.date === dateString);
      
      if (!existingEntry) return;
      
      // Update entry to remove meal
      const { error } = await supabase
        .from('calendar_entries')
        .update({ 
          [`${mealType}_id`]: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingEntry.id);
      
      if (error) throw error;
      
      // Refresh calendar entries
      await fetchCalendarEntries(profile.id);
      
      toast({
        title: "Meal Removed",
        description: `Meal removed from ${format(date, 'EEEE, MMMM d')}`,
      });
    } catch (error: any) {
      console.error('Error removing meal from calendar:', error);
      toast({
        title: "Error Removing Meal",
        description: error.message || "Failed to remove meal from calendar.",
        variant: "destructive",
      });
    }
  };
  
  // Start meal move
  const handleStartMealMove = (date: Date, mealType: string, meal: any) => {
    setMealBeingMoved({
      date,
      mealType,
      meal
    });
    
    toast({
      title: "Moving Meal",
      description: "Select a new slot for this meal.",
    });
  };
  
  // Complete meal move
  const handleCompleteMealMove = async (newDate: Date, newMealType: string) => {
    if (!mealBeingMoved) return;
    
    try {
      setMovingMeal(true);
      
      // Format dates
      const oldDateString = format(mealBeingMoved.date, 'yyyy-MM-dd');
      const newDateString = format(newDate, 'yyyy-MM-dd');
      
      // Find the old entry
      const oldEntry = calendarEntries.find(entry => entry.date === oldDateString);
      
      if (!oldEntry) {
        throw new Error("Original meal entry not found");
      }
      
      // Remove meal from old entry
      const { error: removeError } = await supabase
        .from('calendar_entries')
        .update({ 
          [`${mealBeingMoved.mealType}_id`]: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', oldEntry.id);
      
      if (removeError) throw removeError;
      
      // Find or create new entry
      const newEntry = calendarEntries.find(entry => entry.date === newDateString);
      
      if (newEntry) {
        // Update existing entry
        const { error } = await supabase
          .from('calendar_entries')
          .update({ 
            [`${newMealType}_id`]: mealBeingMoved.meal.id,
            updated_at: new Date().toISOString()
          })
          .eq('id', newEntry.id);
        
        if (error) throw error;
      } else {
        // Create new entry
        const newEntryData = {
          user_id: profile.id,
          date: newDateString,
          [`${newMealType}_id`]: mealBeingMoved.meal.id,
          daily_fructose: mealBeingMoved.meal.total_fructose,
          daily_omega_ratio: mealBeingMoved.meal.omega_ratio
        };
        
        const { error } = await supabase
          .from('calendar_entries')
          .insert(newEntryData);
        
        if (error) throw error;
      }
      
      // Refresh calendar entries
      await fetchCalendarEntries(profile.id);
      
      toast({
        title: "Meal Moved",
        description: `Meal moved to ${format(newDate, 'EEEE, MMMM d')}`,
      });
    } catch (error: any) {
      console.error('Error moving meal:', error);
      toast({
        title: "Error Moving Meal",
        description: error.message || "Failed to move meal.",
        variant: "destructive",
      });
    } finally {
      setMealBeingMoved(null);
      setMovingMeal(false);
    }
  };
  
  // Cancel meal move
  const handleCancelMealMove = () => {
    setMealBeingMoved(null);
    toast({
      title: "Move Cancelled",
      description: "Meal move cancelled.",
    });
  };
  
  // Open grocery list modal
  const handleOpenGroceryListModal = () => {
    setGroceryListDateRange({
      start: weekDates[0],
      end: weekDates[6]
    });
    setShowGroceryListModal(true);
  };
  
  // Generate grocery list
  const handleGenerateGroceryList = async () => {
    if (!groceryListDateRange) return;
    
    try {
      setGeneratingGroceryList(true);
      
      // Format date range
      const startDateString = format(groceryListDateRange.start, 'yyyy-MM-dd');
      const endDateString = format(groceryListDateRange.end, 'yyyy-MM-dd');
      
      // Fetch calendar entries for the date range
      const { data: entriesData, error: entriesError } = await supabase
        .from('calendar_entries')
        .select('*')
        .eq('user_id', profile.id)
        .gte('date', startDateString)
        .lte('date', endDateString);
      
      if (entriesError) throw entriesError;
      
      if (!entriesData || entriesData.length === 0) {
        toast({
          title: "No Meals Found",
          description: "There are no meals in the selected date range.",
        });
        setGeneratingGroceryList(false);
        return;
      }
      
      // Collect all meal IDs
      const mealIds: string[] = [];
      
      entriesData.forEach(entry => {
        if (entry.breakfast_id) mealIds.push(entry.breakfast_id);
        if (entry.lunch_id) mealIds.push(entry.lunch_id);
        if (entry.dinner_id) mealIds.push(entry.dinner_id);
        if (entry.snack1_id) mealIds.push(entry.snack1_id);
        if (entry.snack2_id) mealIds.push(entry.snack2_id);
        if (entry.dessert_id) mealIds.push(entry.dessert_id);
      });
      
      if (mealIds.length === 0) {
        toast({
          title: "No Meals Found",
          description: "There are no meals in the selected date range.",
        });
        setGeneratingGroceryList(false);
        return;
      }
      
      // Fetch meals
      const { data: mealsData, error: mealsError } = await supabase
        .from('meals')
        .select('*')
        .in('id', mealIds);
      
      if (mealsError) throw mealsError;
      
      // Collect all ingredients
      const allIngredients: any[] = [];
      
      mealsData?.forEach(meal => {
        meal.ingredients.forEach((ingredient: any) => {
          // Check if it's a dirty dozen item and should be organic
          const isOrganicItem = useOrganicProduce && 
            dirtyDozenFoods.some(item => 
              ingredient.name.toLowerCase().includes(item.toLowerCase())
            );
          
          allIngredients.push({
            ...ingredient,
            organic: isOrganicItem
          });
        });
      });
      
      // Generate grocery list using OpenAI API
      const response = await fetch('/api/generate-grocery-list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ingredients: allIngredients,
          useOrganicProduce
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate grocery list');
      }
      
      const data = await response.json();
      
      // Format grocery list
      const formattedList = {
        name: `Grocery List ${format(groceryListDateRange.start, 'MMM d')} - ${format(groceryListDateRange.end, 'MMM d, yyyy')}`,
        date_range: {
          start_date: startDateString,
          end_date: endDateString
        },
        items: data.groceryList
      };
      
      // Save grocery list to database
      const { error: saveError } = await supabase
        .from('grocery_lists')
        .insert({
          user_id: profile.id,
          name: formattedList.name,
          date_range: formattedList.date_range,
          items: formattedList.items
        });
      
      if (saveError) throw saveError;
      
      // Set grocery list in state
      setGroceryList(formattedList);
      
      toast({
        title: "Grocery List Generated",
        description: "Your grocery list has been generated and saved.",
      });
    } catch (error: any) {
      console.error('Error generating grocery list:', error);
      toast({
        title: "Error Generating Grocery List",
        description: error.message || "Failed to generate grocery list.",
        variant: "destructive",
      });
    } finally {
      setGeneratingGroceryList(false);
    }
  };
  
  // Get meal for a specific slot
  const getMealForSlot = (date: Date, mealType: string) => {
    const dateString = format(date, 'yyyy-MM-dd');
    const entry = calendarEntries.find(entry => entry.date === dateString);
    
    if (!entry || !entry[`${mealType}_id`]) return null;
    
    const mealId = entry[`${mealType}_id`];
    return savedMeals.find(meal => meal.id === mealId);
  };
  
  // Calculate daily totals for a specific date
  const getDailyTotals = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    const entry = calendarEntries.find(entry => entry.date === dateString);
    
    if (!entry) return { fructose: 0, omegaRatio: '1:0' };
    
    let totalFructose = 0;
    let totalOmega3 = 0;
    let totalOmega6 = 0;
    
    // Add up values from all meals
    const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack1', 'snack2', 'dessert'];
    
    mealTypes.forEach(type => {
      const mealId = entry[`${type}_id`];
      if (mealId) {
        const meal = savedMeals.find(m => m.id === mealId);
        if (meal) {
          totalFructose += meal.total_fructose;
          totalOmega3 += meal.omega3;
          totalOmega6 += meal.omega6;
        }
      }
    });
    
    // Calculate omega ratio
    const omegaRatio = totalOmega3 > 0 
      ? `1:${(totalOmega6 / totalOmega3).toFixed(1)}` 
      : '1:0';
    
    return {
      fructose: totalFructose,
      omegaRatio
    };
  };
  
  // Check if a date is today
  const isToday = (date: Date) => {
    return isSameDay(date, new Date());
  };
  
  // Filter saved meals based on search term
  const filteredMeals = savedMeals.filter(meal => {
    // Only show meals of the selected type
    if (selectedMealType && meal.meal_type !== selectedMealType && meal.meal_type !== null) {
      return false;
    }
    
    // Filter by search term
    if (searchTerm) {
      return meal.name.toLowerCase().includes(searchTerm.toLowerCase());
    }
    
    return true;
  });
  
  // Render meal slot
  const renderMealSlot = (date: Date, mealType: string, label: string) => {
    const meal = getMealForSlot(date, mealType);
    const isMoving = mealBeingMoved !== null;
    const isMovingThisMeal = mealBeingMoved && 
      isSameDay(mealBeingMoved.date, date) && 
      mealBeingMoved.mealType === mealType;
    
    // If we're moving a meal and this is the source slot, show it as empty
    if (isMovingThisMeal) {
      return (
        <div 
          className="calendar-meal-slot border border-dashed border-gray-300 bg-gray-50"
          onClick={handleCancelMealMove}
        >
          <div className="flex justify-between items-center">
            <span className="text-text-secondary">{label}</span>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-5 w-5 p-0" 
              onClick={handleCancelMealMove}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      );
    }
    
    // If there's no meal in this slot
    if (!meal) {
      return (
        <div 
          className={`calendar-meal-slot ${isMoving ? 'bg-gray-100 cursor-pointer' : ''}`}
          onClick={() => {
            if (isMoving) {
              handleCompleteMealMove(date, mealType);
            } else {
              handleMealSlotClick(date, mealType);
            }
          }}
        >
          <div className="flex justify-between items-center">
            <span className="text-text-secondary">{label}</span>
            {!isMoving && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-5 w-5 p-0" 
                onClick={(e) => {
                  e.stopPropagation();
                  handleMealSlotClick(date, mealType);
                }}
              >
                <Plus className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      );
    }
    
    // If there's a meal in this slot
    return (
      <div 
        className={`calendar-meal-slot calendar-meal-filled ${isMoving ? 'bg-gray-100 cursor-pointer' : ''}`}
        onClick={() => {
          if (isMoving) {
            handleCompleteMealMove(date, mealType);
          }
        }}
      >
        <div className="flex justify-between items-center">
          <span className="font-medium truncate">{meal.name}</span>
          {!isMoving && (
            <div className="flex space-x-1">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-5 w-5 p-0" 
                onClick={(e) => {
                  e.stopPropagation();
                  handleStartMealMove(date, mealType, meal);
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8L22 12L18 16"></path>
                  <path d="M2 12H22"></path>
                </svg>
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-5 w-5 p-0 text-error" 
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveMealFromCalendar(date, mealType);
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  };
  
  // Render add meal modal
  const renderAddMealModal = () => {
    if (!showAddMealModal || !selectedDate || !selectedMealType) return null;
    
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-bold">Add Meal to Calendar</h2>
                <p className="text-text-secondary">
                  {format(selectedDate, 'EEEE, MMMM d')} • {selectedMealType.charAt(0).toUpperCase() + selectedMealType.slice(1)}
                </p>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowAddMealModal(false)}
              >
                ✕
              </Button>
            </div>
            
            <div className="mb-4">
              <Input
                placeholder="Search meals..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            {filteredMeals.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <p className="text-text-secondary mb-4">No meals found matching your search criteria.</p>
                <Button 
                  variant="outline" 
                  onClick={() => router.push('/meal-generator')}
                >
                  Generate New Meal
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                {filteredMeals.map(meal => (
                  <Card 
                    key={meal.id} 
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleAddMealToCalendar(meal)}
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{meal.name}</CardTitle>
                      <CardDescription>
                        {meal.meal_type && meal.meal_type.charAt(0).toUpperCase() + meal.meal_type.slice(1)}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="grid grid-cols-3 gap-2 mb-2 text-xs text-text-secondary">
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
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };
  
  // Render grocery list modal
  const renderGroceryListModal = () => {
    if (!showGroceryListModal) return null;
    
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-bold">Generate Grocery List</h2>
                <p className="text-text-secondary">
                  Select a date range for your grocery list
                </p>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  setShowGroceryListModal(false);
                  setGroceryList(null);
                }}
              >
                ✕
              </Button>
            </div>
            
            {!groceryList ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start-date">Start Date</Label>
                    <Input
                      id="start-date"
                      type="date"
                      value={groceryListDateRange?.start ? format(groceryListDateRange.start, 'yyyy-MM-dd') : ''}
                      onChange={(e) => {
                        const date = parseISO(e.target.value);
                        if (isValid(date)) {
                          setGroceryListDateRange(prev => ({
                            start: date,
                            end: prev?.end || date
                          }));
                        }
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end-date">End Date</Label>
                    <Input
                      id="end-date"
                      type="date"
                      value={groceryListDateRange?.end ? format(groceryListDateRange.end, 'yyyy-MM-dd') : ''}
                      onChange={(e) => {
                        const date = parseISO(e.target.value);
                        if (isValid(date)) {
                          setGroceryListDateRange(prev => ({
                            start: prev?.start || date,
                            end: date
                          }));
                        }
                      }}
                    />
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="organic-produce" 
                    checked={useOrganicProduce}
                    onCheckedChange={(checked) => setUseOrganicProduce(checked === true)}
                  />
                  <Label htmlFor="organic-produce">
                    Use organic for EWG's 'Dirty Dozen' produce
                  </Label>
                </div>
                
                <div className="flex justify-end">
                  <Button 
                    onClick={handleGenerateGroceryList}
                    disabled={generatingGroceryList || !groceryListDateRange}
                  >
                    {generatingGroceryList ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        Generate Grocery List
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold">{groceryList.name}</h3>
                
                {groceryList.items.map((category: any, index: number) => (
                  <div key={index} className="space-y-2">
                    <h4 className="font-medium">{category.category}</h4>
                    <ul className="space-y-1">
                      {category.items.map((item: any, itemIndex: number) => (
                        <li key={itemIndex} className="flex items-center space-x-2">
                          <Checkbox id={`item-${index}-${itemIndex}`} />
                          <Label htmlFor={`item-${index}-${itemIndex}`} className="cursor-pointer">
                            {item.amount} {item.unit} {item.name}
                            {item.organic && <span className="ml-1 text-success">(Organic)</span>}
                          </Label>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
                
                <div className="flex justify-between">
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setGroceryList(null);
                    }}
                  >
                    Back
                  </Button>
                  
                  <Button 
                    onClick={() => {
                      setShowGroceryListModal(false);
                      router.push('/grocery-lists');
                    }}
                  >
                    View All Grocery Lists
                  </Button>
                </div>
              </div>
            )}
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
          <p className="mt-4 text-text-secondary">Loading your meal calendar...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-2 text-primary">Meal Calendar</h1>
      <p className="text-text-secondary mb-8">
        Plan your meals for the week and generate grocery lists
      </p>
      
      {/* Calendar Navigation */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={goToPreviousWeek}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous Week
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={goToCurrentWeek}
          >
            Today
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={goToNextWeek}
          >
            Next Week
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
        
        <div>
          <Button 
            variant="outline"
            onClick={handleOpenGroceryListModal}
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            Generate Grocery List
          </Button>
        </div>
      </div>
      
      {/* Calendar */}
      <div className="overflow-x-auto">
        <div className="min-w-[768px]">
          {/* Calendar Header */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {weekDates.map((date, index) => (
              <div 
                key={index} 
                className={`text-center p-2 font-medium ${isToday(date) ? 'bg-primary/10 rounded-md' : ''}`}
              >
                <div className="text-sm text-text-secondary">
                  {format(date, 'EEE')}
                </div>
                <div className={`text-lg ${isToday(date) ? 'text-primary' : ''}`}>
                  {format(date, 'd')}
                </div>
              </div>
            ))}
          </div>
          
          {/* Calendar Body */}
          <div className="grid grid-cols-7 gap-2">
            {weekDates.map((date, dateIndex) => {
              const dailyTotals = getDailyTotals(date);
              const fructoseLimit = profile.has_chronic_condition ? 15 : 25;
              const fructosePercentage = (dailyTotals.fructose / fructoseLimit) * 100;
              let fructoseClass = 'text-success';
              
              if (fructosePercentage > 90) {
                fructoseClass = 'text-error';
              } else if (fructosePercentage > 70) {
                fructoseClass = 'text-accent-dark';
              }
              
              // Parse omega ratio
              const omegaRatioParts = dailyTotals.omegaRatio.split(':');
              const omegaRatioValue = parseFloat(omegaRatioParts[1]);
              let omegaClass = 'text-success';
              
              if (omegaRatioValue < 1.5 || omegaRatioValue > 2.9) {
                omegaClass = 'text-error';
              }
              
              return (
                <div 
                  key={dateIndex} 
                  className={`calendar-day ${isToday(date) ? 'calendar-day-current' : ''}`}
                >
                  {/* Daily totals */}
                  <div className="flex justify-between text-xs mb-2">
                    <span className={fructoseClass}>
                      Fructose: {dailyTotals.fructose.toFixed(1)}g
                    </span>
                    <span className={omegaClass}>
                      Ω: {dailyTotals.omegaRatio}
                    </span>
                  </div>
                  
                  {/* Meal slots */}
                  <div className="space-y-1">
                    {renderMealSlot(date, 'breakfast', 'Breakfast')}
                    {renderMealSlot(date, 'lunch', 'Lunch')}
                    {renderMealSlot(date, 'dinner', 'Dinner')}
                    {renderMealSlot(date, 'snack1', 'Snack 1')}
                    {renderMealSlot(date, 'snack2', 'Snack 2')}
                    {renderMealSlot(date, 'dessert', 'Dessert')}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* Add Meal Modal */}
      {renderAddMealModal()}
      
      {/* Grocery List Modal */}
      {renderGroceryListModal()}
      
      {/* Moving Meal Indicator */}
      {mealBeingMoved && (
        <div className="fixed bottom-4 right-4 bg-primary text-white p-4 rounded-md shadow-lg">
          <div className="flex items-center space-x-2">
            <span>Moving: {mealBeingMoved.meal.name}</span>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-white hover:bg-primary-dark"
              onClick={handleCancelMealMove}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
