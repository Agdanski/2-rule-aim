import { supabase } from './supabase';

// Nutrient ID constants for the CNF database
// These IDs are specific to the CNF 2015 database
const NUTRIENT_IDS = {
  // Macronutrients
  PROTEIN: 203,
  FAT: 204,
  CARBOHYDRATE: 205,
  ENERGY_KCAL: 208,
  FIBER: 291,
  
  // Omega fatty acids
  OMEGA_3_ALA: 851,  // Alpha-linolenic acid (18:3)
  OMEGA_3_EPA: 629,  // Eicosapentaenoic acid (20:5)
  OMEGA_3_DHA: 631,  // Docosahexaenoic acid (22:6)
  
  // Omega-6 fatty acids
  OMEGA_6_LA: 618,   // Linoleic acid (18:2)
  OMEGA_6_AA: 620,   // Arachidonic acid (20:4)
  
  // Sugars
  FRUCTOSE: 212,
  
  // Minerals
  IRON: 303,
};

// Types for food search and nutrition data
export interface FoodSearchResult {
  FoodID: number;
  FoodCode: string;
  FoodDescription: string;
  FoodGroupName: string;
}

export interface NutrientData {
  nutrientId: number;
  nutrientName: string;
  nutrientValue: number;
  nutrientUnit: string;
}

export interface FoodNutritionData {
  foodId: number;
  foodName: string;
  nutrients: NutrientData[];
  measures: MeasureData[];
}

export interface MeasureData {
  measureId: number;
  measureDescription: string;
  conversionFactor: number; // to convert to grams
}

export interface NutrientSummary {
  fructose: number;
  omega3: number;
  omega6: number;
  protein: number;
  carbs: number;
  fat: number;
  calories: number;
  iron: number;
  fiber: number;
}

/**
 * Search for foods in the CNF database by name/description
 * @param searchTerm The search term to look for in food descriptions
 * @param limit Maximum number of results to return
 * @returns Array of matching food items
 */
export async function searchFoods(searchTerm: string, limit = 20): Promise<FoodSearchResult[]> {
  try {
    // Search for foods with names containing the search term
    const { data, error } = await supabase
      .from('FOOD_NAME')
      .select(`
        FoodID,
        FoodCode,
        FoodDescription,
        FoodGroupID,
        FOOD_GROUP!inner(FoodGroupName)
      `)
      .ilike('FoodDescription', `%${searchTerm}%`)
      .limit(limit);

    if (error) throw error;

    // Format the results
    return data.map(item => ({
      FoodID: item.FoodID,
      FoodCode: item.FoodCode,
      FoodDescription: item.FoodDescription,
      FoodGroupName: item.FOOD_GROUP.FoodGroupName
    }));
  } catch (error) {
    console.error('Error searching CNF foods:', error);
    throw new Error('Failed to search foods in the CNF database');
  }
}

/**
 * Get all available nutrition data for a specific food
 * @param foodId The CNF food ID
 * @returns Complete nutrition data for the food
 */
export async function getFoodNutrition(foodId: number): Promise<FoodNutritionData> {
  try {
    // Get food details
    const { data: foodData, error: foodError } = await supabase
      .from('FOOD_NAME')
      .select('*')
      .eq('FoodID', foodId)
      .single();

    if (foodError) throw foodError;

    // Get all nutrients for this food
    const { data: nutrientData, error: nutrientError } = await supabase
      .from('NUTRIENT_AMOUNT')
      .select(`
        NutrientID,
        NutrientValue,
        NUTRIENT_NAME!inner(NutrientName, NutrientUnit)
      `)
      .eq('FoodID', foodId);

    if (nutrientError) throw nutrientError;

    // Get available measures for this food
    const { data: measureData, error: measureError } = await supabase
      .from('CONVERSION_FACTOR')
      .select(`
        MeasureID,
        ConversionFactorValue,
        MEASURE_NAME!inner(MeasureDescription)
      `)
      .eq('FoodID', foodId);

    if (measureError) throw measureError;

    // Format the nutrients
    const nutrients = nutrientData.map(item => ({
      nutrientId: item.NutrientID,
      nutrientName: item.NUTRIENT_NAME.NutrientName,
      nutrientValue: item.NutrientValue,
      nutrientUnit: item.NUTRIENT_NAME.NutrientUnit
    }));

    // Format the measures
    const measures = measureData.map(item => ({
      measureId: item.MeasureID,
      measureDescription: item.MEASURE_NAME.MeasureDescription,
      conversionFactor: item.ConversionFactorValue
    }));

    return {
      foodId,
      foodName: foodData.FoodDescription,
      nutrients,
      measures
    };
  } catch (error) {
    console.error('Error fetching CNF food nutrition:', error);
    throw new Error('Failed to get nutrition data from the CNF database');
  }
}

