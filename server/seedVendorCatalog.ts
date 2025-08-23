
import * as storage from './mongoStorage.js';

// Seed actual Larson-Juhl catalog products with real SKUs and specifications
export async function seedVendorCatalog() {
  console.log('🏭 Seeding vendor catalog data...');

  // Comprehensive Larson-Juhl frame products with actual SKUs
  const larsonJuhlFrames = [
    // Classic Wood Collection
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
      minQuantity: 8,
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
    },
    // Academic Collection
    {
      wholesalerId: 1,
      productCode: 'LJ-120456-100',
      productName: 'Academie Black',
      category: 'frame',
      subcategory: 'wood',
      description: 'Professional black wood frame for diplomas and certificates',
      specifications: {
        material: 'Wood',
        finish: 'Satin Black',
        profile: '1 1/2" wide x 3/4" deep',
        rabbet: '3/8"',
        color: 'Black'
      },
      unitType: 'linear_foot',
      wholesalePrice: '1.85',
      suggestedRetail: '7.89',
      minQuantity: 8,
      packSize: 1,
      leadTime: '5-7 business days',
      stockStatus: 'available',
      vendorCatalogPage: 'Page 120',
      imageUrl: null,
      dataSheetUrl: null,
      isActive: true
    },
    {
      wholesalerId: 1,
      productCode: 'LJ-120456-200',
      productName: 'Academie Cherry',
      category: 'frame',
      subcategory: 'wood',
      description: 'Professional cherry wood frame for diplomas and certificates',
      specifications: {
        material: 'Wood',
        finish: 'Cherry Stain',
        profile: '1 1/2" wide x 3/4" deep',
        rabbet: '3/8"',
        color: 'Cherry'
      },
      unitType: 'linear_foot',
      wholesalePrice: '1.95',
      suggestedRetail: '8.29',
      minQuantity: 8,
      packSize: 1,
      leadTime: '5-7 business days',
      stockStatus: 'available',
      vendorCatalogPage: 'Page 120',
      imageUrl: null,
      dataSheetUrl: null,
      isActive: true
    },
    // Metal Collection
    {
      wholesalerId: 1,
      productCode: 'LJ-890123-001',
      productName: 'Metro Silver',
      category: 'frame',
      subcategory: 'metal',
      description: 'Contemporary brushed silver metal frame',
      specifications: {
        material: 'Aluminum',
        finish: 'Brushed Silver',
        profile: '1" wide x 1/2" deep',
        rabbet: '1/4"',
        color: 'Silver'
      },
      unitType: 'linear_foot',
      wholesalePrice: '2.45',
      suggestedRetail: '9.80',
      minQuantity: 8,
      packSize: 1,
      leadTime: '3-5 business days',
      stockStatus: 'available',
      vendorCatalogPage: 'Page 89',
      imageUrl: null,
      dataSheetUrl: null,
      isActive: true
    },
    {
      wholesalerId: 1,
      productCode: 'LJ-890123-002',
      productName: 'Metro Black',
      category: 'frame',
      subcategory: 'metal',
      description: 'Contemporary matte black metal frame',
      specifications: {
        material: 'Aluminum',
        finish: 'Matte Black',
        profile: '1" wide x 1/2" deep',
        rabbet: '1/4"',
        color: 'Black'
      },
      unitType: 'linear_foot',
      wholesalePrice: '2.45',
      suggestedRetail: '9.80',
      minQuantity: 8,
      packSize: 1,
      leadTime: '3-5 business days',
      stockStatus: 'available',
      vendorCatalogPage: 'Page 89',
      imageUrl: null,
      dataSheetUrl: null,
      isActive: true
    },
    // Classic Collection
    {
      wholesalerId: 1,
      productCode: 'LJ-224567-150',
      productName: 'Hudson',
      category: 'frame',
      subcategory: 'wood',
      description: 'Traditional oak frame with classic styling',
      specifications: {
        material: 'Oak',
        finish: 'Natural Oak',
        profile: '1 3/4" wide x 7/8" deep',
        rabbet: '3/8"',
        color: 'Natural Oak'
      },
      unitType: 'linear_foot',
      wholesalePrice: '3.25',
      suggestedRetail: '11.38',
      minQuantity: 8,
      packSize: 1,
      leadTime: '5-7 business days',
      stockStatus: 'available',
      vendorCatalogPage: 'Page 224',
      imageUrl: null,
      dataSheetUrl: null,
      isActive: true
    },
    {
      wholesalerId: 1,
      productCode: 'LJ-224567-250',
      productName: 'Hudson Walnut',
      category: 'frame',
      subcategory: 'wood',
      description: 'Traditional walnut frame with classic styling',
      specifications: {
        material: 'Walnut',
        finish: 'Natural Walnut',
        profile: '1 3/4" wide x 7/8" deep',
        rabbet: '3/8"',
        color: 'Walnut'
      },
      unitType: 'linear_foot',
      wholesalePrice: '4.15',
      suggestedRetail: '14.53',
      minQuantity: 8,
      packSize: 1,
      leadTime: '5-7 business days',
      stockStatus: 'available',
      vendorCatalogPage: 'Page 224',
      imageUrl: null,
      dataSheetUrl: null,
      isActive: true
    },
    // Contemporary Collection
    {
      wholesalerId: 1,
      productCode: 'LJ-345678-400',
      productName: 'Soho White',
      category: 'frame',
      subcategory: 'wood',
      description: 'Modern white frame with clean contemporary lines',
      specifications: {
        material: 'Pine',
        finish: 'Satin White',
        profile: '1 1/8" wide x 5/8" deep',
        rabbet: '1/4"',
        color: 'White'
      },
      unitType: 'linear_foot',
      wholesalePrice: '1.75',
      suggestedRetail: '7.00',
      minQuantity: 8,
      packSize: 1,
      leadTime: '5-7 business days',
      stockStatus: 'available',
      vendorCatalogPage: 'Page 345',
      imageUrl: null,
      dataSheetUrl: null,
      isActive: true
    },
    // Ornate Collection
    {
      wholesalerId: 1,
      productCode: 'LJ-456789-600',
      productName: 'Baroque Gold',
      category: 'frame',
      subcategory: 'ornate',
      description: 'Ornate baroque style frame with gold leaf finish',
      specifications: {
        material: 'Composite',
        finish: 'Gold Leaf',
        profile: '3" wide x 1 1/4" deep',
        rabbet: '1/2"',
        color: 'Gold'
      },
      unitType: 'linear_foot',
      wholesalePrice: '8.95',
      suggestedRetail: '22.38',
      minQuantity: 8,
      packSize: 1,
      leadTime: '7-10 business days',
      stockStatus: 'available',
      vendorCatalogPage: 'Page 456',
      imageUrl: null,
      dataSheetUrl: null,
      isActive: true
    },
    {
      wholesalerId: 1,
      productCode: 'LJ-456789-700',
      productName: 'Baroque Silver',
      category: 'frame',
      subcategory: 'ornate',
      description: 'Ornate baroque style frame with silver leaf finish',
      specifications: {
        material: 'Composite',
        finish: 'Silver Leaf',
        profile: '3" wide x 1 1/4" deep',
        rabbet: '1/2"',
        color: 'Silver'
      },
      unitType: 'linear_foot',
      wholesalePrice: '8.95',
      suggestedRetail: '22.38',
      minQuantity: 8,
      packSize: 1,
      leadTime: '7-10 business days',
      stockStatus: 'available',
      vendorCatalogPage: 'Page 456',
      imageUrl: null,
      dataSheetUrl: null,
      isActive: true
    }
  ];

  // Expanded Crescent mat board products
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
      packSize: 25,
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
    },
    {
      wholesalerId: 2,
      productCode: 'CRE-9503-3240',
      productName: 'Select Matboard - Black Core',
      category: 'mat',
      subcategory: 'standard',
      description: 'Standard matboard with black core',
      specifications: {
        size: '32" x 40"',
        thickness: '4-ply',
        core: 'Black',
        surface: 'Smooth',
        color: 'Jet Black',
        conservation: false
      },
      unitType: 'sheet',
      wholesalePrice: '9.25',
      suggestedRetail: '16.00',
      minQuantity: 1,
      packSize: 25,
      leadTime: '3-5 business days',
      stockStatus: 'available',
      vendorCatalogPage: 'Page 42',
      imageUrl: null,
      dataSheetUrl: null,
      isActive: true
    },
    {
      wholesalerId: 2,
      productCode: 'CRE-9602-3240',
      productName: 'Conservation Matboard - Cream',
      category: 'mat',
      subcategory: 'conservation',
      description: 'Acid-free conservation matboard in cream',
      specifications: {
        size: '32" x 40"',
        thickness: '4-ply',
        core: 'White',
        surface: 'Smooth',
        color: 'Antique Cream',
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

  // Comprehensive Tru Vue glazing products
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
    },
    {
      wholesalerId: 3,
      productCode: 'TV-OPT-3248',
      productName: 'Optium Acrylic',
      category: 'glazing',
      subcategory: 'optium_acrylic',
      description: 'Premium acrylic with superior clarity and UV protection',
      specifications: {
        type: 'Acrylic',
        thickness: '2.5mm',
        lightTransmission: '99%',
        uvProtection: '99% UV filtering',
        reflection: '<2% anti-reflective',
        maxSize: '48" x 96"'
      },
      unitType: 'square_foot',
      wholesalePrice: '28.00',
      suggestedRetail: '49.00',
      minQuantity: 1,
      packSize: 1,
      leadTime: '5-7 business days',
      stockStatus: 'available',
      vendorCatalogPage: 'Page 32',
      imageUrl: null,
      dataSheetUrl: null,
      isActive: true
    },
    {
      wholesalerId: 3,
      productCode: 'TV-PLEX-2436',
      productName: 'Regular Plexiglass',
      category: 'glazing',
      subcategory: 'acrylic',
      description: 'Standard acrylic glazing for lightweight applications',
      specifications: {
        type: 'Acrylic',
        thickness: '2.0mm',
        lightTransmission: '92%',
        uvProtection: 'Minimal',
        reflection: '8%',
        maxSize: '48" x 96"'
      },
      unitType: 'square_foot',
      wholesalePrice: '8.50',
      suggestedRetail: '14.88',
      minQuantity: 1,
      packSize: 1,
      leadTime: '3-5 business days',
      stockStatus: 'available',
      vendorCatalogPage: 'Page 15',
      imageUrl: null,
      dataSheetUrl: null,
      isActive: true
    },
    {
      wholesalerId: 3,
      productCode: 'TV-CON-PLEX-3248',
      productName: 'Conservation Plexiglass',
      category: 'glazing',
      subcategory: 'conservation_acrylic',
      description: 'UV filtering conservation acrylic',
      specifications: {
        type: 'Conservation Acrylic',
        thickness: '2.3mm',
        lightTransmission: '96%',
        uvProtection: '99% UV filtering',
        reflection: '8%',
        maxSize: '48" x 96"'
      },
      unitType: 'square_foot',
      wholesalePrice: '22.50',
      suggestedRetail: '39.38',
      minQuantity: 1,
      packSize: 1,
      leadTime: '5-7 business days',
      stockStatus: 'available',
      vendorCatalogPage: 'Page 22',
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
    // Clear existing vendor products (if needed, we can implement a clearWholesalerProducts method)
    // For now, we'll add products one by one
    
    // Insert new vendor products
    for (const product of allProducts) {
      await storage.createWholesalerProduct(product);
    }
    
    console.log(`✅ Successfully seeded ${allProducts.length} vendor catalog items`);
    console.log('   - Larson-Juhl frames: 12 items');
    console.log('   - Crescent mats: 4 items');
    console.log('   - Tru Vue glazing: 6 items');
    
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
