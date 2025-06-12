'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, CheckCircle, XCircle, DollarSign, Users, Tag } from 'lucide-react';
import Link from 'next/link';
import { subscriptionTiers } from '@/lib/constants';
import { formatCurrency } from '@/lib/utils';

export default function PricingPage() {
  const router = useRouter();

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-2 text-primary">Pricing & Upgrade</h1>
      <p className="text-text-secondary mb-8">
        Unlock the full potential of the 2-Rule AIM app with our Premium plan
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        {/* Free Plan Card */}
        <Card className="border-2 border-gray-200 shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-text-primary">
              {subscriptionTiers.free.name}
            </CardTitle>
            <CardDescription className="text-lg text-text-secondary">
              Perfect for trying out the 2-Rule AIM system
            </CardDescription>
            <p className="text-5xl font-extrabold text-primary mt-4">
              $0<span className="text-xl font-medium text-text-secondary">/month</span>
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">Features:</h3>
              <ul className="space-y-2">
                {subscriptionTiers.free.features.map((feature, index) => (
                  <li key={index} className="flex items-center text-text-primary">
                    <CheckCircle className="h-5 w-5 text-success mr-2 shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-3">Limitations:</h3>
              <ul className="space-y-2">
                {subscriptionTiers.free.limitations.map((limitation, index) => (
                  <li key={index} className="flex items-center text-text-secondary">
                    <XCircle className="h-5 w-5 text-error mr-2 shrink-0" />
                    {limitation}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button variant="outline" disabled className="w-full">
              Current Plan
            </Button>
          </CardFooter>
        </Card>

        {/* Premium Plan Card */}
        <Card className="border-2 border-primary shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-primary">
              {subscriptionTiers.premium.name}
            </CardTitle>
            <CardDescription className="text-lg text-text-secondary">
              Unlock full meal planning, grocery lists, and more!
            </CardDescription>
            <p className="text-5xl font-extrabold text-primary mt-4">
              {formatCurrency(subscriptionTiers.premium.pricing.monthly.price)}
              <span className="text-xl font-medium text-text-secondary">/month</span>
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">Features:</h3>
              <ul className="space-y-2">
                {subscriptionTiers.premium.features.map((feature, index) => (
                  <li key={index} className="flex items-center text-text-primary">
                    <CheckCircle className="h-5 w-5 text-success mr-2 shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-3">Subscription Options:</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Object.entries(subscriptionTiers.premium.pricing).map(([key, value]) => (
                  <div key={key} className="bg-gray-50 p-4 rounded-md border border-gray-200">
                    <p className="font-semibold capitalize">{value.interval.replace('-', ' ')}</p>
                    <p className="text-2xl font-bold text-primary">
                      {formatCurrency(value.price)}
                    </p>
                    {value.savings > 0 && (
                      <p className="text-sm text-text-secondary">
                        Save {formatCurrency(value.savings)} ({value.savingsPercentage}%)
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-3">Family Member Profiles:</h3>
              <p className="text-text-primary mb-3">
                Add additional family member profiles at a 50% discount. Each family member gets their own personalized meal planning experience.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Object.entries(subscriptionTiers.premium.familyMemberPricing).map(([key, value]) => (
                  <div key={key} className="bg-gray-50 p-4 rounded-md border border-gray-200">
                    <p className="font-semibold capitalize">{value.interval.replace('-', ' ')}</p>
                    <p className="text-2xl font-bold text-primary">
                      {formatCurrency(value.price)}
                    </p>
                    {value.savings > 0 && (
                      <p className="text-sm text-text-secondary">
                        Save {formatCurrency(value.savings)} ({value.savingsPercentage}%)
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button className="w-full">
              <DollarSign className="mr-2 h-4 w-4" />
              Upgrade to Premium
            </Button>
          </CardFooter>
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
