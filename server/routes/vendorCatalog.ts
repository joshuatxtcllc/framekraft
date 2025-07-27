import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db.js';
import { wholesalers, wholesalerProducts, orderLineItems } from '../../shared/schema.js';
import { eq, like, and, or, desc, asc, gte, lte, sql } from 'drizzle-orm';
import { isAuthenticated } from '../replitAuth.js';

const router = Router();

// Get all wholesalers
router.get('/wholesalers', isAuthenticated, async (req, res) => {
  try {
    const allWholesalers = await db.select().from(wholesalers)
      .where(eq(wholesalers.isActive, true))
      .orderBy(asc(wholesalers.companyName));
    
    res.json(allWholesalers);
  } catch (error) {
    console.error('Error fetching wholesalers:', error);
    res.status(500).json({ message: 'Failed to fetch wholesalers' });
  }
});

// Search vendor products with filters
router.get('/products/search', isAuthenticated, async (req, res) => {
  try {
    const { 
      category, 
      subcategory, 
      supplier, 
      query, 
      minPrice, 
      maxPrice,
      stockStatus = 'available',
      limit = 50,
      offset = 0 
    } = req.query;

    let whereConditions = [eq(wholesalerProducts.isActive, true)];

    // Add filters
    if (category) {
      whereConditions.push(eq(wholesalerProducts.category, category as string));
    }
    if (subcategory) {
      whereConditions.push(eq(wholesalerProducts.subcategory, subcategory as string));
    }
    if (stockStatus) {
      whereConditions.push(eq(wholesalerProducts.stockStatus, stockStatus as string));
    }
    if (minPrice) {
      whereConditions.push(gte(wholesalerProducts.wholesalePrice, minPrice as string));
    }
    if (maxPrice) {
      whereConditions.push(lte(wholesalerProducts.wholesalePrice, maxPrice as string));
    }

    // Text search across product name, code, and description  
    if (query) {
      const searchTerm = `%${query}%`;
      const searchCondition = or(
        like(wholesalerProducts.productName, searchTerm),
        like(wholesalerProducts.productCode, searchTerm),
        like(wholesalerProducts.description, searchTerm)
      );
      if (searchCondition) {
        whereConditions.push(searchCondition);
      }
    }

    const products = await db.select({
      id: wholesalerProducts.id,
      productCode: wholesalerProducts.productCode,
      productName: wholesalerProducts.productName,
      category: wholesalerProducts.category,
      subcategory: wholesalerProducts.subcategory,
      description: wholesalerProducts.description,
      specifications: wholesalerProducts.specifications,
      unitType: wholesalerProducts.unitType,
      wholesalePrice: wholesalerProducts.wholesalePrice,
      suggestedRetail: wholesalerProducts.suggestedRetail,
      minQuantity: wholesalerProducts.minQuantity,
      packSize: wholesalerProducts.packSize,
      leadTime: wholesalerProducts.leadTime,
      stockStatus: wholesalerProducts.stockStatus,
      vendorCatalogPage: wholesalerProducts.vendorCatalogPage,
      wholesalerId: wholesalerProducts.wholesalerId,
      supplierName: wholesalers.companyName,
      supplierContact: wholesalers.contactName,
      supplierPhone: wholesalers.phone,
      supplierEmail: wholesalers.email,
      paymentTerms: wholesalers.paymentTerms,
      minOrderAmount: wholesalers.minOrderAmount
    })
    .from(wholesalerProducts)
    .leftJoin(wholesalers, eq(wholesalerProducts.wholesalerId, wholesalers.id))
    .where(and(...whereConditions))
    .orderBy(asc(wholesalerProducts.category), asc(wholesalerProducts.productName))
    .limit(parseInt(limit as string))
    .offset(parseInt(offset as string));

    res.json(products);
  } catch (error) {
    console.error('Error searching vendor products:', error);
    res.status(500).json({ message: 'Failed to search products' });
  }
});

