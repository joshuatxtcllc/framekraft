
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Frame, Layers, Calculator, Printer } from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import FrameVisualizer from "@/components/frame-designer/FrameVisualizer";
import GicleePrintingService from "@/components/giclee/GicleePrintingService";
import LarsonOrderOptimizer from "@/components/orders/LarsonOrderOptimizer";

export default function VirtualFrameDesigner() {
  const [artworkWidth, setArtworkWidth] = useState(16);
  const [artworkHeight, setArtworkHeight] = useState(20);
  const [artworkImage, setArtworkImage] = useState<string | null>(null);
  const [selectedFrames, setSelectedFrames] = useState<any[]>([]);
  const [selectedMats, setSelectedMats] = useState<any[]>([]);
  const [useMultipleFrames, setUseMultipleFrames] = useState(false);
  const [useMultipleMats, setUseMultipleMats] = useState(false);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setArtworkImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFrameImageCaptured = (imageData: string) => {
    console.log('Frame design captured:', imageData);
    // Here you could save the frame design to the order
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
                <h1 className="text-2xl lg:text-3xl font-bold">Virtual Frame Designer</h1>
                <p className="text-muted-foreground">Design custom frames with real-time visualization and optimization tools</p>
              </div>
              <Frame className="w-8 h-8 text-primary" />
            </div>

            <Tabs defaultValue="designer" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="designer" className="flex items-center gap-2">
                  <Frame className="w-4 h-4" />
                  Designer
                </TabsTrigger>
                <TabsTrigger value="giclee" className="flex items-center gap-2">
                  <Printer className="w-4 h-4" />
                  Fine Art Printing
                </TabsTrigger>
                <TabsTrigger value="optimizer" className="flex items-center gap-2">
                  <Calculator className="w-4 h-4" />
                  Materials Optimizer
                </TabsTrigger>
                <TabsTrigger value="preview" className="flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  3D Preview
                </TabsTrigger>
              </TabsList>

              <TabsContent value="designer" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Upload Column */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Upload Artwork</CardTitle>
                      <CardDescription>Upload an image to see your framed artwork</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                        {artworkImage ? (
                          <div className="space-y-4">
                            <img 
                              src={artworkImage} 
                              alt="Uploaded artwork" 
                              className="max-w-full max-h-48 mx-auto object-contain"
                            />
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => document.getElementById('image-upload')?.click()}
                            >
                              Change Image
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <Frame className="w-12 h-12 mx-auto text-muted-foreground" />
                            <div>
                              <p className="text-sm text-muted-foreground mb-2">
                                Click to upload or drag and drop
                              </p>
                              <Button 
                                variant="outline"
                                onClick={() => document.getElementById('image-upload')?.click()}
                              >
                                Browse Files
                              </Button>
                            </div>
                          </div>
                        )}
                        <input
                          id="image-upload"
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="artwork-width">Width (inches)</Label>
                          <Input
                            id="artwork-width"
                            type="number"
                            value={artworkWidth}
                            onChange={(e) => setArtworkWidth(Number(e.target.value))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="artwork-height">Height (inches)</Label>
                          <Input
                            id="artwork-height"
                            type="number"
                            value={artworkHeight}
                            onChange={(e) => setArtworkHeight(Number(e.target.value))}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Frame Options Column */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Frame Options</CardTitle>
                      <CardDescription>Select frame styles and mat colors</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium">Frame Styles</Label>
                          <div className="mt-2 text-sm text-muted-foreground">
                            Frame selection component would go here
                          </div>
                        </div>

                        <div>
                          <Label className="text-sm font-medium">Mat Colors</Label>
                          <div className="mt-2 text-sm text-muted-foreground">
                            Mat selection component would go here
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t">
                          <Label htmlFor="multiple-frames">Multiple Frames</Label>
                          <input
                            id="multiple-frames"
                            type="checkbox"
                            checked={useMultipleFrames}
                            onChange={(e) => setUseMultipleFrames(e.target.checked)}
                            className="rounded"
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <Label htmlFor="multiple-mats">Multiple Mats</Label>
                          <input
                            id="multiple-mats"
                            type="checkbox"
                            checked={useMultipleMats}
                            onChange={(e) => setUseMultipleMats(e.target.checked)}
                            className="rounded"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Preview Column */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Preview</CardTitle>
                      <CardDescription>See your framed artwork</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="aspect-[4/3] bg-muted rounded-lg flex items-center justify-center">
                        <div className="text-center text-muted-foreground">
                          <Frame className="w-12 h-12 mx-auto mb-4" />
                          <p>Select options to see preview</p>
                        </div>
                      </div>

                      <div className="mt-4 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Estimated Total:</span>
                          <span className="font-medium">$0.00</span>
                        </div>
                        <Button className="w-full" disabled>
                          Add to Order
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Full Width Visualizer */}
                <Card>
                  <CardHeader>
                    <CardTitle>Frame Visualizer</CardTitle>
                    <CardDescription>Interactive 3D preview of your framed artwork</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FrameVisualizer
                      frames={selectedFrames}
                      mats={selectedMats}
                      artworkWidth={artworkWidth}
                      artworkHeight={artworkHeight}
                      artworkImage={artworkImage}
                      useMultipleFrames={useMultipleFrames}
                      useMultipleMats={useMultipleMats}
                      onFrameImageCaptured={handleFrameImageCaptured}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="giclee">
                <GicleePrintingService />
              </TabsContent>

              <TabsContent value="optimizer">
                <LarsonOrderOptimizer />
              </TabsContent>

              <TabsContent value="preview" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>3D Material Preview</CardTitle>
                    <CardDescription>
                      Interactive 3D preview of frame materials and textures
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                      <div className="text-center text-muted-foreground">
                        <Layers className="w-16 h-16 mx-auto mb-4" />
                        <p className="text-lg font-medium">3D Material Preview</p>
                        <p className="text-sm">Interactive 3D preview would render here</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}
