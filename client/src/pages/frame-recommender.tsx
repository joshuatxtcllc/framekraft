
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Image, Palette, Ruler } from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";

export default function FrameRecommender() {
  const [artworkType, setArtworkType] = useState("");
  const [dimensions, setDimensions] = useState({ width: "", height: "" });
  const [colorPreference, setColorPreference] = useState("");
  const [budget, setBudget] = useState("");
  const [description, setDescription] = useState("");
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const mockRecommendations = [
    {
      id: 1,
      name: "Classic Oak Frame",
      style: "Traditional",
      material: "Oak Wood",
      color: "Natural",
      price: 89.99,
      confidence: 95,
      reason: "Perfect match for traditional artwork with warm tones"
    },
    {
      id: 2,
      name: "Modern Black Metal",
      style: "Contemporary",
      material: "Aluminum",
      color: "Matte Black",
      price: 124.99,
      confidence: 88,
      reason: "Clean lines complement modern photography"
    },
    {
      id: 3,
      name: "Vintage Gold Ornate",
      style: "Ornate",
      material: "Composite",
      color: "Antique Gold",
      price: 156.99,
      confidence: 82,
      reason: "Elegant option that enhances classical pieces"
    }
  ];

  const handleGetRecommendations = async () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setRecommendations(mockRecommendations);
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      
      <div className="lg:pl-64 flex flex-col flex-1">
        <Header />
        
        <main className="flex-1 p-4 lg:p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold">AI Frame Recommender</h1>
                <p className="text-muted-foreground">Get personalized frame recommendations using AI</p>
              </div>
              <Sparkles className="w-8 h-8 text-primary" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Input Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Image className="w-5 h-5" />
                    Artwork Details
                  </CardTitle>
                  <CardDescription>
                    Tell us about your artwork to get the best frame recommendations
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="artwork-type">Artwork Type</Label>
                    <Select value={artworkType} onValueChange={setArtworkType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select artwork type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="photography">Photography</SelectItem>
                        <SelectItem value="painting">Painting</SelectItem>
                        <SelectItem value="print">Print</SelectItem>
                        <SelectItem value="drawing">Drawing</SelectItem>
                        <SelectItem value="poster">Poster</SelectItem>
                        <SelectItem value="certificate">Certificate</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="width">Width (inches)</Label>
                      <Input
                        id="width"
                        type="number"
                        placeholder="16"
                        value={dimensions.width}
                        onChange={(e) => setDimensions(prev => ({ ...prev, width: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="height">Height (inches)</Label>
                      <Input
                        id="height"
                        type="number"
                        placeholder="20"
                        value={dimensions.height}
                        onChange={(e) => setDimensions(prev => ({ ...prev, height: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="color-preference">Color Preference</Label>
                    <Select value={colorPreference} onValueChange={setColorPreference}>
                      <SelectTrigger>
                        <SelectValue placeholder="Preferred frame color" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="natural">Natural Wood</SelectItem>
                        <SelectItem value="black">Black</SelectItem>
                        <SelectItem value="white">White</SelectItem>
                        <SelectItem value="gold">Gold</SelectItem>
                        <SelectItem value="silver">Silver</SelectItem>
                        <SelectItem value="any">No preference</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="budget">Budget Range</Label>
                    <Select value={budget} onValueChange={setBudget}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select budget range" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="under-50">Under $50</SelectItem>
                        <SelectItem value="50-100">$50 - $100</SelectItem>
                        <SelectItem value="100-200">$100 - $200</SelectItem>
                        <SelectItem value="200-plus">$200+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="description">Additional Details</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe the artwork style, colors, or any specific requirements..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <Button 
                    onClick={handleGetRecommendations}
                    disabled={isLoading || !artworkType}
                    className="w-full"
                  >
                    {isLoading ? "Analyzing..." : "Get AI Recommendations"}
                  </Button>
                </CardContent>
              </Card>

              {/* Recommendations */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="w-5 h-5" />
                    Recommendations
                  </CardTitle>
                  <CardDescription>
                    AI-powered frame suggestions tailored to your artwork
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {recommendations.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Fill in the artwork details to get personalized recommendations</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {recommendations.map((rec) => (
                        <div key={rec.id} className="border rounded-lg p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold">{rec.name}</h3>
                            <Badge variant="secondary">{rec.confidence}% match</Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                            <div>
                              <span className="font-medium">Style:</span> {rec.style}
                            </div>
                            <div>
                              <span className="font-medium">Material:</span> {rec.material}
                            </div>
                            <div>
                              <span className="font-medium">Color:</span> {rec.color}
                            </div>
                            <div>
                              <span className="font-medium">Price:</span> ${rec.price}
                            </div>
                          </div>
                          
                          <p className="text-sm">{rec.reason}</p>
                          
                          <Button variant="outline" size="sm" className="w-full">
                            Add to Quote
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
