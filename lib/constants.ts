import { NutrientSummary } from "./cnf-integration";

/**
 * List of countries for profile setup
 */
export const countries = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria", 
  "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", 
  "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cabo Verde", "Cambodia", 
  "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo", "Costa Rica", 
  "Croatia", "Cuba", "Cyprus", "Czech Republic", "Denmark", "Djibouti", "Dominica", "Dominican Republic", "Ecuador", "Egypt", 
  "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia", "Fiji", "Finland", "France", "Gabon", 
  "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana", 
  "Haiti", "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", 
  "Italy", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Korea, North", "Korea, South", "Kosovo", 
  "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", 
  "Luxembourg", "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", 
  "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar", "Namibia", 
  "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Macedonia", "Norway", "Oman", 
  "Pakistan", "Palau", "Palestine", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal", 
  "Qatar", "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe", 
  "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", 
  "South Africa", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria", "Taiwan", 
  "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", 
  "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan", "Vanuatu", "Vatican City", 
  "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe"
];

/**
 * EWG's Dirty Dozen foods (recommended to buy organic)
 */
export const dirtyDozenFoods = [
  "Strawberries",
  "Spinach",
  "Kale",
  "Collard",
  "Mustard Greens",
  "Grapes",
  "Peaches",
  "Pears",
  "Nectarines",
  "Apples",
  "Bell Peppers",
  "Hot Peppers",
  "Cherries",
  "Blueberries",
  "Green Beans"
];

/**
 * Dietary preference options
 */
export const dietaryPreferenceOptions = [
  'Dairy free', 
  'Gluten free', 
  'Vegetarian', 
  'Vegan', 
  'Pescatarian', 
  'No pork', 
  'FODMAP', 
  'No seafood', 
  'No beef', 
  'Other'
];

/**
 * Food allergy options
 */
export const allergyOptions = [
  'Milk', 
  'Eggs', 
  'Peanuts', 
  'Tree nuts', 
  'Soy', 
  'Wheat', 
  'Fish', 
  'Shellfish', 
  'Sesame', 
  'Gluten', 
  'Corn', 
  'Oats', 
  'Strawberries', 
  'Tomatoes', 
  'Citrus fruits', 
  'Other'
];

/**
 * Dietary preset options
 */
export const dietaryPresetOptions = [
  '2 Rule',
  'Keto + 2 Rule',
  'Mediterranean + 2 Rule',
  'Paleo + 2 Rule',
  'Carnivore + 2 Rule'
];

/**
 * Meal types
 */
export const mealTypes = [
  'breakfast',
  'lunch',
  'dinner',
  'snack',
  'dessert'
];

/**
 * Sample meals preloaded for all users
 */
