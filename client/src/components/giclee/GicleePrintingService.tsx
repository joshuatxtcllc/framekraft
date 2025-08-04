
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Printer, Image, DollarSign } from 'lucide-react';

interface GicleePricing {
  substrateType: string;
  width: number;
  height: number;
  quantity: number;
  squareInches: number;
  pricePerSquareInch: number;
  basePrice: number;
  quantityDiscount: number;
  finalPrice: number;
  savings: number;
}

export default function GicleePrintingService() {
  const [substrateType, setSubstrateType] = useState('canvas');
  const [width, setWidth] = useState('16');
  const [height, setHeight] = useState('20');
  const [quantity, setQuantity] = useState('1');
  const [pricing, setPricing] = useState<GicleePricing | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const substrateOptions = [
    { value: 'canvas', label: 'Canvas', pricePerSqIn: 0.085 },
    { value: 'watercolor_paper', label: 'Watercolor Paper', pricePerSqIn: 0.065 },
    { value: 'photo_paper', label: 'Photo Paper', pricePerSqIn: 0.055 },
    { value: 'fine_art_paper', label: 'Fine Art Paper', pricePerSqIn: 0.075 },
    { value: 'metallic_paper', label: 'Metallic Paper', pricePerSqIn: 0.095 }
  ];

  const bulkDiscounts = [
    { minQty: 1, maxQty: 4, discount: 0 },
    { minQty: 5, maxQty: 9, discount: 0.1 },
    { minQty: 10, maxQty: 24, discount: 0.15 },
    { minQty: 25, maxQty: Infinity, discount: 0.2 }
  ];

  const calculatePricing = () => {
    setIsCalculating(true);
    
    const w = parseFloat(width);
    const h = parseFloat(height);
    const q = parseInt(quantity);
    
    if (w <= 0 || h <= 0 || q <= 0) {
      setIsCalculating(false);
      return;
    }

    const substrate = substrateOptions.find(s => s.value === substrateType);
    if (!substrate) {
      setIsCalculating(false);
      return;
    }

    const squareInches = w * h;
    const basePrice = squareInches * substrate.pricePerSqIn * q;
    
    // Apply quantity discount
    const discountTier = bulkDiscounts.find(tier => q >= tier.minQty && q <= tier.maxQty);
    const quantityDiscount = discountTier ? discountTier.discount : 0;
    const finalPrice = basePrice * (1 - quantityDiscount);
    const savings = basePrice - finalPrice;

    setTimeout(() => {
      setPricing({
        substrateType: substrate.label,
        width: w,
        height: h,
        quantity: q,
        squareInches,
        pricePerSquareInch: substrate.pricePerSqIn,
        basePrice,
        quantityDiscount,
        finalPrice,
        savings
      });
      setIsCalculating(false);
    }, 500);
  };

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5" />
            Giclee Fine Art Printing
          </CardTitle>
          <CardDescription>
            Professional archival quality prints on museum-grade substrates
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Substrate Selection */}
          <div className="space-y-2">
            <Label htmlFor="substrate">Substrate Type</Label>
            <select
              id="substrate"
              className="w-full p-2 border border-input rounded-md bg-background"
              value={substrateType}
              onChange={(e) => setSubstrateType(e.target.value)}
            >
              {substrateOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label} - ${option.pricePerSqIn}/sq in
                </option>
              ))}
            </select>
          </div>

          {/* Dimensions */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="width">Width (inches)</Label>
              <Input
                id="width"
                type="number"
                value={width}
                onChange={(e) => setWidth(e.target.value)}
                min="1"
                max="44"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="height">Height (inches)</Label>
              <Input
                id="height"
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                min="1"
                max="150"
              />
            </div>
          </div>

          {/* Quantity */}
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              min="1"
            />
          </div>

          <Button 
            onClick={calculatePricing} 
            disabled={isCalculating}
            className="w-full"
          >
            {isCalculating ? 'Calculating...' : 'Calculate Pricing'}
          </Button>
        </CardContent>
      </Card>

      {/* Bulk Discount Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Volume Discounts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {bulkDiscounts.map((tier, index) => (
              <div key={index} className="flex justify-between items-center p-2 border rounded">
                <span>
                  {tier.minQty === tier.maxQty ? 
                    `${tier.minQty} print${tier.minQty > 1 ? 's' : ''}` :
                    tier.maxQty === Infinity ? 
                      `${tier.minQty}+ prints` :
                      `${tier.minQty}-${tier.maxQty} prints`
                  }
                </span>
                <Badge variant={tier.discount > 0 ? 'default' : 'secondary'}>
                  {tier.discount > 0 ? `${(tier.discount * 100).toFixed(0)}% off` : 'Standard'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pricing Results */}
      {pricing && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Image className="h-5 w-5" />
              Pricing Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Substrate:</span> {pricing.substrateType}
              </div>
              <div>
                <span className="font-medium">Dimensions:</span> {pricing.width}" × {pricing.height}"
              </div>
              <div>
                <span className="font-medium">Square Inches:</span> {pricing.squareInches.toFixed(1)}
              </div>
              <div>
                <span className="font-medium">Quantity:</span> {pricing.quantity}
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Base Price:</span>
                <span>{formatCurrency(pricing.basePrice)}</span>
              </div>
              
              {pricing.quantityDiscount > 0 && (
                <>
                  <div className="flex justify-between text-green-600">
                    <span>Volume Discount ({(pricing.quantityDiscount * 100).toFixed(0)}%):</span>
                    <span>-{formatCurrency(pricing.savings)}</span>
                  </div>
                  <Separator />
                </>
              )}
              
              <div className="flex justify-between text-xl font-bold">
                <span>Total Price:</span>
                <span>{formatCurrency(pricing.finalPrice)}</span>
              </div>
            </div>

            {pricing.savings > 0 && (
              <Alert>
                <DollarSign className="h-4 w-4" />
                <AlertDescription>
                  You save {formatCurrency(pricing.savings)} with volume pricing!
                </AlertDescription>
              </Alert>
            )}
            
            <div className="pt-4">
              <Button className="w-full">
                Add to Order
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
