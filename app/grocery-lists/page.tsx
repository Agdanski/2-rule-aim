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
import { format, parseISO, isValid } from 'date-fns';
import { dirtyDozenFoods } from '@/lib/constants';
import { 
  AlertCircle, 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  Loader2, 
  Plus,
  Printer,
  Search,
  ShoppingCart,
  Trash2,
  X
} from 'lucide-react';

export default function GroceryListsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createBrowserClient();
  const { isPremium } = useSubscription();
  
  // State
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [groceryLists, setGroceryLists] = useState<any[]>([]);
  const [filteredLists, setFilteredLists] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedList, setSelectedList] = useState<any | null>(null);
  const [showListDetails, setShowListDetails] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deletingListId, setDeletingListId] = useState<string | null>(null);
  const [useOrganicProduce, setUseOrganicProduce] = useState(false);
  const [groceryListDateRange, setGroceryListDateRange] = useState<{ start: Date; end: Date } | null>(null);
  const [generatingGroceryList, setGeneratingGroceryList] = useState(false);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  
  // Fetch user data and grocery lists on component mount
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
        
        // Fetch grocery lists
        await fetchGroceryLists(session.user.id);
      } catch (error) {
        console.error('Error fetching user data:', error);
        toast({
          title: "Error loading grocery lists",
          description: "Please try refreshing the page.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [supabase, router, toast]);
  
  // Fetch grocery lists for the user
  const fetchGroceryLists = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('grocery_lists')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setGroceryLists(data || []);
      setFilteredLists(data || []);
    } catch (error) {
      console.error('Error fetching grocery lists:', error);
      toast({
        title: "Error loading grocery lists",
        description: "Failed to load your grocery lists.",
        variant: "destructive",
      });
    }
  };
  
  // Filter grocery lists based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredLists(groceryLists);
    } else {
      const filtered = groceryLists.filter(list => 
        list.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredLists(filtered);
    }
  }, [searchTerm, groceryLists]);
  
  // Handle create new grocery list
  const handleCreateGroceryList = async () => {
    if (!isPremium) {
      toast({
        title: "Premium Feature",
        description: "Creating grocery lists requires a premium subscription.",
        action: (
          <Button variant="outline" size="sm" onClick={() => router.push('/pricing')}>
            Upgrade
          </Button>
        ),
      });
      return;
    }
    
    // Redirect to calendar page for creating a new grocery list
    router.push('/calendar');
  };
  
  // Handle view grocery list details
  const handleViewListDetails = (list: any) => {
    setSelectedList(list);
    
    // Initialize checked items state
    const initialCheckedState: Record<string, boolean> = {};
    list.items.forEach((category: any) => {
      category.items.forEach((item: any, index: number) => {
        const itemKey = `${category.category}-${index}`;
        initialCheckedState[itemKey] = false;
      });
    });
    setCheckedItems(initialCheckedState);
    
    setShowListDetails(true);
  };
  
  // Handle delete grocery list
  const handleDeleteGroceryList = async (listId: string) => {
    try {
      setDeletingListId(listId);
      
      const { error } = await supabase
        .from('grocery_lists')
        .delete()
        .eq('id', listId);
      
      if (error) throw error;
      
      // Update state
      setGroceryLists(groceryLists.filter(list => list.id !== listId));
      setFilteredLists(filteredLists.filter(list => list.id !== listId));
      
      toast({
        title: "Grocery List Deleted",
        description: "The grocery list has been successfully deleted.",
      });
    } catch (error: any) {
      console.error('Error deleting grocery list:', error);
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete grocery list. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeletingListId(null);
    }
  };
  
  // Handle print grocery list
  const handlePrintGroceryList = () => {
    if (!selectedList) return;
    
    // Create a printable version of the grocery list
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({
        title: "Print Error",
        description: "Unable to open print window. Please check your browser settings.",
        variant: "destructive",
      });
      return;
    }
    
    // Generate HTML for the printable grocery list
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${selectedList.name}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #4CAF50; }
          h2 { margin-top: 20px; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
          ul { list-style-type: none; padding-left: 0; }
          li { padding: 5px 0; display: flex; align-items: center; }
          .checkbox { margin-right: 10px; width: 16px; height: 16px; border: 1px solid #aaa; display: inline-block; }
          .organic { color: #4CAF50; }
          @media print {
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <h1>${selectedList.name}</h1>
        <p>Date Range: ${format(parseISO(selectedList.date_range.start_date), 'MMM d')} - ${format(parseISO(selectedList.date_range.end_date), 'MMM d, yyyy')}</p>
        
        <button onclick="window.print();" style="padding: 8px 16px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer; margin-bottom: 20px;">Print List</button>
        
        ${selectedList.items.map((category: any) => `
          <h2>${category.category}</h2>
          <ul>
            ${category.items.map((item: any) => `
              <li>
                <span class="checkbox"></span>
                ${item.amount} ${item.unit} ${item.name}
                ${item.organic ? '<span class="organic"> (Organic)</span>' : ''}
              </li>
            `).join('')}
          </ul>
        `).join('')}
      </body>
      </html>
    `;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
  };
  
  // Handle download grocery list as CSV
  const handleDownloadCSV = () => {
    if (!selectedList) return;
    
    // Create CSV content
    let csvContent = "Category,Amount,Unit,Item,Organic\n";
    
    selectedList.items.forEach((category: any) => {
      category.items.forEach((item: any) => {
        csvContent += `${category.category},${item.amount},${item.unit},${item.name},${item.organic ? 'Yes' : 'No'}\n`;
      });
    });
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${selectedList.name}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Toggle item checked state
  const toggleItemChecked = (categoryIndex: number, itemIndex: number) => {
    const category = selectedList.items[categoryIndex];
    const itemKey = `${category.category}-${itemIndex}`;
    
    setCheckedItems(prev => ({
      ...prev,
      [itemKey]: !prev[itemKey]
    }));
  };
  
  // Render grocery list details modal
  const renderListDetailsModal = () => {
    if (!showListDetails || !selectedList) return null;
    
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-bold">{selectedList.name}</h2>
                <p className="text-text-secondary">
                  {format(parseISO(selectedList.date_range.start_date), 'MMM d')} - {format(parseISO(selectedList.date_range.end_date), 'MMM d, yyyy')}
                </p>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowListDetails(false)}
              >
                ✕
              </Button>
            </div>
            
            <div className="space-y-6 max-h-[60vh] overflow-y-auto">
              {selectedList.items.map((category: any, categoryIndex: number) => (
                <div key={categoryIndex} className="space-y-2">
                  <h3 className="font-medium border-b pb-1">{category.category}</h3>
                  <ul className="space-y-1">
                    {category.items.map((item: any, itemIndex: number) => {
                      const itemKey = `${category.category}-${itemIndex}`;
                      return (
                        <li key={itemIndex} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`item-${categoryIndex}-${itemIndex}`} 
                            checked={checkedItems[itemKey] || false}
                            onCheckedChange={() => toggleItemChecked(categoryIndex, itemIndex)}
                          />
                          <Label 
                            htmlFor={`item-${categoryIndex}-${itemIndex}`} 
                            className={`cursor-pointer ${checkedItems[itemKey] ? 'line-through text-text-secondary' : ''}`}
                          >
                            {item.amount} {item.unit} {item.name}
                            {item.organic && <span className="ml-1 text-success">(Organic)</span>}
                          </Label>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
            
            <div className="flex justify-between mt-6">
              <Button 
                variant="outline"
                onClick={() => setShowListDetails(false)}
              >
                Close
              </Button>
              
              <div className="space-x-2">
                <Button 
                  variant="outline"
                  onClick={handleDownloadCSV}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download CSV
                </Button>
                
                <Button 
                  onClick={handlePrintGroceryList}
                >
                  <Printer className="mr-2 h-4 w-4" />
                  Print List
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
          <p className="mt-4 text-text-secondary">Loading your grocery lists...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-2 text-primary">Grocery Lists</h1>
      <p className="text-text-secondary mb-8">
        Manage your grocery lists generated from your meal plans
      </p>
      
      {/* Search and Actions Bar */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex space-x-2 flex-1">
          <Input
            placeholder="Search grocery lists..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1"
          />
          <Button variant="outline" onClick={() => setSearchTerm('')} disabled={!searchTerm}>
            Clear
          </Button>
        </div>
        
        <Button onClick={handleCreateGroceryList}>
          <Plus className="mr-2 h-4 w-4" />
          Create New List
        </Button>
      </div>
      
      {/* Grocery Lists */}
      {filteredLists.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          {searchTerm ? (
            <>
              <p className="text-text-secondary mb-4">No grocery lists found matching your search criteria.</p>
              <Button 
                variant="outline" 
                onClick={() => setSearchTerm('')}
              >
                Clear Search
              </Button>
            </>
          ) : (
            <>
              <p className="text-text-secondary mb-4">You don't have any grocery lists yet.</p>
              <Button 
                onClick={handleCreateGroceryList}
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                Create Your First Grocery List
              </Button>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLists.map((list) => (
            <Card key={list.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{list.name}</CardTitle>
                <CardDescription>
                  Created {format(parseISO(list.created_at), 'MMM d, yyyy')}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="pt-0">
                <p className="text-sm text-text-secondary mb-2">
                  Date Range: {format(parseISO(list.date_range.start_date), 'MMM d')} - {format(parseISO(list.date_range.end_date), 'MMM d, yyyy')}
                </p>
                
                <div className="text-sm">
                  <p>{list.items.reduce((total: number, category: any) => total + category.items.length, 0)} items in {list.items.length} categories</p>
                </div>
              </CardContent>
              
              <CardFooter className="flex justify-between pt-0">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleViewListDetails(list)}
                >
                  View List
                </Button>
                
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleDeleteGroceryList(list.id)}
                  disabled={deletingListId === list.id}
                  className="text-error"
                >
                  {deletingListId === list.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      
      {/* Quick Actions */}
      <div className="mt-8 flex flex-wrap gap-4">
        <Button variant="outline" onClick={() => router.push('/dashboard')}>
          Back to Dashboard
        </Button>
        <Button variant="outline" onClick={() => router.push('/calendar')}>
          <Calendar className="mr-2 h-4 w-4" />
          View Calendar
        </Button>
      </div>
      
      {/* List Details Modal */}
      {renderListDetailsModal()}
    </div>
  );
}
