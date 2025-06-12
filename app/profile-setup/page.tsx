'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, ChevronRight, Check, AlertCircle } from 'lucide-react';
import { countries } from '@/lib/constants';

// Define the steps in the profile setup process
const STEPS = [
  'Basic Information',
  'Health Status',
  'Medical Information',
  'Dietary Preferences',
  'Additional Settings',
  'Review & Submit'
];

export default function ProfileSetupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createBrowserClient();
  
  // State for multi-step form
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    // Basic Information (Step 1)
    name: '',
    date_of_birth: '',
    age: 0,
    sex: 'male' as 'male' | 'female' | 'other',
    country: 'Canada',
    weight: 70,
    weight_unit: 'kg' as 'kg' | 'lbs',
    wake_up_time: '07:00',
    
    // Health Status (Step 2)
    has_chronic_condition: false,
    health_conditions: [] as string[],
    iron_levels: 'normal' as 'normal' | 'high' | 'low',
    
    // Medical Information (Step 3)
    vitamins_supplements: [] as { name: string; amount: string; unit: string }[],
    medications: [] as { name: string; dose: string; rxnorm_id?: string }[],
    medical_tests: {
      fasting_blood_insulin: undefined as number | undefined,
      a1c: undefined as number | undefined,
      blood_pressure: undefined as string | undefined,
      cholesterol_levels: {
        total: undefined as number | undefined,
        ldl: undefined as number | undefined,
        hdl: undefined as number | undefined,
        triglycerides: undefined as number | undefined,
      },
      bone_density: undefined as number | undefined,
      iron: undefined as number | undefined,
      crp: undefined as number | undefined,
      uric_acid: undefined as number | undefined,
      vitamin_d: undefined as number | undefined,
      cpk: undefined as number | undefined,
    },
    
    // Dietary Preferences (Step 4)
    dietary_preferences: [] as string[],
    food_allergies: [] as string[],
    dietary_preset: '2 Rule' as '2 Rule' | 'Keto + 2 Rule' | 'Mediterranean + 2 Rule' | 'Paleo + 2 Rule' | 'Carnivore + 2 Rule',
    
    // Additional Settings (Step 5)
    omega3_supplement: {
      takes_supplement: false,
      epa_mg: 0,
      dha_mg: 0,
      ala_mg: 0,
    },
    buy_organic: false,
    weekly_grocery_budget: undefined as number | undefined,
  });
  
  // Form validation state
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Temp state for multi-select inputs
  const [newHealthCondition, setNewHealthCondition] = useState('');
  const [newVitamin, setNewVitamin] = useState({ name: '', amount: '', unit: '' });
  const [newMedication, setNewMedication] = useState({ name: '', dose: '', rxnorm_id: '' });
  const [searchMedication, setSearchMedication] = useState('');
  const [medicationResults, setMedicationResults] = useState<Array<{ rxcui: string, name: string }>>([]);
  const [isSearchingMedication, setIsSearchingMedication] = useState(false);
  const [otherAllergy, setOtherAllergy] = useState('');
  const [otherDietaryPreference, setOtherDietaryPreference] = useState('');
  
  // Dietary preferences and allergies options
  const dietaryPreferenceOptions = [
    'Dairy free', 'Gluten free', 'Vegetarian', 'Vegan', 'Pescatarian', 
    'No pork', 'FODMAP', 'No seafood', 'No beef', 'Other'
  ];
  
  const allergyOptions = [
    'Milk', 'Eggs', 'Peanuts', 'Tree nuts', 'Soy', 'Wheat', 'Fish', 
    'Shellfish', 'Sesame', 'Gluten', 'Corn', 'Oats', 'Strawberries', 
    'Tomatoes', 'Citrus fruits', 'Other'
  ];
  
  // Get user ID on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        setUserId(session.user.id);
        
        // Check if user already has profile data
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        if (data) {
          // Pre-fill form with existing data
          setFormData(prevData => ({
            ...prevData,
            ...data,
          }));
        }
      } else {
        // Redirect to login if not authenticated
        toast({
          title: "Authentication Required",
          description: "Please log in to set up your profile.",
          variant: "destructive",
        });
        router.push('/');
      }
    };
    
    fetchUserData();
  }, [supabase, router, toast]);
  
  // Calculate age from date of birth
  useEffect(() => {
    if (formData.date_of_birth) {
      const birthDate = new Date(formData.date_of_birth);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      setFormData(prev => ({ ...prev, age }));
    }
  }, [formData.date_of_birth]);
  
  // Handle RxNorm API search for medications
  const searchRxNormMedications = async (query: string) => {
    if (!query || query.length < 3) return;
    
    setIsSearchingMedication(true);
    try {
      // Note: In a real implementation, this would call your backend API which would then call RxNorm
      // For now, we'll simulate the API call
      const response = await fetch(`/api/rxnorm/search?query=${encodeURIComponent(query)}`);
      const data = await response.json();
      
      if (data.results) {
        setMedicationResults(data.results);
      }
    } catch (error) {
      console.error('Error searching medications:', error);
      toast({
        title: "Search Error",
        description: "Failed to search medications. Please try again or enter manually.",
        variant: "destructive",
      });
    } finally {
      setIsSearchingMedication(false);
    }
  };
  
  // Handle form input changes
  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for this field if it exists
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };
  
  // Handle nested object changes
  const handleNestedChange = (parent: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent as keyof typeof prev],
        [field]: value
      }
    }));
  };
  
  // Handle deeply nested object changes (for medical tests)
  const handleDeepNestedChange = (parent: string, subParent: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent as keyof typeof prev],
        [subParent]: {
          ...((prev[parent as keyof typeof prev] as any)[subParent]),
          [field]: value
        }
      }
    }));
  };
  
  // Add health condition
  const addHealthCondition = () => {
    if (newHealthCondition.trim()) {
      setFormData(prev => ({
        ...prev,
        health_conditions: [...(prev.health_conditions || []), newHealthCondition.trim()]
      }));
      setNewHealthCondition('');
    }
  };
  
  // Remove health condition
  const removeHealthCondition = (index: number) => {
    setFormData(prev => ({
      ...prev,
      health_conditions: prev.health_conditions.filter((_, i) => i !== index)
    }));
  };
  
  // Add vitamin/supplement
  const addVitamin = () => {
    if (newVitamin.name.trim() && newVitamin.amount.trim() && newVitamin.unit.trim()) {
      setFormData(prev => ({
        ...prev,
        vitamins_supplements: [...(prev.vitamins_supplements || []), { ...newVitamin }]
      }));
      setNewVitamin({ name: '', amount: '', unit: '' });
    }
  };
  
  // Remove vitamin/supplement
  const removeVitamin = (index: number) => {
    setFormData(prev => ({
      ...prev,
      vitamins_supplements: prev.vitamins_supplements.filter((_, i) => i !== index)
    }));
  };
  
  // Add medication
  const addMedication = () => {
    if (newMedication.name.trim() && newMedication.dose.trim()) {
      setFormData(prev => ({
        ...prev,
        medications: [...(prev.medications || []), { 
          name: newMedication.name.trim(), 
          dose: newMedication.dose.trim(),
          rxnorm_id: newMedication.rxnorm_id || undefined
        }]
      }));
      setNewMedication({ name: '', dose: '', rxnorm_id: '' });
      setSearchMedication('');
      setMedicationResults([]);
    }
  };
  
  // Remove medication
  const removeMedication = (index: number) => {
    setFormData(prev => ({
      ...prev,
      medications: prev.medications.filter((_, i) => i !== index)
    }));
  };
  
  // Toggle dietary preference
  const toggleDietaryPreference = (preference: string) => {
    setFormData(prev => {
      const currentPreferences = [...prev.dietary_preferences];
      
      if (currentPreferences.includes(preference)) {
        return {
          ...prev,
          dietary_preferences: currentPreferences.filter(p => p !== preference)
        };
      } else {
        return {
          ...prev,
          dietary_preferences: [...currentPreferences, preference]
        };
      }
    });
  };
  
  // Add other dietary preference
  const addOtherDietaryPreference = () => {
    if (otherDietaryPreference.trim()) {
      setFormData(prev => ({
        ...prev,
        dietary_preferences: [...prev.dietary_preferences, otherDietaryPreference.trim()]
      }));
      setOtherDietaryPreference('');
    }
  };
  
  // Toggle food allergy
  const toggleFoodAllergy = (allergy: string) => {
    setFormData(prev => {
      const currentAllergies = [...prev.food_allergies];
      
      if (currentAllergies.includes(allergy)) {
        return {
          ...prev,
          food_allergies: currentAllergies.filter(a => a !== allergy)
        };
      } else {
        return {
          ...prev,
          food_allergies: [...currentAllergies, allergy]
        };
      }
    });
  };
  
  // Add other food allergy
  const addOtherFoodAllergy = () => {
    if (otherAllergy.trim()) {
      setFormData(prev => ({
        ...prev,
        food_allergies: [...prev.food_allergies, otherAllergy.trim()]
      }));
      setOtherAllergy('');
    }
  };
  
  // Validate current step
  const validateCurrentStep = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Validate based on current step
    if (currentStep === 0) { // Basic Information
      if (!formData.name) newErrors.name = 'Name is required';
      if (!formData.date_of_birth) newErrors.date_of_birth = 'Date of birth is required';
      if (!formData.sex) newErrors.sex = 'Sex is required';
      if (!formData.country) newErrors.country = 'Country is required';
      if (!formData.weight || formData.weight <= 0) newErrors.weight = 'Valid weight is required';
      if (!formData.wake_up_time) newErrors.wake_up_time = 'Wake-up time is required';
    }
    else if (currentStep === 1) { // Health Status
      // Iron levels are required
      if (!formData.iron_levels) newErrors.iron_levels = 'Iron level selection is required';
    }
    // Other steps don't have required fields
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle next step
  const handleNext = () => {
    if (validateCurrentStep()) {
      if (currentStep < STEPS.length - 1) {
        setCurrentStep(currentStep + 1);
        window.scrollTo(0, 0);
      }
    }
  };
  
  // Handle previous step
  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      window.scrollTo(0, 0);
    }
  };
  
  // Handle form submission
  const handleSubmit = async () => {
    if (!validateCurrentStep()) return;
    
    setIsLoading(true);
    
    try {
      if (!userId) {
        throw new Error('User ID not found');
      }
      
      // Save profile data to Supabase
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          ...formData,
          updated_at: new Date().toISOString(),
        });
      
      if (error) throw error;
      
      toast({
        title: "Profile Saved",
        description: "Your profile has been successfully set up.",
      });
      
      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Error saving profile:', error);
      toast({
        title: "Error",
        description: "Failed to save your profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Calculate progress percentage
  const progressPercentage = ((currentStep + 1) / STEPS.length) * 100;
  
  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl text-center text-primary">Profile Setup</CardTitle>
            <CardDescription className="text-center">
              Tell us about yourself so we can personalize your experience
            </CardDescription>
            
            {/* Progress indicator */}
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-xs text-text-secondary">
                <span>Step {currentStep + 1} of {STEPS.length}</span>
                <span>{STEPS[currentStep]}</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </div>
          </CardHeader>
          
          <CardContent className="pt-6">
            {/* Step 1: Basic Information */}
            {currentStep === 0 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Name <span className="text-error">*</span></Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Your full name"
                    className={errors.name ? "border-error" : ""}
                  />
                  {errors.name && <p className="text-sm text-error">{errors.name}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="dob">Date of Birth <span className="text-error">*</span></Label>
                  <Input
                    id="dob"
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    className={errors.date_of_birth ? "border-error" : ""}
                  />
                  {errors.date_of_birth && <p className="text-sm text-error">{errors.date_of_birth}</p>}
                  {formData.age > 0 && (
                    <p className="text-sm text-text-secondary">Age: {formData.age} years</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label>Sex <span className="text-error">*</span></Label>
                  <RadioGroup 
                    value={formData.sex} 
                    onValueChange={(value) => handleInputChange('sex', value)}
                    className="flex space-x-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="male" id="male" />
                      <Label htmlFor="male">Male</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="female" id="female" />
                      <Label htmlFor="female">Female</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="other" id="other" />
                      <Label htmlFor="other">Other</Label>
                    </div>
                  </RadioGroup>
                  {errors.sex && <p className="text-sm text-error">{errors.sex}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="country">Country of Residence <span className="text-error">*</span></Label>
                  <Select 
                    value={formData.country} 
                    onValueChange={(value) => handleInputChange('country', value)}
                  >
                    <SelectTrigger className={errors.country ? "border-error" : ""}>
                      <SelectValue placeholder="Select your country" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country} value={country}>
                          {country}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.country && <p className="text-sm text-error">{errors.country}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="weight">Body Weight <span className="text-error">*</span></Label>
                  <div className="flex space-x-2">
                    <Input
                      id="weight"
                      type="number"
                      value={formData.weight || ''}
                      onChange={(e) => handleInputChange('weight', parseFloat(e.target.value) || 0)}
                      min="1"
                      className={`flex-1 ${errors.weight ? "border-error" : ""}`}
                    />
                    <Select 
                      value={formData.weight_unit} 
                      onValueChange={(value: 'kg' | 'lbs') => handleInputChange('weight_unit', value)}
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kg">kg</SelectItem>
                        <SelectItem value="lbs">lbs</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {errors.weight && <p className="text-sm text-error">{errors.weight}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="wake-up-time">Typical Wake-up Time <span className="text-error">*</span></Label>
                  <Input
                    id="wake-up-time"
                    type="time"
                    value={formData.wake_up_time}
                    onChange={(e) => handleInputChange('wake_up_time', e.target.value)}
                    className={errors.wake_up_time ? "border-error" : ""}
                  />
                  {errors.wake_up_time && <p className="text-sm text-error">{errors.wake_up_time}</p>}
                </div>
              </div>
            )}
            
            {/* Step 2: Health Status */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="chronic-condition" 
                      checked={formData.has_chronic_condition}
                      onCheckedChange={(checked) => handleInputChange('has_chronic_condition', checked === true)}
                    />
                    <Label htmlFor="chronic-condition">
                      Do you have a chronic health condition?
                    </Label>
                  </div>
                  <p className="text-sm text-text-secondary">
                    This affects your daily fructose limit (15g with condition, 25g without)
                  </p>
                </div>
                
                {formData.has_chronic_condition && (
                  <div className="space-y-2">
                    <Label>Please specify your health conditions:</Label>
                    
                    <div className="flex space-x-2">
                      <Input
                        value={newHealthCondition}
                        onChange={(e) => setNewHealthCondition(e.target.value)}
                        placeholder="Enter health condition"
                        className="flex-1"
                      />
                      <Button 
                        type="button" 
                        onClick={addHealthCondition}
                        disabled={!newHealthCondition.trim()}
                      >
                        Add
                      </Button>
                    </div>
                    
                    {formData.health_conditions && formData.health_conditions.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm font-medium mb-2">Your health conditions:</p>
                        <ul className="space-y-1">
                          {formData.health_conditions.map((condition, index) => (
                            <li key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                              <span>{condition}</span>
                              <Button 
                                type="button" 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => removeHealthCondition(index)}
                              >
                                Remove
                              </Button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label>Iron Levels <span className="text-error">*</span></Label>
                  <RadioGroup 
                    value={formData.iron_levels} 
                    onValueChange={(value: 'normal' | 'high' | 'low') => handleInputChange('iron_levels', value)}
                    className="flex space-x-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="normal" id="iron-normal" />
                      <Label htmlFor="iron-normal">Normal</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="high" id="iron-high" />
                      <Label htmlFor="iron-high">High</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="low" id="iron-low" />
                      <Label htmlFor="iron-low">Low</Label>
                    </div>
                  </RadioGroup>
                  {errors.iron_levels && <p className="text-sm text-error">{errors.iron_levels}</p>}
                </div>
              </div>
            )}
            
            {/* Step 3: Medical Information */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label>Current Vitamins & Supplements</Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <Input
                      value={newVitamin.name}
                      onChange={(e) => setNewVitamin({...newVitamin, name: e.target.value})}
                      placeholder="Name"
                      className="col-span-1"
                    />
                    <Input
                      value={newVitamin.amount}
                      onChange={(e) => setNewVitamin({...newVitamin, amount: e.target.value})}
                      placeholder="Amount"
                      className="col-span-1"
                    />
                    <div className="flex space-x-2">
                      <Input
                        value={newVitamin.unit}
                        onChange={(e) => setNewVitamin({...newVitamin, unit: e.target.value})}
                        placeholder="Unit"
                        className="flex-1"
                      />
                      <Button 
                        type="button" 
                        onClick={addVitamin}
                        disabled={!newVitamin.name.trim() || !newVitamin.amount.trim() || !newVitamin.unit.trim()}
                      >
                        Add
                      </Button>
                    </div>
                  </div>
                  
                  {formData.vitamins_supplements && formData.vitamins_supplements.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm font-medium mb-2">Your vitamins & supplements:</p>
                      <div className="space-y-1">
                        {formData.vitamins_supplements.map((vitamin, index) => (
                          <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                            <span>{vitamin.name} - {vitamin.amount} {vitamin.unit}</span>
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => removeVitamin(index)}
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label>Current Medications</Label>
                  <div className="space-y-2">
                    <div className="flex space-x-2">
                      <Input
                        value={searchMedication}
                        onChange={(e) => {
                          setSearchMedication(e.target.value);
                          if (e.target.value.length >= 3) {
                            searchRxNormMedications(e.target.value);
                          }
                        }}
                        placeholder="Search medication name"
                        className="flex-1"
                      />
                    </div>
                    
                    {isSearchingMedication && (
                      <p className="text-sm text-text-secondary">Searching medications...</p>
                    )}
                    
                    {medicationResults.length > 0 && (
                      <div className="max-h-40 overflow-y-auto border rounded-md p-2">
                        {medicationResults.map((med) => (
                          <div 
                            key={med.rxcui}
                            className="p-2 hover:bg-gray-100 cursor-pointer rounded-md"
                            onClick={() => {
                              setNewMedication({
                                name: med.name,
                                dose: '',
                                rxnorm_id: med.rxcui
                              });
                              setSearchMedication('');
                              setMedicationResults([]);
                            }}
                          >
                            {med.name}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <Input
                        value={newMedication.name}
                        onChange={(e) => setNewMedication({...newMedication, name: e.target.value})}
                        placeholder="Medication name"
                      />
                      <div className="flex space-x-2">
                        <Input
                          value={newMedication.dose}
                          onChange={(e) => setNewMedication({...newMedication, dose: e.target.value})}
                          placeholder="Dose"
                          className="flex-1"
                        />
                        <Button 
                          type="button" 
                          onClick={addMedication}
                          disabled={!newMedication.name.trim() || !newMedication.dose.trim()}
                        >
                          Add
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  {formData.medications && formData.medications.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm font-medium mb-2">Your medications:</p>
                      <div className="space-y-1">
                        {formData.medications.map((medication, index) => (
                          <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                            <span>{medication.name} - {medication.dose}</span>
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => removeMedication(index)}
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="space-y-4">
                  <Label>Medical Test Results (Optional)</Label>
                  <p className="text-sm text-text-secondary">
                    Enter any recent medical test results you have available
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fasting-insulin">Fasting Blood Insulin</Label>
                      <Input
                        id="fasting-insulin"
                        type="number"
                        step="0.01"
                        value={formData.medical_tests.fasting_blood_insulin || ''}
                        onChange={(e) => handleNestedChange('medical_tests', 'fasting_blood_insulin', e.target.value ? parseFloat(e.target.value) : undefined)}
                        placeholder="μIU/mL"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="a1c">A1c</Label>
                      <Input
                        id="a1c"
                        type="number"
                        step="0.1"
                        value={formData.medical_tests.a1c || ''}
                        onChange={(e) => handleNestedChange('medical_tests', 'a1c', e.target.value ? parseFloat(e.target.value) : undefined)}
                        placeholder="%"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="blood-pressure">Blood Pressure</Label>
                      <Input
                        id="blood-pressure"
                        value={formData.medical_tests.blood_pressure || ''}
                        onChange={(e) => handleNestedChange('medical_tests', 'blood_pressure', e.target.value || undefined)}
                        placeholder="e.g. 120/80"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="iron">Iron</Label>
                      <Input
                        id="iron"
                        type="number"
                        step="0.01"
                        value={formData.medical_tests.iron || ''}
                        onChange={(e) => handleNestedChange('medical_tests', 'iron', e.target.value ? parseFloat(e.target.value) : undefined)}
                        placeholder="μg/dL"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="crp">CRP</Label>
                      <Input
                        id="crp"
                        type="number"
                        step="0.01"
                        value={formData.medical_tests.crp || ''}
                        onChange={(e) => handleNestedChange('medical_tests', 'crp', e.target.value ? parseFloat(e.target.value) : undefined)}
                        placeholder="mg/L"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="vitamin-d">Vitamin D</Label>
                      <Input
                        id="vitamin-d"
                        type="number"
                        step="0.01"
                        value={formData.medical_tests.vitamin_d || ''}
                        onChange={(e) => handleNestedChange('medical_tests', 'vitamin_d', e.target.value ? parseFloat(e.target.value) : undefined)}
                        placeholder="ng/mL"
                      />
                    </div>
                  </div>
                  
                  <div className="pt-2">
                    <Label className="mb-2 block">Cholesterol Levels</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="total-cholesterol">Total Cholesterol</Label>
                        <Input
                          id="total-cholesterol"
                          type="number"
                          step="0.01"
                          value={formData.medical_tests.cholesterol_levels.total || ''}
                          onChange={(e) => handleDeepNestedChange('medical_tests', 'cholesterol_levels', 'total', e.target.value ? parseFloat(e.target.value) : undefined)}
                          placeholder="mg/dL"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="ldl">LDL</Label>
                        <Input
                          id="ldl"
                          type="number"
                          step="0.01"
                          value={formData.medical_tests.cholesterol_levels.ldl || ''}
                          onChange={(e) => handleDeepNestedChange('medical_tests', 'cholesterol_levels', 'ldl', e.target.value ? parseFloat(e.target.value) : undefined)}
                          placeholder="mg/dL"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="hdl">HDL</Label>
                        <Input
                          id="hdl"
                          type="number"
                          step="0.01"
                          value={formData.medical_tests.cholesterol_levels.hdl || ''}
                          onChange={(e) => handleDeepNestedChange('medical_tests', 'cholesterol_levels', 'hdl', e.target.value ? parseFloat(e.target.value) : undefined)}
                          placeholder="mg/dL"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="triglycerides">Triglycerides</Label>
                        <Input
                          id="triglycerides"
                          type="number"
                          step="0.01"
                          value={formData.medical_tests.cholesterol_levels.triglycerides || ''}
                          onChange={(e) => handleDeepNestedChange('medical_tests', 'cholesterol_levels', 'triglycerides', e.target.value ? parseFloat(e.target.value) : undefined)}
                          placeholder="mg/dL"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Step 4: Dietary Preferences */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label>Dietary Preferences (Select all that apply)</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {dietaryPreferenceOptions.map((preference) => (
                      <div key={preference} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`preference-${preference}`} 
                          checked={formData.dietary_preferences.includes(preference)}
                          onCheckedChange={() => toggleDietaryPreference(preference)}
                        />
                        <Label htmlFor={`preference-${preference}`}>{preference}</Label>
                      </div>
                    ))}
                  </div>
                  
                  {formData.dietary_preferences.includes('Other') && (
                    <div className="flex space-x-2 mt-2">
                      <Input
                        value={otherDietaryPreference}
                        onChange={(e) => setOtherDietaryPreference(e.target.value)}
                        placeholder="Enter other dietary preference"
                        className="flex-1"
                      />
                      <Button 
                        type="button" 
                        onClick={addOtherDietaryPreference}
                        disabled={!otherDietaryPreference.trim()}
                      >
                        Add
                      </Button>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label>Food Allergies (Select all that apply)</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {allergyOptions.map((allergy) => (
                      <div key={allergy} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`allergy-${allergy}`} 
                          checked={formData.food_allergies.includes(allergy)}
                          onCheckedChange={() => toggleFoodAllergy(allergy)}
                        />
                        <Label htmlFor={`allergy-${allergy}`}>{allergy}</Label>
                      </div>
                    ))}
                  </div>
                  
                  {formData.food_allergies.includes('Other') && (
                    <div className="flex space-x-2 mt-2">
                      <Input
                        value={otherAllergy}
                        onChange={(e) => setOtherAllergy(e.target.value)}
                        placeholder="Enter other food allergy"
                        className="flex-1"
                      />
                      <Button 
                        type="button" 
                        onClick={addOtherFoodAllergy}
                        disabled={!otherAllergy.trim()}
                      >
                        Add
                      </Button>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label>Dietary Preset</Label>
                  <RadioGroup 
                    value={formData.dietary_preset} 
                    onValueChange={(value: any) => handleInputChange('dietary_preset', value)}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="2 Rule" id="preset-2rule" />
                        <Label htmlFor="preset-2rule">2 Rule (Default)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Keto + 2 Rule" id="preset-keto" />
                        <Label htmlFor="preset-keto">Keto + 2 Rule</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Mediterranean + 2 Rule" id="preset-mediterranean" />
                        <Label htmlFor="preset-mediterranean">Mediterranean + 2 Rule</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Paleo + 2 Rule" id="preset-paleo" />
                        <Label htmlFor="preset-paleo">Paleo + 2 Rule</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Carnivore + 2 Rule" id="preset-carnivore" />
                        <Label htmlFor="preset-carnivore">Carnivore + 2 Rule</Label>
                      </div>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            )}
            
            {/* Step 5: Additional Settings */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="omega3-supplement" 
                      checked={formData.omega3_supplement.takes_supplement}
                      onCheckedChange={(checked) => handleNestedChange('omega3_supplement', 'takes_supplement', checked === true)}
                    />
                    <Label htmlFor="omega3-supplement">
                      Do you take an Omega-3 supplement?
                    </Label>
                  </div>
                  <p className="text-sm text-text-secondary">
                    This will be used to calculate your daily/weekly omega ratio
                  </p>
                </div>
                
                {formData.omega3_supplement.takes_supplement && (
                  <div className="space-y-4 pl-6">
                    <div className="space-y-2">
                      <Label htmlFor="epa">EPA (mg per day)</Label>
                      <Input
                        id="epa"
                        type="number"
                        min="0"
                        value={formData.omega3_supplement.epa_mg || ''}
                        onChange={(e) => handleNestedChange('omega3_supplement', 'epa_mg', parseInt(e.target.value) || 0)}
                        placeholder="EPA in mg"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="dha">DHA (mg per day)</Label>
                      <Input
                        id="dha"
                        type="number"
                        min="0"
                        value={formData.omega3_supplement.dha_mg || ''}
                        onChange={(e) => handleNestedChange('omega3_supplement', 'dha_mg', parseInt(e.target.value) || 0)}
                        placeholder="DHA in mg"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="ala">ALA (mg per day)</Label>
                      <Input
                        id="ala"
                        type="number"
                        min="0"
                        value={formData.omega3_supplement.ala_mg || ''}
                        onChange={(e) => handleNestedChange('omega3_supplement', 'ala_mg', parseInt(e.target.value) || 0)}
                        placeholder="ALA in mg"
                      />
                    </div>
                  </div>
                )}
                
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="buy-organic" 
                      checked={formData.buy_organic}
                      onCheckedChange={(checked) => handleInputChange('buy_organic', checked === true)}
                    />
                    <Label htmlFor="buy-organic">
                      Are you interested in EWG's 'Dirty Dozen' (Foods to buy organic)?
                    </Label>
                  </div>
                  <p className="text-sm text-text-secondary">
                    This will label certain produce as organic in your grocery lists
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="grocery-budget">How much money do you typically spend on groceries in 1 week?</Label>
                  <div className="flex items-center space-x-2">
                    <span className="text-text-secondary">$</span>
                    <Input
                      id="grocery-budget"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.weekly_grocery_budget || ''}
                      onChange={(e) => handleInputChange('weekly_grocery_budget', e.target.value ? parseFloat(e.target.value) : undefined)}
                      placeholder="Weekly grocery budget"
                    />
                  </div>
                </div>
              </div>
            )}
            
            {/* Step 6: Review & Submit */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-primary">Profile Setup Complete!</h3>
                  <p className="text-text-secondary">
                    Thank you for providing your information. Your profile is ready to be saved.
                  </p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-md">
                  <h4 className="font-medium mb-2">Basic Information</h4>
                  <ul className="space-y-1 text-sm">
                    <li><span className="font-medium">Name:</span> {formData.name}</li>
                    <li><span className="font-medium">Age:</span> {formData.age} years</li>
                    <li><span className="font-medium">Sex:</span> {formData.sex}</li>
                    <li><span className="font-medium">Country:</span> {formData.country}</li>
                    <li><span className="font-medium">Weight:</span> {formData.weight} {formData.weight_unit}</li>
                    <li><span className="font-medium">Wake-up time:</span> {formData.wake_up_time}</li>
                  </ul>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-md">
                  <h4 className="font-medium mb-2">Health Status</h4>
                  <ul className="space-y-1 text-sm">
                    <li>
                      <span className="font-medium">Chronic health condition:</span> {formData.has_chronic_condition ? 'Yes' : 'No'}
                      {formData.has_chronic_condition && formData.health_conditions.length > 0 && (
                        <ul className="pl-4 mt-1">
                          {formData.health_conditions.map((condition, i) => (
                            <li key={i}>• {condition}</li>
                          ))}
                        </ul>
                      )}
                    </li>
                    <li><span className="font-medium">Iron levels:</span> {formData.iron_levels}</li>
                  </ul>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-md">
                  <h4 className="font-medium mb-2">Dietary Information</h4>
                  <ul className="space-y-1 text-sm">
                    <li>
                      <span className="font-medium">Dietary preset:</span> {formData.dietary_preset}
                    </li>
                    <li>
                      <span className="font-medium">Dietary preferences:</span> {formData.dietary_preferences.length > 0 ? formData.dietary_preferences.join(', ') : 'None'}
                    </li>
                    <li>
                      <span className="font-medium">Food allergies:</span> {formData.food_allergies.length > 0 ? formData.food_allergies.join(', ') : 'None'}
                    </li>
                    <li>
                      <span className="font-medium">Omega-3 supplement:</span> {formData.omega3_supplement.takes_supplement ? 'Yes' : 'No'}
                      {formData.omega3_supplement.takes_supplement && (
                        <ul className="pl-4 mt-1">
                          <li>EPA: {formData.omega3_supplement.epa_mg} mg</li>
                          <li>DHA: {formData.omega3_supplement.dha_mg} mg</li>
                          <li>ALA: {formData.omega3_supplement.ala_mg} mg</li>
                        </ul>
                      )}
                    </li>
                    <li>
                      <span className="font-medium">Buy organic (Dirty Dozen):</span> {formData.buy_organic ? 'Yes' : 'No'}
                    </li>
                  </ul>
                </div>
                
                <div className="text-center text-sm text-text-secondary">
                  <p>You can always update your profile information later from the Profile Settings page.</p>
                </div>
              </div>
            )}
          </CardContent>
          
          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0 || isLoading}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            
            {currentStep < STEPS.length - 1 ? (
              <Button
                type="button"
                onClick={handleNext}
                disabled={isLoading}
              >
                Next
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading}
                className="bg-primary hover:bg-primary-dark"
              >
                {isLoading ? (
                  <>Processing...</>
                ) : (
                  <>
                    Save Profile
                    <Check className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
