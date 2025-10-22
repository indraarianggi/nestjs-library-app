import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Github } from 'lucide-react';

/**
 * Footer Component
 * 
 * Site-wide footer with links and copyright information.
 * Includes links to About, Contact, Privacy Policy, and Terms of Service pages.
 */
export const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = [
    { to: '/about', label: 'About' },
    { to: '/contact', label: 'Contact' },
    { to: '/privacy', label: 'Privacy Policy' },
    { to: '/terms', label: 'Terms of Service' },
  ];

  const socialLinks = [
    { icon: Facebook, label: 'Facebook', href: '#' },
    { icon: Twitter, label: 'Twitter', href: '#' },
    { icon: Instagram, label: 'Instagram', href: '#' },
    { icon: Github, label: 'Github', href: '#' },
  ];

  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {/* Company Info */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Library Management System</h3>
            <p className="text-sm text-muted-foreground">
              Your trusted platform for managing library operations efficiently.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Quick Links</h3>
            <nav className="flex flex-col space-y-2">
              {footerLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Social Media */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Follow Us</h3>
            <div className="flex gap-4">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    aria-label={social.label}
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Icon className="h-5 w-5" />
                  </a>
                );
              })}
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 border-t pt-6">
          <p className="text-center text-sm text-muted-foreground">
            © {currentYear} Library Management System. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
