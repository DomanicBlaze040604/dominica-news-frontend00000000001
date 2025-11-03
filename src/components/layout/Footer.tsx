import React from 'react';
import { Link } from 'react-router-dom';
import { SocialMediaLinks } from '../SocialMediaLinks';
import { useSiteSetting } from '../../hooks/useSiteSettings';
import { Mail, Phone, MapPin, Clock } from 'lucide-react';

export const Footer: React.FC = () => {
  // Get site settings
  const { data: siteNameData } = useSiteSetting('site_name');
  const { data: contactEmailData } = useSiteSetting('contact_email');
  const { data: contactPhoneData } = useSiteSetting('contact_phone');
  const { data: contactAddressData } = useSiteSetting('contact_address');
  const { data: workingHoursData } = useSiteSetting('contact_workingHours');

  const siteName = siteNameData?.data?.value || 'Dominica News';
  const contactEmail = contactEmailData?.data?.value;
  const contactPhone = contactPhoneData?.data?.value;
  const contactAddress = contactAddressData?.data?.value;
  const workingHours = workingHoursData?.data?.value;

  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-primary text-primary-foreground mt-16">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* About Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">{siteName}</h3>
            <p className="text-sm text-primary-foreground/80">
              Your premier source for news and updates from the Commonwealth of Dominica 
              and the Caribbean region. Stay informed with breaking news, politics, 
              economy, and culture.
            </p>
            <SocialMediaLinks 
              className="pt-2" 
              variant="ghost" 
              size="md"
            />
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link 
                  to="/category/dominica" 
                  className="text-primary-foreground/80 hover:text-primary-foreground transition-colors"
                >
                  Dominica News
                </Link>
              </li>
              <li>
                <Link 
                  to="/category/world" 
                  className="text-primary-foreground/80 hover:text-primary-foreground transition-colors"
                >
                  World News
                </Link>
              </li>
              <li>
                <Link 
                  to="/category/economy" 
                  className="text-primary-foreground/80 hover:text-primary-foreground transition-colors"
                >
                  Economy
                </Link>
              </li>
              <li>
                <Link 
                  to="/category/agriculture" 
                  className="text-primary-foreground/80 hover:text-primary-foreground transition-colors"
                >
                  Agriculture
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Contact Us</h3>
            <div className="space-y-3 text-sm">
              {contactEmail && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary-foreground/60" />
                  <a 
                    href={`mailto:${contactEmail}`}
                    className="text-primary-foreground/80 hover:text-primary-foreground transition-colors"
                  >
                    {contactEmail}
                  </a>
                </div>
              )}
              {contactPhone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-primary-foreground/60" />
                  <a 
                    href={`tel:${contactPhone}`}
                    className="text-primary-foreground/80 hover:text-primary-foreground transition-colors"
                  >
                    {contactPhone}
                  </a>
                </div>
              )}
              {contactAddress && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-primary-foreground/60 mt-0.5" />
                  <span className="text-primary-foreground/80">
                    {contactAddress}
                  </span>
                </div>
              )}
              {workingHours && (
                <div className="flex items-start gap-2">
                  <Clock className="h-4 w-4 text-primary-foreground/60 mt-0.5" />
                  <span className="text-primary-foreground/80">
                    {workingHours}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Newsletter */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Stay Updated</h3>
            <p className="text-sm text-primary-foreground/80">
              Get the latest news delivered straight to your inbox.
            </p>
            <div className="space-y-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full px-3 py-2 text-sm bg-primary-foreground/10 border border-primary-foreground/20 rounded-md text-primary-foreground placeholder:text-primary-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary-foreground/50"
              />
              <button className="w-full px-3 py-2 text-sm bg-primary-foreground text-primary rounded-md hover:bg-primary-foreground/90 transition-colors">
                Subscribe
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-primary-foreground/20 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-primary-foreground/80">
            <div>
              © {currentYear} {siteName}. All rights reserved.
            </div>
            <div className="flex gap-6">
              <Link 
                to="/privacy" 
                className="hover:text-primary-foreground transition-colors"
              >
                Privacy Policy
              </Link>
              <Link 
                to="/terms" 
                className="hover:text-primary-foreground transition-colors"
              >
                Terms of Service
              </Link>
              <Link 
                to="/contact" 
                className="hover:text-primary-foreground transition-colors"
              >
                Contact
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};