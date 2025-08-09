
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { 
  Eye, 
  Image, 
  Check, 
  X, 
  ShoppingCart,
  RotateCcw,
  Upload,
  Camera,
  FileImage,
  Info,
  Palette,
  Layers,
  Square,
  ChevronDown,
  Search,
  Filter,
  Package,
  Truck,
  Clock,
  AlertTriangle,
  Plus,
  ClipboardList,
  ArrowDownToLine,
  Edit
} from 'lucide-react';
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Frame color definitions with realistic finishes
const FRAME_COLORS = {
  wood: [
    { id: 'natural-oak', name: 'Natural Oak', hex: '#D2B48C', texture: 'wood-grain', finish: 'satin' },
    { id: 'dark-walnut', name: 'Dark Walnut', hex: '#654321', texture: 'wood-grain', finish: 'satin' },
    { id: 'cherry', name: 'Cherry', hex: '#8B4513', texture: 'wood-grain', finish: 'satin' },
    { id: 'mahogany', name: 'Mahogany', hex: '#C04000', texture: 'wood-grain', finish: 'satin' },
    { id: 'espresso', name: 'Espresso', hex: '#362D1D', texture: 'wood-grain', finish: 'satin' },
    { id: 'maple', name: 'Maple', hex: '#F5DEB3', texture: 'wood-grain', finish: 'satin' },
    { id: 'ebony', name: 'Ebony', hex: '#0C0C0C', texture: 'wood-grain', finish: 'satin' },
    { id: 'pine', name: 'Pine', hex: '#E4D5B7', texture: 'wood-grain', finish: 'satin' }
  ],
  metal: [
    { id: 'silver', name: 'Silver', hex: '#C0C0C0', texture: 'brushed-metal', finish: 'brushed' },
    { id: 'brushed-silver', name: 'Brushed Silver', hex: '#B8B8B8', texture: 'brushed-metal', finish: 'brushed' },
    { id: 'polished-silver', name: 'Polished Silver', hex: '#E5E5E5', texture: 'smooth', finish: 'polished' },
    { id: 'gold', name: 'Gold', hex: '#FFD700', texture: 'brushed-metal', finish: 'brushed' },
    { id: 'antique-gold', name: 'Antique Gold', hex: '#D4AF37', texture: 'brushed-metal', finish: 'antique' },
    { id: 'rose-gold', name: 'Rose Gold', hex: '#E8B4B8', texture: 'brushed-metal', finish: 'brushed' },
    { id: 'champagne', name: 'Champagne', hex: '#F7E7CE', texture: 'brushed-metal', finish: 'brushed' },
    { id: 'pewter', name: 'Pewter', hex: '#96A8A1', texture: 'brushed-metal', finish: 'brushed' },
    { id: 'bronze', name: 'Oil Rubbed Bronze', hex: '#CD7F32', texture: 'brushed-metal', finish: 'oil-rubbed' },
    { id: 'copper', name: 'Copper', hex: '#B87333', texture: 'brushed-metal', finish: 'brushed' }
  ],
  modern: [
    { id: 'matte-black', name: 'Matte Black', hex: '#1C1C1C', texture: 'smooth', finish: 'matte' },
    { id: 'gloss-black', name: 'Gloss Black', hex: '#000000', texture: 'smooth', finish: 'gloss' },
    { id: 'matte-white', name: 'Matte White', hex: '#F8F8F8', texture: 'smooth', finish: 'matte' },
    { id: 'gloss-white', name: 'Gloss White', hex: '#FFFFFF', texture: 'smooth', finish: 'gloss' },
    { id: 'light-gray', name: 'Light Gray', hex: '#D3D3D3', texture: 'smooth', finish: 'matte' },
    { id: 'medium-gray', name: 'Medium Gray', hex: '#808080', texture: 'smooth', finish: 'matte' },
    { id: 'dark-gray', name: 'Dark Gray', hex: '#404040', texture: 'smooth', finish: 'matte' },
    { id: 'charcoal', name: 'Charcoal', hex: '#36454F', texture: 'smooth', finish: 'matte' }
  ],
  industrial: [
    { id: 'raw-steel', name: 'Raw Steel', hex: '#71797E', texture: 'brushed-metal', finish: 'raw' },
    { id: 'brushed-steel', name: 'Brushed Steel', hex: '#6E7B7E', texture: 'brushed-metal', finish: 'brushed' },
    { id: 'polished-steel', name: 'Polished Steel', hex: '#8E9B9E', texture: 'smooth', finish: 'polished' },
    { id: 'gunmetal', name: 'Gunmetal', hex: '#2C3539', texture: 'brushed-metal', finish: 'matte' },
    { id: 'iron', name: 'Iron', hex: '#464451', texture: 'brushed-metal', finish: 'raw' },
    { id: 'oxidized-steel', name: 'Oxidized Steel', hex: '#5C6B73', texture: 'brushed-metal', finish: 'oxidized' },
    { id: 'blackened-steel', name: 'Blackened Steel', hex: '#2F3437', texture: 'brushed-metal', finish: 'blackened' },
    { id: 'stainless', name: 'Stainless Steel', hex: '#A8A8A8', texture: 'brushed-metal', finish: 'brushed' }
  ]
};

