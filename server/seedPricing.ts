import { db } from './db';
import { priceStructure } from '@shared/schema';

// Seed realistic framing prices with proper glass options
export async function seedPricingData() {
  const pricingData = [
    // Frame moldings - Wood (per linear foot)
    {
      category: 'frame',
      subcategory: 'wood',
      itemName: 'Basic Wood Frame 1"',
      unitType: 'linear_foot',
      basePrice: 3.50,
      markupPercentage: 30.00,
      retailPrice: 4.55,
    },
    {
      category: 'frame',
      subcategory: 'wood',
      itemName: 'Premium Oak Frame 1.5"',
      unitType: 'linear_foot',
      basePrice: 8.25,
      markupPercentage: 30.00,
      retailPrice: 10.73,
    },
    {
      category: 'frame',
      subcategory: 'wood',
      itemName: 'Cherry Wood Frame 2"',
      unitType: 'linear_foot',
      basePrice: 12.50,
      markupPercentage: 30.00,
      retailPrice: 16.25,
    },
    
    // Frame moldings - Metal (per linear foot)
    {
      category: 'frame',
      subcategory: 'metal',
      itemName: 'Aluminum Frame Silver',
      unitType: 'linear_foot',
      basePrice: 4.75,
      markupPercentage: 30.00,
      retailPrice: 6.18,
    },
    {
      category: 'frame',
      subcategory: 'metal',
      itemName: 'Steel Frame Black',
      unitType: 'linear_foot',
      basePrice: 6.25,
      markupPercentage: 30.00,
      retailPrice: 8.13,
    },
    
    // Matting (per square foot)
    {
      category: 'mat',
      subcategory: 'standard',
      itemName: 'Standard Mat Board',
      unitType: 'square_foot',
      basePrice: 2.25,
      markupPercentage: 30.00,
      retailPrice: 2.93,
    },
    {
      category: 'mat',
      subcategory: 'conservation',
      itemName: 'Conservation Mat Board',
      unitType: 'square_foot',
      basePrice: 4.50,
      markupPercentage: 30.00,
      retailPrice: 5.85,
    },
    {
      category: 'mat',
      subcategory: 'fabric',
      itemName: 'Fabric Covered Mat',
      unitType: 'square_foot',
      basePrice: 8.75,
      markupPercentage: 30.00,
      retailPrice: 11.38,
    },
    
    // Glass options (per square foot) - REALISTIC PRICING
    {
      category: 'glazing',
      subcategory: 'standard_glass',
      itemName: 'Standard Picture Glass',
      unitType: 'square_foot',
      basePrice: 3.25,
      markupPercentage: 30.00,
      retailPrice: 4.23,
    },
    {
      category: 'glazing',
      subcategory: 'standard_glass',
      itemName: 'Non-Glare Glass',
      unitType: 'square_foot',
      basePrice: 5.50,
      markupPercentage: 30.00,
      retailPrice: 7.15,
    },
    {
      category: 'glazing',
      subcategory: 'conservation_glass',
      itemName: 'UV Protection Glass',
      unitType: 'square_foot',
      basePrice: 8.75,
      markupPercentage: 30.00,
      retailPrice: 11.38,
    },
    {
      category: 'glazing',
      subcategory: 'conservation_glass',
      itemName: 'Museum Glass (99% UV)',
      unitType: 'square_foot',
      basePrice: 15.25,
      markupPercentage: 30.00,
      retailPrice: 19.83,
    },
    
    // Acrylic options (per square foot) - PROPER PRICING
    {
      category: 'glazing',
      subcategory: 'acrylic',
      itemName: 'Standard Acrylic',
      unitType: 'square_foot',
      basePrice: 4.25,
      markupPercentage: 30.00,
      retailPrice: 5.53,
    },
    {
      category: 'glazing',
      subcategory: 'acrylic',
      itemName: 'UV Filtering Acrylic',
      unitType: 'square_foot',
      basePrice: 7.50,
      markupPercentage: 30.00,
      retailPrice: 9.75,
    },
    {
      category: 'glazing',
      subcategory: 'acrylic',
      itemName: 'Non-Glare Acrylic',
      unitType: 'square_foot',
      basePrice: 6.75,
      markupPercentage: 30.00,
      retailPrice: 8.78,
    },
    {
      category: 'glazing',
      subcategory: 'acrylic',
      itemName: 'Museum Acrylic (99% UV)',
      unitType: 'square_foot',
      basePrice: 12.50,
      markupPercentage: 30.00,
      retailPrice: 16.25,
    },
    
    // Labor costs
    {
      category: 'labor',
      subcategory: 'cutting',
      itemName: 'Frame Cutting & Assembly',
      unitType: 'each',
      basePrice: 25.00,
      markupPercentage: 30.00,
      retailPrice: 32.50,
    },
    {
      category: 'labor',
      subcategory: 'mounting',
      itemName: 'Artwork Mounting',
      unitType: 'each',
      basePrice: 15.00,
      markupPercentage: 30.00,
      retailPrice: 19.50,
    },
    {
      category: 'labor',
      subcategory: 'installation',
      itemName: 'Hardware Installation',
      unitType: 'each',
      basePrice: 8.00,
      markupPercentage: 30.00,
      retailPrice: 10.40,
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