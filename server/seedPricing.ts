import { db } from './db';
import { priceStructure } from '@shared/schema';

// Calculate sliding scale markup based on base price
// Lowest cost materials: 4.5x markup
// Highest cost materials: 1.9x markup
function calculateSlidingMarkup(basePrice: number, minPrice: number, maxPrice: number): { multiplier: number, retailPrice: number } {
  // Normalize the price position between 0 and 1
  const pricePosition = Math.min(Math.max((basePrice - minPrice) / (maxPrice - minPrice), 0), 1);
  
  // Calculate multiplier: starts at 4.5x for lowest prices, ends at 1.9x for highest prices
  const multiplier = 4.5 - (pricePosition * (4.5 - 1.9));
  
  // Calculate retail price
  const retailPrice = basePrice * multiplier;
  
  return { multiplier, retailPrice };
}

// Seed realistic framing prices with sliding scale markup
export async function seedPricingData() {
  // Define base prices for sliding scale calculations
  const framePrices = [
    { category: 'frame', subcategory: 'wood', itemName: 'Basic Wood Frame 1"', unitType: 'linear_foot', basePrice: 3.50 },
    { category: 'frame', subcategory: 'metal', itemName: 'Aluminum Frame Silver', unitType: 'linear_foot', basePrice: 4.75 },
    { category: 'frame', subcategory: 'metal', itemName: 'Steel Frame Black', unitType: 'linear_foot', basePrice: 6.25 },
    { category: 'frame', subcategory: 'wood', itemName: 'Premium Oak Frame 1.5"', unitType: 'linear_foot', basePrice: 8.25 },
    { category: 'frame', subcategory: 'wood', itemName: 'Cherry Wood Frame 2"', unitType: 'linear_foot', basePrice: 12.50 },
  ];

  const glazingPrices = [
    { category: 'glazing', subcategory: 'standard_glass', itemName: 'Standard Picture Glass', unitType: 'square_foot', basePrice: 3.25 },
    { category: 'glazing', subcategory: 'acrylic', itemName: 'Standard Acrylic', unitType: 'square_foot', basePrice: 4.25 },
    { category: 'glazing', subcategory: 'standard_glass', itemName: 'Non-Glare Glass', unitType: 'square_foot', basePrice: 5.50 },
    { category: 'glazing', subcategory: 'acrylic', itemName: 'Non-Glare Acrylic', unitType: 'square_foot', basePrice: 6.75 },
    { category: 'glazing', subcategory: 'acrylic', itemName: 'UV Filtering Acrylic', unitType: 'square_foot', basePrice: 7.50 },
    { category: 'glazing', subcategory: 'conservation_glass', itemName: 'UV Protection Glass', unitType: 'square_foot', basePrice: 8.75 },
    { category: 'glazing', subcategory: 'acrylic', itemName: 'Museum Acrylic (99% UV)', unitType: 'square_foot', basePrice: 12.50 },
    { category: 'glazing', subcategory: 'conservation_glass', itemName: 'Museum Glass (99% UV)', unitType: 'square_foot', basePrice: 15.25 },
  ];

  // Calculate min and max prices for each category
  const frameMinPrice = Math.min(...framePrices.map(f => f.basePrice));
  const frameMaxPrice = Math.max(...framePrices.map(f => f.basePrice));
  const glazingMinPrice = Math.min(...glazingPrices.map(g => g.basePrice));
  const glazingMaxPrice = Math.max(...glazingPrices.map(g => g.basePrice));

  // Generate pricing data with sliding scale markup
  const frameData = framePrices.map(frame => {
    const { multiplier, retailPrice } = calculateSlidingMarkup(frame.basePrice, frameMinPrice, frameMaxPrice);
    return {
      ...frame,
      markupPercentage: ((multiplier - 1) * 100),
      retailPrice: Math.round(retailPrice * 100) / 100,
    };
  });

  const glazingData = glazingPrices.map(glazing => {
    const { multiplier, retailPrice } = calculateSlidingMarkup(glazing.basePrice, glazingMinPrice, glazingMaxPrice);
    return {
      ...glazing,
      markupPercentage: ((multiplier - 1) * 100),
      retailPrice: Math.round(retailPrice * 100) / 100,
    };
  });

  const pricingData = [
    ...frameData,
    ...glazingData,
    
    // Matting (fixed markup)
    {
      category: 'mat',
      subcategory: 'standard',
      itemName: 'Standard Mat Board',
      unitType: 'square_foot',
      basePrice: 2.25,
      markupPercentage: 100.00, // 3x markup for mats
      retailPrice: 6.75,
    },
    {
      category: 'mat',
      subcategory: 'conservation',
      itemName: 'Conservation Mat Board',
      unitType: 'square_foot',
      basePrice: 4.50,
      markupPercentage: 77.78, // 2.5x markup for conservation
      retailPrice: 11.25,
    },
    
    // Labor costs (fixed markup)
    {
      category: 'labor',
      subcategory: 'cutting',
      itemName: 'Frame Cutting & Assembly',
      unitType: 'each',
      basePrice: 25.00,
      markupPercentage: 40.00,
      retailPrice: 35.00,
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