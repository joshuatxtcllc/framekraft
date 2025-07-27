// FrameCraft Comprehensive Pricing Calculator
// Implements the exact pricing logic from pricing_logic_1753223216760.md

export interface PricingInput {
  artworkWidth: number;
  artworkHeight: number;
  matWidth?: number;
  frameItem?: any;
  matItem?: any;
  glassItem?: any;
  laborCost?: number;
  overheadCost?: number;
  discountPercentage?: number;
  taxRate?: number;
  isWholesale?: boolean;
}

export interface PricingBreakdown {
  framePrice: number;
  matPrice: number;
  glassPrice: number;
  laborCost: number;
  overheadCost: number;
  subtotal: number;
  discountAmount: number;
  discountedSubtotal: number;
  taxAmount: number;
  total: number;
  unitedInches: number;
  calculations: {
    framePerimeterFeet: number;
    frameMarkupFactor: number;
    matMarkupFactor: number;
    glassMarkupFactor: number;
    glassAreaFeet: number;
  };
}

// Houston Heights market adjustments
const FRAME_PRICE_ADJUSTMENT = 0.1667; // Reduce to 1/6th (16.67%)
const GLASS_PRICE_ADJUSTMENT = 0.45;   // Reduce by 55% (keep 45%)

// Frame markup scale based on price per foot
export const getFrameMarkupFactor = (pricePerFoot: number): number => {
  if (pricePerFoot >= 5.0) return 2.5; // Luxury frames: $5.00+
  if (pricePerFoot >= 4.0) return 3.0; // Premium frames: $4.00-$4.99
  if (pricePerFoot >= 3.0) return 3.5; // Higher cost frames: $3.00-$3.99
  if (pricePerFoot >= 2.0) return 4.0; // Medium cost frames: $2.00-$2.99
  return 4.5; // Low cost frames: $0.99-$1.99
};

// Mat markup scale based on united inches
export const getMatMarkupFactor = (unitedInches: number): number => {
  if (unitedInches <= 32) return 2.0; // Base price + 100% (small mats)
  if (unitedInches <= 60) return 1.8; // Base price + 80% (medium mats)
  if (unitedInches <= 80) return 1.6; // Base price + 60% (large mats)
  return 1.4; // Base price + 40% (extra large mats 80+)
};

// Glass markup scale based on united inches
export const getGlassMarkupFactor = (unitedInches: number): number => {
  if (unitedInches <= 40) return 2.0; // Base price + 100% (small glass)
  if (unitedInches <= 60) return 1.75; // Base price + 75% (medium glass)
  if (unitedInches <= 80) return 1.5; // Base price + 50% (large glass)
  return 1.25; // Base price + 25% (extra large glass 80+)
};

export const calculateFramingPrice = (input: PricingInput): PricingBreakdown => {
  const {
    artworkWidth,
    artworkHeight,
    matWidth = 2, // Standard 2" mat border
    frameItem,
    matItem,
    glassItem,
    laborCost = 38,
    overheadCost = 54,
    discountPercentage = 0,
    taxRate = 0.0825, // 8.25% Texas tax rate
    isWholesale = false
  } = input;

  // Calculate united inches (core measurement for custom framing)
  const unitedInches = artworkWidth + artworkHeight + (matWidth * 4);

  // Frame calculations
  let framePrice = 0;
  let framePerimeterFeet = 0;
  let frameMarkupFactor = 1;
  
  if (frameItem) {
    // Frame size includes mat border
    const frameWidth = artworkWidth + (matWidth * 2);
    const frameHeight = artworkHeight + (matWidth * 2);
    framePerimeterFeet = ((frameWidth * 2) + (frameHeight * 2)) / 12;
    
    const pricePerFoot = parseFloat(frameItem.basePrice || frameItem.price || 0);
    
    if (isWholesale) {
      // Wholesale: raw cost without markup
      framePrice = framePerimeterFeet * pricePerFoot;
    } else {
      // Retail: apply sliding scale markup and Houston Heights adjustment
      frameMarkupFactor = getFrameMarkupFactor(pricePerFoot);
      const wholesaleCost = Math.ceil(framePerimeterFeet * pricePerFoot);
      const baseFramePrice = wholesaleCost * frameMarkupFactor;
      framePrice = baseFramePrice * FRAME_PRICE_ADJUSTMENT;
    }
  }

  // Mat calculations
  let matPrice = 0;
  let matMarkupFactor = 1;
  
  if (matItem) {
    const baseMatPrice = parseFloat(matItem.basePrice || matItem.price || 0);
    
    if (isWholesale) {
      // Wholesale: raw cost
      matPrice = baseMatPrice;
    } else {
      // Retail: apply sliding scale markup
      matMarkupFactor = getMatMarkupFactor(unitedInches);
      matPrice = baseMatPrice * matMarkupFactor;
    }
  }

  // Glass calculations
  let glassPrice = 0;
  let glassAreaFeet = 0;
  let glassMarkupFactor = 1;
  
  if (glassItem) {
    const glassWidth = artworkWidth + (matWidth * 2);
    const glassHeight = artworkHeight + (matWidth * 2);
    glassAreaFeet = (glassWidth * glassHeight) / 144;
    
    const pricePerSqFt = parseFloat(glassItem.basePrice || glassItem.price || 0);
    
    if (isWholesale) {
      // Wholesale: raw cost
      glassPrice = glassAreaFeet * pricePerSqFt;
    } else {
      // Retail: apply sliding scale markup and Houston Heights adjustment
      const glassUnitedInches = glassWidth + glassHeight;
      glassMarkupFactor = getGlassMarkupFactor(glassUnitedInches);
      const baseGlassPrice = glassAreaFeet * pricePerSqFt * glassMarkupFactor;
      glassPrice = baseGlassPrice * GLASS_PRICE_ADJUSTMENT;
    }
  }

  // Calculate subtotal
  const subtotal = framePrice + matPrice + glassPrice + laborCost + overheadCost;

  // Apply discount
  const discountAmount = subtotal * (discountPercentage / 100);
  const discountedSubtotal = subtotal - discountAmount;

  // Calculate tax
  const taxAmount = discountedSubtotal * taxRate;

  // Calculate total
  const total = discountedSubtotal + taxAmount;

  return {
    framePrice: Math.round(framePrice * 100) / 100,
    matPrice: Math.round(matPrice * 100) / 100,
    glassPrice: Math.round(glassPrice * 100) / 100,
    laborCost,
    overheadCost,
    subtotal: Math.round(subtotal * 100) / 100,
    discountAmount: Math.round(discountAmount * 100) / 100,
    discountedSubtotal: Math.round(discountedSubtotal * 100) / 100,
    taxAmount: Math.round(taxAmount * 100) / 100,
    total: Math.round(total * 100) / 100,
    unitedInches,
    calculations: {
      framePerimeterFeet: Math.round(framePerimeterFeet * 100) / 100,
      frameMarkupFactor,
      matMarkupFactor,
      glassMarkupFactor,
      glassAreaFeet: Math.round(glassAreaFeet * 100) / 100,
    }
  };
};

// Example calculation as shown in pricing_logic document
export const exampleCalculation = (): PricingBreakdown => {
  return calculateFramingPrice({
    artworkWidth: 16,
    artworkHeight: 20,
    matWidth: 2,
    frameItem: { basePrice: "18" }, // $18/foot Larson Academie
    matItem: { basePrice: "17" }, // $17 White Conservation
    glassItem: { basePrice: "39" }, // $39/sq ft Museum Glass
    laborCost: 38,
    overheadCost: 54,
    discountPercentage: 0,
    taxRate: 0.0825,
    isWholesale: false
  });
};