/**
 * Get specific nutrient values for a food (fructose, omega-3, omega-6, etc.)
 * @param foodId The CNF food ID
 * @returns Summary of key nutrients
 */
export async function getKeyNutrients(foodId: number): Promise<NutrientSummary> {
  try {
    const { data, error } = await supabase
      .from('NUTRIENT_AMOUNT')
      .select('NutrientID, NutrientValue')
      .eq('FoodID', foodId)
      .in('NutrientID', Object.values(NUTRIENT_IDS));

    if (error) throw error;

    // Initialize with zeros
    const summary: NutrientSummary = {
      fructose: 0,
      omega3: 0,
      omega6: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      calories: 0,
      iron: 0,
      fiber: 0
    };

    // Fill in available values
    data.forEach(item => {
      switch (item.NutrientID) {
        case NUTRIENT_IDS.FRUCTOSE:
          summary.fructose = item.NutrientValue;
          break;
        case NUTRIENT_IDS.OMEGA_3_ALA:
        case NUTRIENT_IDS.OMEGA_3_EPA:
        case NUTRIENT_IDS.OMEGA_3_DHA:
          summary.omega3 += item.NutrientValue;
          break;
        case NUTRIENT_IDS.OMEGA_6_LA:
        case NUTRIENT_IDS.OMEGA_6_AA:
          summary.omega6 += item.NutrientValue;
          break;
        case NUTRIENT_IDS.PROTEIN:
          summary.protein = item.NutrientValue;
          break;
        case NUTRIENT_IDS.CARBOHYDRATE:
          summary.carbs = item.NutrientValue;
          break;
        case NUTRIENT_IDS.FAT:
          summary.fat = item.NutrientValue;
          break;
        case NUTRIENT_IDS.ENERGY_KCAL:
          summary.calories = item.NutrientValue;
          break;
        case NUTRIENT_IDS.IRON:
          summary.iron = item.NutrientValue;
          break;
        case NUTRIENT_IDS.FIBER:
          summary.fiber = item.NutrientValue;
          break;
      }
    });

    return summary;
  } catch (error) {
    console.error('Error fetching key nutrients:', error);
    throw new Error('Failed to get key nutrient data from the CNF database');
  }
}

/**
 * Convert a food amount from one measure to another
 * @param foodId The CNF food ID
 * @param amount The amount to convert
 * @param fromMeasureId The source measure ID
 * @param toMeasureId The target measure ID
 * @returns The converted amount
 */
export async function convertMeasure(
  foodId: number,
  amount: number,
  fromMeasureId: number,
  toMeasureId: number
): Promise<number> {
  try {
    // Get conversion factors for both measures
    const { data, error } = await supabase
      .from('CONVERSION_FACTOR')
      .select('MeasureID, ConversionFactorValue')
      .eq('FoodID', foodId)
      .in('MeasureID', [fromMeasureId, toMeasureId]);

    if (error) throw error;

    if (data.length !== 2) {
      throw new Error('Conversion factors not available for the specified measures');
    }

    // Find the conversion factors
    const fromFactor = data.find(item => item.MeasureID === fromMeasureId)?.ConversionFactorValue;
    const toFactor = data.find(item => item.MeasureID === toMeasureId)?.ConversionFactorValue;

    if (!fromFactor || !toFactor) {
      throw new Error('Conversion factors not found');
    }

    // Convert to grams first, then to the target measure
    const gramsAmount = amount * fromFactor;
    const convertedAmount = gramsAmount / toFactor;

    return convertedAmount;
  } catch (error) {
    console.error('Error converting measures:', error);
    throw new Error('Failed to convert between measures');
  }
}

/**
 * Get nutrient values for a food with a specific amount and measure
 * @param foodId The CNF food ID
 * @param amount The amount of food
 * @param measureId The measure ID (defaults to 1, which is typically grams)
 * @returns Summary of key nutrients adjusted for the specified amount
 */
