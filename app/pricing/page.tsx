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
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, ChevronRight, Check, AlertCircle } from 'lucide-react';
import { countries, dietaryPreferenceOptions, allergyOptions, dietaryPresetOptions } from '@/lib/constants';
import { calculateAge } from '@/lib/utils';

// Define the steps in the profile settings process
const STEPS = [
  'Basic Information',
  'Health Status',
  'Medical Information',
  'Dietary Preferences',
  'Additional Settings',
  'Review & Submit'
];

export default function ProfileSettingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createBrowserClient();
  
  // State for multi-step form
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
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
  
  // Fetch user profile data on component mount
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setIsLoading(true);
        
        // Get current session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user) {
          toast({
            title: "Authentication Required",
            description: "Please log in to access your profile settings.",
            variant: "destructive",
          });
          router.push('/');
          return;
        }
        
        setUserId(session.user.id);
        
        // Fetch user profile data
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        if (error) {
          throw error;
        }
        
        if (data) {
          // Pre-fill form with existing data
          setFormData({
            ...formData,
            ...data,
            // Ensure nested objects are properly merged
            medical_tests: {
              ...formData.medical_tests,
              ...(data.medical_tests || {}),
            },
            omega3_supplement: {
              ...formData.omega3_supplement,
              ...(data.omega3_supplement || {}),
            },
            // Ensure arrays are properly initialized
            health_conditions: data.health_conditions || [],
            vitamins_supplements: data.vitamins_supplements || [],
            medications: data.medications || [],
            dietary_preferences: data.dietary_preferences || [],
            food_allergies: data.food_allergies || [],
          });
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        toast({
          title: "Error Loading Profile",
          description: "Failed to load your profile data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserProfile();
  }, [supabase, router, toast]);
  
  // Calculate age from date of birth
  useEffect(() => {
    if (formData.date_of_birth) {
      const age = calculateAge(formData.date_of_birth);
      setFormData(prev => ({ ...prev, age }));
    }
  }, [formData.date_of_birth]);
  
  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: value === '' ? undefined : Number(value) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    // Clear error for this field if it exists
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field if it exists
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
  // Handle checkbox changes
  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
  };
  
  // Handle nested object changes
  const handleNestedChange = (parent: string, child: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent as keyof typeof prev],
        [child]: value
      }
    }));
  };
  
  // Handle deeply nested object changes
  const handleDeeplyNestedChange = (parent: string, child: string, grandchild: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent as keyof typeof prev],
        [child]: {
          ...(prev[parent as keyof typeof prev] as any)[child],
          [grandchild]: value
        }
      }
    }));
  };
  
  // Add health condition
  const handleAddHealthCondition = () => {
    if (!newHealthCondition.trim()) return;
    
    if (!formData.health_conditions.includes(newHealthCondition)) {
      setFormData(prev => ({
        ...prev,
        health_conditions: [...prev.health_conditions, newHealthCondition]
      }));
    }
    
    setNewHealthCondition('');
  };
  
  // Remove health condition
  const handleRemoveHealthCondition = (condition: string) => {
    setFormData(prev => ({
      ...prev,
      health_conditions: prev.health_conditions.filter(c => c !== condition)
    }));
  };
  
  // Add vitamin/supplement
  const handleAddVitamin = () => {
    if (!newVitamin.name.trim() || !newVitamin.amount.trim() || !newVitamin.unit.trim()) return;
    
    setFormData(prev => ({
      ...prev,
      vitamins_supplements: [...prev.vitamins_supplements, { ...newVitamin }]
    }));
    
    setNewVitamin({ name: '', amount: '', unit: '' });
  };
  
  // Remove vitamin/supplement
  const handleRemoveVitamin = (index: number) => {
    setFormData(prev => ({
      ...prev,
      vitamins_supplements: prev.vitamins_supplements.filter((_, i) => i !== index)
    }));
  };
  
  // Search medications using RxNorm API
  const handleSearchMedication = async () => {
    if (!searchMedication.trim() || searchMedication.length < 3) return;
    
    try {
      setIsSearchingMedication(true);
      
      // In a real app, this would call the RxNorm API
      // For now, we'll simulate a response
      setTimeout(() => {
        setMedicationResults([
          { rxcui: '1', name: searchMedication + ' 10mg' },
          { rxcui: '2', name: searchMedication + ' 20mg' },
          { rxcui: '3', name: searchMedication + ' 50mg' },
        ]);
        setIsSearchingMedication(false);
      }, 1000);
    } catch (error) {
      console.error('Error searching medications:', error);
      setIsSearchingMedication(false);
    }
  };
  
  // Add medication
  const handleAddMedication = () => {
    if (!newMedication.name.trim() || !newMedication.dose.trim()) return;
    
    setFormData(prev => ({
      ...prev,
      medications: [...prev.medications, { ...newMedication }]
    }));
    
    setNewMedication({ name: '', dose: '', rxnorm_id: '' });
    setSearchMedication('');
    setMedicationResults([]);
  };
  
  // Remove medication
  const handleRemoveMedication = (index: number) => {
    setFormData(prev => ({
      ...prev,
      medications: prev.medications.filter((_, i) => i !== index)
    }));
  };
  
  // Handle dietary preference toggle
  const handleDietaryPreferenceChange = (preference: string, checked: boolean) => {
    if (checked) {
      if (!formData.dietary_preferences.includes(preference)) {
        setFormData(prev => ({
          ...prev,
          dietary_preferences: [...prev.dietary_preferences, preference]
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        dietary_preferences: prev.dietary_preferences.filter(p => p !== preference)
      }));
    }
  };
  
  // Add other dietary preference
  const handleAddOtherDietaryPreference = () => {
    if (!otherDietaryPreference.trim()) return;
    
    if (!formData.dietary_preferences.includes(otherDietaryPreference)) {
      setFormData(prev => ({
        ...prev,
        dietary_preferences: [...prev.dietary_preferences, otherDietaryPreference]
      }));
    }
    
    setOtherDietaryPreference('');
  };
  
  // Handle food allergy toggle
  const handleFoodAllergyChange = (allergy: string, checked: boolean) => {
    if (checked) {
      if (!formData.food_allergies.includes(allergy)) {
        setFormData(prev => ({
          ...prev,
          food_allergies: [...prev.food_allergies, allergy]
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        food_allergies: prev.food_allergies.filter(a => a !== allergy)
      }));
    }
  };
  
  // Add other food allergy
  const handleAddOtherFoodAllergy = () => {
    if (!otherAllergy.trim()) return;
    
    if (!formData.food_allergies.includes(otherAllergy)) {
      setFormData(prev => ({
        ...prev,
        food_allergies: [...prev.food_allergies, otherAllergy]
      }));
    }
    
    setOtherAllergy('');
  };
  
  // Validate current step
  const validateCurrentStep = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    switch (currentStep) {
      case 0: // Basic Information
        // Name and DOB are not modifiable, so we don't validate them
        if (!formData.sex) newErrors.sex = 'Please select your sex';
        if (!formData.country) newErrors.country = 'Please select your country';
        if (!formData.weight || formData.weight <= 0) newErrors.weight = 'Please enter a valid weight';
        if (!formData.weight_unit) newErrors.weight_unit = 'Please select a weight unit';
        if (!formData.wake_up_time) newErrors.wake_up_time = 'Please enter your typical wake-up time';
        break;
        
      case 1: // Health Status
        // No required fields in this step
        break;
        
      case 2: // Medical Information
        // No required fields in this step
        break;
        
      case 3: // Dietary Preferences
        // No required fields in this step
        break;
        
      case 4: // Additional Settings
        if (formData.omega3_supplement.takes_supplement) {
          if (!formData.omega3_supplement.epa_mg && formData.omega3_supplement.epa_mg !== 0) {
            newErrors['omega3_supplement.epa_mg'] = 'Please enter EPA amount';
          }
          if (!formData.omega3_supplement.dha_mg && formData.omega3_supplement.dha_mg !== 0) {
            newErrors['omega3_supplement.dha_mg'] = 'Please enter DHA amount';
          }
          if (!formData.omega3_supplement.ala_mg && formData.omega3_supplement.ala_mg !== 0) {
            newErrors['omega3_supplement.ala_mg'] = 'Please enter ALA amount';
          }
        }
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Navigate to next step
  const handleNextStep = () => {
    if (validateCurrentStep()) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
      window.scrollTo(0, 0);
    }
  };
  
  // Navigate to previous step
  const handlePreviousStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
    window.scrollTo(0, 0);
  };
  
  // Save profile data
  const handleSaveProfile = async () => {
    if (!validateCurrentStep()) return;
    
    try {
      setIsSaving(true);
      
      if (!userId) {
        throw new Error('User ID not found');
      }
      
      // Update profile in database
      const { error } = await supabase
        .from('profiles')
        .update({
          // Only include fields that can be modified
          sex: formData.sex,
          country: formData.country,
          weight: formData.weight,
          weight_unit: formData.weight_unit,
          wake_up_time: formData.wake_up_time,
          has_chronic_condition: formData.has_chronic_condition,
          health_conditions: formData.health_conditions,
          iron_levels: formData.iron_levels,
          vitamins_supplements: formData.vitamins_supplements,
          medications: formData.medications,
          medical_tests: formData.medical_tests,
          dietary_preferences: formData.dietary_preferences,
          food_allergies: formData.food_allergies,
          dietary_preset: formData.dietary_preset,
          omega3_supplement: formData.omega3_supplement,
          buy_organic: formData.buy_organic,
          weekly_grocery_budget: formData.weekly_grocery_budget,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
      
      if (error) throw error;
      
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
      
      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error Updating Profile",
        description: "Failed to update your profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Basic Information
        return (
          <div className="space-y-4">
            {/* Name - Read-only */}
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                disabled
                className="bg-gray-100"
              />
              <p className="text-xs text-text-secondary">Name cannot be changed after initial setup</p>
            </div>
            
            {/* Date of Birth - Read-only */}
            <div className="space-y-2">
              <Label htmlFor="date_of_birth">Date of Birth</Label>
              <Input
                id="date_of_birth"
                name="date_of_birth"
                type="date"
                value={formData.date_of_birth}
                disabled
                className="bg-gray-100"
              />
              <p className="text-xs text-text-secondary">Date of birth cannot be changed after initial setup</p>
            </div>
            
            {/* Age (calculated) */}
            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                name="age"
                type="number"
                value={formData.age}
                disabled
                className="bg-gray-100"
              />
            </div>
            
            {/* Sex */}
            <div className="space-y-2">
              <Label htmlFor="sex">Sex</Label>
              <RadioGroup
                value={formData.sex}
                onValueChange={(value) => handleSelectChange('sex', value)}
                className="flex flex-col space-y-1"
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
            
            {/* Country */}
            <div className="space-y-2">
              <Label htmlFor="country">Country of Residence</Label>
              <Select
                value={formData.country}
                onValueChange={(value) => handleSelectChange('country', value)}
              >
                <SelectTrigger id="country" className={errors.country ? 'border-error' : ''}>
                  <SelectValue placeholder="Select country" />
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
            
            {/* Weight */}
            <div className="space-y-2">
              <Label htmlFor="weight">Body Weight</Label>
              <div className="flex space-x-2">
                <Input
                  id="weight"
                  name="weight"
                  type="number"
                  value={formData.weight}
                  onChange={handleInputChange}
                  className={`flex-1 ${errors.weight ? 'border-error' : ''}`}
                />
                <Select
                  value={formData.weight_unit}
                  onValueChange={(value) => handleSelectChange('weight_unit', value as 'kg' | 'lbs')}
                >
                  <SelectTrigger id="weight_unit" className={`w-24 ${errors.weight_unit ? 'border-error' : ''}`}>
                    <SelectValue placeholder="Unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kg">kg</SelectItem>
                    <SelectItem value="lbs">lbs</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {errors.weight && <p className="text-sm text-error">{errors.weight}</p>}
              {errors.weight_unit && <p className="text-sm text-error">{errors.weight_unit}</p>}
            </div>
            
            {/* Wake-up Time */}
            <div className="space-y-2">
              <Label htmlFor="wake_up_time">Typical Wake-up Time</Label>
              <Input
                id="wake_up_time"
                name="wake_up_time"
                type="time"
                value={formData.wake_up_time}
                onChange={handleInputChange}
                className={errors.wake_up_time ? 'border-error' : ''}
              />
              {errors.wake_up_time && <p className="text-sm text-error">{errors.wake_up_time}</p>}
            </div>
          </div>
        );
        
      case 1: // Health Status
        return (
          <div className="space-y-4">
            {/* Chronic Health Condition */}
            <div className="space-y-2">
              <Label htmlFor="has_chronic_condition">Do you have a chronic health condition?</Label>
              <RadioGroup
                value={formData.has_chronic_condition ? 'yes' : 'no'}
                onValueChange={(value) => handleCheckboxChange('has_chronic_condition', value === 'yes')}
                className="flex flex-col space-y-1"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="chronic-yes" />
                  <Label htmlFor="chronic-yes">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="chronic-no" />
                  <Label htmlFor="chronic-no">No</Label>
                </div>
              </RadioGroup>
            </div>
            
            {/* Health Conditions */}
            {formData.has_chronic_condition && (
              <div className="space-y-2">
                <Label htmlFor="health_conditions">Please specify your health conditions</Label>
                <div className="space-y-2">
                  {formData.health_conditions.map((condition, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <div className="bg-gray-100 px-3 py-1 rounded-md flex-1">{condition}</div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveHealthCondition(condition)}
                      >
                        &times;
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="flex space-x-2">
                  <Input
                    id="new_health_condition"
                    value={newHealthCondition}
                    onChange={(e) => setNewHealthCondition(e.target.value)}
                    placeholder="Enter health condition"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    onClick={handleAddHealthCondition}
                    disabled={!newHealthCondition.trim()}
                  >
                    Add
                  </Button>
                </div>
                <p className="text-xs text-text-secondary">
                  <a href="#" className="text-primary hover:underline">Unsure? Click here</a>
                </p>
              </div>
            )}
            
            {/* Iron Levels */}
            <div className="space-y-2">
              <Label htmlFor="iron_levels">Iron Levels</Label>
              <RadioGroup
                value={formData.iron_levels}
                onValueChange={(value) => handleSelectChange('iron_levels', value as 'normal' | 'high' | 'low')}
                className="flex flex-col space-y-1"
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
            </div>
          </div>
        );
        
      case 2: // Medical Information
        return (
          <div className="space-y-6">
            {/* Vitamins & Supplements */}
            <div className="space-y-2">
              <Label>Current Vitamins & Supplements</Label>
              <div className="space-y-2">
                {formData.vitamins_supplements.map((vitamin, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div className="bg-gray-100 px-3 py-1 rounded-md flex-1">
                      {vitamin.name} - {vitamin.amount} {vitamin.unit}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveVitamin(index)}
                    >
                      &times;
                    </Button>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Input
                  placeholder="Name"
                  value={newVitamin.name}
                  onChange={(e) => setNewVitamin({ ...newVitamin, name: e.target.value })}
                />
                <Input
                  placeholder="Amount"
                  value={newVitamin.amount}
                  onChange={(e) => setNewVitamin({ ...newVitamin, amount: e.target.value })}
                />
                <Input
                  placeholder="Unit"
                  value={newVitamin.unit}
                  onChange={(e) => setNewVitamin({ ...newVitamin, unit: e.target.value })}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={handleAddVitamin}
                disabled={!newVitamin.name.trim() || !newVitamin.amount.trim() || !newVitamin.unit.trim()}
                className="w-full"
              >
                Add Vitamin/Supplement
              </Button>
            </div>
            
            {/* Medications */}
            <div className="space-y-2">
              <Label>Current Medications</Label>
              <div className="space-y-2">
                {formData.medications.map((medication, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div className="bg-gray-100 px-3 py-1 rounded-md flex-1">
                      {medication.name} - {medication.dose}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveMedication(index)}
                    >
                      &times;
                    </Button>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <div className="flex space-x-2">
                  <Input
                    placeholder="Search medication..."
                    value={searchMedication}
                    onChange={(e) => setSearchMedication(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSearchMedication}
                    disabled={isSearchingMedication || !searchMedication.trim() || searchMedication.length < 3}
                  >
                    {isSearchingMedication ? 'Searching...' : 'Search'}
                  </Button>
                </div>
                
                {medicationResults.length > 0 && (
                  <div className="bg-white border rounded-md shadow-sm max-h-40 overflow-y-auto">
                    {medicationResults.map((result) => (
                      <div
                        key={result.rxcui}
                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => {
                          setNewMedication({
                            name: result.name,
                            dose: '',
                            rxnorm_id: result.rxcui
                          });
                          setMedicationResults([]);
                          setSearchMedication('');
                        }}
                      >
                        {result.name}
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Medication Name"
                    value={newMedication.name}
                    onChange={(e) => setNewMedication({ ...newMedication, name: e.target.value })}
                  />
                  <Input
                    placeholder="Dose"
                    value={newMedication.dose}
                    onChange={(e) => setNewMedication({ ...newMedication, dose: e.target.value })}
                  />
                </div>
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddMedication}
                  disabled={!newMedication.name.trim() || !newMedication.dose.trim()}
                  className="w-full"
                >
                  Add Medication
                </Button>
              </div>
            </div>
            
            {/* Medical Test Results */}
            <div className="space-y-4">
              <Label>Medical Test Results (Optional)</Label>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Fasting Blood Insulin */}
                <div className="space-y-1">
                  <Label htmlFor="fasting_blood_insulin" className="text-sm">Fasting Blood Insulin</Label>
                  <Input
                    id="fasting_blood_insulin"
                    type="number"
                    step="0.01"
                    placeholder="μU/mL"
                    value={formData.medical_tests.fasting_blood_insulin || ''}
                    onChange={(e) => handleDeeplyNestedChange(
                      'medical_tests',
                      'fasting_blood_insulin',
                      '',
                      e.target.value === '' ? undefined : Number(e.target.value)
                    )}
                  />
                </div>
                
                {/* A1C */}
                <div className="space-y-1">
                  <Label htmlFor="a1c" className="text-sm">A1C</Label>
                  <Input
                    id="a1c"
                    type="number"
                    step="0.1"
                    placeholder="%"
                    value={formData.medical_tests.a1c || ''}
                    onChange={(e) => handleDeeplyNestedChange(
                      'medical_tests',
                      'a1c',
                      '',
                      e.target.value === '' ? undefined : Number(e.target.value)
                    )}
                  />
                </div>
                
                {/* Blood Pressure */}
                <div className="space-y-1">
                  <Label htmlFor="blood_pressure" className="text-sm">Blood Pressure</Label>
                  <Input
                    id="blood_pressure"
                    placeholder="120/80"
                    value={formData.medical_tests.blood_pressure || ''}
                    onChange={(e) => handleDeeplyNestedChange(
                      'medical_tests',
                      'blood_pressure',
                      '',
                      e.target.value
                    )}
                  />
                </div>
                
                {/* Cholesterol - Total */}
                <div className="space-y-1">
                  <Label htmlFor="cholesterol_total" className="text-sm">Total Cholesterol</Label>
                  <Input
                    id="cholesterol_total"
                    type="number"
                    placeholder="mg/dL"
                    value={formData.medical_tests.cholesterol_levels.total || ''}
                    onChange={(e) => handleDeeplyNestedChange(
                      'medical_tests',
                      'cholesterol_levels',
                      'total',
                      e.target.value === '' ? undefined : Number(e.target.value)
                    )}
                  />
                </div>
                
                {/* Cholesterol - LDL */}
                <div className="space-y-1">
                  <Label htmlFor="cholesterol_ldl" className="text-sm">LDL Cholesterol</Label>
                  <Input
                    id="cholesterol_ldl"
                    type="number"
                    placeholder="mg/dL"
                    value={formData.medical_tests.cholesterol_levels.ldl || ''}
                    onChange={(e) => handleDeeplyNestedChange(
                      'medical_tests',
                      'cholesterol_levels',
                      'ldl',
                      e.target.value === '' ? undefined : Number(e.target.value)
                    )}
                  />
                </div>
                
                {/* Cholesterol - HDL */}
                <div className="space-y-1">
                  <Label htmlFor="cholesterol_hdl" className="text-sm">HDL Cholesterol</Label>
                  <Input
                    id="cholesterol_hdl"
                    type="number"
                    placeholder="mg/dL"
                    value={formData.medical_tests.cholesterol_levels.hdl || ''}
                    onChange={(e) => handleDeeplyNestedChange(
                      'medical_tests',
                      'cholesterol_levels',
                      'hdl',
                      e.target.value === '' ? undefined : Number(e.target.value)
                    )}
                  />
                </div>
                
                {/* Cholesterol - Triglycerides */}
                <div className="space-y-1">
                  <Label htmlFor="cholesterol_triglycerides" className="text-sm">Triglycerides</Label>
                  <Input
                    id="cholesterol_triglycerides"
                    type="number"
                    placeholder="mg/dL"
                    value={formData.medical_tests.cholesterol_levels.triglycerides || ''}
                    onChange={(e) => handleDeeplyNestedChange(
                      'medical_tests',
                      'cholesterol_levels',
                      'triglycerides',
                      e.target.value === '' ? undefined : Number(e.target.value)
                    )}
                  />
                </div>
                
                {/* Bone Density */}
                <div className="space-y-1">
                  <Label htmlFor="bone_density" className="text-sm">Bone Density (T-score)</Label>
                  <Input
                    id="bone_density"
                    type="number"
                    step="0.1"
                    placeholder="T-score"
                    value={formData.medical_tests.bone_density || ''}
                    onChange={(e) => handleDeeplyNestedChange(
                      'medical_tests',
                      'bone_density',
                      '',
                      e.target.value === '' ? undefined : Number(e.target.value)
                    )}
                  />
                </div>
                
                {/* Iron */}
                <div className="space-y-1">
                  <Label htmlFor="iron" className="text-sm">Iron</Label>
                  <Input
                    id="iron"
                    type="number"
                    placeholder="μg/dL"
                    value={formData.medical_tests.iron || ''}
                    onChange={(e) => handleDeeplyNestedChange(
                      'medical_tests',
                      'iron',
                      '',
                      e.target.value === '' ? undefined : Number(e.target.value)
                    )}
                  />
                </div>
                
                {/* CRP */}
                <div className="space-y-1">
                  <Label htmlFor="crp" className="text-sm">CRP</Label>
                  <Input
                    id="crp"
                    type="number"
                    step="0.01"
                    placeholder="mg/L"
                    value={formData.medical_tests.crp || ''}
                    onChange={(e) => handleDeeplyNestedChange(
                      'medical_tests',
                      'crp',
                      '',
                      e.target.value === '' ? undefined : Number(e.target.value)
                    )}
                  />
                </div>
                
                {/* Uric Acid */}
                <div className="space-y-1">
                  <Label htmlFor="uric_acid" className="text-sm">Uric Acid</Label>
                  <Input
                    id="uric_acid"
                    type="number"
                    step="0.1"
                    placeholder="mg/dL"
                    value={formData.medical_tests.uric_acid || ''}
                    onChange={(e) => handleDeeplyNestedChange(
                      'medical_tests',
                      'uric_acid',
                      '',
                      e.target.value === '' ? undefined : Number(e.target.value)
                    )}
                  />
                </div>
                
                {/* Vitamin D */}
                <div className="space-y-1">
                  <Label htmlFor="vitamin_d" className="text-sm">Vitamin D</Label>
                  <Input
                    id="vitamin_d"
                    type="number"
                    placeholder="ng/mL"
                    value={formData.medical_tests.vitamin_d || ''}
                    onChange={(e) => handleDeeplyNestedChange(
                      'medical_tests',
                      'vitamin_d',
                      '',
                      e.target.value === '' ? undefined : Number(e.target.value)
                    )}
                  />
                </div>
                
                {/* CPK */}
                <div className="space-y-1">
                  <Label htmlFor="cpk" className="text-sm">CPK</Label>
                  <Input
                    id="cpk"
                    type="number"
                    placeholder="U/L"
                    value={formData.medical_tests.cpk || ''}
                    onChange={(e) => handleDeeplyNestedChange(
                      'medical_tests',
                      'cpk',
                      '',
                      e.target.value === '' ? undefined : Number(e.target.value)
                    )}
                  />
                </div>
              </div>
            </div>
          </div>
        );
        
      case 3: // Dietary Preferences
        return (
          <div className="space-y-6">
            {/* Dietary Preferences */}
            <div className="space-y-2">
              <Label>Dietary Preferences (select all that apply)</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {dietaryPreferenceOptions.map((preference) => (
                  preference !== 'Other' ? (
                    <div key={preference} className="flex items-center space-x-2">
                      <Checkbox
                        id={`preference-${preference}`}
                        checked={formData.dietary_preferences.includes(preference)}
                        onCheckedChange={(checked) => handleDietaryPreferenceChange(preference, !!checked)}
                      />
                      <Label htmlFor={`preference-${preference}`}>{preference}</Label>
                    </div>
                  ) : null
                ))}
              </div>
              
              {/* Other Dietary Preference */}
              <div className="space-y-2 mt-4">
                <Label>Other Dietary Preferences</Label>
                <div className="space-y-2">
                  {formData.dietary_preferences
                    .filter(pref => !dietaryPreferenceOptions.includes(pref))
                    .map((pref, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <div className="bg-gray-100 px-3 py-1 rounded-md flex-1">{pref}</div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDietaryPreferenceChange(pref, false)}
                        >
                          &times;
                        </Button>
                      </div>
                    ))
                  }
                </div>
                <div className="flex space-x-2">
                  <Input
                    placeholder="Enter other dietary preference"
                    value={otherDietaryPreference}
                    onChange={(e) => setOtherDietaryPreference(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    onClick={handleAddOtherDietaryPreference}
                    disabled={!otherDietaryPreference.trim()}
                  >
                    Add
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Food Allergies */}
            <div className="space-y-2">
              <Label>Food Allergies (select all that apply)</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {allergyOptions.map((allergy) => (
                  allergy !== 'Other' ? (
                    <div key={allergy} className="flex items-center space-x-2">
                      <Checkbox
                        id={`allergy-${allergy}`}
                        checked={formData.food_allergies.includes(allergy)}
                        onCheckedChange={(checked) => handleFoodAllergyChange(allergy, !!checked)}
                      />
                      <Label htmlFor={`allergy-${allergy}`}>{allergy}</Label>
                    </div>
                  ) : null
                ))}
              </div>
              
              {/* Other Food Allergy */}
              <div className="space-y-2 mt-4">
                <Label>Other Food Allergies</Label>
                <div className="space-y-2">
                  {formData.food_allergies
                    .filter(allergy => !allergyOptions.includes(allergy))
                    .map((allergy, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <div className="bg-gray-100 px-3 py-1 rounded-md flex-1">{allergy}</div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleFoodAllergyChange(allergy, false)}
                        >
                          &times;
                        </Button>
                      </div>
                    ))
                  }
                </div>
                <div className="flex space-x-2">
                  <Input
                    placeholder="Enter other food allergy"
                    value={otherAllergy}
                    onChange={(e) => setOtherAllergy(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    onClick={handleAddOtherFoodAllergy}
                    disabled={!otherAllergy.trim()}
                  >
                    Add
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Dietary Preset */}
            <div className="space-y-2">
              <Label htmlFor="dietary_preset">Dietary Preset</Label>
              <Select
                value={formData.dietary_preset}
                onValueChange={(value) => handleSelectChange('dietary_preset', value)}
              >
                <SelectTrigger id="dietary_preset">
                  <SelectValue placeholder="Select dietary preset" />
                </SelectTrigger>
                <SelectContent>
                  {dietaryPresetOptions.map((preset) => (
                    <SelectItem key={preset} value={preset}>
                      {preset}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-text-secondary">
                The default is "2 Rule" which focuses on fructose limits and omega balance.
                Other options combine the 2 Rule with popular diets.
              </p>
            </div>
          </div>
        );
        
      case 4: // Additional Settings
        return (
          <div className="space-y-6">
            {/* Omega 3 Supplement */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="takes_omega3"
                  checked={formData.omega3_supplement.takes_supplement}
                  onCheckedChange={(checked) => handleNestedChange('omega3_supplement', 'takes_supplement', !!checked)}
                />
                <Label htmlFor="takes_omega3">I take an Omega 3 supplement</Label>
              </div>
              
              {formData.omega3_supplement.takes_supplement && (
                <div className="pl-6 space-y-4 mt-2">
                  <p className="text-sm text-text-secondary">
                    Please specify the amounts in your supplement. This will be used to calculate your daily omega balance.
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* EPA */}
                    <div className="space-y-1">
                      <Label htmlFor="epa_mg">EPA (mg)</Label>
                      <Input
                        id="epa_mg"
                        type="number"
                        value={formData.omega3_supplement.epa_mg}
                        onChange={(e) => handleNestedChange(
                          'omega3_supplement',
                          'epa_mg',
                          e.target.value === '' ? 0 : Number(e.target.value)
                        )}
                        className={errors['omega3_supplement.epa_mg'] ? 'border-error' : ''}
                      />
                      {errors['omega3_supplement.epa_mg'] && (
                        <p className="text-sm text-error">{errors['omega3_supplement.epa_mg']}</p>
                      )}
                    </div>
                    
                    {/* DHA */}
                    <div className="space-y-1">
                      <Label htmlFor="dha_mg">DHA (mg)</Label>
                      <Input
                        id="dha_mg"
                        type="number"
                        value={formData.omega3_supplement.dha_mg}
                        onChange={(e) => handleNestedChange(
                          'omega3_supplement',
                          'dha_mg',
                          e.target.value === '' ? 0 : Number(e.target.value)
                        )}
                        className={errors['omega3_supplement.dha_mg'] ? 'border-error' : ''}
                      />
                      {errors['omega3_supplement.dha_mg'] && (
                        <p className="text-sm text-error">{errors['omega3_supplement.dha_mg']}</p>
                      )}
                    </div>
                    
                    {/* ALA */}
                    <div className="space-y-1">
                      <Label htmlFor="ala_mg">ALA (mg)</Label>
                      <Input
                        id="ala_mg"
                        type="number"
                        value={formData.omega3_supplement.ala_mg}
                        onChange={(e) => handleNestedChange(
                          'omega3_supplement',
                          'ala_mg',
                          e.target.value === '' ? 0 : Number(e.target.value)
                        )}
                        className={errors['omega3_supplement.ala_mg'] ? 'border-error' : ''}
                      />
                      {errors['omega3_supplement.ala_mg'] && (
                        <p className="text-sm text-error">{errors['omega3_supplement.ala_mg']}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Organic Produce */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="buy_organic"
                  checked={formData.buy_organic}
                  onCheckedChange={(checked) => handleCheckboxChange('buy_organic', !!checked)}
                />
                <Label htmlFor="buy_organic">
                  I'm interested in EWG's 'Dirty Dozen' (Foods to buy organic)
                </Label>
              </div>
              <p className="text-xs text-text-secondary pl-6">
                This will highlight produce items from the Environmental Working Group's "Dirty Dozen" list
                in your grocery lists, recommending organic options for these items.
              </p>
            </div>
            
            {/* Weekly Grocery Budget */}
            <div className="space-y-2">
              <Label htmlFor="weekly_grocery_budget">Weekly Grocery Budget (Optional)</Label>
              <div className="flex items-center space-x-2">
                <span className="text-text-secondary">$</span>
                <Input
                  id="weekly_grocery_budget"
                  name="weekly_grocery_budget"
                  type="number"
                  placeholder="Amount"
                  value={formData.weekly_grocery_budget || ''}
                  onChange={(e) => handleInputChange(e)}
                />
              </div>
              <p className="text-xs text-text-secondary">
                This helps us provide cost-effective meal suggestions.
              </p>
            </div>
          </div>
        );
        
      case 5: // Review & Submit
        return (
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="font-medium mb-2">Basic Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                <div>
                  <span className="text-text-secondary">Name:</span> {formData.name}
                </div>
                <div>
                  <span className="text-text-secondary">Age:</span> {formData.age}
                </div>
                <div>
                  <span className="text-text-secondary">Sex:</span> {formData.sex}
                </div>
                <div>
                  <span className="text-text-secondary">Country:</span> {formData.country}
                </div>
                <div>
                  <span className="text-text-secondary">Weight:</span> {formData.weight} {formData.weight_unit}
                </div>
                <div>
                  <span className="text-text-secondary">Wake-up Time:</span> {formData.wake_up_time}
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="font-medium mb-2">Health Status</h3>
              <div className="space-y-2">
                <div>
                  <span className="text-text-secondary">Chronic Health Condition:</span> {formData.has_chronic_condition ? 'Yes' : 'No'}
                </div>
                {formData.has_chronic_condition && formData.health_conditions.length > 0 && (
                  <div>
                    <span className="text-text-secondary">Health Conditions:</span> {formData.health_conditions.join(', ')}
                  </div>
                )}
                <div>
                  <span className="text-text-secondary">Iron Levels:</span> {formData.iron_levels}
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="font-medium mb-2">Dietary Preferences</h3>
              <div className="space-y-2">
                {formData.dietary_preferences.length > 0 && (
                  <div>
                    <span className="text-text-secondary">Dietary Preferences:</span> {formData.dietary_preferences.join(', ')}
                  </div>
                )}
                {formData.food_allergies.length > 0 && (
                  <div>
                    <span className="text-text-secondary">Food Allergies:</span> {formData.food_allergies.join(', ')}
                  </div>
                )}
                <div>
                  <span className="text-text-secondary">Dietary Preset:</span> {formData.dietary_preset}
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="font-medium mb-2">Additional Settings</h3>
              <div className="space-y-2">
                <div>
                  <span className="text-text-secondary">Omega 3 Supplement:</span> {formData.omega3_supplement.takes_supplement ? 'Yes' : 'No'}
                  {formData.omega3_supplement.takes_supplement && (
                    <span>
                      {' '}(EPA: {formData.omega3_supplement.epa_mg}mg, DHA: {formData.omega3_supplement.dha_mg}mg, ALA: {formData.omega3_supplement.ala_mg}mg)
                    </span>
                  )}
                </div>
                <div>
                  <span className="text-text-secondary">Buy Organic:</span> {formData.buy_organic ? 'Yes' : 'No'}
                </div>
                {formData.weekly_grocery_budget && (
                  <div>
                    <span className="text-text-secondary">Weekly Grocery Budget:</span> ${formData.weekly_grocery_budget}
                  </div>
                )}
              </div>
            </div>
            
            <div className="bg-primary/10 p-4 rounded-md flex items-start space-x-2">
              <AlertCircle className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="text-primary font-medium">Important Note</p>
                <p className="text-sm">
                  By saving these settings, you confirm that the information provided is accurate to the best of your knowledge.
                  This information will be used to personalize your meal plans and health recommendations.
                </p>
              </div>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-text-secondary">Loading your profile settings...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-2 text-primary">Profile Settings</h1>
      <p className="text-text-secondary mb-8">Update your profile information to personalize your experience</p>
      
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between mb-2">
          <span className="text-sm">{STEPS[currentStep]}</span>
          <span className="text-sm">{currentStep + 1}/{STEPS.length}</span>
        </div>
        <Progress value={((currentStep + 1) / STEPS.length) * 100} className="h-2" />
      </div>
      
      {/* Form Card */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>{STEPS[currentStep]}</CardTitle>
          <CardDescription>
            {currentStep === 0 && "Update your basic information. Note: Name and date of birth cannot be changed."}
            {currentStep === 1 && "Update your health status information."}
            {currentStep === 2 && "Update your medical information."}
            {currentStep === 3 && "Update your dietary preferences and restrictions."}
            {currentStep === 4 && "Update additional settings for your meal planning."}
            {currentStep === 5 && "Review your information before saving."}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {renderStepContent()}
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePreviousStep}
            disabled={currentStep === 0}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>
          
          {currentStep < STEPS.length - 1 ? (
            <Button onClick={handleNextStep}>
              Next
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleSaveProfile} disabled={isSaving}>
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Save Profile
                </>
              )}
            </Button>
          )}
        </CardFooter>
      </Card>
      
      {/* Cancel Button */}
      <div className="text-center">
        <Button
          variant="ghost"
          onClick={() => router.push('/dashboard')}
          disabled={isSaving}
        >
          Cancel and return to dashboard
        </Button>
      </div>
    </div>
  );
}
