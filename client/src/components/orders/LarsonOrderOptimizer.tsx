
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Calculator, AlertTriangle, DollarSign, Package, Scissors } from 'lucide-react';

interface OrderOptimization {
  itemNumber: string;
  footageNeeded: number;
  lengthOption: {
    sticksNeeded: number;
    totalFootage: number;
    wasteFootage: number;
    costPerFoot: number;
    totalCost: number;
    description: string;
  };
  chopOption: {
    footageNeeded: number;
    costPerFoot: number;
    totalCost: number;
    description: string;
  };
  mixedOption?: {
    fullSticks: number;
    chopFootage: number;
    totalCost: number;
    description: string;
  };
  recommendation: {
    method: 'length' | 'chop' | 'mixed';
    savings: number;
    reason: string;
    alert?: string;
  };
}

export default function LarsonOrderOptimizer() {
  const [itemNumber, setItemNumber] = useState('');
  const [artworkWidth, setArtworkWidth] = useState('16');
  const [artworkHeight, setArtworkHeight] = useState('20');
  const [matWidth, setMatWidth] = useState('3');
  const [customFootage, setCustomFootage] = useState('');
  const [optimizationMode, setOptimizationMode] = useState<'frame' | 'footage'>('frame');
  const [optimization, setOptimization] = useState<OrderOptimization | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const calculateOptimization = async () => {
    if (!itemNumber) return;
    
    setIsCalculating(true);
    
    // Simulate calculation
    setTimeout(() => {
      const footageNeeded = optimizationMode === 'frame' 
        ? calculateFrameFootage(parseFloat(artworkWidth), parseFloat(artworkHeight), parseFloat(matWidth))
        : parseFloat(customFootage);

      const lengthPrice = 3.25; // Example price per foot for length pricing
      const chopPrice = 4.50; // Example chop price (typically 30-40% higher)
      
      const sticksNeeded = Math.ceil(footageNeeded / 9.5); // 9.5 feet per stick
      const totalFootage = sticksNeeded * 9.5;
      const wasteFootage = totalFootage - footageNeeded;
      
      const lengthCost = totalFootage * lengthPrice;
      const chopCost = footageNeeded * chopPrice;
      
      let recommendedMethod: 'length' | 'chop' | 'mixed' = 'chop';
      let savings = 0;
      
      if (lengthCost < chopCost) {
        recommendedMethod = 'length';
        savings = chopCost - lengthCost;
      } else {
        savings = lengthCost - chopCost;
      }

      const mockOptimization: OrderOptimization = {
        itemNumber,
        footageNeeded,
        lengthOption: {
          sticksNeeded,
          totalFootage,
          wasteFootage,
          costPerFoot: lengthPrice,
          totalCost: lengthCost,
          description: `${sticksNeeded} full stick${sticksNeeded > 1 ? 's' : ''} × 9.5 ft`
        },
        chopOption: {
          footageNeeded,
          costPerFoot: chopPrice,
          totalCost: chopCost,
          description: `${footageNeeded.toFixed(1)} ft cut to exact length`
        },
        recommendation: {
          method: recommendedMethod,
          savings,
          reason: recommendedMethod === 'length' 
            ? `Length pricing saves money despite ${wasteFootage.toFixed(1)} ft waste`
            : 'Chop pricing is more economical for this quantity',
          alert: wasteFootage > 5 ? 'High waste - consider chop pricing' : undefined
        }
      };

      setOptimization(mockOptimization);
      setIsCalculating(false);
    }, 1000);
  };

  const calculateFrameFootage = (width: number, height: number, matWidth: number) => {
    const frameWidth = width + (matWidth * 2);
    const frameHeight = height + (matWidth * 2);
    const perimeter = (frameWidth * 2) + (frameHeight * 2);
    return perimeter / 12; // Convert inches to feet
  };

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;

  const getRecommendationIcon = (method: string) => {
    switch (method) {
      case 'length': return <Package className="h-4 w-4" />;
      case 'chop': return <Scissors className="h-4 w-4" />;
      case 'mixed': return <Calculator className="h-4 w-4" />;
      default: return <Calculator className="h-4 w-4" />;
    }
  };

  const getRecommendationColor = (method: string) => {
    switch (method) {
      case 'length': return 'bg-blue-500';
      case 'chop': return 'bg-green-500';
      case 'mixed': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Larson-Juhl Order Optimizer
          </CardTitle>
          <CardDescription>
            Determine the most cost-effective way to purchase frame moulding: 
            full length sticks vs. chop pricing vs. mixed approach
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Item Number Input */}
          <div className="space-y-2">
            <Label htmlFor="itemNumber">Larson-Juhl Item Number</Label>
            <Input
              id="itemNumber"
              value={itemNumber}
              onChange={(e) => setItemNumber(e.target.value)}
              placeholder="e.g., 10-036M, 100750, etc."
            />
          </div>

          {/* Mode Selection */}
          <div className="space-y-2">
            <Label>Calculation Mode</Label>
            <div className="flex gap-2">
              <Button
                variant={optimizationMode === 'frame' ? 'default' : 'outline'}
                onClick={() => setOptimizationMode('frame')}
                size="sm"
              >
                Frame Dimensions
              </Button>
              <Button
                variant={optimizationMode === 'footage' ? 'default' : 'outline'}
                onClick={() => setOptimizationMode('footage')}
                size="sm"
              >
                Custom Footage
              </Button>
            </div>
          </div>

          {/* Frame Dimensions Inputs */}
          {optimizationMode === 'frame' && (
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="artworkWidth">Artwork Width (in)</Label>
                <Input
                  id="artworkWidth"
                  type="number"
                  value={artworkWidth}
                  onChange={(e) => setArtworkWidth(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="artworkHeight">Artwork Height (in)</Label>
                <Input
                  id="artworkHeight"
                  type="number"
                  value={artworkHeight}
                  onChange={(e) => setArtworkHeight(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="matWidth">Mat Width (in)</Label>
                <Input
                  id="matWidth"
                  type="number"
                  value={matWidth}
                  onChange={(e) => setMatWidth(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Custom Footage Input */}
          {optimizationMode === 'footage' && (
            <div className="space-y-2">
              <Label htmlFor="customFootage">Footage Needed (ft)</Label>
              <Input
                id="customFootage"
                type="number"
                step="0.1"
                value={customFootage}
                onChange={(e) => setCustomFootage(e.target.value)}
                placeholder="Enter exact footage needed"
              />
            </div>
          )}

          <Button 
            onClick={calculateOptimization} 
            disabled={isCalculating || !itemNumber || (optimizationMode === 'footage' && !customFootage)}
            className="w-full"
          >
            {isCalculating ? 'Calculating...' : 'Optimize Order'}
          </Button>
        </CardContent>
      </Card>

      {/* Optimization Results */}
      {optimization && (
        <div className="space-y-4">
          {/* Alert for Optimal Ranges */}
          {optimization.recommendation.alert && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {optimization.recommendation.alert}
              </AlertDescription>
            </Alert>
          )}

          {/* Recommendation Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getRecommendationIcon(optimization.recommendation.method)}
                Recommendation: {optimization.recommendation.method.toUpperCase()}
              </CardTitle>
              <CardDescription>
                {optimization.recommendation.reason}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Badge className={getRecommendationColor(optimization.recommendation.method)}>
                  Save {formatCurrency(optimization.recommendation.savings)}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {optimization.footageNeeded.toFixed(1)} ft needed
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Options Comparison */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Length Option */}
            <Card className={optimization.recommendation.method === 'length' ? 'ring-2 ring-blue-500' : ''}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Package className="h-4 w-4" />
                  Length Pricing
                </CardTitle>
                <CardDescription>Full 9.5' sticks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="text-2xl font-bold">{formatCurrency(optimization.lengthOption.totalCost)}</div>
                  <div className="text-sm text-muted-foreground">
                    {optimization.lengthOption.description}
                  </div>
                </div>
                <Separator />
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Total footage:</span>
                    <span>{optimization.lengthOption.totalFootage}'</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Waste:</span>
                    <span className="text-red-600">{optimization.lengthOption.wasteFootage.toFixed(1)}'</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cost per foot:</span>
                    <span>{formatCurrency(optimization.lengthOption.costPerFoot)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Chop Option */}
            <Card className={optimization.recommendation.method === 'chop' ? 'ring-2 ring-green-500' : ''}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Scissors className="h-4 w-4" />
                  Chop Pricing
                </CardTitle>
                <CardDescription>Cut to exact length</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="text-2xl font-bold">{formatCurrency(optimization.chopOption.totalCost)}</div>
                  <div className="text-sm text-muted-foreground">
                    {optimization.chopOption.description}
                  </div>
                </div>
                <Separator />
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Exact footage:</span>
                    <span>{optimization.chopOption.footageNeeded.toFixed(1)}'</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Waste:</span>
                    <span className="text-green-600">0'</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cost per foot:</span>
                    <span>{formatCurrency(optimization.chopOption.costPerFoot)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
