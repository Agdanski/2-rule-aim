import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO, isValid, differenceInYears } from "date-fns";
import { NutrientSummary } from "./cnf-integration";
import { mealRules } from "./constants";

/**
 * Combines multiple class names using clsx and tailwind-merge
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a date string to a readable format
 */
export function formatDate(date: string | Date, formatStr: string = "PPP") {
  if (!date) return "";
  
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  
  if (!isValid(dateObj)) return "";
  
  return format(dateObj, formatStr);
}

/**
 * Calculate age from date of birth
 */
export function calculateAge(dateOfBirth: string | Date): number {
  if (!dateOfBirth) return 0;
  
  const birthDate = typeof dateOfBirth === "string" 
    ? parseISO(dateOfBirth) 
    : dateOfBirth;
  
  if (!isValid(birthDate)) return 0;
  
  return differenceInYears(new Date(), birthDate);
}

/**
 * Format currency with proper symbol and decimals
 */
export function formatCurrency(
  amount: number,
  currency: string = "USD",
  locale: string = "en-US"
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Convert weight between kg and lbs
 */
export function convertWeight(
  weight: number,
  from: "kg" | "lbs",
  to: "kg" | "lbs"
): number {
  if (from === to) return weight;
  
  if (from === "kg" && to === "lbs") {
    return weight * 2.20462;
  } else {
    return weight / 2.20462;
  }
}

/**
 * Calculate omega ratio as a string (e.g. "1:2.5")
 */
export function calculateOmegaRatio(omega3: number, omega6: number): string {
  if (omega3 <= 0) return "N/A";
  
  const ratio = omega6 / omega3;
  return `1:${ratio.toFixed(2)}`;
}

/**
 * Check if omega ratio is within acceptable range
 */
export function isOmegaRatioValid(omega3: number, omega6: number): boolean {
  if (omega3 <= 0) return false;
  
  const ratio = omega6 / omega3;
  return ratio >= mealRules.omegaRatioRange.min && ratio <= mealRules.omegaRatioRange.max;
}

/**
 * Check if fructose amount is within daily limit based on health condition
 */
export function isFructoseValid(
  fructose: number,
  hasChronicCondition: boolean,
  isFullDay: boolean = false
): boolean {
  const limit = hasChronicCondition
    ? mealRules.fructoseLimits.withChronicCondition
    : mealRules.fructoseLimits.withoutChronicCondition;
  
  // If checking a single meal, divide the limit by 3 (approximate per meal)
  const adjustedLimit = isFullDay ? limit : limit / 3;
  
  return fructose <= adjustedLimit;
}

/**
 * Check if a meal follows both of the 2 rules
 */
export function mealFollows2Rules(
  fructose: number,
  omega3: number,
  omega6: number,
  hasChronicCondition: boolean,
  isFullDay: boolean = false
): boolean {
  return (
    isOmegaRatioValid(omega3, omega6) &&
    isFructoseValid(fructose, hasChronicCondition, isFullDay)
  );
}

/**
 * Calculate macronutrient percentages from grams
 */
export function calculateMacroPercentages(protein: number, carbs: number, fat: number) {
  const proteinCalories = protein * 4;
  const carbsCalories = carbs * 4;
  const fatCalories = fat * 9;
  
  const totalCalories = proteinCalories + carbsCalories + fatCalories;
  
  if (totalCalories === 0) return { protein: 0, carbs: 0, fat: 0 };
  
  return {
    protein: Math.round((proteinCalories / totalCalories) * 100),
    carbs: Math.round((carbsCalories / totalCalories) * 100),
    fat: Math.round((fatCalories / totalCalories) * 100),
  };
}

/**
 * Calculate net carbs (total carbs - fiber)
 */
export function calculateNetCarbs(totalCarbs: number, fiber: number): number {
  return Math.max(0, totalCarbs - fiber);
}

/**
 * Generate a hash for a meal based on its ingredients
 * Used for duplicate detection
 */
export function generateMealHash(ingredients: string[]): string {
  // Clean and normalize ingredient names
  const normalizedIngredients = ingredients.map(ingredient => {
    return ingredient
      .toLowerCase()
      .replace(/\b(grilled|baby|roasted|fresh|frozen|cooked|raw|organic)\b/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  });
  
  // Sort and deduplicate
  const uniqueIngredients = [...new Set(normalizedIngredients)].sort();
  
  // Join with a delimiter
  return uniqueIngredients.join('-');
}

/**
 * Check if two meals are similar based on ingredients
 */
export function areMealsSimilar(ingredients1: string[], ingredients2: string[], threshold: number = 0.75): boolean {
  // Clean and normalize
  const normalized1 = ingredients1.map(i => i.toLowerCase().trim());
  const normalized2 = ingredients2.map(i => i.toLowerCase().trim());
  
  // Find common ingredients
  const common = normalized1.filter(i => normalized2.some(j => j.includes(i) || i.includes(j)));
  
  // Calculate similarity
  const similarity = common.length / Math.max(normalized1.length, normalized2.length);
  
  return similarity >= threshold;
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
}

/**
 * Safely access nested object properties
 */
export function safeGet<T>(obj: any, path: string, defaultValue: T): T {
  try {
    const keys = path.split('.');
    let result = obj;
    
    for (const key of keys) {
      if (result === undefined || result === null) return defaultValue;
      result = result[key];
    }
    
    return result === undefined || result === null ? defaultValue : result;
  } catch (error) {
    return defaultValue;
  }
}

/**
 * Deep clone an object
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

/**
 * Get initials from a name
 */
export function getInitials(name: string): string {
  if (!name) return '';
  
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
}
