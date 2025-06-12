'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function FAQPage() {
  const router = useRouter();

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-2 text-primary">Frequently Asked Questions</h1>
      <p className="text-text-secondary mb-8">Find answers to common questions about the 2-Rule AIM app</p>

      <div className="space-y-6">
        {/* General Questions */}
        <Card>
          <CardHeader>
            <CardTitle>General Questions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-1">What is the 2-Rule AIM App?</h3>
              <p className="text-text-primary">
                The 2-Rule AIM (Anti-Inflammatory Meal) App is a meal planning tool designed to help you manage your health by focusing on two key nutritional rules: limiting daily fructose intake and balancing your omega-3 to omega-6 fatty acid ratio. It aims to help lower fasting insulin levels and reduce chronic inflammation.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-1">Who is this app for?</h3>
              <p className="text-text-primary">
                This app is for anyone interested in:
              </p>
              <ul className="list-disc pl-5 space-y-1 mt-1">
                <li>Reducing chronic inflammation</li>
                <li>Preventing chronic disease</li>
                <li>Achieving or maintaining a healthy body weight</li>
                <li>Improving metabolic, gut, or cognitive health</li>
                <li>Generating fast, compliant meals without needing nutrition training</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-1">Is this app a substitute for medical advice?</h3>
              <p className="text-text-primary">
                No, the information provided in this app is for educational purposes only and is not a substitute for professional medical advice, diagnosis, or treatment. Always consult with a qualified healthcare provider before making any changes to your diet or lifestyle, especially if you have existing health conditions or are on medication.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-1">How often should I update my health indicators?</h3>
              <p className="text-text-primary">
                It is recommended to update your health indicators every 3 months. This allows the app to provide the most accurate and personalized meal recommendations based on your current health status.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Subscription & Features */}
        <Card>
          <CardHeader>
            <CardTitle>Subscription & Features</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-1">What's included in the Free plan?</h3>
              <p className="text-text-primary">
                The Free plan lets you:
              </p>
              <ul className="list-disc pl-5 space-y-1 mt-1">
                <li>Generate 1 meal at a time</li>
                <li>Apply 1 dietary filter (e.g., dairy-free, gluten-free)</li>
                <li>Set dietary preset (e.g., Keto)</li>
                <li>View nutrition info for that meal</li>
                <li>Save up to 2 meals</li>
                <li>Learn how the 2 Rule system works</li>
              </ul>
              <p className="text-text-primary mt-1">
                You can't build full meal plans or access grocery lists unless you upgrade.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-1">What do I get with Premium?</h3>
              <p className="text-text-primary">
                Premium subscribers get:
              </p>
              <ul className="list-disc pl-5 space-y-1 mt-1">
                <li>Build 1-day or 7-day meal plans</li>
                <li>Save 14 days of meals (42 meals) every month</li>
                <li>Create grocery lists</li>
                <li>Track fructose & omega ratio per day</li>
                <li>Use multiple dietary filters and preferences</li>
                <li>Include snacks and desserts</li>
                <li>Use of the Meal Builder to add custom ingredients</li>
                <li>Ingredient 'swapping' in Meal Builder (limited to 12/month)</li>
                <li>Add family member profiles at a 50% discount and prorated</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-1">How do grocery lists work?</h3>
              <p className="text-text-primary">
                You can generate grocery lists directly from your planned meals in the Calendar. Simply select a date range, and the app will compile all the ingredients needed for those meals. You can also choose to label certain produce (EWG's 'Dirty Dozen') as organic.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Meal Generation & Building */}
        <Card>
          <CardHeader>
            <CardTitle>Meal Generation & Building</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-1">What is the difference between "Meal Generator" and "Meal Builder"?</h3>
              <p className="text-text-primary">
                The <strong>Meal Generator</strong> uses AI to create new meals, full-day plans, or full-week plans based on your profile settings and specific generation options (e.g., meal type, portions, protein goals). The <strong>Meal Builder</strong> allows you to manually select ingredients from a database or your saved foods to create a meal, and then analyze its nutritional content.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-1">What are the "2 Rules"?</h3>
              <p className="text-text-primary">
                The two core rules are:
              </p>
              <ol className="list-decimal pl-5 mt-1 space-y-1">
                <li>Keep daily fructose intake below a specific limit (15g for those with chronic conditions, 25g for others).</li>
                <li>Maintain an omega-3 to omega-6 fatty acid ratio between 1:1.5 and 1:2.9.</li>
              </ol>
              <p className="text-text-primary mt-1">
                The app helps you adhere to these rules in your meal planning.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-1">Why are some meals marked as "Doesn't Follow 2 Rules"?</h3>
              <p className="text-text-primary">
                This indicates that the generated or built meal does not meet one or both of the core 2-Rule AIM nutritional guidelines (fructose limit or omega ratio). The app will highlight this so you can adjust your choices or preferences.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-1">Can I swap ingredients in a generated meal?</h3>
              <p className="text-text-primary">
                Yes, for single meals generated by the AI, you can request an ingredient swap. The AI will suggest an alternative that aims to maintain the meal's nutritional balance, especially regarding fructose and omega ratios.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-1">Are these meal plans kid-friendly?</h3>
              <p className="text-text-primary">
                Yes! Many meals work for kids as-is. The app will create meals depending on age, adjusting portion sizes while making the ingredients as kid-friendly as possible (given restrictions).
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Dietary Preferences & Health */}
        <Card>
          <CardHeader>
            <CardTitle>Dietary Preferences & Health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-1">What dietary preferences can I choose from?</h3>
              <p className="text-text-primary">
                We support 10+ filters: Gluten-free, dairy-free, vegan, vegetarian, Pescatarian, FODMAP, no pork, no seafood, no beef, and more.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-1">Can I save meals and reuse them later?</h3>
              <p className="text-text-primary">
                Yes! In Premium, you can save 2 weeks of meals and favorite the ones you love.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-1">How do I know if I have a chronic health condition?</h3>
              <p className="text-text-primary">
                In the app, we provide a reference list. If unsure, ask your healthcare provider. If you select "Yes" to have a chronic condition, the app automatically uses the stricter fructose limits.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-1">Are these meal plans safe?</h3>
              <p className="text-text-primary">
                The 2 Rule AIM approach is based on peer-reviewed research and avoids excessive sugar and inflammatory fats. However, if you have a medical condition, you should consult your healthcare provider before making major dietary changes.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-1">Do I need to buy supplements?</h3>
              <p className="text-text-primary">
                Meals are designed to meet fructose and omega-3:6 ratio targets without the need for supplements. However, if you use omega-3 supplements (like fish oil), you can enter the amount so the app adjusts your omega balance accordingly allowing for greater variety in the meals.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Data & Privacy */}
        <Card>
          <CardHeader>
            <CardTitle>Data & Privacy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-1">Where does the nutritional data come from?</h3>
              <p className="text-text-primary">
                The app primarily uses data from the Canadian Nutrient File (CNF) for Canadian users and the USDA FoodData Central for users in the United States and other regions. These are official and comprehensive nutrient databases.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-1">Is my personal health information secure?</h3>
              <p className="text-text-primary">
                Yes, your personal health information is stored securely and is not shared with third parties. We use industry-standard encryption and security practices to protect your data.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-1">How is AI used in the app?</h3>
              <p className="text-text-primary">
                The app uses advanced artificial intelligence to generate meal plans, nutritional analysis, and educational content. While we aim for accuracy and relevance, AI-generated information may occasionally include errors or outdated data. Users are encouraged to use their own judgment and consult healthcare professionals before making significant dietary changes.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Technical Support */}
        <Card>
          <CardHeader>
            <CardTitle>Technical Support</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-1">What devices can I use the app on?</h3>
              <p className="text-text-primary">
                The 2-Rule AIM App is a web-based application that works on any device with a modern web browser, including desktops, laptops, tablets, and smartphones.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-1">How do I update my profile information?</h3>
              <p className="text-text-primary">
                You can update your profile information at any time by going to the Profile Settings page. Note that your name and date of birth cannot be changed once they are set.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-1">Who do I contact if I have technical issues?</h3>
              <p className="text-text-primary">
                If you encounter any technical issues, please visit our Contact Us page to send us a message, and our support team will assist you as soon as possible.
              </p>
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
