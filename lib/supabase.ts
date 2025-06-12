export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          name: string
          date_of_birth: string
          age: number
          sex: 'male' | 'female' | 'other'
          country: string
          weight: number
          weight_unit: 'lbs' | 'kg'
          wake_up_time: string
          health_conditions: string[] | null
          has_chronic_condition: boolean
          vitamins_supplements: {
            name: string
            amount: string
            unit: string
          }[] | null
          medications: {
            name: string
            dose: string
            rxnorm_id?: string
          }[] | null
          medical_tests: {
            fasting_blood_insulin?: number
            a1c?: number
            blood_pressure?: string
            cholesterol_levels?: {
              total?: number
              ldl?: number
              hdl?: number
              triglycerides?: number
            }
            bone_density?: number
            iron?: number
            crp?: number
            uric_acid?: number
            vitamin_d?: number
            cpk?: number
          } | null
          iron_levels: 'normal' | 'high' | 'low'
          dietary_preferences: string[]
          food_allergies: string[]
          dietary_preset: 'Keto + 2 Rule' | 'Mediterranean + 2 Rule' | 'Paleo + 2 Rule' | 'Carnivore + 2 Rule' | '2 Rule'
          buy_organic: boolean
          weekly_grocery_budget: number | null
          omega3_supplement: {
            takes_supplement: boolean
            epa_mg: number
            dha_mg: number
            ala_mg: number
          }
          last_disclaimer_shown: string | null
          disclaimer_dont_show: boolean
        }
        Insert: {
          id: string
          created_at?: string
          updated_at?: string
          name: string
          date_of_birth: string
          age?: number
          sex: 'male' | 'female' | 'other'
          country: string
          weight: number
          weight_unit: 'lbs' | 'kg'
          wake_up_time: string
          health_conditions?: string[] | null
          has_chronic_condition: boolean
          vitamins_supplements?: {
            name: string
            amount: string
            unit: string
          }[] | null
          medications?: {
            name: string
            dose: string
            rxnorm_id?: string
          }[] | null
          medical_tests?: {
            fasting_blood_insulin?: number
            a1c?: number
            blood_pressure?: string
            cholesterol_levels?: {
              total?: number
              ldl?: number
              hdl?: number
              triglycerides?: number
            }
            bone_density?: number
            iron?: number
            crp?: number
            uric_acid?: number
            vitamin_d?: number
            cpk?: number
          } | null
          iron_levels: 'normal' | 'high' | 'low'
          dietary_preferences?: string[]
          food_allergies?: string[]
          dietary_preset?: 'Keto + 2 Rule' | 'Mediterranean + 2 Rule' | 'Paleo + 2 Rule' | 'Carnivore + 2 Rule' | '2 Rule'
          buy_organic?: boolean
          weekly_grocery_budget?: number | null
          omega3_supplement?: {
            takes_supplement: boolean
            epa_mg: number
            dha_mg: number
            ala_mg: number
          }
          last_disclaimer_shown?: string | null
          disclaimer_dont_show?: boolean
        }
        Update: {
          created_at?: string
          updated_at?: string
          name?: string
          date_of_birth?: string
          age?: number
          sex?: 'male' | 'female' | 'other'
          country?: string
          weight?: number
          weight_unit?: 'lbs' | 'kg'
          wake_up_time?: string
          health_conditions?: string[] | null
          has_chronic_condition?: boolean
          vitamins_supplements?: {
            name: string
            amount: string
            unit: string
          }[] | null
          medications?: {
            name: string
            dose: string
            rxnorm_id?: string
          }[] | null
          medical_tests?: {
            fasting_blood_insulin?: number
            a1c?: number
            blood_pressure?: string
            cholesterol_levels?: {
              total?: number
              ldl?: number
              hdl?: number
              triglycerides?: number
            }
            bone_density?: number
            iron?: number
            crp?: number
            uric_acid?: number
            vitamin_d?: number
            cpk?: number
          } | null
          iron_levels?: 'normal' | 'high' | 'low'
          dietary_preferences?: string[]
          food_allergies?: string[]
          dietary_preset?: 'Keto + 2 Rule' | 'Mediterranean + 2 Rule' | 'Paleo + 2 Rule' | 'Carnivore + 2 Rule' | '2 Rule'
          buy_organic?: boolean
          weekly_grocery_budget?: number | null
          omega3_supplement?: {
            takes_supplement: boolean
            epa_mg: number
            dha_mg: number
            ala_mg: number
          }
          last_disclaimer_shown?: string | null
          disclaimer_dont_show?: boolean
        }
      }
      meals: {
        Row: {
          id: string
          user_id: string
          created_at: string
          updated_at: string
          name: string
          type: 'single' | 'full_day' | 'full_week'
          meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'dessert' | null
          ingredients: {
            name: string
            amount: string
            unit: string
            fructose: number
            omega3: number
            omega6: number
          }[]
          instructions: string
          total_fructose: number
          omega3: number
          omega6: number
          omega_ratio: string
          protein: number
          carbs: number
          fat: number
          calories: number
          iron_content: number
          fiber: number
          heavy_metal_content: Json | null
          net_carbs: number
          macronutrient_breakdown: Json
          follows_2_rules: boolean
          is_favorite: boolean
          portions: number
        }
        Insert: {
          id?: string
          user_id: string
          created_at?: string
          updated_at?: string
          name: string
          type: 'single' | 'full_day' | 'full_week'
          meal_type?: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'dessert' | null
          ingredients: {
            name: string
            amount: string
            unit: string
            fructose: number
            omega3: number
            omega6: number
          }[]
          instructions: string
          total_fructose: number
          omega3: number
          omega6: number
          omega_ratio: string
          protein: number
          carbs: number
          fat: number
          calories: number
          iron_content: number
          fiber: number
          heavy_metal_content?: Json | null
          net_carbs: number
          macronutrient_breakdown: Json
          follows_2_rules: boolean
          is_favorite?: boolean
          portions: number
        }
        Update: {
          user_id?: string
          created_at?: string
          updated_at?: string
          name?: string
          type?: 'single' | 'full_day' | 'full_week'
          meal_type?: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'dessert' | null
          ingredients?: {
            name: string
            amount: string
            unit: string
            fructose: number
            omega3: number
            omega6: number
          }[]
          instructions?: string
          total_fructose?: number
          omega3?: number
          omega6?: number
          omega_ratio?: string
          protein?: number
          carbs?: number
          fat?: number
          calories?: number
          iron_content?: number
          fiber?: number
          heavy_metal_content?: Json | null
          net_carbs?: number
          macronutrient_breakdown?: Json
          follows_2_rules?: boolean
          is_favorite?: boolean
          portions?: number
        }
      }
      full_day_meals: {
        Row: {
          id: string
          user_id: string
          created_at: string
          updated_at: string
          name: string
          breakfast_id: string | null
          lunch_id: string | null
          dinner_id: string | null
          snack1_id: string | null
          snack2_id: string | null
          dessert_id: string | null
          total_fructose: number
          omega3: number
          omega6: number
          omega_ratio: string
          total_protein: number
          total_carbs: number
          total_fat: number
          total_calories: number
          total_iron: number
          total_fiber: number
          heavy_metal_report: Json | null
          total_net_carbs: number
          follows_2_rules: boolean
          is_favorite: boolean
          nutrient_deficiencies: Json | null
          medication_interactions: Json | null
        }
        Insert: {
          id?: string
          user_id: string
          created_at?: string
          updated_at?: string
          name: string
          breakfast_id?: string | null
          lunch_id?: string | null
          dinner_id?: string | null
          snack1_id?: string | null
          snack2_id?: string | null
          dessert_id?: string | null
          total_fructose: number
          omega3: number
          omega6: number
          omega_ratio: string
          total_protein: number
          total_carbs: number
          total_fat: number
          total_calories: number
          total_iron: number
          total_fiber: number
          heavy_metal_report?: Json | null
          total_net_carbs: number
          follows_2_rules: boolean
          is_favorite?: boolean
          nutrient_deficiencies?: Json | null
          medication_interactions?: Json | null
        }
        Update: {
          user_id?: string
          created_at?: string
          updated_at?: string
          name?: string
          breakfast_id?: string | null
          lunch_id?: string | null
          dinner_id?: string | null
          snack1_id?: string | null
          snack2_id?: string | null
          dessert_id?: string | null
          total_fructose?: number
          omega3?: number
          omega6?: number
          omega_ratio?: string
          total_protein?: number
          total_carbs?: number
          total_fat?: number
          total_calories?: number
          total_iron?: number
          total_fiber?: number
          heavy_metal_report?: Json | null
          total_net_carbs?: number
          follows_2_rules?: boolean
          is_favorite?: boolean
          nutrient_deficiencies?: Json | null
          medication_interactions?: Json | null
        }
      }
      full_week_meals: {
        Row: {
          id: string
          user_id: string
          created_at: string
          updated_at: string
          name: string
          days: {
            day_number: number
            full_day_id: string
          }[]
          follows_2_rules: boolean
          is_favorite: boolean
          weekly_nutrient_report: Json | null
        }
        Insert: {
          id?: string
          user_id: string
          created_at?: string
          updated_at?: string
          name: string
          days: {
            day_number: number
            full_day_id: string
          }[]
          follows_2_rules: boolean
          is_favorite?: boolean
          weekly_nutrient_report?: Json | null
        }
        Update: {
          user_id?: string
          created_at?: string
          updated_at?: string
          name?: string
          days?: {
            day_number: number
            full_day_id: string
          }[]
          follows_2_rules?: boolean
          is_favorite?: boolean
          weekly_nutrient_report?: Json | null
        }
      }
      calendar_entries: {
        Row: {
          id: string
          user_id: string
          created_at: string
          updated_at: string
          date: string
          breakfast_id: string | null
          lunch_id: string | null
          dinner_id: string | null
          snack1_id: string | null
          snack2_id: string | null
          dessert_id: string | null
          full_day_id: string | null
          daily_fructose: number
          daily_omega_ratio: string
        }
        Insert: {
          id?: string
          user_id: string
          created_at?: string
          updated_at?: string
          date: string
          breakfast_id?: string | null
          lunch_id?: string | null
          dinner_id?: string | null
          snack1_id?: string | null
          snack2_id?: string | null
          dessert_id?: string | null
          full_day_id?: string | null
          daily_fructose: number
          daily_omega_ratio: string
        }
        Update: {
          user_id?: string
          created_at?: string
          updated_at?: string
          date?: string
          breakfast_id?: string | null
          lunch_id?: string | null
          dinner_id?: string | null
          snack1_id?: string | null
          snack2_id?: string | null
          dessert_id?: string | null
          full_day_id?: string | null
          daily_fructose?: number
          daily_omega_ratio?: string
        }
      }
      grocery_lists: {
        Row: {
          id: string
          user_id: string
          created_at: string
          updated_at: string
          name: string
          date_range: {
            start_date: string
            end_date: string
          }
          items: {
            category: string
            items: {
              name: string
              amount: string
              unit: string
              organic: boolean
            }[]
          }[]
        }
        Insert: {
          id?: string
          user_id: string
          created_at?: string
          updated_at?: string
          name: string
          date_range: {
            start_date: string
            end_date: string
          }
          items: {
            category: string
            items: {
              name: string
              amount: string
              unit: string
              organic: boolean
            }[]
          }[]
        }
        Update: {
          user_id?: string
          created_at?: string
          updated_at?: string
          name?: string
          date_range?: {
            start_date: string
            end_date: string
          }
          items?: {
            category: string
            items: {
              name: string
              amount: string
              unit: string
              organic: boolean
            }[]
          }[]
        }
      }
      my_foods: {
        Row: {
          id: string
          user_id: string
          created_at: string
          updated_at: string
          name: string
          amount: number
          unit: string
          fructose: number
          omega3: number
          omega6: number
          protein: number
          carbs: number
          fat: number
          calories: number
          iron: number
          fiber: number
          source: 'USDA' | 'CNF' | 'user' | 'barcode'
          source_id: string | null
          barcode: string | null
        }
        Insert: {
          id?: string
          user_id: string
          created_at?: string
          updated_at?: string
          name: string
          amount: number
          unit: string
          fructose: number
          omega3: number
          omega6: number
          protein: number
          carbs: number
          fat: number
          calories: number
          iron: number
          fiber: number
          source: 'USDA' | 'CNF' | 'user' | 'barcode'
          source_id?: string | null
          barcode?: string | null
        }
        Update: {
          user_id?: string
          created_at?: string
          updated_at?: string
          name?: string
          amount?: number
          unit?: string
          fructose?: number
          omega3?: number
          omega6?: number
          protein?: number
          carbs?: number
          fat?: number
          calories?: number
          iron?: number
          fiber?: number
          source?: 'USDA' | 'CNF' | 'user' | 'barcode'
          source_id?: string | null
          barcode?: string | null
        }
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          created_at: string
          updated_at: string
          stripe_customer_id: string
          stripe_subscription_id: string
          status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete'
          tier: 'free' | 'premium'
          price_id: string
          interval: 'month' | '3-month' | '6-month' | 'year'
          current_period_start: string
          current_period_end: string
          cancel_at_period_end: boolean
          meals_generated_count: number
          meals_saved_count: number
          ingredient_swaps_count: number
          additional_profiles: string[] | null
        }
        Insert: {
          id?: string
          user_id: string
          created_at?: string
          updated_at?: string
          stripe_customer_id: string
          stripe_subscription_id: string
          status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete'
          tier: 'free' | 'premium'
          price_id: string
          interval: 'month' | '3-month' | '6-month' | 'year'
          current_period_start: string
          current_period_end: string
          cancel_at_period_end?: boolean
          meals_generated_count?: number
          meals_saved_count?: number
          ingredient_swaps_count?: number
          additional_profiles?: string[] | null
        }
        Update: {
          user_id?: string
          created_at?: string
          updated_at?: string
          stripe_customer_id?: string
          stripe_subscription_id?: string
          status?: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete'
          tier?: 'free' | 'premium'
          price_id?: string
          interval?: 'month' | '3-month' | '6-month' | 'year'
          current_period_start?: string
          current_period_end?: string
          cancel_at_period_end?: boolean
          meals_generated_count?: number
          meals_saved_count?: number
          ingredient_swaps_count?: number
          additional_profiles?: string[] | null
        }
      }
      medical_disclaimer_consents: {
        Row: {
          id: string
          user_id: string
          created_at: string
          consented_at: string
          ip_address: string | null
          user_agent: string | null
        }
        Insert: {
          id?: string
          user_id: string
          created_at?: string
          consented_at: string
          ip_address?: string | null
          user_agent?: string | null
        }
        Update: {
          user_id?: string
          created_at?: string
          consented_at?: string
          ip_address?: string | null
          user_agent?: string | null
        }
      }
      cnf_foods: {
        Row: {
          id: string
          food_code: string
          food_description: string
          food_group: string
          food_source: string
          nutrient_data: {
            fructose: number
            omega3: number
            omega6: number
            protein: number
            carbs: number
            fat: number
            calories: number
            iron: number
            fiber: number
            vitamins: Json
            minerals: Json
            heavy_metals: Json | null
          }
        }
        Insert: {
          id?: string
          food_code: string
          food_description: string
          food_group: string
          food_source: string
          nutrient_data: {
            fructose: number
            omega3: number
            omega6: number
            protein: number
            carbs: number
            fat: number
            calories: number
            iron: number
            fiber: number
            vitamins: Json
            minerals: Json
            heavy_metals: Json | null
          }
        }
        Update: {
          food_code?: string
          food_description?: string
          food_group?: string
          food_source?: string
          nutrient_data?: {
            fructose: number
            omega3: number
            omega6: number
            protein: number
            carbs: number
            fat: number
            calories: number
            iron: number
            fiber: number
            vitamins: Json
            minerals: Json
            heavy_metals: Json | null
          }
        }
      }
      // CNF 2015 Database Tables
      FOOD_NAME: {
        Row: {
          FoodID: number
          FoodCode: string
          FoodDescription: string
          FoodGroupID: number
          FoodSourceID: number
          CountryCode: number
          ScientificName: string | null
        }
        Insert: {
          FoodID: number
          FoodCode: string
          FoodDescription: string
          FoodGroupID: number
          FoodSourceID: number
          CountryCode: number
          ScientificName?: string | null
        }
        Update: {
          FoodID?: number
          FoodCode?: string
          FoodDescription?: string
          FoodGroupID?: number
          FoodSourceID?: number
          CountryCode?: number
          ScientificName?: string | null
        }
      }
      NUTRIENT_AMOUNT: {
        Row: {
          FoodID: number
          NutrientID: number
          NutrientValue: number
          StandardError: number | null
          NumberOfObservations: number | null
          NutrientSourceID: number
          NutrientDateOfEntry: string | null
        }
        Insert: {
          FoodID: number
          NutrientID: number
          NutrientValue: number
          StandardError?: number | null
          NumberOfObservations?: number | null
          NutrientSourceID: number
          NutrientDateOfEntry?: string | null
        }
        Update: {
          FoodID?: number
          NutrientID?: number
          NutrientValue?: number
          StandardError?: number | null
          NumberOfObservations?: number | null
          NutrientSourceID?: number
          NutrientDateOfEntry?: string | null
        }
      }
      NUTRIENT_NAME: {
        Row: {
          NutrientID: number
          NutrientCode: string
          NutrientSymbol: string | null
          NutrientUnit: string
          NutrientName: string
          NutrientDecimalPlaces: number
          TagName: string | null
        }
        Insert: {
          NutrientID: number
          NutrientCode: string
          NutrientSymbol?: string | null
          NutrientUnit: string
          NutrientName: string
          NutrientDecimalPlaces: number
          TagName?: string | null
        }
        Update: {
          NutrientID?: number
          NutrientCode?: string
          NutrientSymbol?: string | null
          NutrientUnit?: string
          NutrientName?: string
          NutrientDecimalPlaces?: number
          TagName?: string | null
        }
      }
      MEASURE_NAME: {
        Row: {
          MeasureID: number
          MeasureDescription: string
        }
        Insert: {
          MeasureID: number
          MeasureDescription: string
        }
        Update: {
          MeasureID?: number
          MeasureDescription?: string
        }
      }
      FOOD_GROUP: {
        Row: {
          FoodGroupID: number
          FoodGroupCode: string
          FoodGroupName: string
        }
        Insert: {
          FoodGroupID: number
          FoodGroupCode: string
          FoodGroupName: string
        }
        Update: {
          FoodGroupID?: number
          FoodGroupCode?: string
          FoodGroupName?: string
        }
      }
      FOOD_SOURCE: {
        Row: {
          FoodSourceID: number
          FoodSourceDescription: string
        }
        Insert: {
          FoodSourceID: number
          FoodSourceDescription: string
        }
        Update: {
          FoodSourceID?: number
          FoodSourceDescription?: string
        }
      }
      NUTRIENT_SOURCE: {
        Row: {
          NutrientSourceID: number
          NutrientSourceCode: string
          NutrientSourceDescription: string
          NutrientSourceDescriptionF: string
        }
        Insert: {
          NutrientSourceID: number
          NutrientSourceCode: string
          NutrientSourceDescription: string
          NutrientSourceDescriptionF: string
        }
        Update: {
          NutrientSourceID?: number
          NutrientSourceCode?: string
          NutrientSourceDescription?: string
          NutrientSourceDescriptionF?: string
        }
      }
      REFUSE_NAME: {
        Row: {
          RefuseID: number
          RefuseDescription: string
        }
        Insert: {
          RefuseID: number
          RefuseDescription: string
        }
        Update: {
          RefuseID?: number
          RefuseDescription?: string
        }
      }
      YIELD_NAME: {
        Row: {
          YieldID: number
          YieldDescription: string
        }
        Insert: {
          YieldID: number
          YieldDescription: string
        }
        Update: {
          YieldID?: number
          YieldDescription?: string
        }
      }
      CONVERSION_FACTOR: {
        Row: {
          FoodID: number
          MeasureID: number
          ConversionFactorValue: number
          ConversionDate: string | null
        }
        Insert: {
          FoodID: number
          MeasureID: number
          ConversionFactorValue: number
          ConversionDate?: string | null
        }
        Update: {
          FoodID?: number
          MeasureID?: number
          ConversionFactorValue?: number
          ConversionDate?: string | null
        }
      }
      REFUSE_AMOUNT: {
        Row: {
          FoodID: number
          RefuseID: number
          RefuseAmount: number
        }
        Insert: {
          FoodID: number
          RefuseID: number
          RefuseAmount: number
        }
        Update: {
          FoodID?: number
          RefuseID?: number
          RefuseAmount?: number
        }
      }
      YIELD_AMOUNT: {
        Row: {
          FoodID: number
          YieldID: number
          YieldAmount: number
        }
        Insert: {
          FoodID: number
          YieldID: number
          YieldAmount: number
        }
        Update: {
          FoodID?: number
          YieldID?: number
          YieldAmount?: number
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Insertable<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type Updatable<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Re-export the browser client for convenience
export { createClient as createBrowserClient } from './supabase-browser'
