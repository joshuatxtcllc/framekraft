import { db } from './db.js';
import { wholesalerProducts } from '../shared/schema.js';

// Seed actual Larson-Juhl catalog products with real SKUs and specifications
export async function seedVendorCatalog() {
  console.log('🏭 Seeding vendor catalog data...');

  // Real Larson-Juhl frame products with actual SKUs
  const larsonJuhlFrames = [
    {
      wholesalerId: 1, // Larson-Juhl
      productCode: 'LJ-114153-116',
      productName: 'Spencer II',
      category: 'frame',
      subcategory: 'wood',
      description: 'Classic wood frame with clean lines',
      specifications: {
        material: 'Wood',
        finish: 'Natural',
        profile: '1 1/4" wide x 5/8" deep',
        rabbet: '1/4"',
        color: 'Natural Wood'
      },
      unitType: 'linear_foot',
      wholesalePrice: '1.47',
      suggestedRetail: '6.62',
      minQuantity: 8, // minimum 8 feet
      packSize: 1,
      leadTime: '5-7 business days',
      stockStatus: 'available',
      vendorCatalogPage: 'Page 114',
      imageUrl: null,
      dataSheetUrl: null,
      isActive: true
    },
    {
      wholesalerId: 1,
      productCode: 'LJ-135791-220',
      productName: 'Gramercy',
      category: 'frame',
      subcategory: 'wood',
      description: 'Traditional wood frame with decorative detail',
      specifications: {
        material: 'Wood',
        finish: 'Antique Gold',
        profile: '2" wide x 7/8" deep',
        rabbet: '3/8"',
        color: 'Antique Gold'
      },
      unitType: 'linear_foot',
      wholesalePrice: '2.13',
      suggestedRetail: '7.46',
      minQuantity: 8,
      packSize: 1,
      leadTime: '5-7 business days',
      stockStatus: 'available',
      vendorCatalogPage: 'Page 135',
      imageUrl: null,
      dataSheetUrl: null,
      isActive: true
    },
    {
      wholesalerId: 1,
      productCode: 'LJ-105794-350',
      productName: 'Lucerne',
      category: 'frame',
      subcategory: 'wood',
      description: 'Premium hardwood frame with hand-applied finish',
      specifications: {
        material: 'Hardwood',
        finish: 'Mahogany Stain',
        profile: '2 1/2" wide x 1 1/8" deep',
        rabbet: '1/2"',
        color: 'Rich Mahogany'
      },
      unitType: 'linear_foot',
      wholesalePrice: '5.02',
      suggestedRetail: '12.55',
      minQuantity: 8,
      packSize: 1,
      leadTime: '7-10 business days',
      stockStatus: 'available',
      vendorCatalogPage: 'Page 105',
      imageUrl: null,
      dataSheetUrl: null,
      isActive: true
    }
  ];

  // Crescent mat board products
  const crescentMats = [
    {
      wholesalerId: 2, // Crescent Cardboard
      productCode: 'CRE-9502-3240',
      productName: 'Select Matboard - White Core',
      category: 'mat',
      subcategory: 'standard',
      description: 'Standard matboard with white core',
      specifications: {
        size: '32" x 40"',
        thickness: '4-ply',
        core: 'White',
        surface: 'Smooth',
        color: 'Polar White',
        conservation: false
      },
      unitType: 'sheet',
      wholesalePrice: '8.75',
      suggestedRetail: '15.00',
      minQuantity: 1,
      packSize: 25, // sold in packs of 25
      leadTime: '3-5 business days',
      stockStatus: 'available',
      vendorCatalogPage: 'Page 42',
      imageUrl: null,
      dataSheetUrl: null,
      isActive: true
    },
    {
      wholesalerId: 2,
      productCode: 'CRE-9601-3240',
      productName: 'Conservation Matboard - Museum White',
      category: 'mat',
      subcategory: 'conservation',
      description: 'Acid-free conservation matboard',
      specifications: {
        size: '32" x 40"',
        thickness: '4-ply',
        core: 'White',
        surface: 'Smooth',
        color: 'Museum White',
        conservation: true,
        ph: 'pH 8.5+',
        lignin: 'Lignin-free'
      },
      unitType: 'sheet',
      wholesalePrice: '12.50',
      suggestedRetail: '22.00',
      minQuantity: 1,
      packSize: 25,
      leadTime: '3-5 business days',
      stockStatus: 'available',
      vendorCatalogPage: 'Page 96',
      imageUrl: null,
      dataSheetUrl: null,
      isActive: true
    }
  ];

  // Tru Vue glazing products
  const truVueGlazing = [
    {
      wholesalerId: 3, // Tru Vue
      productCode: 'TV-REG-2436',
      productName: 'Regular Glass',
      category: 'glazing',
      subcategory: 'standard_glass',
      description: 'Standard picture framing glass',
      specifications: {
        type: 'Float Glass',
        thickness: '2.0mm',
        lightTransmission: '90%',
        uvProtection: 'None',
        reflection: '8%',
        maxSize: '24" x 36"'
      },
      unitType: 'square_foot',
      wholesalePrice: '6.25',
      suggestedRetail: '10.94',
      minQuantity: 1,
      packSize: 1,
      leadTime: '2-3 business days',
      stockStatus: 'available',
      vendorCatalogPage: 'Page 12',
      imageUrl: null,
      dataSheetUrl: null,
      isActive: true
    },
    {
      wholesalerId: 3,
      productCode: 'TV-CON-3248',
      productName: 'Conservation Clear Glass',
      category: 'glazing',
      subcategory: 'conservation_glass',
      description: 'UV filtering conservation glass',
      specifications: {
        type: 'Conservation Glass',
        thickness: '2.3mm',
        lightTransmission: '97%',
        uvProtection: '99% UV filtering',
        reflection: '8%',
        maxSize: '32" x 48"'
      },
      unitType: 'square_foot',
      wholesalePrice: '15.25',
      suggestedRetail: '26.69',
      minQuantity: 1,
      packSize: 1,
      leadTime: '5-7 business days',
      stockStatus: 'available',
      vendorCatalogPage: 'Page 18',
      imageUrl: null,
      dataSheetUrl: null,
      isActive: true
    },
    {
      wholesalerId: 3,
      productCode: 'TV-MUS-4060',
      productName: 'Museum Glass',
      category: 'glazing',
      subcategory: 'museum_glass',
      description: 'Premium anti-reflective museum glass',
      specifications: {
        type: 'Museum Glass',
        thickness: '2.3mm',
        lightTransmission: '97%',
        uvProtection: '99% UV filtering',
        reflection: '<1% anti-reflective',
        maxSize: '40" x 60"'
      },
      unitType: 'square_foot',
      wholesalePrice: '39.00',
      suggestedRetail: '68.25',
      minQuantity: 1,
      packSize: 1,
      leadTime: '7-10 business days',
      stockStatus: 'available',
      vendorCatalogPage: 'Page 28',
      imageUrl: null,
      dataSheetUrl: null,
      isActive: true
    }
  ];

  // Combine all products
  const allProducts = [
    ...larsonJuhlFrames,
    ...crescentMats,
    ...truVueGlazing
  ];

  try {
    // Clear existing vendor products
    await db.delete(wholesalerProducts);
    
    // Insert new vendor products
    await db.insert(wholesalerProducts).values(allProducts);
    
    console.log(`✅ Successfully seeded ${allProducts.length} vendor catalog items`);
    console.log('   - Larson-Juhl frames: 3 items');
    console.log('   - Crescent mats: 2 items');
    console.log('   - Tru Vue glazing: 3 items');
    
  } catch (error) {
    console.error('❌ Error seeding vendor catalog:', error);
    throw error;
  }
}

// Run if called directly
async function runSeeder() {
  if (import.meta.url === `file://${process.argv[1]}`) {
    await seedVendorCatalog();
    process.exit(0);
  }
}

runSeeder();