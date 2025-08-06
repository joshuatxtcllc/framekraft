
import React, { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Frame, Palette, Download, RotateCw, ZoomIn, ZoomOut } from "lucide-react";

interface FrameOption {
  id: string;
  name: string;
  color: string;
  width: number;
  style: string;
  price: number;
}

interface MatOption {
  id: string;
  name: string;
  color: string;
  price: number;
}

export default function VirtualFrameDesigner() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedFrame, setSelectedFrame] = useState<FrameOption | null>(null);
  const [selectedMat, setSelectedMat] = useState<MatOption | null>(null);
  const [artworkWidth, setArtworkWidth] = useState(8);
  const [artworkHeight, setArtworkHeight] = useState(10);
  const [matWidth, setMatWidth] = useState([2]);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  // Mock data for frames and mats
  const frameOptions: FrameOption[] = [
    { id: "1", name: "Classic Wood", color: "#8B4513", width: 1, style: "traditional", price: 45 },
    { id: "2", name: "Modern Black", color: "#000000", width: 0.5, style: "contemporary", price: 35 },
    { id: "3", name: "Gold Ornate", color: "#FFD700", width: 1.5, style: "ornate", price: 85 },
    { id: "4", name: "Silver Sleek", color: "#C0C0C0", width: 0.75, style: "modern", price: 55 },
    { id: "5", name: "White Clean", color: "#FFFFFF", width: 1, style: "minimalist", price: 40 },
  ];

  const matOptions: MatOption[] = [
    { id: "1", name: "Ivory White", color: "#FFFFF0", price: 15 },
    { id: "2", name: "Museum Black", color: "#1C1C1C", price: 18 },
    { id: "3", name: "Warm Gray", color: "#A0A0A0", price: 16 },
    { id: "4", name: "Cream", color: "#F5F5DC", price: 15 },
    { id: "5", name: "Navy Blue", color: "#000080", price: 20 },
  ];

  const drawVisualization = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Set up scaling and positioning
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const scale = Math.min(canvas.width / (artworkWidth + (matWidth[0] * 2) + 4), canvas.height / (artworkHeight + (matWidth[0] * 2) + 4)) * zoom;

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(scale, scale);

    // Draw frame
    if (selectedFrame) {
      const frameWidth = selectedFrame.width;
      const totalWidth = artworkWidth + (matWidth[0] * 2) + (frameWidth * 2);
      const totalHeight = artworkHeight + (matWidth[0] * 2) + (frameWidth * 2);

      ctx.fillStyle = selectedFrame.color;
      ctx.fillRect(-totalWidth / 2, -totalHeight / 2, totalWidth, totalHeight);
    }

    // Draw mat
    if (selectedMat) {
      const matTotalWidth = artworkWidth + (matWidth[0] * 2);
      const matTotalHeight = artworkHeight + (matWidth[0] * 2);

      ctx.fillStyle = selectedMat.color;
      ctx.fillRect(-matTotalWidth / 2, -matTotalHeight / 2, matTotalWidth, matTotalHeight);
    }

    // Draw artwork area
    ctx.fillStyle = '#f0f0f0';
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 0.1;
    ctx.fillRect(-artworkWidth / 2, -artworkHeight / 2, artworkWidth, artworkHeight);
    ctx.strokeRect(-artworkWidth / 2, -artworkHeight / 2, artworkWidth, artworkHeight);

    // Add sample artwork text
    ctx.fillStyle = '#666';
    ctx.font = `${Math.min(artworkWidth, artworkHeight) / 6}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Your Artwork', 0, 0);

    ctx.restore();
  };

  // Initialize defaults once when component mounts
  React.useEffect(() => {
    if (frameOptions.length > 0 && !selectedFrame) {
      setSelectedFrame(frameOptions[0]);
    }
    if (matOptions.length > 0 && !selectedMat) {
      setSelectedMat(matOptions[0]);
    }
  }, []); // Only run once on mount

  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      drawVisualization();
    }, 100);
    return () => clearTimeout(timeoutId);
  }, [selectedFrame, selectedMat, artworkWidth, artworkHeight, matWidth, zoom, rotation]);

  const calculateTotal = () => {
    const framePrice = selectedFrame?.price || 0;
    const matPrice = selectedMat?.price || 0;
    const sizeMultiplier = (artworkWidth * artworkHeight) / 80; // Base size 8x10
    return (framePrice + matPrice) * sizeMultiplier;
  };

  const captureDesign = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataURL = canvas.toDataURL('image/jpeg', 0.9);
    console.log('Frame design captured:', dataURL);
    
    // Create download link
    const link = document.createElement('a');
    link.download = 'frame-design.jpg';
    link.href = dataURL;
    link.click();
  };

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      
      <div className="lg:pl-64 flex flex-col flex-1">
        <Header />
        
        <main className="flex-1">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <div className="md:flex md:items-center md:justify-between mb-8">
                <div className="flex-1 min-w-0">
                  <h2 className="text-2xl font-bold leading-7 text-foreground sm:text-3xl sm:truncate">
                    Virtual Frame Designer
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Design and visualize your custom frame before ordering
                  </p>
                </div>
                <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
                  <Button variant="outline" onClick={captureDesign}>
                    <Download className="w-4 h-4 mr-2" />
                    Save Design
                  </Button>
                  <Button>
                    Add to Cart - ${calculateTotal().toFixed(2)}
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Controls Panel */}
                <div className="lg:col-span-1 space-y-6">
                  {/* Artwork Dimensions */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Frame className="w-5 h-5 mr-2" />
                        Artwork Size
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="width">Width (inches)</Label>
                          <Input
                            id="width"
                            type="number"
                            value={artworkWidth}
                            onChange={(e) => setArtworkWidth(Number(e.target.value))}
                            min="1"
                            max="48"
                          />
                        </div>
                        <div>
                          <Label htmlFor="height">Height (inches)</Label>
                          <Input
                            id="height"
                            type="number"
                            value={artworkHeight}
                            onChange={(e) => setArtworkHeight(Number(e.target.value))}
                            min="1"
                            max="48"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Frame Selection */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Frame Style</CardTitle>
                      <CardDescription>Choose your frame</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 gap-2">
                        {frameOptions.map((frame) => (
                          <div
                            key={frame.id}
                            className={`p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                              selectedFrame?.id === frame.id
                                ? 'border-primary bg-primary/5'
                                : 'border-border hover:border-primary/50'
                            }`}
                            onClick={() => setSelectedFrame(frame)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div
                                  className="w-6 h-6 rounded border"
                                  style={{ backgroundColor: frame.color }}
                                />
                                <div>
                                  <div className="font-medium">{frame.name}</div>
                                  <div className="text-sm text-muted-foreground">{frame.style}</div>
                                </div>
                              </div>
                              <Badge variant="secondary">${frame.price}</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Mat Selection */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Palette className="w-5 h-5 mr-2" />
                        Mat Options
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Mat Width: {matWidth[0]} inches</Label>
                        <Slider
                          value={matWidth}
                          onValueChange={setMatWidth}
                          max={4}
                          min={0.5}
                          step={0.25}
                          className="mt-2"
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 gap-2">
                        {matOptions.map((mat) => (
                          <div
                            key={mat.id}
                            className={`p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                              selectedMat?.id === mat.id
                                ? 'border-primary bg-primary/5'
                                : 'border-border hover:border-primary/50'
                            }`}
                            onClick={() => setSelectedMat(mat)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div
                                  className="w-6 h-6 rounded border"
                                  style={{ backgroundColor: mat.color }}
                                />
                                <div className="font-medium">{mat.name}</div>
                              </div>
                              <Badge variant="secondary">${mat.price}</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Visualization Panel */}
                <div className="lg:col-span-2">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>Preview</CardTitle>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
                          >
                            <ZoomOut className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setZoom(Math.min(2, zoom + 0.1))}
                          >
                            <ZoomIn className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setRotation((rotation + 90) % 360)}
                          >
                            <RotateCw className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-gray-100 rounded-lg p-4 flex items-center justify-center min-h-[500px]">
                        <canvas
                          ref={canvasRef}
                          width={600}
                          height={500}
                          className="border border-gray-300 rounded shadow-sm bg-white"
                        />
                      </div>
                      
                      <Separator className="my-4" />
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Frame: {selectedFrame?.name || 'None'}</span>
                          <span>${selectedFrame?.price || 0}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Mat: {selectedMat?.name || 'None'}</span>
                          <span>${selectedMat?.price || 0}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Size: {artworkWidth}" × {artworkHeight}"</span>
                          <span>Multiplier: {((artworkWidth * artworkHeight) / 80).toFixed(2)}x</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between font-medium">
                          <span>Total:</span>
                          <span>${calculateTotal().toFixed(2)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
