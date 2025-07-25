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
  // Frame pricing from ACTUAL Larson-Juhl catalog (wholesale "Length" prices per linear foot)
  const framePrices = [
    { category: 'frame', subcategory: 'economy', itemName: 'Spencer II 114153', unitType: 'linear_foot', basePrice: 1.47 },
    { category: 'frame', subcategory: 'economy', itemName: 'Confetti 115632', unitType: 'linear_foot', basePrice: 2.08 },
    { category: 'frame', subcategory: 'standard', itemName: 'Gramercy 135791', unitType: 'linear_foot', basePrice: 2.13 },
    { category: 'frame', subcategory: 'standard', itemName: 'Gramercy 135790', unitType: 'linear_foot', basePrice: 2.93 },
    { category: 'frame', subcategory: 'standard', itemName: 'Hudson 103180', unitType: 'linear_foot', basePrice: 3.11 },
    { category: 'frame', subcategory: 'standard', itemName: 'Academie 103235', unitType: 'linear_foot', basePrice: 3.17 },
    { category: 'frame', subcategory: 'premium', itemName: 'Vienna 105CB', unitType: 'linear_foot', basePrice: 3.31 },
    { category: 'frame', subcategory: 'premium', itemName: 'Gramercy 145791', unitType: 'linear_foot', basePrice: 3.45 },
    { category: 'frame', subcategory: 'premium', itemName: 'Shoji 119206', unitType: 'linear_foot', basePrice: 3.62 },
    { category: 'frame', subcategory: 'luxury', itemName: 'Lucerne 105794', unitType: 'linear_foot', basePrice: 5.02 },
    { category: 'frame', subcategory: 'luxury', itemName: 'L7 108184', unitType: 'linear_foot', basePrice: 7.04 },
    { category: 'frame', subcategory: 'luxury', itemName: 'Maple Garrett 10-036M', unitType: 'linear_foot', basePrice: 10.05 },
  ];

  // Glass pricing - specific requested types
  const glazingPrices = [
    { category: 'glazing', subcategory: 'standard_glass', itemName: 'Regular Glass', unitType: 'square_foot', basePrice: 6.25 },
    { category: 'glazing', subcategory: 'conservation_glass', itemName: 'Conservation Clear Glass', unitType: 'square_foot', basePrice: 22.50 },
    { category: 'glazing', subcategory: 'museum_glass', itemName: 'Museum Glass', unitType: 'square_foot', basePrice: 39.00 },
    { category: 'glazing', subcategory: 'acrylic', itemName: 'Regular Plexiglass', unitType: 'square_foot', basePrice: 8.50 },
    { category: 'glazing', subcategory: 'conservation_acrylic', itemName: 'Conservation Plexiglass', unitType: 'square_foot', basePrice: 15.25 },
    { category: 'glazing', subcategory: 'optium_acrylic', itemName: 'Optium Acrylic', unitType: 'square_foot', basePrice: 28.00 },
  ];

  // Mat pricing from ACTUAL Larson-Juhl catalog - Crescent Select Mat Board
  // Standard mat board is 32"x40" = 1,280 square inches
  // Conservation mat board is 32"x40" = 1,280 square inches
  const matPrices = [
    { category: 'mat', subcategory: 'standard', itemName: 'Crescent 9502 White', unitType: 'square_inch', basePrice: 8.50 / 1280 }, // $0.0066 per sq inch
    { category: 'mat', subcategory: 'standard', itemName: 'Crescent 9503 Cream', unitType: 'square_inch', basePrice: 8.50 / 1280 },
    { category: 'mat', subcategory: 'standard', itemName: 'Crescent 9504 Light Gray', unitType: 'square_inch', basePrice: 8.50 / 1280 },
    { category: 'mat', subcategory: 'standard', itemName: 'Crescent 9505 Charcoal', unitType: 'square_inch', basePrice: 8.50 / 1280 },
    { category: 'mat', subcategory: 'standard', itemName: 'Crescent 9506 Navy Blue', unitType: 'square_inch', basePrice: 8.50 / 1280 },
    { category: 'mat', subcategory: 'standard', itemName: 'Crescent 9507 Forest Green', unitType: 'square_inch', basePrice: 8.50 / 1280 },
    { category: 'mat', subcategory: 'conservation', itemName: 'Crescent Conservation 9601 White', unitType: 'square_inch', basePrice: 14.25 / 1280 }, // $0.0111 per sq inch
    { category: 'mat', subcategory: 'conservation', itemName: 'Crescent Conservation 9602 Cream', unitType: 'square_inch', basePrice: 14.25 / 1280 },
  ];

  // Generate frame pricing with cost-based markup (NO Houston adjustment in database)
  const frameData = framePrices.map(frame => {
    const markupFactor = getFrameMarkupFactor(frame.basePrice);
    const retailPrice = frame.basePrice * markupFactor; // Full retail price before adjustments
    return {
      ...frame,
      markupPercentage: ((markupFactor - 1) * 100),
      retailPrice: Math.round(retailPrice * 100) / 100,
    };
  });

  // Mat pricing uses base price per square inch + united inch markup (we'll use average for seeding)
  const matData = matPrices.map(mat => {
    const avgMarkupFactor = getMatMarkupFactor(50); // Average project size
    const retailPrice = mat.basePrice * avgMarkupFactor;
    return {
      ...mat,
      markupPercentage: ((avgMarkupFactor - 1) * 100),
      retailPrice: Math.round(retailPrice * 10000) / 10000, // Round to 4 decimal places for per sq inch pricing
    };
  });

  // Glass pricing with united inch markup (NO Houston adjustment in database)
  const glazingData = glazingPrices.map(glazing => {
    const avgMarkupFactor = getGlassMarkupFactor(50); // Average project size
    const retailPrice = glazing.basePrice * avgMarkupFactor; // Full retail price before adjustments
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