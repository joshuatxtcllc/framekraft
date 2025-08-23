import { Router } from 'express';
import * as storage from '../mongoStorage';
import { z } from 'zod';

const router = Router();

// Search query schema
const searchSchema = z.object({
  query: z.string().min(1).max(100),
  types: z.array(z.enum(['orders', 'customers', 'products', 'invoices', 'inventory'])).optional(),
  limit: z.number().min(1).max(50).optional().default(10),
});

// Global search endpoint
router.get('/search', async (req, res) => {
  try {
    // Parse and validate query parameters
    const params = searchSchema.parse({
      query: req.query.q as string,
      types: req.query.types ? (req.query.types as string).split(',') : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
    });

    const searchQuery = params.query.toLowerCase().trim();
    const searchTypes = params.types || ['orders', 'customers', 'products', 'invoices', 'inventory'];
    const results: any = {
      orders: [],
      customers: [],
      products: [],
      invoices: [],
      inventory: [],
      totalResults: 0,
    };

    // Search in parallel for better performance
    const searchPromises = [];

    // Search Orders
    if (searchTypes.includes('orders')) {
      searchPromises.push(
        storage.getOrders().then(orders => {
          results.orders = orders
            .filter((order: any) => {
              const searchableText = [
                order.orderNumber,
                order.description,
                order.artworkDescription,
                order.frameStyle,
                order.matColor,
                order.glazing,
                order.status,
                order.notes,
                order.customer?.firstName,
                order.customer?.lastName,
                order.customer?.email,
              ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();
              
              return searchableText.includes(searchQuery);
            })
            .slice(0, params.limit)
            .map((order: any) => ({
              id: order.id,
              type: 'order',
              title: `Order #${order.orderNumber}`,
              subtitle: order.description,
              meta: {
                status: order.status,
                customer: order.customer ? `${order.customer.firstName} ${order.customer.lastName}` : 'Unknown',
                date: order.createdAt,
                amount: order.totalAmount,
              },
              url: `/orders/edit/${order.id}`,
            }));
        })
      );
    }

    // Search Customers
    if (searchTypes.includes('customers')) {
      searchPromises.push(
        storage.getCustomers().then(customers => {
          results.customers = customers
            .filter((customer: any) => {
              const searchableText = [
                customer.firstName,
                customer.lastName,
                customer.email,
                customer.phone,
                customer.address,
                customer.notes,
              ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();
              
              return searchableText.includes(searchQuery);
            })
            .slice(0, params.limit)
            .map((customer: any) => ({
              id: customer._id || customer.id,
              type: 'customer',
              title: `${customer.firstName} ${customer.lastName}`,
              subtitle: customer.email || customer.phone || 'No contact info',
              meta: {
                orderCount: customer.orderCount,
                totalSpent: customer.totalSpent,
                lastOrder: customer.updatedAt,
              },
              url: `/customers?id=${customer._id || customer.id}`,
            }));
        })
      );
    }

    // Search Wholesaler Products
    if (searchTypes.includes('products')) {
      searchPromises.push(
        storage.searchWholesalerProducts(params.query).then(products => {
          results.products = products
            .slice(0, params.limit)
            .map((product: any) => ({
              id: product._id || product.id,
              type: 'product',
              title: product.productName,
              subtitle: `${product.productCode} - ${product.category}`,
              meta: {
                supplier: product.wholesalerId?.companyName || 'Unknown Supplier',
                price: product.wholesalePrice,
                stock: product.stockStatus,
                unitType: product.unitType,
              },
              url: `/vendor-catalog?product=${product._id || product.id}`,
            }));
        })
      );
    }

    // Search Invoices
    if (searchTypes.includes('invoices')) {
      searchPromises.push(
        storage.getInvoices().then(invoices => {
          results.invoices = invoices
            .filter((invoice: any) => {
              const searchableText = [
                invoice.invoiceNumber,
                invoice.notes,
                invoice.status,
                invoice.paymentMethod,
                invoice.customerId?.firstName,
                invoice.customerId?.lastName,
                invoice.customerId?.email,
              ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();
              
              return searchableText.includes(searchQuery);
            })
            .slice(0, params.limit)
            .map((invoice: any) => ({
              id: invoice._id || invoice.id,
              type: 'invoice',
              title: `Invoice #${invoice.invoiceNumber}`,
              subtitle: invoice.customerId ? `${invoice.customerId.firstName} ${invoice.customerId.lastName}` : 'Unknown Customer',
              meta: {
                status: invoice.status,
                amount: invoice.totalAmount,
                dueDate: invoice.dueDate,
                paid: invoice.paidDate ? true : false,
              },
              url: `/invoices?id=${invoice._id || invoice.id}`,
            }));
        })
      );
    }

    // Search Inventory
    if (searchTypes.includes('inventory')) {
      searchPromises.push(
        storage.getInventory().then(items => {
          results.inventory = items
            .filter((item: any) => {
              const searchableText = [
                item.itemName,
                item.category,
                item.description,
                item.supplier,
              ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();
              
              return searchableText.includes(searchQuery);
            })
            .slice(0, params.limit)
            .map((item: any) => ({
              id: item._id || item.id,
              type: 'inventory',
              title: item.itemName,
              subtitle: `${item.category}${item.supplier ? ` - ${item.supplier}` : ''}`,
              meta: {
                quantity: item.quantity,
                minQuantity: item.minQuantity,
                lowStock: item.quantity <= item.minQuantity,
                unitCost: item.unitCost,
              },
              url: `/inventory?item=${item._id || item.id}`,
            }));
        })
      );
    }

    // Wait for all searches to complete
    await Promise.all(searchPromises);

    // Calculate total results
    results.totalResults = 
      results.orders.length + 
      results.customers.length + 
      results.products.length + 
      results.invoices.length + 
      results.inventory.length;

    // Combine all results for a unified view
    results.all = [
      ...results.orders,
      ...results.customers,
      ...results.products,
      ...results.invoices,
      ...results.inventory,
    ].slice(0, params.limit * 2); // Return more for "all" view

    res.json({
      success: true,
      query: params.query,
      results,
    });
  } catch (error: any) {
    console.error('Search error:', error);
    
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid search parameters',
        errors: error.errors,
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Search failed',
    });
  }
});

// Quick search suggestions endpoint
router.get('/search/suggestions', async (req, res) => {
  try {
    const query = (req.query.q as string || '').toLowerCase().trim();
    
    if (!query || query.length < 2) {
      return res.json({ success: true, suggestions: [] });
    }

    // Get recent orders and customers for quick suggestions
    const [orders, customers] = await Promise.all([
      storage.getOrders(),
      storage.getCustomers(),
    ]);

    const suggestions = [];

    // Add order suggestions
    orders
      .filter((order: any) => 
        order.orderNumber?.toLowerCase().includes(query) ||
        order.description?.toLowerCase().includes(query)
      )
      .slice(0, 3)
      .forEach((order: any) => {
        suggestions.push({
          type: 'order',
          text: `Order #${order.orderNumber}`,
          value: order.orderNumber,
        });
      });

    // Add customer suggestions
    customers
      .filter((customer: any) => {
        const fullName = `${customer.firstName} ${customer.lastName}`.toLowerCase();
        return fullName.includes(query) || customer.email?.toLowerCase().includes(query);
      })
      .slice(0, 3)
      .forEach((customer: any) => {
        suggestions.push({
          type: 'customer',
          text: `${customer.firstName} ${customer.lastName}`,
          value: `${customer.firstName} ${customer.lastName}`,
        });
      });

    res.json({
      success: true,
      suggestions: suggestions.slice(0, 5),
    });
  } catch (error) {
    console.error('Suggestions error:', error);
    res.status(500).json({
      success: false,
      suggestions: [],
    });
  }
});

export default router;