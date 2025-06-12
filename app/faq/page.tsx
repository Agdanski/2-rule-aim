'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { resourceLinks } from '@/lib/constants';

export default function ResourcesPage() {
  const router = useRouter();

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-2 text-primary">Resources</h1>
      <p className="text-text-secondary mb-8">
        Explore valuable resources to further improve your knowledge and health
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {resourceLinks.map((resource, index) => (
          <Card key={index} className="flex flex-col justify-between">
            <CardHeader>
              <CardTitle>{resource.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-text-secondary mb-4">
                {getResourceDescription(resource.title)}
              </p>
              <Link href={resource.url} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="w-full">
                  Visit Resource
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
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

// Helper function to get descriptions for each resource
function getResourceDescription(title: string): string {
  switch (title) {
    case 'Sleep':
      return 'Learn about the importance of quality sleep for health and how it impacts inflammation and recovery.';
    case 'Cooking and decreasing AGE\'s':
      return 'Discover cooking techniques that reduce Advanced Glycation End products (AGEs) for healthier meals.';
    case 'Exercise':
      return 'Find effective exercise strategies that complement your anti-inflammatory diet for optimal health.';
    case 'Supplements to consider and why?':
      return 'Explore evidence-based supplements that may enhance your anti-inflammatory lifestyle.';
    case 'General health':
      return 'Access a comprehensive resource for holistic health information and research.';
    case 'Stress: Michael Singer Podcast - Sounds True, Living Untethered':
      return 'Learn stress management techniques from Michael Singer\'s approach to mindfulness and emotional well-being.';
    case '2 Rule AIM supporting research':
      return 'Review the scientific research that supports the 2 Rule AIM approach to nutrition and health.';
    default:
      return 'Explore this valuable resource to enhance your health journey.';
  }
}
