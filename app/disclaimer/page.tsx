'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';

export default function DisclaimerPage() {
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const disclaimerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createBrowserClient();

  useEffect(() => {
    // Check if user is coming from signup (new user) or login
    const checkUserStatus = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // Check if user has a profile already
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('name, date_of_birth')
          .eq('id', session.user.id)
          .single();
        
        // If no name or DOB, consider them a new user needing profile setup
        setIsNewUser(!profile?.name || !profile?.date_of_birth);
      }
    };
    
    checkUserStatus();
  }, [supabase]);

  // Handle scroll event to detect when user reaches bottom of disclaimer
  const handleScroll = () => {
    if (disclaimerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = disclaimerRef.current;
      // Consider "scrolled to bottom" when within 10px of the bottom
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10;
      
      if (isAtBottom) {
        setHasScrolledToBottom(true);
      }
    }
  };

  const handleConsent = async () => {
    if (!consentChecked) return;
    
    setIsSubmitting(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        toast({
          title: "Authentication Error",
          description: "You must be logged in to continue.",
          variant: "destructive",
        });
        router.push('/');
        return;
      }
      
      // Record the consent
      const { error: consentError } = await supabase
        .from('medical_disclaimer_consents')
        .insert({
          user_id: session.user.id,
          consented_at: new Date().toISOString(),
          ip_address: null, // Could be captured server-side if needed
          user_agent: navigator.userAgent
        });
      
      if (consentError) throw consentError;
      
      // Update user profile with disclaimer preferences
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          last_disclaimer_shown: new Date().toISOString(),
          disclaimer_dont_show: dontShowAgain
        })
        .eq('id', session.user.id);
      
      if (profileError) throw profileError;
      
      // Redirect based on user status
      if (isNewUser) {
        router.push('/profile-setup');
      } else {
        router.push('/dashboard');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to save your consent. Please try again.",
        variant: "destructive",
      });
      console.error('Disclaimer consent error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold text-primary">
            Medical Disclaimer
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <div 
            ref={disclaimerRef}
            onScroll={handleScroll}
            className="h-[60vh] overflow-y-auto border rounded-md p-4 mb-6 prose prose-sm max-w-none"
          >
            <h2 className="text-xl font-semibold mb-4">Medical Disclaimer</h2>
            <p>Please read and consent to the following disclaimer before using the 2 Rule AIM App</p>
            <p>This disclaimer must be reviewed and accepted every 30 days to continue using the app.</p>
            
            <p>The information provided in this app is for general educational and informational purposes only. 
            It is not intended as, nor should it be considered a substitute for, professional medical advice, 
            diagnosis, or treatment.</p>
            
            <p>No claims are being made that the information, suggestions, or meal plans provided will treat, 
            cure, or prevent any disease or health condition. Always consult with a qualified healthcare 
            provider before making any changes to your diet or lifestyle.</p>
            
            <p>Do not disregard, avoid, or delay obtaining medical or health-related advice from your 
            healthcare professional because of information provided through this app. Individual dietary 
            needs and restrictions vary, and it is your responsibility to consult with a healthcare professional 
            before making any health-related decisions or changes to your diet.</p>
            
            <p>It is strongly recommended that you be under medical supervision when making significant 
            dietary changes, especially if you are on medication.</p>
            
            <p>Following the 2 Rule AIM Meal Plan may improve health markers such as blood pressure, 
            cholesterol, blood sugar, inflammation, and weight, among others. These improvements may 
            impact your medication needs.</p>
            
            <p>While every effort has been made to provide accurate nutrient values, some calculations are 
            generated using best-available sources and estimation tools. Nutrient totals (including fructose 
            and omega-3/omega-6 values) are based on standard food composition databases, such as the 
            USDA FoodData Central, and may not reflect exact values for all food brands, preparations, or 
            regional variations.</p>
            
            <p>The app uses a combination of automated tools and logic to validate nutrient targets (e.g., 
            fructose limits and omega balance), but absolute precision cannot be guaranteed in all cases. 
            Users relying on precise nutritional data for medical or therapeutic reasons are advised to 
            consult a registered dietitian or healthcare provider.</p>
            
            <p>Nutrient information provided in this app, including, but not limited to, vitamin, mineral, iron, and 
            trace element values (such as heavy metal content), is based on standardized food composition 
            data and general assumptions about food sourcing. Actual nutrient and contaminant levels can 
            vary due to factors such as soil quality, food origin, cooking methods, and product brand.</p>
            
            <p>The app's estimates are intended for general guidance only and should not be interpreted as 
            precise laboratory measurements. Users with diagnosed nutrient deficiencies, iron disorders, or 
            sensitivity to heavy metals should consult a licensed healthcare provider for personalized 
            assessment and testing.</p>
            
            <h3 className="text-lg font-semibold mt-6 mb-2">Important Note on AI-Generated Content</h3>
            <p>This app uses advanced artificial intelligence (AI) to generate meal plans, nutritional analysis, 
            and educational content. While we aim for accuracy and relevance, AI-generated information 
            may occasionally include errors, outdated data, or unintended omissions.</p>
            
            <p>Users are encouraged to use their own judgment and consult qualified healthcare professionals 
            before making significant dietary, supplement, or lifestyle changes.</p>
            
            <p>We do not guarantee that all AI-generated content is error-free. By using this app, you 
            acknowledge that occasional inaccuracies may occur and agree not to hold the developers or 
            affiliated parties liable for such errors.</p>
            
            <p>By using this app, you acknowledge and accept that the creators are not liable for adverse 
            outcomes resulting from app usage.</p>
            
            <p>For your safety, this disclaimer will be shown again in 30 days for review.</p>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="dont-show-again" 
                checked={dontShowAgain}
                onCheckedChange={(checked) => setDontShowAgain(checked === true)}
              />
              <Label htmlFor="dont-show-again">
                Don&apos;t show this again (will still be shown every 30 days)
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="consent" 
                disabled={!hasScrolledToBottom}
                checked={consentChecked}
                onCheckedChange={(checked) => setConsentChecked(checked === true)}
              />
              <Label 
                htmlFor="consent" 
                className={!hasScrolledToBottom ? "text-gray-400" : ""}
              >
                I have read and consent to the disclaimer
                {!hasScrolledToBottom && (
                  <span className="block text-xs text-error mt-1">
                    Please scroll through the entire disclaimer to enable consent
                  </span>
                )}
              </Label>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-center">
          <Button 
            onClick={handleConsent}
            disabled={!consentChecked || isSubmitting}
            className="w-full md:w-auto"
          >
            {isSubmitting ? "Processing..." : "I Consent and Agree"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
