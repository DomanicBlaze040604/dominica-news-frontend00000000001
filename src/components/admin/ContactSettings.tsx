import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Mail, Phone, MapPin, Clock } from 'lucide-react';
import { useAllSiteSettings, useUpdateSiteSetting } from '../../hooks/useSiteSettings';

const contactSchema = z.object({
  email: z.string().email('Please enter a valid email address').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  workingHours: z.string().optional(),
});

type ContactFormData = z.infer<typeof contactSchema>;

const contactFields = [
  { 
    key: 'email', 
    label: 'Contact Email', 
    icon: Mail, 
    type: 'email',
    placeholder: 'contact@dominicanews.com',
    description: 'Main contact email address'
  },
  { 
    key: 'phone', 
    label: 'Phone Number', 
    icon: Phone, 
    type: 'tel',
    placeholder: '+1-767-448-NEWS',
    description: 'Contact phone number'
  },
  { 
    key: 'address', 
    label: 'Address', 
    icon: MapPin, 
    type: 'text',
    placeholder: '123 Independence Street, Roseau, Commonwealth of Dominica',
    description: 'Physical address'
  },
  { 
    key: 'workingHours', 
    label: 'Working Hours', 
    icon: Clock, 
    type: 'text',
    placeholder: 'Monday - Friday: 8:00 AM - 6:00 PM AST',
    description: 'Business hours'
  },
];

export const ContactSettings: React.FC = () => {
  const { data: settingsData, isLoading } = useAllSiteSettings();
  const updateSetting = useUpdateSiteSetting();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      email: '',
      phone: '',
      address: '',
      workingHours: '',
    },
  });

  // Populate form with existing settings
  useEffect(() => {
    if (settingsData?.data?.settings) {
      const settings = settingsData.data.settings;
      const contactSettings: ContactFormData = {};
      
      contactFields.forEach(field => {
        const setting = settings.find(s => s.key === `contact_${field.key}`);
        contactSettings[field.key as keyof ContactFormData] = setting?.value || '';
      });
      
      form.reset(contactSettings);
    }
  }, [settingsData, form]);

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);
    
    try {
      // Update each contact setting
      const updatePromises = contactFields.map(field => {
        const value = data[field.key as keyof ContactFormData] || '';
        return updateSetting.mutateAsync({
          key: `contact_${field.key}`,
          value,
          description: field.description,
        });
      });

      await Promise.all(updatePromises);
      toast.success('Contact information updated successfully!');
    } catch (error) {
      console.error('Error updating contact information:', error);
      toast.error('Failed to update contact information');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Contact Information
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Configure your contact details. This information will be displayed on your contact page and footer.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {contactFields.map((field) => {
            const Icon = field.icon;
            const isTextarea = field.key === 'address' || field.key === 'workingHours';
            
            return (
              <div key={field.key} className="space-y-2">
                <Label htmlFor={field.key} className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  {field.label}
                </Label>
                {isTextarea ? (
                  <Textarea
                    id={field.key}
                    placeholder={field.placeholder}
                    rows={3}
                    {...form.register(field.key as keyof ContactFormData)}
                  />
                ) : (
                  <Input
                    id={field.key}
                    type={field.type}
                    placeholder={field.placeholder}
                    {...form.register(field.key as keyof ContactFormData)}
                  />
                )}
                {form.formState.errors[field.key as keyof ContactFormData] && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors[field.key as keyof ContactFormData]?.message}
                  </p>
                )}
              </div>
            );
          })}
          
          <div className="pt-4">
            <Button 
              type="submit" 
              disabled={isSubmitting || updateSetting.isPending}
              className="w-full sm:w-auto"
            >
              {isSubmitting ? 'Updating...' : 'Update Contact Information'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};