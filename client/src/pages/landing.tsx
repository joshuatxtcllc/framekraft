import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Frame, Brain, TrendingUp, Users, Package, BarChart3 } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-wood-50 to-accent/10">
      {/* Header */}
      <header className="px-4 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Frame className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-primary">FrameCraft</h1>
              <p className="text-sm text-muted-foreground">Business Suite</p>
            </div>
          </div>
          <Button 
            onClick={() => window.location.href = '/login'}
            className="btn-primary"
          >
            Sign In
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="px-4 py-20">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-foreground mb-6">
            Revolutionize Your <span className="text-primary">Custom Framing</span> Business
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            FrameCraft combines powerful business management tools with AI-powered insights 
            to streamline operations, enhance customer service, and grow your framing business.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={() => window.location.href = '/signup'}
              className="btn-primary text-lg px-8 py-4"
            >
              Get Started Today
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="text-lg px-8 py-4"
            >
              Watch Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="px-4 py-20 bg-white/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Everything You Need to Manage Your Business
            </h2>
            <p className="text-lg text-muted-foreground">
              Professional tools designed specifically for custom framing businesses
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Order Management */}
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <CardContent className="p-0">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Package className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Order Management</h3>
                <p className="text-muted-foreground">
                  Track custom framing projects from consultation to completion with detailed 
                  workflow management and automated status updates.
                </p>
              </CardContent>
            </Card>

            {/* AI-Powered Recommendations */}
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <CardContent className="p-0">
                <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-4">
                  <Brain className="w-6 h-6 text-secondary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">AI Frame Recommender</h3>
                <p className="text-muted-foreground">
                  Get intelligent frame, mat, and glazing recommendations based on artwork 
                  analysis, customer preferences, and industry best practices.
                </p>
              </CardContent>
            </Card>

            {/* Customer Management */}
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <CardContent className="p-0">
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-accent-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Customer Insights</h3>
                <p className="text-muted-foreground">
                  Maintain detailed customer profiles, track preferences, and build 
                  lasting relationships with comprehensive customer management tools.
                </p>
              </CardContent>
            </Card>

            {/* Business Analytics */}
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <CardContent className="p-0">
                <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center mb-4">
                  <BarChart3 className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Business Analytics</h3>
                <p className="text-muted-foreground">
                  Monitor key performance metrics, revenue trends, and operational 
                  efficiency with comprehensive business intelligence dashboards.
                </p>
              </CardContent>
            </Card>

            {/* Growth Optimization */}
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <CardContent className="p-0">
                <div className="w-12 h-12 bg-wood-300/10 rounded-lg flex items-center justify-center mb-4">
                  <TrendingUp className="w-6 h-6 text-wood-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Growth Optimization</h3>
                <p className="text-muted-foreground">
                  Identify revenue opportunities, optimize pricing strategies, and 
                  streamline operations with AI-powered business insights.
                </p>
              </CardContent>
            </Card>

            {/* Professional Tools */}
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <CardContent className="p-0">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Frame className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Professional Tools</h3>
                <p className="text-muted-foreground">
                  Access industry-specific tools for pricing, inventory management, 
                  and quality control tailored for custom framing professionals.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-20 bg-primary/5">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Ready to Transform Your Framing Business?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join hundreds of framing professionals who trust FrameCraft to manage and grow their business.
          </p>
          <Button 
            size="lg" 
            onClick={() => window.location.href = '/api/login'}
            className="btn-primary text-lg px-8 py-4"
          >
            Start Your Free Trial
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 py-12 bg-wood-900 text-wood-100">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
              <Frame className="w-5 h-5 text-wood-600" />
            </div>
            <span className="text-xl font-bold">FrameCraft</span>
          </div>
          <p className="text-wood-300">
            Professional business management platform for custom framing professionals.
          </p>
        </div>
      </footer>
    </div>
  );
}
