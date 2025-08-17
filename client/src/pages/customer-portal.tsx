
import React from 'react';
import { Link } from 'wouter';
import { Package, Search, Phone, Mail, MapPin, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function CustomerPortal() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">FC</span>
              </div>
              <div className="ml-3">
                <h1 className="text-2xl font-bold text-gray-900">FrameCraft Pro</h1>
                <p className="text-sm text-gray-500">Custom Framing Excellence</p>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <div className="flex items-center text-gray-600">
                <Phone className="w-4 h-4 mr-2" />
                <span>(555) 123-FRAME</span>
              </div>
              <div className="flex items-center text-gray-600">
                <Mail className="w-4 h-4 mr-2" />
                <span>hello@framecraftpro.com</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Professional Custom Framing
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Transform your art, photos, and memories with our expert framing services. 
            Quality craftsmanship, premium materials, and personalized service.
          </p>
          
          {/* Order Tracking Widget */}
          <Card className="max-w-md mx-auto mb-12">
            <CardHeader>
              <CardTitle className="flex items-center justify-center">
                <Search className="w-5 h-5 mr-2" />
                Track Your Order
              </CardTitle>
              <CardDescription>
                Enter your order number to see real-time progress
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Order #FC2401"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  data-testid="input-track-order"
                />
                <Link href="/order-tracking">
                  <Button className="bg-emerald-600 hover:bg-emerald-700" data-testid="button-track-order">
                    Track
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Services */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Our Services
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Custom Picture Frames</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Handcrafted frames in any size, style, or finish to perfectly complement your artwork.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Canvas Stretching</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Professional canvas stretching services using museum-quality materials and techniques.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Art Restoration</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Expert restoration and conservation framing to preserve your valuable artwork.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Contact & Hours */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Visit Our Studio</h3>
              <div className="space-y-4">
                <div className="flex items-start">
                  <MapPin className="w-5 h-5 text-emerald-600 mt-1 mr-3" />
                  <div>
                    <p className="font-semibold text-gray-900">123 Art Street</p>
                    <p className="text-gray-600">Creative District, CA 90210</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Phone className="w-5 h-5 text-emerald-600 mt-1 mr-3" />
                  <div>
                    <p className="font-semibold text-gray-900">(555) 123-FRAME</p>
                    <p className="text-gray-600">Call for consultation</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Mail className="w-5 h-5 text-emerald-600 mt-1 mr-3" />
                  <div>
                    <p className="font-semibold text-gray-900">hello@framecraftpro.com</p>
                    <p className="text-gray-600">Get a quote</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Studio Hours</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Monday - Friday</span>
                  <span className="font-semibold text-gray-900">9:00 AM - 6:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Saturday</span>
                  <span className="font-semibold text-gray-900">10:00 AM - 4:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Sunday</span>
                  <span className="font-semibold text-gray-900">By Appointment</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">FC</span>
            </div>
            <span className="ml-2 text-xl font-bold">FrameCraft Pro</span>
          </div>
          <p className="text-gray-400">
            © 2025 FrameCraft Pro. All rights reserved. | Professional Custom Framing Services
          </p>
        </div>
      </footer>
    </div>
  );
}