// Mat color definitions
const MAT_COLORS = {
  whites: [
    { id: 'pure-white', name: 'Pure White', hex: '#FFFFFF', core: 'white' },
    { id: 'antique-white', name: 'Antique White', hex: '#FAEBD7', core: 'white' },
    { id: 'ivory', name: 'Ivory', hex: '#FFFFF0', core: 'white' },
    { id: 'cream', name: 'Cream', hex: '#F5F5DC', core: 'white' },
    { id: 'pearl', name: 'Pearl', hex: '#F8F6F0', core: 'white' },
    { id: 'linen', name: 'Linen', hex: '#FAF0E6', core: 'white' }
  ],
  neutrals: [
    { id: 'light-gray', name: 'Light Gray', hex: '#D3D3D3', core: 'white' },
    { id: 'warm-gray', name: 'Warm Gray', hex: '#C7C2B8', core: 'white' },
    { id: 'dove-gray', name: 'Dove Gray', hex: '#6D6D6D', core: 'black' },
    { id: 'charcoal', name: 'Charcoal', hex: '#36454F', core: 'black' },
    { id: 'black', name: 'Black', hex: '#000000', core: 'black' },
    { id: 'off-black', name: 'Off Black', hex: '#1C1C1C', core: 'black' }
  ],
  blues: [
    { id: 'navy', name: 'Navy Blue', hex: '#000080', core: 'black' },
    { id: 'navy-dark', name: 'Deep Navy', hex: '#1A1A3A', core: 'black' },
    { id: 'navy-midnight', name: 'Midnight Navy', hex: '#191970', core: 'black' },
    { id: 'royal-blue', name: 'Royal Blue', hex: '#4169E1', core: 'white' },
    { id: 'powder-blue', name: 'Powder Blue', hex: '#B0E0E6', core: 'white' },
    { id: 'slate-blue', name: 'Slate Blue', hex: '#6A5ACD', core: 'white' },
    { id: 'teal', name: 'Teal', hex: '#008080', core: 'white' },
    { id: 'dusty-blue', name: 'Dusty Blue', hex: '#6B8CAE', core: 'white' },
    { id: 'steel-blue', name: 'Steel Blue', hex: '#4682B4', core: 'white' }
  ],
  earth_tones: [
    { id: 'sand', name: 'Sand', hex: '#C2B280', core: 'white' },
    { id: 'taupe', name: 'Taupe', hex: '#483C32', core: 'black' },
    { id: 'sienna', name: 'Sienna', hex: '#A0522D', core: 'black' },
    { id: 'sage', name: 'Sage Green', hex: '#9CAF88', core: 'white' },
    { id: 'moss', name: 'Moss Green', hex: '#8A9A5B', core: 'black' },
    { id: 'terra-cotta', name: 'Terra Cotta', hex: '#E2725B', core: 'white' }
  ],
  warm_colors: [
    { id: 'burgundy', name: 'Burgundy', hex: '#800020', core: 'black' },
    { id: 'deep-red', name: 'Deep Red', hex: '#8B0000', core: 'black' },
    { id: 'rose', name: 'Rose', hex: '#FF007F', core: 'white' },
    { id: 'gold', name: 'Gold', hex: '#FFD700', core: 'black' },
    { id: 'amber', name: 'Amber', hex: '#FFBF00', core: 'black' },
    { id: 'peach', name: 'Peach', hex: '#FFCBA4', core: 'white' }
  ]
};