export const sampleMeals = [
  {
    id: 'sample-meal-1',
    name: 'Mac & Cheese',
    type: 'single',
    meal_type: 'lunch',
    ingredients: [
      { name: 'chickpea elbow pasta (dry)', amount: '75', unit: 'g', fructose: 0.5, omega3: 0.2, omega6: 0.4 },
      { name: 'shredded cheddar cheese', amount: '30', unit: 'g', fructose: 0.1, omega3: 0.1, omega6: 0.3 },
      { name: 'butter', amount: '10', unit: 'g', fructose: 0, omega3: 0.1, omega6: 0.2 },
      { name: 'ground flaxseed', amount: '7', unit: 'g', fructose: 0.04, omega3: 1.6, omega6: 0.43 },
      { name: 'cooked broccoli (steamed)', amount: '30', unit: 'g', fructose: 0.7, omega3: 0.11, omega6: 0.1 }
    ],
    instructions: 'Cook pasta until al dente. Drain and stir in cheese, butter, and flaxseed while hot. Serve with steamed broccoli on the side.',
    total_fructose: 2.34,
    omega3: 3.51,
    omega6: 7.03,
    omega_ratio: '1:2.00',
    protein: 45,
    carbs: 70,
    fat: 39,
    calories: 811,
    iron_content: 4.2,
    fiber: 12,
    heavy_metal_content: null,
    net_carbs: 58,
    macronutrient_breakdown: {
      protein_percentage: 22,
      carbs_percentage: 35,
      fat_percentage: 43
    },
    follows_2_rules: true,
    is_favorite: false,
    portions: 1
  },
  {
    id: 'sample-meal-2',
    name: 'Burger & Turnip Fries',
    type: 'single',
    meal_type: 'dinner',
    ingredients: [
      { name: 'ground beef patty', amount: '100', unit: 'g', fructose: 0, omega3: 0.05, omega6: 0.2 },
      { name: 'flax-almond flour bread', amount: '25', unit: 'g', fructose: 0.3, omega3: 1.2, omega6: 0.6 },
      { name: 'baked turnip fries (olive oil)', amount: '100', unit: 'g', fructose: 1.8, omega3: 0.12, omega6: 1.3 },
      { name: 'avocado', amount: '15', unit: 'g', fructose: 0.93, omega3: 0.8, omega6: 2.66 }
    ],
    instructions: 'Grill burger patty. Toast bread slice. Bake turnip sticks tossed in olive oil until crispy. Serve with avocado on top of the burger.',
    total_fructose: 3.03,
    omega3: 2.17,
    omega6: 4.76,
    omega_ratio: '1:2.20',
    protein: 58,
    carbs: 32,
    fat: 50,
    calories: 810,
    iron_content: 3.8,
    fiber: 8,
    heavy_metal_content: null,
    net_carbs: 24,
    macronutrient_breakdown: {
      protein_percentage: 29,
      carbs_percentage: 16,
      fat_percentage: 55
    },
    follows_2_rules: true,
    is_favorite: false,
    portions: 1
  },
  {
    id: 'sample-meal-3',
    name: 'Flaxseed Crust Pizza',
    type: 'single',
    meal_type: 'dinner',
    ingredients: [
      { name: 'flaxseed-based crust', amount: '75', unit: 'g', fructose: 0.4, omega3: 3.2, omega6: 0.8 },
      { name: 'tomato sauce (no added sugar)', amount: '25', unit: 'g', fructose: 1.2, omega3: 0.02, omega6: 0.14 },
      { name: 'mozzarella', amount: '30', unit: 'g', fructose: 0.1, omega3: 0.1, omega6: 0.2 },
      { name: 'arugula', amount: '20', unit: 'g', fructose: 0.17, omega3: 0.1, omega6: 0.1 },
      { name: 'sautéed mushrooms', amount: '30', unit: 'g', fructose: 0.1, omega3: 0, omega6: 0.1 },
      { name: 'chia seeds', amount: '3', unit: 'g', fructose: 0, omega3: 0.6, omega6: 0.2 }
    ],
    instructions: 'Bake flax crust with sauce and cheese. Add mushrooms before baking. Top with arugula and chia seeds before serving.',
    total_fructose: 3.97,
    omega3: 4.72,
    omega6: 9.44,
    omega_ratio: '1:2.00',
    protein: 52,
    carbs: 45,
    fat: 47,
    calories: 811,
    iron_content: 5.2,
    fiber: 18,
    heavy_metal_content: null,
    net_carbs: 27,
    macronutrient_breakdown: {
      protein_percentage: 26,
      carbs_percentage: 22,
      fat_percentage: 52
    },
    follows_2_rules: true,
    is_favorite: false,
    portions: 1
  },
  {
    id: 'sample-meal-4',
    name: 'Chicken Wings',
    type: 'single',
    meal_type: 'dinner',
    ingredients: [
      { name: 'skin-on chicken wings (baked, dry-rubbed)', amount: '150', unit: 'g', fructose: 0, omega3: 0.3, omega6: 2.1 },
      { name: 'avocado oil', amount: '5', unit: 'g', fructose: 0, omega3: 0.06, omega6: 0.62 },
      { name: 'celery sticks', amount: '40', unit: 'g', fructose: 0.4, omega3: 0.1, omega6: 0.2 },
      { name: 'carrot sticks', amount: '30', unit: 'g', fructose: 0.6, omega3: 0, omega6: 0.1 },
      { name: 'ground chia seeds (in side dip)', amount: '10', unit: 'g', fructose: 0.08, omega3: 1.8, omega6: 0.6 }
    ],
    instructions: 'Dry-rub and bake wings until crispy. Serve with raw celery and carrot sticks and a dip made from ground chia, lemon, and spices.',
    total_fructose: 2.48,
    omega3: 4.96,
    omega6: 9.92,
    omega_ratio: '1:2.00',
    protein: 65,
    carbs: 16,
    fat: 54,
    calories: 810,
    iron_content: 3.5,
    fiber: 9,
    heavy_metal_content: null,
    net_carbs: 7,
    macronutrient_breakdown: {
      protein_percentage: 32,
      carbs_percentage: 8,
      fat_percentage: 60
    },
    follows_2_rules: true,
    is_favorite: false,
    portions: 1
  },
  {
    id: 'sample-meal-5',
    name: 'Spaghetti and Meatballs',
    type: 'single',
    meal_type: 'dinner',
    ingredients: [
      { name: 'cooked lentil spaghetti', amount: '75', unit: 'g', fructose: 0.5, omega3: 0.1, omega6: 0.3 },
      { name: 'conventional beef meatballs', amount: '80', unit: 'g', fructose: 0, omega3: 0.04, omega6: 0.24 },
      { name: 'walnut pesto', amount: '25', unit: 'g', fructose: 0.3, omega3: 2.5, omega6: 5.3 },
      { name: 'grilled zucchini', amount: '50', unit: 'g', fructose: 1.0, omega3: 0.06, omega6: 0.1 },
      { name: 'hemp seeds', amount: '10', unit: 'g', fructose: 0, omega3: 1.1, omega6: 2.2 }
    ],
    instructions: 'Prepare meatballs using conventional ground beef and bake or pan-sear. Toss cooked lentil spaghetti with walnut pesto, add grilled zucchini, and top with meatballs and hemp seeds.',
    total_fructose: 3.8,
    omega3: 3.8,
    omega6: 8.14,
    omega_ratio: '1:2.14',
    protein: 54,
    carbs: 47,
    fat: 45,
    calories: 809,
    iron_content: 4.8,
    fiber: 14,
    heavy_metal_content: null,
    net_carbs: 33,
    macronutrient_breakdown: {
      protein_percentage: 27,
      carbs_percentage: 23,
      fat_percentage: 50
    },
    follows_2_rules: true,
    is_favorite: false,
    portions: 1
  }
];

