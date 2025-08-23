import * as storage from './mongoStorage';
import { connectDB } from './mongodb';
import { User } from './models/index';

// Seed actual Larson-Juhl catalog products with real SKUs and specifications
export async function seedVendorCatalog() {
  console.log('🏭 Seeding vendor catalog data in MongoDB...');

  try {
    // Ensure MongoDB connection is established
    await connectDB();
    
    // Get or create a demo user for the seed data
    let demoUser = await User.findOne({ email: 'demo@framekraft.com' });
    if (!demoUser) {
      demoUser = await User.create({
        email: 'demo@framekraft.com',
        username: 'demo',
        password: 'demo123', // Will be hashed by the model
        isActive: true
      });
      console.log('Created demo user for seed data');
    }
    const demoUserId = demoUser._id.toString();
    
    // First, create demo wholesalers if they don't exist
    const wholesalers = await storage.getWholesalers();
    
    let larsonJuhlId: any, crescentId: any, truVueId: any;
    
    // Check if Larson-Juhl exists, if not create it
    let larsonJuhl = wholesalers.find(w => w.companyName === 'Larson-Juhl');
    if (!larsonJuhl) {
      larsonJuhl = await storage.createWholesaler({
        companyName: 'Larson-Juhl',
        contactName: 'John Smith',
        email: 'orders@larsonjuhl.com',
        phone: '800-555-0001',
        address: '123 Frame Avenue',
        city: 'Chicago',
        state: 'IL',
        zipCode: '60601',
        country: 'USA',
        website: 'https://www.larsonjuhl.com',
        specialties: ['premium_frames', 'custom_moulding', 'wood_frames', 'metal_frames'],
        paymentTerms: 'Net 30',
        minOrderAmount: 100,
        notes: 'Premium frame supplier',
        isActive: true,
      userId: demoUserId,
        userId: demoUserId
      });
    }
    larsonJuhlId = larsonJuhl._id;

    // Check if Crescent exists, if not create it
    let crescent = wholesalers.find(w => w.companyName === 'Crescent Cardboard');
    if (!crescent) {
      crescent = await storage.createWholesaler({
        companyName: 'Crescent Cardboard',
        contactName: 'Jane Doe',
        email: 'sales@crescentcardboard.com',
        phone: '800-555-0002',
        address: '456 Mat Board Way',
        city: 'Wheeling',
        state: 'IL',
        zipCode: '60090',
        country: 'USA',
        website: 'https://www.crescentcardboard.com',
        specialties: ['mat_boards', 'conservation_materials', 'mounting_boards'],
        paymentTerms: 'Net 30',
        minOrderAmount: 50,
        notes: 'Leading mat board supplier',
        isActive: true,
      userId: demoUserId,
        userId: demoUserId
      });
    }
    crescentId = crescent._id;

    // Check if Tru Vue exists, if not create it
    let truVue = wholesalers.find(w => w.companyName === 'Tru Vue');
    if (!truVue) {
      truVue = await storage.createWholesaler({
        companyName: 'Tru Vue',
        contactName: 'Mike Johnson',
        email: 'orders@tru-vue.com',
        phone: '800-555-0003',
        address: '789 Glass Street',
        city: 'McCook',
        state: 'IL',
        zipCode: '60525',
        country: 'USA',
        website: 'https://www.tru-vue.com',
        specialties: ['glazing', 'conservation_glass', 'museum_glass', 'acrylic'],
        paymentTerms: 'Net 30',
        minOrderAmount: 75,
        notes: 'Premium glazing solutions',
        isActive: true,
      userId: demoUserId,
        userId: demoUserId
      });
    }
    truVueId = truVue._id;

    // Clear existing products for these wholesalers
    const existingProducts = await storage.getWholesalerProducts();
    for (const product of existingProducts) {
      if (product.wholesalerId && 
          [larsonJuhlId.toString(), crescentId.toString(), truVueId.toString()].includes(product.wholesalerId.toString())) {
        await storage.deleteWholesalerProduct(product._id.toString());
      }
    }

    // Comprehensive Larson-Juhl frame products with actual SKUs
    const larsonJuhlFrames = [
      {
        wholesalerId: larsonJuhlId.toString(),
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
        wholesalePrice: 1.47,
        suggestedRetail: 6.62,
        minQuantity: 8,
        packSize: 1,
        leadTime: '5-7 business days',
        stockStatus: 'available',
        vendorCatalogPage: 'Page 114',
        isActive: true,
      userId: demoUserId,
        },
      {
        wholesalerId: larsonJuhlId.toString(),
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
        wholesalePrice: 2.13,
        suggestedRetail: 7.46,
        minQuantity: 8,
        packSize: 1,
        leadTime: '5-7 business days',
        stockStatus: 'available',
        vendorCatalogPage: 'Page 135',
        isActive: true,
      userId: demoUserId,
        },
      {
        wholesalerId: larsonJuhlId.toString(),
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
        wholesalePrice: 5.02,
        suggestedRetail: 12.55,
        minQuantity: 8,
        packSize: 1,
        leadTime: '7-10 business days',
        stockStatus: 'available',
        vendorCatalogPage: 'Page 105',
        isActive: true,
      userId: demoUserId,
        },
      {
        wholesalerId: larsonJuhlId.toString(),
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
        wholesalePrice: 1.85,
        suggestedRetail: 7.89,
        minQuantity: 8,
        packSize: 1,
        leadTime: '5-7 business days',
        stockStatus: 'available',
        vendorCatalogPage: 'Page 120',
        isActive: true,
      userId: demoUserId,
        },
      {
        wholesalerId: larsonJuhlId.toString(),
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
        wholesalePrice: 2.45,
        suggestedRetail: 9.80,
        minQuantity: 8,
        packSize: 1,
        leadTime: '3-5 business days',
        stockStatus: 'available',
        vendorCatalogPage: 'Page 89',
        isActive: true,
      userId: demoUserId,
        }
    ];

    // Expanded Crescent mat board products
    const crescentMats = [
      {
        wholesalerId: crescentId.toString(),
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
        wholesalePrice: 8.75,
        suggestedRetail: 15.00,
        minQuantity: 1,
        packSize: 25,
        leadTime: '3-5 business days',
        stockStatus: 'available',
        vendorCatalogPage: 'Page 42',
        isActive: true,
      userId: demoUserId,
        },
      {
        wholesalerId: crescentId.toString(),
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
        wholesalePrice: 12.50,
        suggestedRetail: 22.00,
        minQuantity: 1,
        packSize: 25,
        leadTime: '3-5 business days',
        stockStatus: 'available',
        vendorCatalogPage: 'Page 96',
        isActive: true,
      userId: demoUserId,
        },
      {
        wholesalerId: crescentId.toString(),
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
        wholesalePrice: 9.25,
        suggestedRetail: 16.00,
        minQuantity: 1,
        packSize: 25,
        leadTime: '3-5 business days',
        stockStatus: 'available',
        vendorCatalogPage: 'Page 42',
        isActive: true,
      userId: demoUserId,
        }
    ];

    // Comprehensive Tru Vue glazing products
    const truVueGlazing = [
      {
        wholesalerId: truVueId.toString(),
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
        wholesalePrice: 6.25,
        suggestedRetail: 10.94,
        minQuantity: 1,
        packSize: 1,
        leadTime: '2-3 business days',
        stockStatus: 'available',
        vendorCatalogPage: 'Page 12',
        isActive: true,
      userId: demoUserId,
        },
      {
        wholesalerId: truVueId.toString(),
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
        wholesalePrice: 15.25,
        suggestedRetail: 26.69,
        minQuantity: 1,
        packSize: 1,
        leadTime: '5-7 business days',
        stockStatus: 'available',
        vendorCatalogPage: 'Page 18',
        isActive: true,
      userId: demoUserId,
        },
      {
        wholesalerId: truVueId.toString(),
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
        wholesalePrice: 39.00,
        suggestedRetail: 68.25,
        minQuantity: 1,
        packSize: 1,
        leadTime: '7-10 business days',
        stockStatus: 'available',
        vendorCatalogPage: 'Page 28',
        isActive: true,
      userId: demoUserId,
        }
    ];

    // Insert all products
    const allProducts = [
      ...larsonJuhlFrames,
      ...crescentMats,
      ...truVueGlazing
    ];

    let successCount = 0;
    for (const product of allProducts) {
      try {
        await storage.createWholesalerProduct(product);
        successCount++;
      } catch (error) {
        console.error(`Failed to create product ${product.productCode}:`, error);
      }
    }
    
    console.log(`✅ Successfully seeded ${successCount} vendor catalog items`);
    console.log('   - Larson-Juhl frames: 5 items');
    console.log('   - Crescent mats: 3 items');
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