// Frame style definitions
const FRAME_STYLES = [
  {
    id: 'standard-wood',
    name: 'Standard Wood',
    description: 'Classic wood frame with clean lines',
    width: 1.5,
    price: 2.50,
    colors: FRAME_COLORS.wood,
    category: 'Traditional'
  },
  {
    id: 'premium-wood',
    name: 'Premium Wood',
    description: 'High-quality hardwood with elegant profile',
    width: 2,
    price: 3.75,
    colors: FRAME_COLORS.wood,
    category: 'Traditional'
  },
  {
    id: 'metal-classic',
    name: 'Classic Metal',
    description: 'Traditional metal finishes',
    width: 1,
    price: 3.25,
    colors: FRAME_COLORS.metal,
    category: 'Classic'
  },
  {
    id: 'modern-minimal',
    name: 'Modern Minimal',
    description: 'Clean contemporary lines',
    width: 0.75,
    price: 2.95,
    colors: FRAME_COLORS.modern,
    category: 'Modern'
  },
  {
    id: 'industrial',
    name: 'Industrial Steel',
    description: 'Raw steel and iron finishes',
    width: 1.25,
    price: 4.25,
    colors: FRAME_COLORS.industrial,
    category: 'Industrial'
  }
];

export default function VirtualFrameDesigner() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // State management
  const [artworkImage, setArtworkImage] = useState<string>('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEzMyIgdmlld0JveD0iMCAwIDIwMCAxMzMiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTMzIiBmaWxsPSIjNEY4NEY4Ii8+Cjx0ZXh0IHg9IjEwMCIgeT0iNzAiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCI+U2FtcGxlIEFydHdvcms8L3RleHQ+Cgo8L3N2Zz4K');
  const [artworkDimensions, setArtworkDimensions] = useState({ width: 24, height: 16, unit: 'inches' });
  const [selectedFrameStyle, setSelectedFrameStyle] = useState<string>('standard-wood');
  const [selectedFrameColor, setSelectedFrameColor] = useState<string>('natural-oak');
  const [selectedMatOption, setSelectedMatOption] = useState<'none' | 'single' | 'double'>('none');
  const [selectedMatColor1, setSelectedMatColor1] = useState<string>('');
  const [selectedMatColor2, setSelectedMatColor2] = useState<string>('');
  const [showInfo, setShowInfo] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('designer');

  // Get texture pattern for frame colors
  const getFrameTexture = (texture: string, color: string) => {
    const patterns = {
      'wood-grain': `linear-gradient(90deg, ${color} 0%, rgba(0,0,0,0.08) 25%, ${color} 50%, rgba(0,0,0,0.04) 75%, ${color} 100%)`,
      'brushed-metal': `linear-gradient(90deg, ${color} 48%, rgba(255,255,255,0.2) 50%, ${color} 52%)`,
      'smooth': color
    };
    
    return patterns[texture as keyof typeof patterns] || color;
  };

  // Calculate pricing
  const calculatePrice = useCallback(() => {
    const frameStyle = FRAME_STYLES.find(s => s.id === selectedFrameStyle);
    if (!frameStyle) return 0;

    const perimeter = (artworkDimensions.width + artworkDimensions.height) * 2;
    const basePrice = perimeter * frameStyle.price;
    
    let matPrice = 0;
    if (selectedMatOption === 'single') matPrice = 20;
    if (selectedMatOption === 'double') matPrice = 35;

    return Math.ceil(basePrice + matPrice);
  }, [selectedFrameStyle, selectedMatOption, artworkDimensions]);

  // Handle image upload
  const handleImageUpload = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setArtworkImage(result);
        
        // Create image to get dimensions
        const img = new window.Image();
        img.onload = () => {
          const aspectRatio = img.width / img.height;
          let width, height;
          
          // Standard sizes based on aspect ratio
          if (aspectRatio > 1.5) {
            // Landscape
            width = 24;
            height = 16;
          } else if (aspectRatio < 0.75) {
            // Portrait
            width = 16;
            height = 24;
          } else {
            // Square-ish
            width = 20;
            height = 20;
          }
          
          setArtworkDimensions({ width, height, unit: 'inches' });
        };
        img.src = result;
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleImageUpload(files[0]);
    }
  };

  // Handle file input
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleImageUpload(files[0]);
    }
    e.target.value = '';
  };

  // Trigger file input
  const triggerFileInput = () => {
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
      fileInput.click();
    }
  };

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
    const frameStyle = FRAME_STYLES.find(s => s.id === selectedFrameStyle);
    const frameColor = frameStyle?.colors.find(c => c.id === selectedFrameColor);
    
    if (!frameStyle || !frameColor) return;

    const frameWidth = frameStyle.width * 20; // Scale frame width
    const matWidth = selectedMatOption !== 'none' ? 40 : 0;
    
    const displayWidth = 300;
    const displayHeight = (displayWidth * artworkDimensions.height) / artworkDimensions.width;

    ctx.save();
    ctx.translate(centerX, centerY);

    // Draw frame
    const totalWidth = displayWidth + (matWidth * 2) + (frameWidth * 2);
    const totalHeight = displayHeight + (matWidth * 2) + (frameWidth * 2);

    ctx.fillStyle = frameColor.hex;
    ctx.fillRect(-totalWidth / 2, -totalHeight / 2, totalWidth, totalHeight);

    // Draw mat if selected
    if (selectedMatOption !== 'none') {
      const matColor1 = Object.values(MAT_COLORS).flat().find(c => c.id === selectedMatColor1);
      if (matColor1) {
        const matTotalWidth = displayWidth + (matWidth * 2);
        const matTotalHeight = displayHeight + (matWidth * 2);
        
        ctx.fillStyle = matColor1.hex;
        ctx.fillRect(-matTotalWidth / 2, -matTotalHeight / 2, matTotalWidth, matTotalHeight);

        if (selectedMatOption === 'double' && selectedMatColor2) {
          const matColor2 = Object.values(MAT_COLORS).flat().find(c => c.id === selectedMatColor2);
          if (matColor2) {
            const innerMatWidth = matWidth * 0.6;
            const innerTotalWidth = displayWidth + (innerMatWidth * 2);
            const innerTotalHeight = displayHeight + (innerMatWidth * 2);
            
            ctx.fillStyle = matColor2.hex;
            ctx.fillRect(-innerTotalWidth / 2, -innerTotalHeight / 2, innerTotalWidth, innerTotalHeight);
          }
        }
      }
    }

    // Draw artwork background
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(-displayWidth / 2, -displayHeight / 2, displayWidth, displayHeight);

    // Draw artwork or placeholder
    const drawPlaceholder = () => {
      ctx.fillStyle = '#666';
      ctx.font = '24px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Your Artwork', 0, 0);
    };

    if (artworkImage && !artworkImage.includes('data:image/svg+xml')) {
      const img = new window.Image();
      img.onload = () => {
        // Clear the artwork area first
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(-displayWidth / 2, -displayHeight / 2, displayWidth, displayHeight);
        // Draw the actual image
        ctx.drawImage(img, -displayWidth / 2, -displayHeight / 2, displayWidth, displayHeight);
      };
      img.onerror = () => drawPlaceholder();
      img.src = artworkImage;
    } else {
      drawPlaceholder();
    }

    ctx.restore();
  };

  useEffect(() => {
    drawVisualization();
  }, [selectedFrameStyle, selectedFrameColor, selectedMatOption, selectedMatColor1, selectedMatColor2, artworkImage, artworkDimensions]);

  // Color swatch component
  const ColorSwatch: React.FC<{
    color: any;
    isSelected: boolean;
    onClick: () => void;
    size?: 'sm' | 'md' | 'lg';
  }> = ({ color, isSelected, onClick, size = 'md' }) => {
    const sizeClasses = {
      sm: 'w-8 h-8',
      md: 'w-10 h-10',
      lg: 'w-12 h-12'
    };

    const style = color.texture 
      ? { background: getFrameTexture(color.texture, color.hex) }
      : { backgroundColor: color.hex };

    return (
      <button
        className={`
          ${sizeClasses[size]} rounded-lg border-2 transition-all hover:scale-105 flex-shrink-0
          ${isSelected ? 'border-blue-500 shadow-lg ring-2 ring-blue-200' : 'border-gray-300 hover:border-gray-400'}
          ${color.hex === '#FFFFFF' ? 'shadow-inner' : ''}
        `}
        style={style}
        onClick={onClick}
        title={color.name}
        aria-label={`Select ${color.name}`}
      />
    );
  };

  const resetDesign = () => {
    setArtworkImage('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEzMyIgdmlld0JveD0iMCAwIDIwMCAxMzMiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTMzIiBmaWxsPSIjNEY4NEY4Ii8+Cjx0ZXh0IHg9IjEwMCIgeT0iNzAiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCI+U2FtcGxlIEFydHdvcms8L3RleHQ+Cgo8L3N2Zz4K');
    setArtworkDimensions({ width: 24, height: 16, unit: 'inches' });
    setSelectedFrameStyle('standard-wood');
    setSelectedFrameColor('natural-oak');
    setSelectedMatOption('none');
    setSelectedMatColor1('');
    setSelectedMatColor2('');
  };

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      
      <div className="lg:pl-64 flex flex-col flex-1">
        <Header />
        
        <main className="flex-1">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {/* Header */}
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
                  <Button variant="outline" onClick={resetDesign}>
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset Design
                  </Button>
                  <Button>
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Add to Cart - ${calculatePrice()}.00
                  </Button>
                </div>
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="designer">Frame Designer</TabsTrigger>
                  <TabsTrigger value="materials">Materials List</TabsTrigger>
                </TabsList>

                <TabsContent value="designer" className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Preview Panel */}
                    <div className="order-1">
                      <Card>
                        <CardHeader>
                          <div className="flex items-center gap-2">
                            <Eye className="h-5 w-5" />
                            <CardTitle>Live Preview</CardTitle>
                          </div>
                          <CardDescription>
                            See your custom frame design in real-time
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="bg-gray-100 rounded-lg p-4 flex items-center justify-center min-h-[500px]">
                            <canvas
                              ref={canvasRef}
                              width={600}
                              height={500}
                              className="border border-gray-300 rounded shadow-sm bg-white max-w-full h-auto"
                            />
                          </div>
                          
                          <div className="mt-4 space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Frame: {FRAME_STYLES.find(s => s.id === selectedFrameStyle)?.name || 'None'}</span>
                              <span>${FRAME_STYLES.find(s => s.id === selectedFrameStyle)?.price || 0}/in</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Mat: {selectedMatOption === 'none' ? 'No Mat' : selectedMatOption === 'single' ? 'Single Mat' : 'Double Mat'}</span>
                              <span>${selectedMatOption === 'single' ? 20 : selectedMatOption === 'double' ? 35 : 0}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Size: {artworkDimensions.width}" × {artworkDimensions.height}"</span>
                              <span>Perimeter: {((artworkDimensions.width + artworkDimensions.height) * 2).toFixed(1)}"</span>
                            </div>
                            <div className="border-t pt-2">
                              <div className="flex justify-between font-medium">
                                <span>Total:</span>
                                <span>${calculatePrice()}.00</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Controls Panel */}
                    <div className="order-2 space-y-6">
                      {/* Upload Section */}
                      <Card>
                        <CardHeader>
                          <div className="flex items-center gap-2">
                            <Upload className="h-5 w-5 text-blue-600" />
                            <CardTitle>1. Upload Your Artwork</CardTitle>
                          </div>
                        </CardHeader>
                        <CardContent>
                          {!artworkImage || artworkImage.includes('data:image/svg+xml') ? (
                            <div 
                              className={`
                                border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer
                                ${isDragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
                              `}
                              onDragOver={handleDragOver}
                              onDragLeave={handleDragLeave}
                              onDrop={handleDrop}
                              onClick={triggerFileInput}
                            >
                              <input
                                id="file-upload"
                                type="file"
                                accept="image/*"
                                onChange={handleFileInput}
                                className="hidden"
                              />
                              
                              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                              <h4 className="font-medium mb-2">Upload Your Image</h4>
                              <p className="text-gray-600 text-sm mb-3">
                                Drag and drop or click to browse
                              </p>
                              <p className="text-xs text-gray-500">
                                Supports: JPG, PNG, GIF • Max size: 10MB
                              </p>
                            </div>
                          ) : (
                            <div className="flex items-center gap-4 p-4 bg-green-50 rounded-lg border border-green-200">
                              <img 
                                src={artworkImage} 
                                alt="Uploaded artwork" 
                                className="w-16 h-16 rounded object-cover"
                              />
                              <div className="flex-1">
                                <p className="text-green-800 font-medium">✓ Artwork uploaded successfully!</p>
                                <p className="text-green-600 text-sm">
                                  Size: {artworkDimensions.width}" × {artworkDimensions.height}"
                                </p>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={triggerFileInput}
                              >
                                Change Image
                              </Button>
                            </div>
                          )}

                          {/* Artwork Dimensions */}
                          <div className="mt-4 grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="width">Width (inches)</Label>
                              <Input
                                id="width"
                                type="number"
                                value={artworkDimensions.width}
                                onChange={(e) => setArtworkDimensions(prev => ({ ...prev, width: Number(e.target.value) }))}
                                min="1"
                                max="48"
                              />
                            </div>
                            <div>
                              <Label htmlFor="height">Height (inches)</Label>
                              <Input
                                id="height"
                                type="number"
                                value={artworkDimensions.height}
                                onChange={(e) => setArtworkDimensions(prev => ({ ...prev, height: Number(e.target.value) }))}
                                min="1"
                                max="48"
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Frame Style Selection */}
                      <Card>
                        <CardHeader>
                          <CardTitle>2. Choose Frame Style</CardTitle>
                          <CardDescription>Select your frame style and width</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-1 gap-3">
                            {FRAME_STYLES.map((frame) => (
                              <div
                                key={frame.id}
                                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                                  selectedFrameStyle === frame.id
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-300 hover:border-gray-400'
                                }`}
                                onClick={() => {
                                  setSelectedFrameStyle(frame.id);
                                  setSelectedFrameColor(frame.colors[0].id);
                                }}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <div className="font-medium">{frame.name}</div>
                                    <div className="text-sm text-gray-600">{frame.description}</div>
                                    <div className="text-sm text-gray-500">Width: {frame.width}" • ${frame.price}/in</div>
                                  </div>
                                  <Badge variant="secondary">{frame.category}</Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>

                      {/* Frame Color Selection */}
                      {selectedFrameStyle && (
                        <Card>
                          <CardHeader>
                            <CardTitle>3. Choose Frame Color</CardTitle>
                            <CardDescription>Select your preferred finish</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-4 gap-3">
                              {FRAME_STYLES.find(s => s.id === selectedFrameStyle)?.colors.map((color) => (
                                <div key={color.id} className="text-center">
                                  <ColorSwatch
                                    color={color}
                                    isSelected={selectedFrameColor === color.id}
                                    onClick={() => setSelectedFrameColor(color.id)}
                                  />
                                  <p className="text-xs mt-1 truncate" title={color.name}>{color.name}</p>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Mat Selection */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center">
                            <Palette className="w-5 h-5 mr-2" />
                            4. Mat Options
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-1 gap-3">
                            {[
                              { id: 'none', label: 'No Mat', price: 0, description: 'Frame directly touches artwork' },
                              { id: 'single', label: 'Single Mat', price: 20, description: 'Classic single mat border' },
                              { id: 'double', label: 'Double Mat', price: 35, description: 'Premium double mat with accent' }
                            ].map(option => (
                              <div
                                key={option.id}
                                className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                  selectedMatOption === option.id
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-300 hover:border-gray-400'
                                }`}
                                onClick={() => setSelectedMatOption(option.id as any)}
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="font-medium">{option.label}</div>
                                    <div className="text-sm text-gray-600">{option.description}</div>
                                  </div>
                                  <Badge variant="secondary">
                                    {option.price > 0 ? `+$${option.price}` : 'Free'}
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Mat Color Selection */}
                          {selectedMatOption !== 'none' && (
                            <div className="space-y-4 pt-4 border-t">
                              <div>
                                <Label className="text-sm font-medium">
                                  {selectedMatOption === 'double' ? 'Outer Mat Color' : 'Mat Color'}
                                </Label>
                                {Object.entries(MAT_COLORS).map(([category, colors]) => (
                                  <div key={category} className="mt-3">
                                    <h4 className="text-xs font-medium text-gray-600 mb-2 capitalize">
                                      {category.replace('_', ' ')}
                                    </h4>
                                    <div className="grid grid-cols-6 gap-2">
                                      {colors.map(color => (
                                        <div key={color.id} className="text-center">
                                          <ColorSwatch
                                            color={color}
                                            isSelected={selectedMatColor1 === color.id}
                                            onClick={() => setSelectedMatColor1(color.id)}
                                            size="sm"
                                          />
                                          <p className="text-xs mt-1 truncate" title={color.name}>
                                            {color.name.split(' ')[0]}
                                          </p>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {selectedMatOption === 'double' && (
                                <div>
                                  <Label className="text-sm font-medium">Inner Mat Color (Accent)</Label>
                                  {Object.entries(MAT_COLORS).map(([category, colors]) => (
                                    <div key={category} className="mt-3">
                                      <h4 className="text-xs font-medium text-gray-600 mb-2 capitalize">
                                        {category.replace('_', ' ')}
                                      </h4>
                                      <div className="grid grid-cols-6 gap-2">
                                        {colors.map(color => (
                                          <div key={color.id} className="text-center">
                                            <ColorSwatch
                                              color={color}
                                              isSelected={selectedMatColor2 === color.id}
                                              onClick={() => setSelectedMatColor2(color.id)}
                                              size="sm"
                                            />
                                            <p className="text-xs mt-1 truncate" title={color.name}>
                                              {color.name.split(' ')[0]}
                                            </p>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="materials" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        <CardTitle>Materials Required</CardTitle>
                      </div>
                      <CardDescription>
                        Materials needed for this frame design
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {selectedFrameStyle && (
                          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                            <div>
                              <div className="font-medium">
                                {FRAME_STYLES.find(s => s.id === selectedFrameStyle)?.name} Frame
                              </div>
                              <div className="text-sm text-gray-600">
                                Color: {FRAME_STYLES.find(s => s.id === selectedFrameStyle)?.colors.find(c => c.id === selectedFrameColor)?.name}
                              </div>
                              <div className="text-sm text-gray-600">
                                Length needed: {((artworkDimensions.width + artworkDimensions.height) * 2).toFixed(1)} inches
                              </div>
                            </div>
                            <Badge variant="outline">In Stock</Badge>
                          </div>
                        )}

                        {selectedMatOption !== 'none' && (
                          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                            <div>
                              <div className="font-medium">
                                {selectedMatOption === 'single' ? 'Single' : 'Double'} Mat Board
                              </div>
                              <div className="text-sm text-gray-600">
                                Primary: {Object.values(MAT_COLORS).flat().find(c => c.id === selectedMatColor1)?.name || 'Not selected'}
                              </div>
                              {selectedMatOption === 'double' && selectedMatColor2 && (
                                <div className="text-sm text-gray-600">
                                  Accent: {Object.values(MAT_COLORS).flat().find(c => c.id === selectedMatColor2)?.name}
                                </div>
                              )}
                            </div>
                            <Badge variant="outline">In Stock</Badge>
                          </div>
                        )}

                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <div className="font-medium">Glass</div>
                            <div className="text-sm text-gray-600">
                              Standard UV protection glass
                            </div>
                            <div className="text-sm text-gray-600">
                              Size: {artworkDimensions.width}" × {artworkDimensions.height}"
                            </div>
                          </div>
                          <Badge variant="outline">In Stock</Badge>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <div className="font-medium">Hardware & Backing</div>
                            <div className="text-sm text-gray-600">
                              Hanging hardware, dust cover, backing board
                            </div>
                          </div>
                          <Badge variant="outline">In Stock</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
