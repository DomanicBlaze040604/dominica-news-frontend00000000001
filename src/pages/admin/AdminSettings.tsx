import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Globe, Mail, Search, Facebook } from "lucide-react";
import { GeneralSettings } from "../../components/admin/GeneralSettings";
import { SocialMediaSettings } from "../../components/admin/SocialMediaSettings";
import { ContactSettings } from "../../components/admin/ContactSettings";
import { SEOSettings } from "../../components/admin/SEOSettings";

const AdminSettings = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-headline font-bold text-foreground mb-2">
          Site Settings
        </h1>
        <p className="text-muted-foreground">
          Configure various site-wide settings and preferences
        </p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="social" className="flex items-center gap-2">
            <Facebook className="h-4 w-4" />
            Social Media
          </TabsTrigger>
          <TabsTrigger value="contact" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Contact
          </TabsTrigger>
          <TabsTrigger value="seo" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            SEO
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <GeneralSettings />
        </TabsContent>

        <TabsContent value="social" className="space-y-6">
          <SocialMediaSettings />
        </TabsContent>

        <TabsContent value="contact" className="space-y-6">
          <ContactSettings />
        </TabsContent>

        <TabsContent value="seo" className="space-y-6">
          <SEOSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSettings;