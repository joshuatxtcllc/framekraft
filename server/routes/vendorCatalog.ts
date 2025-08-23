import { Router } from 'express';
import { z } from 'zod';
import * as storage from '../mongoStorage.js';
import { isAuthenticated } from '../replitAuth.js';

const router = Router();

// Get all wholesalers
router.get('/wholesalers', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user?.id;
    const allWholesalers = await storage.getWholesalersByUserId(userId);
    
    // Filter only active wholesalers and sort by company name
    const activeWholesalers = allWholesalers
      .filter(w => w.isActive)
      .sort((a, b) => a.companyName.localeCompare(b.companyName));
    
    res.json(activeWholesalers);
  } catch (error) {
    console.error('Error fetching wholesalers:', error);
    res.status(500).json({ message: 'Failed to fetch wholesalers' });
  }
});

// Search vendor products with filters
router.get('/products/search', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user?.id;
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

    // Get all products
    let products = await storage.getWholesalerProducts();
    
    // Get wholesalers for joining
    const wholesalersList = await storage.getWholesalersByUserId(userId);
    const wholesalersMap = new Map(wholesalersList.map(w => [w.id, w]));

    // Filter active products
    products = products.filter(p => p.isActive);

    // Apply filters
    if (category) {
      products = products.filter(p => p.category === category);
    }
    if (subcategory) {
      products = products.filter(p => p.subcategory === subcategory);
    }
    if (stockStatus) {
      products = products.filter(p => p.stockStatus === stockStatus);
    }
    if (minPrice) {
      products = products.filter(p => parseFloat(p.wholesalePrice) >= parseFloat(minPrice as string));
    }
    if (maxPrice) {
      products = products.filter(p => parseFloat(p.wholesalePrice) <= parseFloat(maxPrice as string));
    }

    // Text search across product name, code, and description
    if (query) {
      const searchTerm = (query as string).toLowerCase();
      products = products.filter(p => 
        p.productName.toLowerCase().includes(searchTerm) ||
        p.productCode.toLowerCase().includes(searchTerm) ||
        (p.description && p.description.toLowerCase().includes(searchTerm))
      );
    }

    // Join with wholesaler data
    const productsWithSupplier = products.map(p => {
      const wholesaler = wholesalersMap.get(p.wholesalerId);
      return {
        ...p,
        supplierName: wholesaler?.companyName,
        supplierContact: wholesaler?.contactName,
        supplierPhone: wholesaler?.phone,
        supplierEmail: wholesaler?.email,
        paymentTerms: wholesaler?.paymentTerms,
        minOrderAmount: wholesaler?.minOrderAmount
      };
    });

    // Sort by category and product name
    productsWithSupplier.sort((a, b) => {
      const categoryCompare = (a.category || '').localeCompare(b.category || '');
      if (categoryCompare !== 0) return categoryCompare;
      return a.productName.localeCompare(b.productName);
    });

    // Apply pagination
    const startIndex = parseInt(offset as string);
    const endIndex = startIndex + parseInt(limit as string);
    const paginatedProducts = productsWithSupplier.slice(startIndex, endIndex);

    res.json(paginatedProducts);
  } catch (error) {
    console.error('Error searching vendor products:', error);
    res.status(500).json({ message: 'Failed to search products' });
  }
});

// Get product details by ID with full specifications
router.get('/products/:id', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user?.id;
    const productId = req.params.id;
    
    const products = await storage.getWholesalerProducts();
    const product = products.find(p => p.id === productId);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Get wholesaler details
    const wholesaler = await storage.getWholesalerById(product.wholesalerId);
    
    const productWithSupplier = {
      ...product,
      supplierName: wholesaler?.companyName,
      supplierContact: wholesaler?.contactName,
      supplierPhone: wholesaler?.phone,
      supplierEmail: wholesaler?.email,
      supplierWebsite: wholesaler?.website,
      paymentTerms: wholesaler?.paymentTerms,
      minOrderAmount: wholesaler?.minOrderAmount,
      specialties: wholesaler?.specialties
    };

    res.json(productWithSupplier);
  } catch (error) {
    console.error('Error fetching product details:', error);
    res.status(500).json({ message: 'Failed to fetch product details' });
  }
});

