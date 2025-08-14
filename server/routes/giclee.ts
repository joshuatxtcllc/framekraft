
import { Router } from 'express';
import { isAuthenticated } from '../middleware/auth.js';

const router = Router();

interface GicleePricingRequest {
  substrateType: string;
  width: number;
  height: number;
  quantity: number;
}

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

// Calculate Giclee pricing
router.post('/calculate-pricing', isAuthenticated, async (req, res) => {
  try {
    const { substrateType, width, height, quantity }: GicleePricingRequest = req.body;

    if (!substrateType || width <= 0 || height <= 0 || quantity <= 0) {
      return res.status(400).json({ message: 'Invalid pricing parameters' });
    }

    const substrate = substrateOptions.find(s => s.value === substrateType);
    if (!substrate) {
      return res.status(400).json({ message: 'Invalid substrate type' });
    }

    const squareInches = width * height;
    const basePrice = squareInches * substrate.pricePerSqIn * quantity;
    
    // Apply quantity discount
    const discountTier = bulkDiscounts.find(tier => quantity >= tier.minQty && quantity <= tier.maxQty);
    const quantityDiscount = discountTier ? discountTier.discount : 0;
    const finalPrice = basePrice * (1 - quantityDiscount);
    const savings = basePrice - finalPrice;

    const pricing: GicleePricing = {
      substrateType: substrate.label,
      width,
      height,
      quantity,
      squareInches,
      pricePerSquareInch: substrate.pricePerSqIn,
      basePrice: Math.round(basePrice * 100) / 100,
      quantityDiscount,
      finalPrice: Math.round(finalPrice * 100) / 100,
      savings: Math.round(savings * 100) / 100
    };

    res.json(pricing);
  } catch (error) {
    console.error('Giclee pricing calculation error:', error);
    res.status(500).json({ message: 'Failed to calculate pricing' });
  }
});

// Get substrate options
router.get('/substrates', isAuthenticated, async (req, res) => {
  try {
    res.json(substrateOptions);
  } catch (error) {
    console.error('Error fetching substrates:', error);
    res.status(500).json({ message: 'Failed to fetch substrate options' });
  }
});

// Get bulk discount tiers
router.get('/discounts', isAuthenticated, async (req, res) => {
  try {
    res.json(bulkDiscounts);
  } catch (error) {
    console.error('Error fetching discounts:', error);
    res.status(500).json({ message: 'Failed to fetch discount tiers' });
  }
});

export default router;
