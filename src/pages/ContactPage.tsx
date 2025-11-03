import React from 'react';
import Navbar from '../components/Navbar';
import { Footer } from '../components/layout/Footer';
import { Header } from '../components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Mail, Phone, MapPin, Clock, Send } from 'lucide-react';
import { useSiteSetting } from '../hooks/useSiteSettings';
import { SocialMediaLinks } from '../components/SocialMediaLinks';

export const ContactPage: React.FC = () => {
  // Get contact settings
  const { data: contactEmailData } = useSiteSetting('contact_email');
  const { data: contactPhoneData } = useSiteSetting('contact_phone');
  const { data: contactAddressData } = useSiteSetting('contact_address');
  const { data: workingHoursData } = useSiteSetting('contact_workingHours');
  const { data: siteNameData } = useSiteSetting('site_name');

  const contactEmail = contactEmailData?.data?.value;
  const contactPhone = contactPhoneData?.data?.value;
  const contactAddress = contactAddressData?.data?.value;
  const workingHours = workingHoursData?.data?.value;
  const siteName = siteNameData?.data?.value || 'Dominica News';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission here
    console.log('Contact form submitted');
  };

  return (
    <div className="min-h-screen bg-background">
      <Header>
        <Navbar />
      </Header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Page Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-headline font-bold text-foreground mb-4">
              Contact Us
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Get in touch with the {siteName} team. We'd love to hear from you and 
              answer any questions you may have.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Information */}
            <div className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Get in Touch
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {contactEmail && (
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Mail className="h-5 w-5 text-primary" />
                        </div>
                      </div>
                      <div>
                        <h3 className="font-semibold">Email</h3>
                        <a 
                          href={`mailto:${contactEmail}`}
                          className="text-primary hover:underline"
                        >
                          {contactEmail}
                        </a>
                      </div>
                    </div>
                  )}

                  {contactPhone && (
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Phone className="h-5 w-5 text-primary" />
                        </div>
                      </div>
                      <div>
                        <h3 className="font-semibold">Phone</h3>
                        <a 
                          href={`tel:${contactPhone}`}
                          className="text-primary hover:underline"
                        >
                          {contactPhone}
                        </a>
                      </div>
                    </div>
                  )}

                  {contactAddress && (
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <MapPin className="h-5 w-5 text-primary" />
                        </div>
                      </div>
                      <div>
                        <h3 className="font-semibold">Address</h3>
                        <p className="text-muted-foreground">{contactAddress}</p>
                      </div>
                    </div>
                  )}

                  {workingHours && (
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Clock className="h-5 w-5 text-primary" />
                        </div>
                      </div>
                      <div>
                        <h3 className="font-semibold">Working Hours</h3>
                        <p className="text-muted-foreground">{workingHours}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Social Media */}
              <Card>
                <CardHeader>
                  <CardTitle>Follow Us</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Stay connected with us on social media for the latest updates and news.
                  </p>
                  <SocialMediaLinks 
                    size="lg" 
                    variant="outline" 
                    showLabels={true}
                    className="flex-wrap"
                  />
                </CardContent>
              </Card>
            </div>

            {/* Contact Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5" />
                  Send us a Message
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input id="firstName" placeholder="John" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input id="lastName" placeholder="Doe" required />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="john.doe@example.com" 
                      required 
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Input 
                      id="subject" 
                      placeholder="What is this regarding?" 
                      required 
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea 
                      id="message" 
                      placeholder="Tell us more about your inquiry..."
                      rows={6}
                      required 
                    />
                  </div>

                  <Button type="submit" className="w-full">
                    <Send className="mr-2 h-4 w-4" />
                    Send Message
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ContactPage;