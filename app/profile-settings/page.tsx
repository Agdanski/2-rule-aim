'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AboutPage() {
  const router = useRouter();

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-2 text-primary">About Us</h1>
      <p className="text-text-secondary mb-8">Learn more about the 2-Rule AIM app and its mission</p>

      <div className="space-y-8">
        {/* Section 1: About the App */}
        <Card>
          <CardHeader>
            <CardTitle>About the 2-Rule AIM App</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-text-primary">
                The 2-Rule AIM (Anti-Inflammatory Meal) App is a science-backed tool designed to help specifically YOU take control of your health by addressing root causes of chronic disease. It's built around 2 powerful nutritional rules: limit fructose to specific daily levels and balance omega-6 with omega-3 to a specific ratio.
              </p>
              <p className="text-text-primary">
                By following these simple yet powerful guidelines, the app is specifically designed to help lower fasting insulin levels and reduce chronic inflammation — two key drivers behind many modern health conditions. Lowering fasting insulin and reducing chronic inflammation can be very helpful in preventing and helping improve chronic health conditions. Significant changes to our health may happen in as little as 2 weeks, but as a general rule, it takes about 3 months of lifestyle changes to see significant effects. Every 3 months of following the 2 Rule AIM Plan, your health indicators will be asked to be updated.
              </p>
              <div className="bg-gray-50 p-4 rounded-md">
                <p className="font-medium mb-2">Important Notes:</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>
                    It is not necessary, but highly recommended to use a high quality, 3rd party tested Omega 3 supplement of EPA/DHA. (This will allow for greater variation in meals)
                  </li>
                  <li>
                    Alcohol has very similar effects as fructose. As such, it is strongly recommended to eliminate consumption of alcohol for best results.
                  </li>
                  <li>
                    The 2 AIM App is very customizable. The more preferences and restrictions you set, the less variety will appear in your meals, and less likely meals will be able to be created.
                  </li>
                </ul>
              </div>
              <div className="space-y-2">
                <p className="font-medium">Learn more about:</p>
                <ul className="space-y-1">
                  <li>
                    <Link href="#" className="text-primary hover:underline">
                      Fructose and chronic disease
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="text-primary hover:underline">
                      Omega 3, Omega 6, and chronic disease
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="text-primary hover:underline">
                      Insulin, inflammation, and chronic disease
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 2: How to Use the App */}
        <Card>
          <CardHeader>
            <CardTitle>How to Use the App</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">1. Choose How You Want to Create Meals</h3>
                <p className="mb-2">Go to the Meal Generator or Meal Builder from your dashboard.</p>
                
                <h4 className="font-medium">▶ Meal Generator</h4>
                <p className="mb-2">Choose to create:</p>
                <ul className="list-disc pl-5 space-y-1 mb-2">
                  <li>1 meal (breakfast, lunch, or dinner)</li>
                  <li>1 full day of meals (3 meals + optional snacks/dessert)</li>
                  <li>1 full week of meals (21 meals + optional snacks/desserts)</li>
                </ul>
                
                <p className="mb-2">You'll also choose:</p>
                <ul className="list-disc pl-5 space-y-1 mb-2">
                  <li>How many portions to generate</li>
                  <li>Whether to include prep instructions and macronutrient info (proteins, fats, and carbs)</li>
                  <li>If you want to use grass-fed meats only</li>
                  <li>If you want a heavy metal report</li>
                  <li>If you want to set a protein target per meal or per day</li>
                </ul>
                
                <p className="mb-2">Each meal must follow your dietary preferences and settings AND the 2 Rules</p>
                <p className="italic mb-2">Less restrictions = more variety</p>
                
                <p className="font-medium mb-1">The 2 Rules:</p>
                <ol className="list-decimal pl-5 space-y-1 mb-4">
                  <li>Keep daily fructose under 15g or 25g (based on health status)</li>
                  <li>Keep omega-3 to omega-6 ratio between 1:1.5 and 1:2.9</li>
                </ol>
                
                <h4 className="font-medium">▶ Meal Builder</h4>
                <p className="mb-2">Manually select ingredients from:</p>
                <ul className="list-disc pl-5 space-y-1 mb-2">
                  <li>Your saved food list (My Foods)</li>
                  <li>A search list powered by CNF (Canada) or USDA nutrient databases</li>
                </ul>
                
                <p className="mb-2">Choose whether to:</p>
                <ul className="list-disc pl-5 space-y-1 mb-2">
                  <li>Build the meal with 2 Rule compliance (AI will help balance the meal)</li>
                  <li>Build the meal without 2 rule compliance. This will allow you to view your own meals in relation to the 2 Rules via meal reporting and the Fructose and Omega Meters on the Dashboard Page.</li>
                </ul>
                
                <p>Either way, you'll see a breakdown of nutrients, including fructose and omega balance.</p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">2. Save and Manage Your Meals</h3>
                <p className="mb-2">Once a meal is generated or built:</p>
                <ul className="list-disc pl-5 space-y-1 mb-2">
                  <li>You can save it to your Saved Meals page</li>
                  <li>Saved meals are labeled as:
                    <ul className="list-disc pl-5 space-y-1 mt-1">
                      <li>Single meal (breakfast/lunch/dinner)</li>
                      <li>Full day</li>
                      <li>Full week</li>
                    </ul>
                  </li>
                  <li>From here, you can:
                    <ul className="list-disc pl-5 space-y-1 mt-1">
                      <li>Favorite it</li>
                      <li>Add it to your calendar</li>
                      <li>Share it (with limits)</li>
                    </ul>
                  </li>
                </ul>
                
                <div className="flex items-center space-x-4 text-sm bg-gray-50 p-3 rounded-md">
                  <div>
                    <span className="font-medium">Free users</span> can save up to 2 meals per month
                  </div>
                  <div>
                    <span className="font-medium">Premium users</span> can save up to 42 meals per month
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">3. Add Meals to Your Calendar</h3>
                <p className="mb-2">Use the Calendar Page to plan out meals.</p>
                <ul className="list-disc pl-5 space-y-1 mb-2">
                  <li>Add meals into specific days and times (breakfast/lunch/dinner)</li>
                  <li>Each day supports either:
                    <ul className="list-disc pl-5 space-y-1 mt-1">
                      <li>3 single meals, or</li>
                      <li>1 full day set</li>
                    </ul>
                  </li>
                </ul>
                <p className="mb-2">Or add an entire 1 week plan at once.</p>
                
                <p className="mb-2">The calendar powers the Daily Meters on your Dashboard:</p>
                <ul className="list-disc pl-5 space-y-1 mb-2">
                  <li>Fructose meter — shows how close you are to your daily limit</li>
                  <li>Omega ratio meter — shows if your meals stay balanced</li>
                </ul>
                
                <p>Meals update these meters automatically.</p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">4. Generate Grocery Lists</h3>
                <p className="mb-2">From your Calendar Page, choose a date range (1–14 days) and generate a grocery list based on your selected meals.</p>
                <p className="mb-2">You can also:</p>
                <ul className="list-disc pl-5 space-y-1 mb-2">
                  <li>Choose whether to label certain foods (EWG's 'Dirty Dozen') as organic</li>
                  <li>Save your grocery list for future access in the Grocery List(s) page</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">5. Explore Resources and FAQs</h3>
                <p className="mb-2">Visit the Resources Page to learn about:</p>
                <ul className="list-disc pl-5 space-y-1 mb-2">
                  <li>Supplements</li>
                  <li>Cooking techniques</li>
                  <li>Exercise and stress</li>
                  <li>Inflammation, insulin, and chronic disease</li>
                </ul>
                
                <p>Check the FAQ Page for quick answers to common questions.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 3: About the Creator */}
        <Card>
          <CardHeader>
            <CardTitle>About the Creator</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-text-primary mb-4">
              Dr. Allan M. Gdanski is a 3rd generation Chiropractor with decades of nutritional experience and a strong belief in the role of nutrient-focused, anti-inflammatory eating in preventing and managing chronic illness. His work bridges the gap between research and real life, combining functional principles with simple tools that anyone can use. He is the owner of <Link href="https://gdanskichiropractic.com" className="text-primary hover:underline">Gdanski Chiropractic Clinic</Link> in London, Ontario, Canada.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 flex flex-wrap gap-4">
        <Button variant="outline" onClick={() => router.push('/dashboard')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
}
