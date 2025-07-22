import { db } from './db';
import { priceStructure } from '@shared/schema';

// Calculate frame markup based on wholesale price per foot
function getFrameMarkupFactor(pricePerFoot: number): number {
  if (pricePerFoot <= 1.99) return 4.5;
  if (pricePerFoot <= 2.99) return 4.0;
  if (pricePerFoot <= 3.99) return 3.5;
  if (pricePerFoot <= 4.99) return 3.0;
  return 2.5; // $5.00+ per foot
}

// Calculate mat markup based on united inches
function getMatMarkupFactor(unitedInches: number): number {
  if (unitedInches <= 32) return 2.0; // 100% markup
  if (unitedInches <= 60) return 1.8; // 80% markup
  if (unitedInches <= 80) return 1.6; // 60% markup
  return 1.4; // 40% markup for 80+ united inches
}

// Calculate glass markup based on united inches
function getGlassMarkupFactor(unitedInches: number): number {
  if (unitedInches <= 40) return 2.0; // 100% markup
  if (unitedInches <= 60) return 1.75; // 75% markup
  if (unitedInches <= 80) return 1.5; // 50% markup
  return 1.25; // 25% markup for 80+ united inches
}

// Seed realistic framing prices with sliding scale markup
export async function seedPricingData() {
  // Frame pricing with united inch-based markup
  const framePrices = [
    { category: 'frame', subcategory: 'economy', itemName: 'Basic Wood Frame 1"', unitType: 'linear_foot', basePrice: 0.99 },
    { category: 'frame', subcategory: 'economy', itemName: 'Simple Metal Frame', unitType: 'linear_foot', basePrice: 1.49 },
    { category: 'frame', subcategory: 'standard', itemName: 'Standard Wood Frame', unitType: 'linear_foot', basePrice: 2.25 },
    { category: 'frame', subcategory: 'standard', itemName: 'Aluminum Frame Silver', unitType: 'linear_foot', basePrice: 2.75 },
    { category: 'frame', subcategory: 'premium', itemName: 'Premium Oak Frame', unitType: 'linear_foot', basePrice: 3.50 },
    { category: 'frame', subcategory: 'premium', itemName: 'Steel Frame Black', unitType: 'linear_foot', basePrice: 3.99 },
    { category: 'frame', subcategory: 'luxury', itemName: 'Cherry Wood Frame 2"', unitType: 'linear_foot', basePrice: 4.50 },
    { category: 'frame', subcategory: 'luxury', itemName: 'Larson Academie', unitType: 'linear_foot', basePrice: 18.00 },
  ];

  // Glass pricing - base prices per square foot
  const glazingPrices = [
    { category: 'glazing', subcategory: 'standard_glass', itemName: 'Standard Picture Glass', unitType: 'square_foot', basePrice: 8.00 },
    { category: 'glazing', subcategory: 'standard_glass', itemName: 'Non-Glare Glass', unitType: 'square_foot', basePrice: 12.50 },
    { category: 'glazing', subcategory: 'acrylic', itemName: 'Standard Acrylic', unitType: 'square_foot', basePrice: 10.00 },
    { category: 'glazing', subcategory: 'acrylic', itemName: 'UV Filtering Acrylic', unitType: 'square_foot', basePrice: 18.00 },
    { category: 'glazing', subcategory: 'conservation_glass', itemName: 'UV Protection Glass', unitType: 'square_foot', basePrice: 25.00 },
    { category: 'glazing', subcategory: 'conservation_glass', itemName: 'Museum Glass (99% UV)', unitType: 'square_foot', basePrice: 39.00 },
  ];

  // Mat pricing - base prices
  const matPrices = [
    { category: 'mat', subcategory: 'standard', itemName: 'Standard Mat Board', unitType: 'each', basePrice: 17.00 },
    { category: 'mat', subcategory: 'conservation', itemName: 'White Conservation Mat', unitType: 'each', basePrice: 22.00 },
    { category: 'mat', subcategory: 'specialty', itemName: 'Fabric Covered Mat', unitType: 'each', basePrice: 35.00 },
  ];

  // Generate frame pricing with cost-based markup
  const frameData = framePrices.map(frame => {
    const markupFactor = getFrameMarkupFactor(frame.basePrice);
    const retailPrice = frame.basePrice * markupFactor * 0.1667; // Houston Heights adjustment
    return {
      ...frame,
      markupPercentage: ((markupFactor - 1) * 100),
      retailPrice: Math.round(retailPrice * 100) / 100,
    };
  });

  // Mat pricing uses base price + united inch markup (we'll use average for seeding)
  const matData = matPrices.map(mat => {
    const avgMarkupFactor = getMatMarkupFactor(50); // Average project size
    const retailPrice = mat.basePrice * avgMarkupFactor;
    return {
      ...mat,
      markupPercentage: ((avgMarkupFactor - 1) * 100),
      retailPrice: Math.round(retailPrice * 100) / 100,
    };
  });

  // Glass pricing with united inch markup and Houston adjustment
  const glazingData = glazingPrices.map(glazing => {
    const avgMarkupFactor = getGlassMarkupFactor(50); // Average project size
    const retailPrice = glazing.basePrice * avgMarkupFactor * 0.45; // Houston Heights adjustment
    return {
      ...glazing,
      markupPercentage: ((avgMarkupFactor - 1) * 100),
      retailPrice: Math.round(retailPrice * 100) / 100,
    };
  });

  const pricingData = [
    ...frameData,
    ...matData,
    ...glazingData,
    
    // Labor costs (service charges)
    {
      category: 'labor',
      subcategory: 'assembly',
      itemName: 'Frame Assembly Service',
      unitType: 'each',
      basePrice: 25.00,
      markupPercentage: 40.00,
      retailPrice: 35.00,
    },
    {
      category: 'labor',
      subcategory: 'mounting',
      itemName: 'Artwork Mounting',
      unitType: 'each',
      basePrice: 15.00,
      markupPercentage: 66.67,
      retailPrice: 25.00,
    },
  ];

  try {
    // Clear existing pricing data
    await db.delete(priceStructure);
    
    // Insert new pricing data
    await db.insert(priceStructure).values(pricingData);
    
    console.log('✅ Pricing data seeded successfully');
  } catch (error) {
    console.error('❌ Error seeding pricing data:', error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedPricingData()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}