// Get product details by ID with full specifications
router.get('/products/:id', isAuthenticated, async (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    
    const [product] = await db.select({
      id: wholesalerProducts.id,
      productCode: wholesalerProducts.productCode,
      productName: wholesalerProducts.productName,
      category: wholesalerProducts.category,
      subcategory: wholesalerProducts.subcategory,
      description: wholesalerProducts.description,
      specifications: wholesalerProducts.specifications,
      unitType: wholesalerProducts.unitType,
      wholesalePrice: wholesalerProducts.wholesalePrice,
      suggestedRetail: wholesalerProducts.suggestedRetail,
      minQuantity: wholesalerProducts.minQuantity,
      packSize: wholesalerProducts.packSize,
      leadTime: wholesalerProducts.leadTime,
      stockStatus: wholesalerProducts.stockStatus,
      vendorCatalogPage: wholesalerProducts.vendorCatalogPage,
      imageUrl: wholesalerProducts.imageUrl,
      dataSheetUrl: wholesalerProducts.dataSheetUrl,
      lastUpdated: wholesalerProducts.lastUpdated,
      wholesalerId: wholesalerProducts.wholesalerId,
      supplierName: wholesalers.companyName,
      supplierContact: wholesalers.contactName,
      supplierPhone: wholesalers.phone,
      supplierEmail: wholesalers.email,
      supplierWebsite: wholesalers.website,
      paymentTerms: wholesalers.paymentTerms,
      minOrderAmount: wholesalers.minOrderAmount,
      specialties: wholesalers.specialties
    })
    .from(wholesalerProducts)
    .leftJoin(wholesalers, eq(wholesalerProducts.wholesalerId, wholesalers.id))
    .where(eq(wholesalerProducts.id, productId));

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    console.error('Error fetching product details:', error);
    res.status(500).json({ message: 'Failed to fetch product details' });
  }
});

// Get products by category with supplier info
router.get('/categories/:category', isAuthenticated, async (req, res) => {
  try {
    const { category } = req.params;
    const { subcategory } = req.query;

    let whereConditions = [
      eq(wholesalerProducts.category, category),
      eq(wholesalerProducts.isActive, true)
    ];

    if (subcategory) {
      whereConditions.push(eq(wholesalerProducts.subcategory, subcategory as string));
    }

    const products = await db.select({
      id: wholesalerProducts.id,
      productCode: wholesalerProducts.productCode,
      productName: wholesalerProducts.productName,
      subcategory: wholesalerProducts.subcategory,
      wholesalePrice: wholesalerProducts.wholesalePrice,
      suggestedRetail: wholesalerProducts.suggestedRetail,
      unitType: wholesalerProducts.unitType,
      leadTime: wholesalerProducts.leadTime,
      stockStatus: wholesalerProducts.stockStatus,
      specifications: wholesalerProducts.specifications,
      supplierName: wholesalers.companyName,
      minQuantity: wholesalerProducts.minQuantity,
      packSize: wholesalerProducts.packSize
    })
    .from(wholesalerProducts)
    .leftJoin(wholesalers, eq(wholesalerProducts.wholesalerId, wholesalers.id))
    .where(and(...whereConditions))
    .orderBy(asc(wholesalerProducts.wholesalePrice), asc(wholesalerProducts.productName));

    res.json(products);
  } catch (error) {
    console.error('Error fetching category products:', error);
    res.status(500).json({ message: 'Failed to fetch category products' });
  }
});

// Get purchasing recommendations based on order history
router.get('/recommendations/:category', isAuthenticated, async (req, res) => {
  try {
    const { category } = req.params;
    
    // Get most frequently ordered products in this category
    const popularProducts = await db.select({
      productCode: orderLineItems.productCode,
      productName: orderLineItems.productName,
      supplierName: orderLineItems.supplierName,
      orderCount: sql<number>`COUNT(*)::int`,
      avgWholesalePrice: sql<number>`AVG(${orderLineItems.wholesalePrice})::numeric(8,2)`,
      avgRetailPrice: sql<number>`AVG(${orderLineItems.retailPrice})::numeric(8,2)`,
      totalQuantity: sql<number>`SUM(${orderLineItems.quantity})::numeric(8,2)`
    })
    .from(orderLineItems)
    .where(eq(orderLineItems.itemType, category))
    .groupBy(
      orderLineItems.productCode, 
      orderLineItems.productName, 
      orderLineItems.supplierName
    )
    .orderBy(desc(sql`COUNT(*)`))
    .limit(10);

    // Get current vendor products that match popular items
    const currentProducts = await db.select()
      .from(wholesalerProducts)
      .leftJoin(wholesalers, eq(wholesalerProducts.wholesalerId, wholesalers.id))
      .where(and(
        eq(wholesalerProducts.category, category),
        eq(wholesalerProducts.isActive, true)
      ))
      .orderBy(asc(wholesalerProducts.wholesalePrice));

    res.json({
      popularFromHistory: popularProducts,
      currentAvailable: currentProducts.slice(0, 20) // Top 20 by price
    });
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    res.status(500).json({ message: 'Failed to fetch recommendations' });
  }
});

export default router;