/**
 * App subscription tiers and pricing
 */
export const subscriptionTiers = {
  free: {
    name: 'Free',
    features: [
      'Generate 1 meal at a time',
      'Apply 1 dietary filter (e.g., dairy-free, gluten-free)',
      'Set dietary preset (e.g., Keto)',
      'View nutrition info for that meal',
      'Save up to 2 meals',
      'Learn how the 2 Rule system works'
    ],
    limitations: [
      'Cannot build full meal plans',
      'No grocery lists',
      'Limited to 2 saved meals'
    ]
  },
  premium: {
    name: 'Premium',
    features: [
      'Build 1-day or 7-day meal plans',
      'Save 14 days of meals (42 meals) every month',
      'Create grocery lists',
      'Track fructose & omega ratio per day',
      'Use multiple dietary filters and preferences',
      'Include snacks and desserts',
      'Use of the Meal Builder to add custom ingredients',
      'Ingredient swapping in Meal Builder (limited to 12/month)',
      'Add family member profiles at a 50% discount'
    ],
    pricing: {
      monthly: {
        price: 12.00,
        interval: 'month',
        savings: 0,
        savingsPercentage: 0
      },
      quarterly: {
        price: 33.00,
        interval: '3-month',
        savings: 3.00,
        savingsPercentage: 8.3
      },
      biannually: {
        price: 60.00,
        interval: '6-month',
        savings: 12.00,
        savingsPercentage: 16.7
      },
      annually: {
        price: 96.00,
        interval: 'year',
        savings: 48.00,
        savingsPercentage: 33.3
      }
    },
    familyMemberPricing: {
      monthly: {
        price: 6.00,
        interval: 'month',
        savings: 0,
        savingsPercentage: 0
      },
      quarterly: {
        price: 16.50,
        interval: '3-month',
        savings: 1.50,
        savingsPercentage: 8.3
      },
      biannually: {
        price: 30.00,
        interval: '6-month',
        savings: 6.00,
        savingsPercentage: 16.7
      },
      annually: {
        price: 48.00,
        interval: 'year',
        savings: 24.00,
        savingsPercentage: 33.3
      }
    }
  }
};

/**
 * Meal generation rules
 */
export const mealRules = {
  fructoseLimits: {
    withChronicCondition: 15, // grams per day
    withoutChronicCondition: 25 // grams per day
  },
  omegaRatioRange: {
    min: 1.5, // 1:1.5
    max: 2.9  // 1:2.9
  },
  netCarbsLimits: {
    perMeal: 15, // grams
    perDay: 45   // grams
  }
};

/**
 * App navigation items
 */
export const navigationItems = [
  { name: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard' },
  { name: 'Meal Generator', href: '/meal-generator', icon: 'Sparkles' },
  { name: 'Meal Builder', href: '/meal-builder', icon: 'Utensils' },
  { name: 'Saved Meals', href: '/saved-meals', icon: 'BookmarkCheck' },
  { name: 'Calendar', href: '/calendar', icon: 'Calendar' },
  { name: 'Grocery Lists', href: '/grocery-lists', icon: 'ShoppingCart' },
  { name: 'My Foods', href: '/my-foods', icon: 'Apple' },
  { name: 'Resources', href: '/resources', icon: 'BookOpen' },
  { name: 'FAQ', href: '/faq', icon: 'HelpCircle' },
  { name: 'About', href: '/about', icon: 'Info' },
  { name: 'Profile Settings', href: '/profile-settings', icon: 'Settings' },
  { name: 'Pricing', href: '/pricing', icon: 'CreditCard' },
  { name: 'Help', href: '/help', icon: 'LifeBuoy' },
  { name: 'Contact Us', href: '/contact', icon: 'Mail' }
];

/**
 * Resource links
 */
export const resourceLinks = [
  { title: 'Sleep', url: 'https://example.com/sleep-resources' },
  { title: 'Cooking and decreasing AGE\'s', url: 'https://example.com/cooking-ages' },
  { title: 'Exercise', url: 'https://example.com/exercise-resources' },
  { title: 'Supplements to consider and why?', url: 'https://example.com/supplements-guide' },
  { title: 'General health', url: 'https://www.mercola.com' },
  { title: 'Stress: Michael Singer Podcast - Sounds True, Living Untethered', url: 'https://example.com/stress-podcast' },
  { title: '2 Rule AIM supporting research', url: 'https://example.com/2rule-research' }
];