export async function getNutrientsForAmount(
  foodId: number,
  amount: number,
  measureId: number = 1
): Promise<NutrientSummary> {
  try {
    // Get base nutrients per 100g
    const baseNutrients = await getKeyNutrients(foodId);
    
    // Get the conversion factor for the specified measure
    const { data, error } = await supabase
      .from('CONVERSION_FACTOR')
      .select('ConversionFactorValue')
      .eq('FoodID', foodId)
      .eq('MeasureID', measureId)
      .single();

    if (error) {
      // If no conversion factor found, assume direct grams
      console.warn('No conversion factor found, assuming direct grams');
      const scaleFactor = amount / 100; // Nutrients are per 100g by default
      
      return {
        fructose: baseNutrients.fructose * scaleFactor,
        omega3: baseNutrients.omega3 * scaleFactor,
        omega6: baseNutrients.omega6 * scaleFactor,
        protein: baseNutrients.protein * scaleFactor,
        carbs: baseNutrients.carbs * scaleFactor,
        fat: baseNutrients.fat * scaleFactor,
        calories: baseNutrients.calories * scaleFactor,
        iron: baseNutrients.iron * scaleFactor,
        fiber: baseNutrients.fiber * scaleFactor
      };
    }
    
    // Calculate the amount in grams
    const gramsAmount = amount * data.ConversionFactorValue;
    const scaleFactor = gramsAmount / 100; // Nutrients are per 100g by default
    
    // Scale all nutrients by the factor
    return {
      fructose: baseNutrients.fructose * scaleFactor,
      omega3: baseNutrients.omega3 * scaleFactor,
      omega6: baseNutrients.omega6 * scaleFactor,
      protein: baseNutrients.protein * scaleFactor,
      carbs: baseNutrients.carbs * scaleFactor,
      fat: baseNutrients.fat * scaleFactor,
      calories: baseNutrients.calories * scaleFactor,
      iron: baseNutrients.iron * scaleFactor,
      fiber: baseNutrients.fiber * scaleFactor
    };
  } catch (error) {
    console.error('Error calculating nutrients for amount:', error);
    throw new Error('Failed to calculate nutrients for the specified amount');
  }
}

/**
 * Get available measures for a specific food
 * @param foodId The CNF food ID
 * @returns Array of available measures
 */
export async function getAvailableMeasures(foodId: number): Promise<MeasureData[]> {
  try {
    const { data, error } = await supabase
      .from('CONVERSION_FACTOR')
      .select(`
        MeasureID,
        ConversionFactorValue,
        MEASURE_NAME!inner(MeasureDescription)
      `)
      .eq('FoodID', foodId);

    if (error) throw error;

    return data.map(item => ({
      measureId: item.MeasureID,
      measureDescription: item.MEASURE_NAME.MeasureDescription,
      conversionFactor: item.ConversionFactorValue
    }));
  } catch (error) {
    console.error('Error fetching available measures:', error);
    throw new Error('Failed to get available measures for the food');
  }
}

/**
 * Search for foods and return with their key nutrient data
 * @param searchTerm The search term
 * @param limit Maximum number of results
 * @returns Array of foods with their key nutrients
 */
export async function searchFoodsWithNutrients(searchTerm: string, limit = 10): Promise<Array<FoodSearchResult & NutrientSummary>> {
  try {
    // First search for foods
    const foods = await searchFoods(searchTerm, limit);
    
    // Then get nutrients for each food
    const foodsWithNutrients = await Promise.all(
      foods.map(async (food) => {
        const nutrients = await getKeyNutrients(food.FoodID);
        return {
          ...food,
          ...nutrients
        };
      })
    );
    
    return foodsWithNutrients;
  } catch (error) {
    console.error('Error searching foods with nutrients:', error);
    throw new Error('Failed to search foods with nutrient data');
  }
}

/**
 * Check if a food has complete data for the key nutrients we need
 * @param foodId The CNF food ID
 * @returns Boolean indicating if the food has complete data
 */
export async function hasCompleteNutrientData(foodId: number): Promise<boolean> {
  try {
    const nutrients = await getKeyNutrients(foodId);
    
    // Check if we have values for the critical nutrients
    const hasFructose = nutrients.fructose !== 0;
    const hasOmega3 = nutrients.omega3 !== 0;
    const hasOmega6 = nutrients.omega6 !== 0;
    
    return hasFructose && hasOmega3 && hasOmega6;
  } catch (error) {
    console.error('Error checking nutrient completeness:', error);
    return false;
  }
}
