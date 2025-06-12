import { Configuration, OpenAIApi } from 'openai';
import { NutrientSummary, getKeyNutrients, searchFoods } from './cnf-integration';
import { mealRules, dietaryPresetOptions } from './constants';
import { calculateOmegaRatio, isOmegaRatioValid, isFructoseValid, mealFollows2Rules } from './utils';

// OpenAI API configuration
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
  organization: process.env.OPENAI_ORGANIZATION,
});

// Initialize OpenAI API client
const openai = new OpenAIApi(configuration);

// Types for meal generation
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'dessert';
export type MealGenerationType = 'single' | 'full_day' | 'full_week';
export type DietaryPreset = '2 Rule' | 'Keto + 2 Rule' | 'Mediterranean + 2 Rule' | 'Paleo + 2 Rule' | 'Carnivore + 2 Rule';

// Interface for meal generation options
export interface MealGenerationOptions {
  mealType?: MealType;
  generationType: MealGenerationType;
  portions: number;
  includeSnacks?: boolean;
  includeDessert?: boolean;
  includeInstructions: boolean;
  includeMacros: boolean;
  includeHeavyMetals: boolean;
  proteinGoal?: number;
  proteinGoalPerDay?: boolean;
  useGrassFed: boolean;
  userAllergies: string[];
  userDietaryPreferences: string[];
  userDietaryPreset: DietaryPreset;
  userIronLevels: 'normal' | 'high' | 'low';
  userMedications: { name: string; dose: string; rxnorm_id?: string }[];
  userWeight: number;
  userWeightUnit: 'kg' | 'lbs';
  userAge: number;
  userSex: 'male' | 'female' | 'other';
  userHasChronicCondition: boolean;
  userOmega3Supplement?: {
    takes_supplement: boolean;
    epa_mg: number;
    dha_mg: number;
    ala_mg: number;
  };
  previousMeals?: string[]; // For avoiding repetition
}

// Interface for generated meal
export interface GeneratedMeal {
  name: string;
  type: MealGenerationType;
  meal_type: MealType | null;
  ingredients: {
    name: string;
    amount: string;
    unit: string;
    fructose: number;
    omega3: number;
    omega6: number;
  }[];
  instructions: string;
  total_fructose: number;
  omega3: number;
  omega6: number;
  omega_ratio: string;
  protein: number;
  carbs: number;
  fat: number;
  calories: number;
  iron_content: number;
  fiber: number;
  heavy_metal_content: any | null;
  net_carbs: number;
  macronutrient_breakdown: {
    protein_percentage: number;
    carbs_percentage: number;
    fat_percentage: number;
  };
  follows_2_rules: boolean;
  portions: number;
}

// Interface for generated full day meals
export interface GeneratedFullDay {
  name: string;
  breakfast: GeneratedMeal | null;
  lunch: GeneratedMeal | null;
  dinner: GeneratedMeal | null;
  snack1: GeneratedMeal | null;
  snack2: GeneratedMeal | null;
  dessert: GeneratedMeal | null;
  total_fructose: number;
  omega3: number;
  omega6: number;
  omega_ratio: string;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  total_calories: number;
  total_iron: number;
  total_fiber: number;
  heavy_metal_report: any | null;
  total_net_carbs: number;
  follows_2_rules: boolean;
  nutrient_deficiencies: any | null;
  medication_interactions: any | null;
}

// Interface for generated full week meals
export interface GeneratedFullWeek {
  name: string;
  days: {
    day_number: number;
    full_day: GeneratedFullDay;
  }[];
  follows_2_rules: boolean;
  weekly_nutrient_report: any | null;
}

/**
 * Generate a single meal using GPT-4o
 * @param options Meal generation options
 * @returns Generated meal or error
 */
