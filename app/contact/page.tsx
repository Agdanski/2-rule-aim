'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function HelpPage() {
  const router = useRouter();

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-2 text-primary">Help & How to Use</h1>
      <p className="text-text-secondary mb-8">
        A step-by-step guide to getting the most out of your 2-Rule AIM app
      </p>

      <div className="space-y-8">
        {/* Section 1: Getting Started */}
        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-text-primary">
                Welcome to the 2-Rule AIM (Anti-Inflammatory Meal) App! This guide will walk you through the key features and how to use them to achieve your health goals.
              </p>
              <p className="text-text-primary">
                Before you begin, ensure your <Link href="/profile-settings" className="text-primary hover:underline">Profile Settings</Link> are up-to-date. Your profile information, including health conditions, dietary preferences, and weight, helps the app personalize your meal plans.
              </p>
              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="font-medium mb-2">The 2 Rules</h3>
                <p className="mb-2">All meals in this app are designed to follow two key nutritional principles:</p>
                <ol className="list-decimal pl-5 space-y-1">
                  <li>Keep daily fructose under 15g (for those with chronic conditions) or 25g (for those without)</li>
                  <li>Maintain an omega-3 to omega-6 ratio between 1:1.5 and 1:2.9</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 2: How to Create Meals */}
        <Card>
          <CardHeader>
            <CardTitle>How to Create Meals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">1. Choose Your Meal Creation Method</h3>
                <p className="mb-2">You have two primary ways to create meals: the <strong>Meal Generator</strong> and the <strong>Meal Builder</strong>.</p>
                
                <h4 className="font-medium mt-4 mb-2">▶ Meal Generator</h4>
                <p className="mb-2">The Meal Generator uses advanced AI to create new meals based on your profile and specific options. You can choose to generate:</p>
                <ul className="list-disc pl-5 space-y-1 mb-2">
                  <li><strong>Single Meal:</strong> A single breakfast, lunch, or dinner.</li>
                  <li><strong>Full Day:</strong> A complete plan including 3 main meals (breakfast, lunch, dinner) and optional snacks/desserts. (Premium feature)</li>
                  <li><strong>Full Week:</strong> A comprehensive plan for 7 days, including 21 main meals and optional snacks/desserts. (Premium feature)</li>
                </ul>
                
                <p className="mb-2">When generating, you can also specify:</p>
                <ul className="list-disc pl-5 space-y-1 mb-2">
                  <li><strong>Portions:</strong> How many servings the meal should yield.</li>
                  <li><strong>Instructions:</strong> Whether to include detailed meal preparation instructions.</li>
                  <li><strong>Macronutrients:</strong> To include a breakdown of proteins, fats, and carbs.</li>
                  <li><strong>Heavy Metal Report:</strong> To include an estimated heavy metal content.</li>
                  <li><strong>Protein Goal:</strong> Set a target for protein intake per meal or per day.</li>
                  <li><strong>Grass-fed/Pasture-raised:</strong> To only use these types of meats.</li>
                </ul>
                
                <p className="mb-2">All generated meals are designed to adhere to your dietary preferences and settings AND the 2 Rules</p>
                <p className="italic mb-2">Less restrictions = more variety</p>
                
                <h4 className="font-medium mt-4 mb-2">▶ Meal Builder</h4>
                <p className="mb-2">The Meal Builder allows you to manually select ingredients to create your own meal. You can choose ingredients from:</p>
                <ul className="list-disc pl-5 space-y-1 mb-2">
                  <li>Your personal saved food list (My Foods).</li>
                  <li>A comprehensive search database powered by the Canadian Nutrient File (CNF) or USDA nutrient databases.</li>
                </ul>
                
                <p className="mb-2">You can decide whether to build the meal:</p>
                <ul className="list-disc pl-5 space-y-1 mb-2">
                  <li><strong>According to the 2 Rules:</strong> The AI will help balance the meal to meet the fructose and omega ratio targets.</li>
                  <li><strong>Without the 2 Rules:</strong> This allows you to analyze your own recipes and see how they align with the 2 Rules via detailed meal reporting.</li>
                </ul>
                
                <p>In both cases, you'll receive a full nutritional breakdown, including fructose and omega balance.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 3: Managing Meals and Plans */}
        <Card>
          <CardHeader>
            <CardTitle>Managing Your Meals and Plans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">2. Save and Organize Your Meals</h3>
                <p className="mb-2">After generating or building a meal, you can save it to your <Link href="/saved-meals" className="text-primary hover:underline">Saved Meals</Link> page. Saved meals are categorized as single meals, full days, or full weeks.</p>
                <p className="mb-2">From the Saved Meals page, you can:</p>
                <ul className="list-disc pl-5 space-y-1 mb-2">
                  <li><strong>Favorite</strong> meals for quick access.</li>
                  <li><strong>Add</strong> meals directly to your Calendar.</li>
                  <li><strong>Share</strong> meals with others (subject to limits).</li>
                  <li><strong>Delete</strong> meals you no longer need.</li>
                </ul>
                <div className="flex items-center space-x-4 text-sm bg-gray-50 p-3 rounded-md">
                  <div>
                    <span className="font-medium">Free users</span> can save up to 2 meals.
                  </div>
                  <div>
                    <span className="font-medium">Premium users</span> can save up to 42 meals per month.
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">3. Plan Your Week with the Calendar</h3>
                <p className="mb-2">The <Link href="/calendar" className="text-primary hover:underline">Calendar</Link> page is your central hub for meal planning. Here you can:</p>
                <ul className="list-disc pl-5 space-y-1 mb-2">
                  <li>Add meals into specific days and times (breakfast/lunch/dinner)</li>
                  <li>Each day supports either:
                    <ul className="list-disc pl-5 space-y-1 mt-1">
                      <li>3 single meals, or</li>
                      <li>1 full day set</li>
                    </ul>
                  </li>
                  <li>Move meals between different days by dragging and dropping</li>
                  <li>Remove meals you no longer want on your calendar</li>
                </ul>
                
                <p className="mb-2">The calendar powers the Daily Meters on your Dashboard:</p>
                <ul className="list-disc pl-5 space-y-1 mb-2">
                  <li><strong>Fructose meter</strong> — shows how close you are to your daily limit</li>
                  <li><strong>Omega ratio meter</strong> — shows if your meals stay balanced</li>
                </ul>
                
                <p>Meals update these meters automatically, and they reset at your wake-up time (set in profile settings).</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 4: Grocery Lists */}
        <Card>
          <CardHeader>
            <CardTitle>Creating and Managing Grocery Lists</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-text-primary">
                The <Link href="/grocery-lists" className="text-primary hover:underline">Grocery Lists</Link> feature helps you plan your shopping based on your meal calendar.
              </p>
              
              <h3 className="text-lg font-medium mb-2">4. Generate Grocery Lists</h3>
              <p className="mb-2">From your Calendar Page, choose a date range (1–14 days) and generate a grocery list based on your selected meals.</p>
              <p className="mb-2">To create a grocery list:</p>
              <ol className="list-decimal pl-5 space-y-1 mb-4">
                <li>Go to your <Link href="/calendar" className="text-primary hover:underline">Calendar</Link> page</li>
                <li>Click the "Generate Grocery List" button</li>
                <li>Select your desired date range</li>
                <li>Choose whether to label certain foods (EWG's 'Dirty Dozen') as organic</li>
                <li>Click "Generate Grocery List"</li>
              </ol>
              
              <p className="mb-2">Once generated, you can:</p>
              <ul className="list-disc pl-5 space-y-1 mb-2">
                <li>View your list organized by food categories</li>
                <li>Check off items as you shop</li>
                <li>Print your grocery list</li>
                <li>Download your list as a CSV file</li>
                <li>Access all your saved grocery lists from the <Link href="/grocery-lists" className="text-primary hover:underline">Grocery Lists</Link> page</li>
              </ul>
              
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-sm"><strong>Note:</strong> Grocery list generation is a Premium feature.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 5: My Foods */}
        <Card>
          <CardHeader>
            <CardTitle>Managing Your Food Database</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-text-primary">
                The <Link href="/my-foods" className="text-primary hover:underline">My Foods</Link> page allows you to build a personal collection of ingredients you frequently use.
              </p>
              
              <h3 className="text-lg font-medium mb-2">5. Add and Manage Your Foods</h3>
              <p className="mb-2">To add foods to your collection:</p>
              <ol className="list-decimal pl-5 space-y-1 mb-4">
                <li>Go to the <Link href="/my-foods" className="text-primary hover:underline">My Foods</Link> page</li>
                <li>Search for foods in the database</li>
                <li>Select a food from the search results</li>
                <li>Specify the amount and unit</li>
                <li>Click "Add to My Foods"</li>
              </ol>
              
              <p className="mb-2">Benefits of using My Foods:</p>
              <ul className="list-disc pl-5 space-y-1 mb-2">
                <li>Quick access to your favorite ingredients when building meals</li>
                <li>Save custom portion sizes for ingredients you use regularly</li>
                <li>See nutritional information including fructose content and omega ratios at a glance</li>
              </ul>
              
              <p>You can remove foods from your collection at any time by clicking the delete icon next to the food item.</p>
            </div>
          </CardContent>
        </Card>

        {/* Section 6: Understanding the Dashboard */}
        <Card>
          <CardHeader>
            <CardTitle>Understanding Your Dashboard</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-text-primary">
                Your <Link href="/dashboard" className="text-primary hover:underline">Dashboard</Link> is the central hub for monitoring your daily nutritional targets and accessing key features.
              </p>
              
              <h3 className="text-lg font-medium mb-2">6. Using the Dashboard Effectively</h3>
              <p className="mb-2">Key dashboard elements:</p>
              <ul className="list-disc pl-5 space-y-1 mb-4">
                <li><strong>Daily Fructose Meter:</strong> Shows your current fructose consumption for the day relative to your personal limit (15g for chronic conditions, 25g otherwise).</li>
                <li><strong>Omega Ratio Meter:</strong> Displays your current omega-3 to omega-6 ratio, with the ideal range (1:1.5 to 1:2.9) highlighted.</li>
                <li><strong>Quick Actions:</strong> Shortcuts to frequently used features like generating meals, building meals, and planning your week.</li>
                <li><strong>Navigation Menu:</strong> Access to all app features and pages.</li>
              </ul>
              
              <p className="mb-2">The dashboard meters automatically update based on the meals in your calendar for the current day. They reset daily at your wake-up time (set in your profile settings).</p>
              
              <div className="bg-gray-50 p-3 rounded-md">
                <p><strong>Tip:</strong> Check your dashboard regularly to ensure you're staying within your daily fructose limit and maintaining a healthy omega balance.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 7: Troubleshooting and Support */}
        <Card>
          <CardHeader>
            <CardTitle>Troubleshooting and Support</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <h3 className="text-lg font-medium mb-2">7. Getting Help When You Need It</h3>
              <p className="mb-2">If you encounter any issues or have questions, we're here to help:</p>
              <ul className="list-disc pl-5 space-y-1 mb-4">
                <li>Check the <Link href="/faq" className="text-primary hover:underline">FAQ</Link> page for answers to common questions</li>
                <li>Visit the <Link href="/resources" className="text-primary hover:underline">Resources</Link> page for additional information on health topics</li>
                <li>Contact our support team through the <Link href="/contact" className="text-primary hover:underline">Contact Us</Link> page</li>
              </ul>
              
              <h4 className="font-medium mb-2">Common Issues:</h4>
              <div className="space-y-3">
                <div>
                  <p className="font-medium">Meal generation fails:</p>
                  <ul className="list-disc pl-5">
                    <li>Try reducing the number of dietary restrictions</li>
                    <li>Check that your protein goals are realistic</li>
                    <li>Try generating a single meal instead of a full day or week</li>
                  </ul>
                </div>
                
                <div>
                  <p className="font-medium">Can't save more meals:</p>
                  <ul className="list-disc pl-5">
                    <li>Free users are limited to 2 saved meals</li>
                    <li>Premium users can save up to 42 meals per month</li>
                    <li>Consider removing meals you no longer need</li>
                  </ul>
                </div>
                
                <div>
                  <p className="font-medium">Dashboard meters not updating:</p>
                  <ul className="list-disc pl-5">
                    <li>Ensure you have meals added to the current day in your calendar</li>
                    <li>Check that you're viewing the correct date</li>
                    <li>Try refreshing the page</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 8: Premium Features */}
        <Card>
          <CardHeader>
            <CardTitle>Premium Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-text-primary">
                Upgrade to Premium to unlock the full potential of the 2-Rule AIM App:
              </p>
              
              <ul className="list-disc pl-5 space-y-1 mb-4">
                <li><strong>Full Day & Week Planning:</strong> Generate complete meal plans for an entire day or week</li>
                <li><strong>Expanded Storage:</strong> Save up to 42 meals per month (compared to 2 for free users)</li>
                <li><strong>Grocery Lists:</strong> Generate and manage shopping lists based on your meal plans</li>
                <li><strong>Multiple Dietary Filters:</strong> Apply multiple dietary preferences simultaneously</li>
                <li><strong>Snacks & Desserts:</strong> Include optional snacks and desserts in your meal plans</li>
                <li><strong>Ingredient Swapping:</strong> Swap ingredients in the Meal Builder (12 swaps per month)</li>
                <li><strong>Family Profiles:</strong> Add family member profiles at a 50% discount</li>
              </ul>
              
              <div className="flex justify-center">
                <Link href="/pricing">
                  <Button>
                    View Premium Plans
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 flex flex-wrap gap-4">
        <Button variant="outline" onClick={() => router.push('/dashboard')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
        <Button variant="outline" onClick={() => router.push('/contact')}>
          Contact Support
        </Button>
      </div>
    </div>
  );
}
