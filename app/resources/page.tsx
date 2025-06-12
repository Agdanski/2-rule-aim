'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Mail, Send, Loader2, PhoneCall, MapPin } from 'lucide-react';
import Link from 'next/link';

export default function ContactPage() {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createBrowserClient();
  
  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  // Form validation
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    subject?: string;
    message?: string;
  }>({});
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const newErrors: {
      name?: string;
      email?: string;
      subject?: string;
      message?: string;
    } = {};
    
    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!subject.trim()) {
      newErrors.subject = 'Subject is required';
    }
    
    if (!message.trim()) {
      newErrors.message = 'Message is required';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    // Clear errors
    setErrors({});
    
    try {
      setSubmitting(true);
      
      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      
      // Save message to database
      const { error } = await supabase
        .from('contact_messages')
        .insert({
          user_id: session?.user?.id || null,
          name,
          email,
          subject,
          message,
          status: 'new'
        });
      
      if (error) throw error;
      
      // Clear form
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
      
      // Show success message
      toast({
        title: "Message Sent",
        description: "Thank you for your message. We'll respond within 1-2 business days.",
      });
    } catch (error: any) {
      console.error('Error sending contact message:', error);
      toast({
        title: "Error Sending Message",
        description: "There was a problem sending your message. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-2 text-primary">Contact Us</h1>
      <p className="text-text-secondary mb-8">
        Have a question, issue, or suggestion? We'd love to hear from you.
      </p>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Contact Information */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Get in Touch</CardTitle>
              <CardDescription>
                We'll do our best to respond within 1–2 business days.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start space-x-3">
                <Mail className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h3 className="font-medium">Email</h3>
                  <p className="text-text-secondary">
                    <a href="mailto:support@2ruleaim.com" className="text-primary hover:underline">
                      support@2ruleaim.com
                    </a>
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <PhoneCall className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h3 className="font-medium">Phone</h3>
                  <p className="text-text-secondary">
                    <a href="tel:+15191234567" className="hover:underline">
                      (519) 123-4567
                    </a>
                  </p>
                  <p className="text-xs text-text-secondary">
                    Monday-Friday, 9:00 AM - 5:00 PM EST
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h3 className="font-medium">Location</h3>
                  <p className="text-text-secondary">
                    Gdanski Chiropractic Clinic<br />
                    London, Ontario, Canada
                  </p>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <h3 className="font-medium mb-2">Follow Us</h3>
                <div className="flex space-x-4">
                  <a href="#" className="text-text-secondary hover:text-primary">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                    </svg>
                    <span className="sr-only">Facebook</span>
                  </a>
                  <a href="#" className="text-text-secondary hover:text-primary">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                    </svg>
                    <span className="sr-only">Instagram</span>
                  </a>
                  <a href="#" className="text-text-secondary hover:text-primary">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                      <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
                    </svg>
                    <span className="sr-only">Twitter</span>
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Contact Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Send Us a Message</CardTitle>
              <CardDescription>
                Fill out the form below and we'll get back to you as soon as possible.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Name <span className="text-error">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className={errors.name ? 'border-error' : ''}
                  />
                  {errors.name && (
                    <p className="text-sm text-error">{errors.name}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">
                    Email <span className="text-error">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Your email address"
                    className={errors.email ? 'border-error' : ''}
                  />
                  {errors.email && (
                    <p className="text-sm text-error">{errors.email}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="subject">
                    Subject <span className="text-error">*</span>
                  </Label>
                  <Input
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Message subject"
                    className={errors.subject ? 'border-error' : ''}
                  />
                  {errors.subject && (
                    <p className="text-sm text-error">{errors.subject}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="message">
                    Message <span className="text-error">*</span>
                  </Label>
                  <textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Your message"
                    rows={5}
                    className={`flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${errors.message ? 'border-error' : ''}`}
                  />
                  {errors.message && (
                    <p className="text-sm text-error">{errors.message}</p>
                  )}
                </div>
                
                <div className="flex justify-end">
                  <Button type="submit" disabled={submitting}>
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Send Message
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* FAQ Section */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-4">Frequently Asked Questions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">How quickly will I receive a response?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-text-secondary">
                We aim to respond to all inquiries within 1-2 business days. For urgent matters, please call our support line.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Can I request a feature for the app?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-text-secondary">
                Absolutely! We welcome feature requests and feedback to improve the 2-Rule AIM app. Please use the contact form and select "Feature Request" as the subject.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">How do I report a technical issue?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-text-secondary">
                Please provide as much detail as possible about the issue you're experiencing, including the device and browser you're using, and any error messages you see.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Can I schedule a consultation?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-text-secondary">
                For personalized nutrition or health consultations with Dr. Gdanski, please contact the Gdanski Chiropractic Clinic directly to schedule an appointment.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="mt-8 flex flex-wrap gap-4">
        <Button variant="outline" onClick={() => router.push('/dashboard')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
        <Button variant="outline" onClick={() => router.push('/faq')}>
          View All FAQs
        </Button>
      </div>
      
      {/* Thank You Message */}
      <div className="mt-12 text-center">
        <p className="text-text-secondary">
          Thank you for being part of the 2 Rule AIM community!
        </p>
      </div>
    </div>
  );
}