// Get products by category with supplier info
router.get('/categories/:category', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { category } = req.params;
    const { subcategory } = req.query;

    // Get all products
    let products = await storage.getWholesalerProducts();
    
    // Get wholesalers for joining
    const wholesalersList = await storage.getWholesalersByUserId(userId);
    const wholesalersMap = new Map(wholesalersList.map(w => [w.id, w]));

    // Filter by category and active status
    products = products.filter(p => 
      p.category === category && p.isActive
    );

    if (subcategory) {
      products = products.filter(p => p.subcategory === subcategory);
    }

    // Join with wholesaler data
    const productsWithSupplier = products.map(p => {
      const wholesaler = wholesalersMap.get(p.wholesalerId);
      return {
        id: p.id,
        productCode: p.productCode,
        productName: p.productName,
        subcategory: p.subcategory,
        wholesalePrice: p.wholesalePrice,
        suggestedRetail: p.suggestedRetail,
        unitType: p.unitType,
        leadTime: p.leadTime,
        stockStatus: p.stockStatus,
        specifications: p.specifications,
        supplierName: wholesaler?.companyName,
        minQuantity: p.minQuantity,
        packSize: p.packSize
      };
    });

    // Sort by price and name
    productsWithSupplier.sort((a, b) => {
      const priceCompare = parseFloat(a.wholesalePrice) - parseFloat(b.wholesalePrice);
      if (priceCompare !== 0) return priceCompare;
      return a.productName.localeCompare(b.productName);
    });

    res.json(productsWithSupplier);
  } catch (error) {
    console.error('Error fetching category products:', error);
    res.status(500).json({ message: 'Failed to fetch category products' });
  }
});

// Get purchasing recommendations based on order history
router.get('/recommendations/:category', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { category } = req.params;
    
    // Get all orders to analyze popular products
    const orders = await storage.getOrders(userId);
    const productStats = new Map();

    // Analyze order line items
    for (const order of orders) {
      if (order.lineItems) {
        for (const item of order.lineItems) {
          if (item.itemType === category) {
            const key = `${item.productCode}_${item.productName}_${item.supplierName}`;
            if (!productStats.has(key)) {
              productStats.set(key, {
                productCode: item.productCode,
                productName: item.productName,
                supplierName: item.supplierName,
                orderCount: 0,
                totalQuantity: 0,
                totalWholesale: 0,
                totalRetail: 0
              });
            }
            const stats = productStats.get(key);
            stats.orderCount += 1;
            stats.totalQuantity += parseFloat(item.quantity || '0');
            stats.totalWholesale += parseFloat(item.wholesalePrice || '0');
            stats.totalRetail += parseFloat(item.retailPrice || '0');
          }
        }
      }
    }

    // Convert to array and calculate averages
    const popularProducts = Array.from(productStats.values())
      .map(stats => ({
        ...stats,
        avgWholesalePrice: stats.orderCount > 0 ? (stats.totalWholesale / stats.orderCount).toFixed(2) : '0',
        avgRetailPrice: stats.orderCount > 0 ? (stats.totalRetail / stats.orderCount).toFixed(2) : '0'
      }))
      .sort((a, b) => b.orderCount - a.orderCount)
      .slice(0, 10);

    // Get current vendor products in this category
    let currentProducts = await storage.getWholesalerProducts();
    
    // Filter and sort
    currentProducts = currentProducts
      .filter(p => p.category === category && p.isActive)
      .sort((a, b) => parseFloat(a.wholesalePrice) - parseFloat(b.wholesalePrice))
      .slice(0, 20);

    res.json({
      popularFromHistory: popularProducts,
      currentAvailable: currentProducts
    });
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    res.status(500).json({ message: 'Failed to fetch recommendations' });
  }
});

export default router;