export async function generateSingleMeal(options: MealGenerationOptions): Promise<{ meal: GeneratedMeal | null; error: string | null }> {
  try {
    // Calculate fructose limit based on health condition
    const fructoseLimit = options.userHasChronicCondition
      ? mealRules.fructoseLimits.withChronicCondition / 3 // Per meal (approx 1/3 of daily)
      : mealRules.fructoseLimits.withoutChronicCondition / 3;
    
    // Calculate omega3 supplement contribution (if applicable)
    let omega3SupplementInfo = '';
    if (options.userOmega3Supplement?.takes_supplement) {
      const { epa_mg, dha_mg, ala_mg } = options.userOmega3Supplement;
      omega3SupplementInfo = `${epa_mg} mg EPA, ${dha_mg} mg DHA, ${ala_mg} mg ALA`;
    }
    
    // Convert dietary preset to format expected by GPT
    const dietaryPreset = options.userDietaryPreset === '2 Rule' 
      ? 'null' 
      : options.userDietaryPreset.replace(' + 2 Rule', '');
    
    // Build the prompt for GPT-4o
    const prompt = `You are an expert in nutrition, medicine, and anti-inflammatory meal planning. Only respond with what is asked of you.
Do not create a meal unless it fully satisfies all user constraints. Avoid repeating meals you've previously generated. Vary ingredients and meal types as much as possible within the user's constraints.

Create a ${options.mealType || 'meal'} with; a 1:1.5-1:2.9 omega 3:6 ratio range including ⅓ of ${omega3SupplementInfo} already, total fructose below ${fructoseLimit}g, ${options.proteinGoal ? `at least ${options.proteinGoal}g of protein,` : ''} ${options.useGrassFed ? 'with' : 'without'} grass fed meat/pastured pork, no ingredients matching ${options.userAllergies.join(', ')}, adhering to a ${options.userDietaryPreferences.join(', ')} diet, adhering to a ${dietaryPreset} diet, ${options.userIronLevels === 'high' ? 'low' : 'high'} in iron, no soy, no ingredients that interact negatively with ${options.userMedications.map(med => med.name).join(', ')}, enough calories for 1 meal for a ${options.userWeight} ${options.userWeightUnit}, ${options.userAge} year old, ${options.userSex}, limit net carbs to 15g, ingredients listed, ${options.includeInstructions ? 'meal prep instructions,' : ''} ${options.includeMacros ? 'a macronutrient profile,' : ''} a report of calories, iron, fiber, ${options.includeHeavyMetals ? 'heavy metal content,' : ''} net carbs.`;

    // Add previous meals to avoid repetition if provided
    if (options.previousMeals && options.previousMeals.length > 0) {
      prompt += `\n\nAvoid repeating these meals or similar ingredients: ${options.previousMeals.join(', ')}`;
    }

    // Call GPT-4o API
    const response = await openai.createChatCompletion({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an expert nutritionist specializing in anti-inflammatory meal planning.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    // Parse the response
    const mealText = response.data.choices[0]?.message?.content;
    if (!mealText) {
      throw new Error('No response from GPT-4o');
    }

    // Parse the meal text into structured data
    const parsedMeal = parseMealFromGPT(mealText, options);
    
    // Validate the meal against nutritional requirements
    const validationResult = await validateMeal(parsedMeal, options);
    
    if (!validationResult.valid) {
      // If not valid, try once more with feedback
      return await retryMealGeneration(options, validationResult.reason);
    }
    
    return { meal: parsedMeal, error: null };
  } catch (error: any) {
    console.error('Error generating meal:', error);
    return { meal: null, error: error.message || 'Failed to generate meal' };
  }
}

/**
 * Parse the GPT-4o response into a structured meal object
 * @param mealText Raw text from GPT-4o
 * @param options Original generation options
 * @returns Structured meal object
 */
function parseMealFromGPT(mealText: string, options: MealGenerationOptions): GeneratedMeal {
  // Extract meal name - usually the first line or a line starting with "Meal:"
  const nameMatch = mealText.match(/^(.*?)(?:\n|$)/) || mealText.match(/Meal:\s*(.*?)(?:\n|$)/);
  const name = nameMatch ? nameMatch[1].trim() : 'Generated Meal';
  
  // Extract ingredients - look for a section starting with "Ingredients:" and ending with a blank line
  const ingredientsMatch = mealText.match(/Ingredients:([\s\S]*?)(?:\n\n|\n[A-Z]|$)/);
  const ingredientsText = ingredientsMatch ? ingredientsMatch[1].trim() : '';
  
  // Parse ingredients into structured format
  const ingredients = ingredientsText.split('\n').map(line => {
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith('-') === false) return null;
    
    const ingredient = trimmedLine.substring(1).trim();
    const amountMatch = ingredient.match(/(\d+(?:\.\d+)?)\s*([a-zA-Z]+)/);
    
    if (amountMatch) {
      return {
        name: ingredient.replace(amountMatch[0], '').trim(),
        amount: amountMatch[1],
        unit: amountMatch[2],
        fructose: 0, // Placeholder, will be filled by validation
        omega3: 0,   // Placeholder, will be filled by validation
        omega6: 0    // Placeholder, will be filled by validation
      };
    }
    
    return {
      name: ingredient,
      amount: '1',
      unit: 'serving',
      fructose: 0,
      omega3: 0,
      omega6: 0
    };
  }).filter(Boolean) as GeneratedMeal['ingredients'];
  
  // Extract instructions
  const instructionsMatch = mealText.match(/Instructions:([\s\S]*?)(?:\n\n|\n[A-Z]|$)/);
  const instructions = instructionsMatch 
    ? instructionsMatch[1].trim() 
    : 'No specific instructions provided.';
  
  // Extract nutritional information
  const fructoseMatch = mealText.match(/Fructose:\s*(\d+(?:\.\d+)?)/);
  const omega3Match = mealText.match(/Omega-?3:\s*(\d+(?:\.\d+)?)/);
  const omega6Match = mealText.match(/Omega-?6:\s*(\d+(?:\.\d+)?)/);
  const omegaRatioMatch = mealText.match(/Omega Ratio:\s*(1:[\d.]+)/);
  const proteinMatch = mealText.match(/Protein:\s*(\d+(?:\.\d+)?)/);
  const carbsMatch = mealText.match(/Carbs:\s*(\d+(?:\.\d+)?)/);
  const fatMatch = mealText.match(/Fat:\s*(\d+(?:\.\d+)?)/);
  const caloriesMatch = mealText.match(/Calories:\s*(\d+(?:\.\d+)?)/);
  const ironMatch = mealText.match(/Iron:\s*(\d+(?:\.\d+)?)/);
  const fiberMatch = mealText.match(/Fiber:\s*(\d+(?:\.\d+)?)/);
  const netCarbsMatch = mealText.match(/Net Carbs:\s*(\d+(?:\.\d+)?)/);
  
  // Extract heavy metal content if requested
  const heavyMetalContent = options.includeHeavyMetals 
    ? extractHeavyMetalContent(mealText) 
    : null;
  
  // Calculate macronutrient breakdown
  const protein = proteinMatch ? parseFloat(proteinMatch[1]) : 0;
  const carbs = carbsMatch ? parseFloat(carbsMatch[1]) : 0;
  const fat = fatMatch ? parseFloat(fatMatch[1]) : 0;
  
  const proteinCalories = protein * 4;
  const carbsCalories = carbs * 4;
  const fatCalories = fat * 9;
  const totalCalories = proteinCalories + carbsCalories + fatCalories;
  
  const macronutrientBreakdown = {
    protein_percentage: Math.round((proteinCalories / totalCalories) * 100) || 0,
    carbs_percentage: Math.round((carbsCalories / totalCalories) * 100) || 0,
    fat_percentage: Math.round((fatCalories / totalCalories) * 100) || 0,
  };
  
  // Construct the meal object
  return {
    name,
    type: 'single',
    meal_type: options.mealType || null,
    ingredients,
    instructions,
    total_fructose: fructoseMatch ? parseFloat(fructoseMatch[1]) : 0,
    omega3: omega3Match ? parseFloat(omega3Match[1]) : 0,
    omega6: omega6Match ? parseFloat(omega6Match[1]) : 0,
    omega_ratio: omegaRatioMatch ? omegaRatioMatch[1] : '1:0',
    protein,
    carbs,
    fat,
    calories: caloriesMatch ? parseFloat(caloriesMatch[1]) : 0,
    iron_content: ironMatch ? parseFloat(ironMatch[1]) : 0,
    fiber: fiberMatch ? parseFloat(fiberMatch[1]) : 0,
    heavy_metal_content: heavyMetalContent,
    net_carbs: netCarbsMatch ? parseFloat(netCarbsMatch[1]) : (carbs - (fiberMatch ? parseFloat(fiberMatch[1]) : 0)),
    macronutrient_breakdown,
    follows_2_rules: true, // Will be validated later
    portions: options.portions || 1
  };
}

/**
 * Extract heavy metal content from meal text
 * @param mealText Raw text from GPT-4o
 * @returns Heavy metal content object
 */
function extractHeavyMetalContent(mealText: string): any {
  const heavyMetalSection = mealText.match(/Heavy Metal Content:([\s\S]*?)(?:\n\n|\n[A-Z]|$)/);
  
  if (!heavyMetalSection) return null;
  
  const content = heavyMetalSection[1].trim();
  const heavyMetals: Record<string, number> = {};
  
  // Look for common heavy metals
  const metals = ['Mercury', 'Lead', 'Cadmium', 'Arsenic'];
  
  metals.forEach(metal => {
    const match = content.match(new RegExp(`${metal}:\\s*(\\d+(?:\\.\\d+)?)`));
    if (match) {
      heavyMetals[metal.toLowerCase()] = parseFloat(match[1]);
    }
  });
  
  return Object.keys(heavyMetals).length > 0 ? heavyMetals : null;
}

/**
 * Validate a generated meal against nutritional requirements
 * @param meal Generated meal to validate
 * @param options Original generation options
 * @returns Validation result
 */
async function validateMeal(meal: GeneratedMeal, options: MealGenerationOptions): Promise<{ valid: boolean; reason?: string }> {
  try {
    // Validate ingredients exist in the database and get their nutritional values
    for (let i = 0; i < meal.ingredients.length; i++) {
      const ingredient = meal.ingredients[i];
      
      // Search for the ingredient in the CNF database
      const searchResults = await searchFoods(ingredient.name, 1);
      
      if (searchResults.length === 0) {
        return { valid: false, reason: `Ingredient "${ingredient.name}" not found in database` };
      }
      
      // Get nutritional data for the ingredient
      const nutrients = await getKeyNutrients(searchResults[0].FoodID);
      
      // Calculate nutritional values based on amount
      // This is a simplified calculation - in a real app, you'd need proper unit conversion
      const amountInGrams = parseFloat(ingredient.amount) * 100; // Assuming nutrients are per 100g
      
      // Update the ingredient with actual nutritional values
      meal.ingredients[i] = {
        ...ingredient,
        fructose: nutrients.fructose * amountInGrams / 100,
        omega3: nutrients.omega3 * amountInGrams / 100,
        omega6: nutrients.omega6 * amountInGrams / 100
      };
    }
    
    // Recalculate total nutritional values based on validated ingredients
    let totalFructose = 0;
    let totalOmega3 = 0;
    let totalOmega6 = 0;
    
    meal.ingredients.forEach(ingredient => {
      totalFructose += ingredient.fructose;
      totalOmega3 += ingredient.omega3;
      totalOmega6 += ingredient.omega6;
    });
    
    // Add omega3 supplement if applicable (1/3 for single meal)
    if (options.userOmega3Supplement?.takes_supplement) {
      const { epa_mg, dha_mg, ala_mg } = options.userOmega3Supplement;
      totalOmega3 += (epa_mg + dha_mg + ala_mg) / 1000 / 3; // Convert mg to g and divide by 3 for one meal
    }
    
    // Update meal with recalculated values
    meal.total_fructose = totalFructose;
    meal.omega3 = totalOmega3;
    meal.omega6 = totalOmega6;
    meal.omega_ratio = calculateOmegaRatio(totalOmega3, totalOmega6);
    
    // Check if meal follows the 2 rules
    const fructoseValid = isFructoseValid(totalFructose, options.userHasChronicCondition, false);
    const omegaRatioValid = isOmegaRatioValid(totalOmega3, totalOmega6);
    
    meal.follows_2_rules = fructoseValid && omegaRatioValid;
    
    if (!fructoseValid) {
      return { 
        valid: false, 
        reason: `Fructose content (${totalFructose.toFixed(2)}g) exceeds limit for ${options.userHasChronicCondition ? 'chronic condition' : 'healthy individual'}` 
      };
    }
    
    if (!omegaRatioValid) {
      return { 
        valid: false, 
        reason: `Omega ratio (${meal.omega_ratio}) outside acceptable range of 1:1.5-1:2.9` 
      };
    }
    
    // Check protein goal if specified
    if (options.proteinGoal && meal.protein < options.proteinGoal) {
      return { 
        valid: false, 
        reason: `Protein content (${meal.protein}g) below goal of ${options.proteinGoal}g` 
      };
    }
    
    // Check net carbs limit
    if (meal.net_carbs > mealRules.netCarbsLimits.perMeal) {
      return { 
        valid: false, 
        reason: `Net carbs (${meal.net_carbs}g) exceed limit of ${mealRules.netCarbsLimits.perMeal}g` 
      };
    }
    
    return { valid: true };
  } catch (error: any) {
    console.error('Error validating meal:', error);
    return { valid: false, reason: error.message || 'Failed to validate meal' };
  }
}

/**
 * Retry meal generation with feedback from validation
 * @param options Original generation options
 * @param reason Reason for validation failure
 * @returns New generation attempt
 */
async function retryMealGeneration(options: MealGenerationOptions, reason?: string): Promise<{ meal: GeneratedMeal | null; error: string | null }> {
  try {
    // Calculate fructose limit based on health condition
    const fructoseLimit = options.userHasChronicCondition
      ? mealRules.fructoseLimits.withChronicCondition / 3
      : mealRules.fructoseLimits.withoutChronicCondition / 3;
    
    // Calculate omega3 supplement contribution (if applicable)
    let omega3SupplementInfo = '';
    if (options.userOmega3Supplement?.takes_supplement) {
      const { epa_mg, dha_mg, ala_mg } = options.userOmega3Supplement;
      omega3SupplementInfo = `${epa_mg} mg EPA, ${dha_mg} mg DHA, ${ala_mg} mg ALA`;
    }
    
    // Convert dietary preset to format expected by GPT
    const dietaryPreset = options.userDietaryPreset === '2 Rule' 
      ? 'null' 
      : options.userDietaryPreset.replace(' + 2 Rule', '');
    
    // Build the prompt for GPT-4o with feedback
    const prompt = `You are an expert in nutrition, medicine, and anti-inflammatory meal planning. Only respond with what is asked of you.
Do not create a meal unless it fully satisfies all user constraints. Avoid repeating meals you've previously generated. Vary ingredients and meal types as much as possible within the user's constraints.

The previous meal generation attempt failed because: ${reason}

Please create a new ${options.mealType || 'meal'} with; a 1:1.5-1:2.9 omega 3:6 ratio range including ⅓ of ${omega3SupplementInfo} already, total fructose below ${fructoseLimit}g, ${options.proteinGoal ? `at least ${options.proteinGoal}g of protein,` : ''} ${options.useGrassFed ? 'with' : 'without'} grass fed meat/pastured pork, no ingredients matching ${options.userAllergies.join(', ')}, adhering to a ${options.userDietaryPreferences.join(', ')} diet, adhering to a ${dietaryPreset} diet, ${options.userIronLevels === 'high' ? 'low' : 'high'} in iron, no soy, no ingredients that interact negatively with ${options.userMedications.map(med => med.name).join(', ')}, enough calories for 1 meal for a ${options.userWeight} ${options.userWeightUnit}, ${options.userAge} year old, ${options.userSex}, limit net carbs to 15g, ingredients listed, ${options.includeInstructions ? 'meal prep instructions,' : ''} ${options.includeMacros ? 'a macronutrient profile,' : ''} a report of calories, iron, fiber, ${options.includeHeavyMetals ? 'heavy metal content,' : ''} net carbs.`;

    // Call GPT-4o API
    const response = await openai.createChatCompletion({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an expert nutritionist specializing in anti-inflammatory meal planning.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    // Parse the response
    const mealText = response.data.choices[0]?.message?.content;
    if (!mealText) {
      throw new Error('No response from GPT-4o');
    }

    // Parse the meal text into structured data
    const parsedMeal = parseMealFromGPT(mealText, options);
    
    // Validate the meal against nutritional requirements
    const validationResult = await validateMeal(parsedMeal, options);
    
    if (!validationResult.valid) {
      // If still not valid after retry, return error
      return { 
        meal: null, 
        error: `Failed to generate a compliant meal after retry. ${validationResult.reason}` 
      };
    }
    
    return { meal: parsedMeal, error: null };
  } catch (error: any) {
    console.error('Error retrying meal generation:', error);
    return { meal: null, error: error.message || 'Failed to generate meal on retry' };
  }
}

/**
 * Generate a full day of meals
 * @param options Meal generation options
 * @returns Generated full day or error
 */
export async function generateFullDay(options: MealGenerationOptions): Promise<{ fullDay: GeneratedFullDay | null; error: string | null }> {
  try {
    // Check if user is allowed to generate full day
    // This would typically be handled by the subscription provider
    
    // Calculate fructose limit based on health condition
    const fructoseLimit = options.userHasChronicCondition
      ? mealRules.fructoseLimits.withChronicCondition
      : mealRules.fructoseLimits.withoutChronicCondition;
    
    // Calculate omega3 supplement contribution (if applicable)
    let omega3SupplementInfo = '';
    if (options.userOmega3Supplement?.takes_supplement) {
      const { epa_mg, dha_mg, ala_mg } = options.userOmega3Supplement;
      omega3SupplementInfo = `${epa_mg} mg EPA, ${dha_mg} mg DHA, ${ala_mg} mg ALA`;
    }
    
    // Convert dietary preset to format expected by GPT
    const dietaryPreset = options.userDietaryPreset === '2 Rule' 
      ? 'null' 
      : options.userDietaryPreset.replace(' + 2 Rule', '');
    
    // Build the prompt for GPT-4o
    const prompt = `You are an expert in nutrition, medicine, and anti-inflammatory meal planning. Only respond with what is asked of you.
Do not create a meal unless it fully satisfies all user constraints. Avoid repeating meals you've previously generated. Vary ingredients and meal types as much as possible within the user's constraints.

Create breakfast, lunch, dinner, ${options.includeSnacks ? `${options.includeSnacks === true ? '2' : '1'} snack(s),` : ''} ${options.includeDessert ? '1 dessert' : ''} with; an overall 1:1.5-1:2.9 omega 3:6 ratio range including ${omega3SupplementInfo} already, total daily fructose below ${fructoseLimit}g, at least ${options.proteinGoal}g of protein per ${options.proteinGoalPerDay ? 'day' : 'meal'}, ${options.useGrassFed ? 'with' : 'without'} grass fed meat/pastured pork, no ingredients matching ${options.userAllergies.join(', ')}, adhering to a ${options.userDietaryPreferences.join(', ')} diet, adhering to a ${dietaryPreset} diet, ${options.userIronLevels === 'high' ? 'low' : 'high'} in iron, no soy, no ingredients that interact negatively with ${options.userMedications.map(med => med.name).join(', ')}, enough calories for 1 day for a ${options.userWeight} ${options.userWeightUnit}, ${options.userAge} year old, ${options.userSex}, limit net carbs to ${mealRules.netCarbsLimits.perDay}g/day, ingredients listed, a report of all daily vitamin or mineral deficiencies or toxicities (taking into account user's Vitamins/Supplements), possible interactions with the user's Medications, ${options.includeInstructions ? 'meal prep instructions,' : ''} a macronutrient profile per ${options.proteinGoalPerDay ? 'day' : 'meal'}, calories, iron content, ${options.includeHeavyMetals ? 'heavy metal content,' : ''} fiber content, net carbs.`;

    // Call GPT-4o API
    const response = await openai.createChatCompletion({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an expert nutritionist specializing in anti-inflammatory meal planning.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    // Parse the response
    const fullDayText = response.data.choices[0]?.message?.content;
    if (!fullDayText) {
      throw new Error('No response from GPT-4o');
    }

    // Parse the full day text into structured data
    // This would be a more complex version of parseMealFromGPT
    // For now, we'll return a placeholder implementation
    
    // In a real implementation, you would:
    // 1. Parse each meal separately
    // 2. Validate each meal
    // 3. Validate the full day's nutritional totals
    // 4. Return the structured full day object
    
    return { 
      fullDay: {
        name: 'Full Day Meal Plan',
        breakfast: null, // Would be parsed from the response
        lunch: null,     // Would be parsed from the response
        dinner: null,    // Would be parsed from the response
        snack1: null,    // Would be parsed if includeSnacks
        snack2: null,    // Would be parsed if includeSnacks === 2
        dessert: null,   // Would be parsed if includeDessert
        total_fructose: 0,
        omega3: 0,
        omega6: 0,
        omega_ratio: '1:0',
        total_protein: 0,
        total_carbs: 0,
        total_fat: 0,
        total_calories: 0,
        total_iron: 0,
        total_fiber: 0,
        heavy_metal_report: null,
        total_net_carbs: 0,
        follows_2_rules: true,
        nutrient_deficiencies: null,
        medication_interactions: null
      }, 
      error: 'Full day meal generation not fully implemented yet' 
    };
  } catch (error: any) {
    console.error('Error generating full day:', error);
    return { fullDay: null, error: error.message || 'Failed to generate full day' };
  }
}

/**
 * Generate a full week of meals
 * @param options Meal generation options
 * @returns Generated full week or error
 */
export async function generateFullWeek(options: MealGenerationOptions): Promise<{ fullWeek: GeneratedFullWeek | null; error: string | null }> {
  try {
    // Check if user is allowed to generate full week
    // This would typically be handled by the subscription provider
    
    // In a real implementation, you would:
    // 1. Generate 7 full days of meals
    // 2. Ensure variety across the week
    // 3. Validate the full week's nutritional totals
    // 4. Return the structured full week object
    
    return { 
      fullWeek: {
        name: 'Full Week Meal Plan',
        days: [],
        follows_2_rules: true,
        weekly_nutrient_report: null
      }, 
      error: 'Full week meal generation not implemented yet' 
    };
  } catch (error: any) {
    console.error('Error generating full week:', error);
    return { fullWeek: null, error: error.message || 'Failed to generate full week' };
  }
}

/**
 * Swap an ingredient in a meal
 * @param meal Original meal
 * @param ingredientIndex Index of ingredient to swap
 * @param options Original generation options
 * @returns Updated meal with swapped ingredient or error
 */
export async function swapIngredient(
  meal: GeneratedMeal,
  ingredientIndex: number,
  options: MealGenerationOptions
): Promise<{ meal: GeneratedMeal | null; error: string | null }> {
  try {
    if (ingredientIndex < 0 || ingredientIndex >= meal.ingredients.length) {
      return { meal: null, error: 'Invalid ingredient index' };
    }
    
    const ingredientToSwap = meal.ingredients[ingredientIndex];
    
    // Build the prompt for GPT-4o
    const prompt = `Here are ingredients for a meal: ${meal.ingredients.map(i => i.name).join(', ')}. 
I would like to exchange ${ingredientToSwap.name} for something else with a very similar or less omega 6 and fructose content.`;

    // Call GPT-4o API
    const response = await openai.createChatCompletion({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an expert nutritionist specializing in anti-inflammatory meal planning.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 200,
    });

    // Parse the response
    const swapText = response.data.choices[0]?.message?.content;
    if (!swapText) {
      throw new Error('No response from GPT-4o');
    }

    // Extract the new ingredient name
    const newIngredientName = extractIngredientFromSwapResponse(swapText);
    
    if (!newIngredientName) {
      return { meal: null, error: 'Failed to extract new ingredient from response' };
    }
    
    // Search for the new ingredient in the CNF database
    const searchResults = await searchFoods(newIngredientName, 1);
    
    if (searchResults.length === 0) {
      return { meal: null, error: `Ingredient "${newIngredientName}" not found in database` };
    }
    
    // Get nutritional data for the new ingredient
    const nutrients = await getKeyNutrients(searchResults[0].FoodID);
    
    // Calculate nutritional values based on amount
    // This is a simplified calculation - in a real app, you'd need proper unit conversion
    const amountInGrams = parseFloat(ingredientToSwap.amount) * 100; // Assuming nutrients are per 100g
    
    // Create the new ingredient
    const newIngredient = {
      name: newIngredientName,
      amount: ingredientToSwap.amount,
      unit: ingredientToSwap.unit,
      fructose: nutrients.fructose * amountInGrams / 100,
      omega3: nutrients.omega3 * amountInGrams / 100,
      omega6: nutrients.omega6 * amountInGrams / 100
    };
    
    // Create a copy of the meal with the swapped ingredient
    const updatedMeal = {
      ...meal,
      ingredients: [...meal.ingredients]
    };
    
    updatedMeal.ingredients[ingredientIndex] = newIngredient;
    
    // Recalculate total nutritional values
    let totalFructose = 0;
    let totalOmega3 = 0;
    let totalOmega6 = 0;
    
    updatedMeal.ingredients.forEach(ingredient => {
      totalFructose += ingredient.fructose;
      totalOmega3 += ingredient.omega3;
      totalOmega6 += ingredient.omega6;
    });
    
    // Add omega3 supplement if applicable (1/3 for single meal)
    if (options.userOmega3Supplement?.takes_supplement) {
      const { epa_mg, dha_mg, ala_mg } = options.userOmega3Supplement;
      totalOmega3 += (epa_mg + dha_mg + ala_mg) / 1000 / 3; // Convert mg to g and divide by 3 for one meal
    }
    
    // Update meal with recalculated values
    updatedMeal.total_fructose = totalFructose;
    updatedMeal.omega3 = totalOmega3;
    updatedMeal.omega6 = totalOmega6;
    updatedMeal.omega_ratio = calculateOmegaRatio(totalOmega3, totalOmega6);
    
    // Check if meal still follows the 2 rules
    updatedMeal.follows_2_rules = mealFollows2Rules(
      totalFructose, 
      totalOmega3, 
      totalOmega6, 
      options.userHasChronicCondition,
      false
    );
    
    return { meal: updatedMeal, error: null };
  } catch (error: any) {
    console.error('Error swapping ingredient:', error);
    return { meal: null, error: error.message || 'Failed to swap ingredient' };
  }
}

/**
 * Extract new ingredient name from GPT-4o swap response
 * @param swapText Raw text from GPT-4o
 * @returns New ingredient name
 */
function extractIngredientFromSwapResponse(swapText: string): string | null {
  // Look for patterns like "You can replace X with Y"
  const replacementPatterns = [
    /replace .+ with (.+?)(\.|\n|$)/i,
    /substitute .+ with (.+?)(\.|\n|$)/i,
    /swap .+ for (.+?)(\.|\n|$)/i,
    /use (.+?) instead/i,
    /(.+?) would be a good alternative/i,
    /(.+?) is a suitable replacement/i,
    /(.+?) can be used instead/i
  ];
  
  for (const pattern of replacementPatterns) {
    const match = swapText.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  
  // If no pattern matches, try to find the first food item mentioned
  const lines = swapText.split('\n');
  for (const line of lines) {
    if (line.trim() && !line.toLowerCase().includes('replace') && !line.toLowerCase().includes('swap')) {
      return line.trim();
    }
  }
  
  return null;
}

/**
 * Build a meal from user-selected ingredients
 * @param ingredients List of ingredient names
 * @param options Meal generation options
 * @param follow2Rules Whether to enforce the 2 rules
 * @returns Generated meal or error
 */
export async function buildMealFromIngredients(
  ingredients: string[],
  options: MealGenerationOptions,
  follow2Rules: boolean
): Promise<{ meal: GeneratedMeal | null; error: string | null }> {
  try {
    if (!ingredients || ingredients.length === 0) {
      return { meal: null, error: 'No ingredients provided' };
    }
    
    // Convert dietary preset to format expected by GPT
    const dietaryPreset = options.userDietaryPreset === '2 Rule' 
      ? 'null' 
      : options.userDietaryPreset.replace(' + 2 Rule', '');
    
    let prompt = '';
    
    if (follow2Rules) {
      // Calculate fructose limit based on health condition
      const fructoseLimit = options.userHasChronicCondition
        ? mealRules.fructoseLimits.withChronicCondition / 3
        : mealRules.fructoseLimits.withoutChronicCondition / 3;
      
      // Calculate omega3 supplement contribution (if applicable)
      let omega3SupplementInfo = '';
      if (options.userOmega3Supplement?.takes_supplement) {
        const { epa_mg, dha_mg, ala_mg } = options.userOmega3Supplement;
        omega3SupplementInfo = `${epa_mg} mg EPA, ${dha_mg} mg DHA, ${ala_mg} mg ALA`;
      }
      
      prompt = `You are an expert in nutrition, medicine, and anti-inflammatory meal planning. Only respond with what is asked of you.

Do not create a meal unless it fully satisfies all user constraints. Avoid repeating meals you've previously generated. Vary ingredients and meal types as much as possible within the user's constraints.

Using ${ingredients.join(', ')} and only adding ingredients if required, Create a ${options.mealType || 'meal'} with; a 1:1.5-1:2.9 omega 3:6 ratio range including ⅓ of ${omega3SupplementInfo} already, total fructose below ${fructoseLimit}g, ${options.proteinGoal ? `at least ${options.proteinGoal}g of protein,` : ''} ${options.useGrassFed ? 'with' : 'without'} grass fed meat/pastured pork, no ingredients matching ${options.userAllergies.join(', ')}, adhering to a ${options.userDietaryPreferences.join(', ')} diet, adhering to a ${dietaryPreset} diet, ${options.userIronLevels === 'high' ? 'low' : 'high'} in iron, no ingredients that interact negatively with ${options.userMedications.map(med => med.name).join(', ')}, enough calories for 1 meal for a ${options.userWeight} ${options.userWeightUnit}, ${options.userAge} year old, ${options.userSex}, ingredients listed, total fructose and omega ratio, ${options.includeInstructions ? 'meal prep instructions,' : ''} a macronutrient profile, a report of calories, iron, fiber, ${options.includeHeavyMetals ? 'and heavy metal content.' : '.'}`;
    } else {
      prompt = `You are an expert in nutrition, medicine, and anti-inflammatory meal planning. Only respond with what is asked of you.

Do not create a meal unless it fully satisfies all user constraints. If any requirement cannot be met exactly, respond with:
'No compliant meal is possible with these constraints. Please adjust your preferences and try again.' Avoid repeating meals you've previously generated. Vary ingredients and meal types as much as possible within the user's constraints.

Using ${ingredients.join(', ')} and only adding ingredients if required, Create a ${options.mealType || 'meal'} with; ${options.proteinGoal ? `at least ${options.proteinGoal}g of protein,` : ''} ${options.useGrassFed ? 'with' : 'without'} grass fed meat/pastured pork, no ingredients matching ${options.userAllergies.join(', ')}, adhering to a ${options.userDietaryPreferences.join(', ')} diet, adhering to a ${dietaryPreset} diet, ${options.userIronLevels === 'high' ? 'low' : 'high'} in iron, no ingredients that interact negatively with ${options.userMedications.map(med => med.name).join(', ')}, enough calories for 1 meal for a ${options.userWeight} ${options.userWeightUnit}, ${options.userAge} year old, ${options.userSex}, ingredients listed, total fructose and omega ratio, ${options.includeInstructions ? 'meal prep instructions,' : ''} a macronutrient profile, a report of calories, iron, fiber, ${options.includeHeavyMetals ? 'and heavy metal content.' : '.'}`;
    }

    // Call GPT-4o API
    const response = await openai.createChatCompletion({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an expert nutritionist specializing in anti-inflammatory meal planning.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    // Parse the response
    const mealText = response.data.choices[0]?.message?.content;
    if (!mealText) {
      throw new Error('No response from GPT-4o');
    }
    
    // Check if GPT-4o reported that a compliant meal isn't possible
    if (mealText.includes('No compliant meal is possible with these constraints')) {
      return { meal: null, error: mealText };
    }

    // Parse the meal text into structured data
    const parsedMeal = parseMealFromGPT(mealText, options);
    
    if (follow2Rules) {
      // Validate the meal against nutritional requirements
      const validationResult = await validateMeal(parsedMeal, options);
      
      if (!validationResult.valid) {
        return { meal: null, error: validationResult.reason || 'Failed to create a compliant meal' };
      }
    } else {
      // Still validate ingredients but don't enforce the 2 rules
      for (let i = 0; i < parsedMeal.ingredients.length; i++) {
        const ingredient = parsedMeal.ingredients[i];
        
        // Search for the ingredient in the CNF database
        const searchResults = await searchFoods(ingredient.name, 1);
        
        if (searchResults.length > 0) {
          // Get nutritional data for the ingredient
          const nutrients = await getKeyNutrients(searchResults[0].FoodID);
          
          // Calculate nutritional values based on amount
          const amountInGrams = parseFloat(ingredient.amount) * 100; // Assuming nutrients are per 100g
          
          // Update the ingredient with actual nutritional values
          parsedMeal.ingredients[i] = {
            ...ingredient,
            fructose: nutrients.fructose * amountInGrams / 100,
            omega3: nutrients.omega3 * amountInGrams / 100,
            omega6: nutrients.omega6 * amountInGrams / 100
          };
        }
      }
      
      // Recalculate total nutritional values
      let totalFructose = 0;
      let totalOmega3 = 0;
      let totalOmega6 = 0;
      
      parsedMeal.ingredients.forEach(ingredient => {
        totalFructose += ingredient.fructose;
        totalOmega3 += ingredient.omega3;
        totalOmega6 += ingredient.omega6;
      });
      
      // Add omega3 supplement if applicable (1/3 for single meal)
      if (options.userOmega3Supplement?.takes_supplement) {
        const { epa_mg, dha_mg, ala_mg } = options.userOmega3Supplement;
        totalOmega3 += (epa_mg + dha_mg + ala_mg) / 1000 / 3; // Convert mg to g and divide by 3 for one meal
      }
      
      // Update meal with recalculated values
      parsedMeal.total_fructose = totalFructose;
      parsedMeal.omega3 = totalOmega3;
      parsedMeal.omega6 = totalOmega6;
      parsedMeal.omega_ratio = calculateOmegaRatio(totalOmega3, totalOmega6);
      
      // Check if meal follows the 2 rules but don't enforce it
      parsedMeal.follows_2_rules = mealFollows2Rules(
        totalFructose, 
        totalOmega3, 
        totalOmega6, 
        options.userHasChronicCondition,
        false
      );
    }
    
    return { meal: parsedMeal, error: null };
  } catch (error: any) {
    console.error('Error building meal from ingredients:', error);
    return { meal: null, error: error.message || 'Failed to build meal from ingredients' };
  }
}
