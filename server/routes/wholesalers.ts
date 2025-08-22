import type { Express } from "express";
import * as storage from "../mongoStorage";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import {
  parseAndValidateCSV,
  convertToProductData,
  generateCSVTemplate,
  generateExampleCSV,
} from "../utils/csvProductImport";

// Configure multer for file uploads
const uploadDir = "./server/uploads/catalogs";
const upload = multer({
  storage: multer.diskStorage({
    destination: async (req, file, cb) => {
      try {
        await fs.mkdir(uploadDir, { recursive: true });
        cb(null, uploadDir);
      } catch (error) {
        cb(error as Error, uploadDir);
      }
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, `catalog-${uniqueSuffix}${path.extname(file.originalname)}`);
    },
  }),
  fileFilter: (req, file, cb) => {
    const allowedTypes = [".pdf", ".xlsx", ".xls", ".csv"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only PDF, Excel, and CSV files are allowed."));
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
});

export function registerWholesalerRoutes(app: Express, isAuthenticated: any) {
  // Get all wholesalers
  app.get("/api/wholesalers", isAuthenticated, async (req, res) => {
    try {
      const wholesalers = await storage.getWholesalers();
      res.json(wholesalers);
    } catch (error) {
      console.error("Error fetching wholesalers:", error);
      res.status(500).json({ message: "Failed to fetch wholesalers" });
    }
  });

  // Get specific wholesaler by ID
  app.get("/api/wholesalers/:id", isAuthenticated, async (req, res) => {
    try {
      const wholesaler = await storage.getWholesalerById(req.params.id);
      if (!wholesaler) {
        return res.status(404).json({ message: "Wholesaler not found" });
      }
      res.json(wholesaler);
    } catch (error) {
      console.error("Error fetching wholesaler:", error);
      res.status(500).json({ message: "Failed to fetch wholesaler" });
    }
  });

  // Create new wholesaler
  app.post("/api/wholesalers", isAuthenticated, async (req, res) => {
    try {
      // Convert min order amount to number if provided
      const data = {
        ...req.body,
        minOrderAmount: req.body.minOrderAmount ? parseFloat(req.body.minOrderAmount) : undefined,
      };
      
      const wholesaler = await storage.createWholesaler(data);
      res.status(201).json(wholesaler);
    } catch (error) {
      console.error("Error creating wholesaler:", error);
      res.status(500).json({ message: "Failed to create wholesaler" });
    }
  });

  // Update wholesaler
  app.put("/api/wholesalers/:id", isAuthenticated, async (req, res) => {
    try {
      const data = {
        ...req.body,
        minOrderAmount: req.body.minOrderAmount ? parseFloat(req.body.minOrderAmount) : undefined,
      };
      
      const wholesaler = await storage.updateWholesaler(req.params.id, data);
      if (!wholesaler) {
        return res.status(404).json({ message: "Wholesaler not found" });
      }
      res.json(wholesaler);
    } catch (error) {
      console.error("Error updating wholesaler:", error);
      res.status(500).json({ message: "Failed to update wholesaler" });
    }
  });

  // Delete wholesaler
  app.delete("/api/wholesalers/:id", isAuthenticated, async (req, res) => {
    try {
      const deleted = await storage.deleteWholesaler(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Wholesaler not found" });
      }
      res.status(200).json({ message: "Wholesaler deleted successfully" });
    } catch (error) {
      console.error("Error deleting wholesaler:", error);
      res.status(500).json({ message: "Failed to delete wholesaler" });
    }
  });

  // Upload catalog file for wholesaler
  app.post("/api/wholesalers/:id/upload-catalog", isAuthenticated, upload.single("catalog"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const wholesaler = await storage.updateWholesaler(req.params.id, {
        catalogFileName: req.file.originalname,
        catalogFileUrl: `/uploads/catalogs/${req.file.filename}`,
        catalogUploadedAt: new Date(),
      });

      if (!wholesaler) {
        // Delete uploaded file if wholesaler not found
        await fs.unlink(req.file.path).catch(() => {});
        return res.status(404).json({ message: "Wholesaler not found" });
      }

      res.json({
        message: "Catalog uploaded successfully",
        fileName: req.file.originalname,
        fileUrl: `/uploads/catalogs/${req.file.filename}`,
      });
    } catch (error) {
      console.error("Error uploading catalog:", error);
      // Clean up uploaded file on error
      if (req.file) {
        await fs.unlink(req.file.path).catch(() => {});
      }
      res.status(500).json({ message: "Failed to upload catalog" });
    }
  });

  // Download catalog file
  app.get("/api/wholesalers/:id/download-catalog", isAuthenticated, async (req, res) => {
    try {
      const wholesaler = await storage.getWholesalerById(req.params.id);
      if (!wholesaler || !wholesaler.catalogFileUrl) {
        return res.status(404).json({ message: "Catalog not found" });
      }

      const filePath = path.join(process.cwd(), wholesaler.catalogFileUrl);
      
      // Check if file exists
      try {
        await fs.access(filePath);
      } catch {
        return res.status(404).json({ message: "Catalog file not found" });
      }

      res.download(filePath, wholesaler.catalogFileName || "catalog.pdf");
    } catch (error) {
      console.error("Error downloading catalog:", error);
      res.status(500).json({ message: "Failed to download catalog" });
    }
  });

  // Delete catalog file
  app.delete("/api/wholesalers/:id/catalog", isAuthenticated, async (req, res) => {
    try {
      const wholesaler = await storage.getWholesalerById(req.params.id);
      if (!wholesaler) {
        return res.status(404).json({ message: "Wholesaler not found" });
      }

      // Delete the physical file if it exists
      if (wholesaler.catalogFileUrl) {
        const filePath = path.join(process.cwd(), wholesaler.catalogFileUrl);
        await fs.unlink(filePath).catch(() => {}); // Ignore errors if file doesn't exist
      }

      // Update wholesaler record
      await storage.updateWholesaler(req.params.id, {
        catalogFileName: null,
        catalogFileUrl: null,
        catalogUploadedAt: null,
      });

      res.json({ message: "Catalog deleted successfully" });
    } catch (error) {
      console.error("Error deleting catalog:", error);
      res.status(500).json({ message: "Failed to delete catalog" });
    }
  });

  // Get products for a specific wholesaler
  app.get("/api/wholesalers/:id/products", isAuthenticated, async (req, res) => {
    try {
      const products = await storage.getWholesalerProductsByWholesaler(req.params.id);
      res.json(products);
    } catch (error) {
      console.error("Error fetching wholesaler products:", error);
      res.status(500).json({ message: "Failed to fetch wholesaler products" });
    }
  });

  // Create product for wholesaler
  app.post("/api/wholesalers/:id/products", isAuthenticated, async (req, res) => {
    try {
      const productData = {
        ...req.body,
        wholesalerId: req.params.id,
        wholesalePrice: parseFloat(req.body.wholesalePrice),
        suggestedRetail: req.body.suggestedRetail ? parseFloat(req.body.suggestedRetail) : undefined,
        minQuantity: req.body.minQuantity ? parseInt(req.body.minQuantity) : 1,
        packSize: req.body.packSize ? parseInt(req.body.packSize) : 1,
      };

      const product = await storage.createWholesalerProduct(productData);
      res.status(201).json(product);
    } catch (error: any) {
      console.error("Error creating product:", error);
      if (error.code === 11000) {
        res.status(400).json({ message: "Product with this code already exists for this wholesaler" });
      } else {
        res.status(500).json({ message: "Failed to create product" });
      }
    }
  });

  // Update product
  app.put("/api/wholesalers/products/:productId", isAuthenticated, async (req, res) => {
    try {
      const productData = {
        ...req.body,
        wholesalePrice: req.body.wholesalePrice ? parseFloat(req.body.wholesalePrice) : undefined,
        suggestedRetail: req.body.suggestedRetail ? parseFloat(req.body.suggestedRetail) : undefined,
        minQuantity: req.body.minQuantity ? parseInt(req.body.minQuantity) : undefined,
        packSize: req.body.packSize ? parseInt(req.body.packSize) : undefined,
      };

      const product = await storage.updateWholesalerProduct(req.params.productId, productData);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      console.error("Error updating product:", error);
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  // Delete product
  app.delete("/api/wholesalers/products/:productId", isAuthenticated, async (req, res) => {
    try {
      const deleted = await storage.deleteWholesalerProduct(req.params.productId);
      if (!deleted) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json({ message: "Product deleted successfully" });
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  // Search all wholesaler products
  app.get("/api/wholesalers/products/search", isAuthenticated, async (req, res) => {
    try {
      const { q } = req.query;
      const products = await storage.searchWholesalerProducts(q as string);
      res.json(products);
    } catch (error) {
      console.error("Error searching wholesaler products:", error);
      res.status(500).json({ message: "Failed to search products" });
    }
  });

  // Get all products across all wholesalers
  app.get("/api/wholesaler-products", isAuthenticated, async (req, res) => {
    try {
      const products = await storage.getWholesalerProducts();
      res.json(products);
    } catch (error) {
      console.error("Error fetching all products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  // Download CSV template
  app.get("/api/wholesalers/csv-template", isAuthenticated, async (req, res) => {
    try {
      const template = await generateCSVTemplate();
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=product_import_template.csv");
      res.send(template);
    } catch (error) {
      console.error("Error generating CSV template:", error);
      res.status(500).json({ message: "Failed to generate template" });
    }
  });

  // Download CSV example
  app.get("/api/wholesalers/csv-example", isAuthenticated, async (req, res) => {
    try {
      const example = await generateExampleCSV();
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=product_import_example.csv");
      res.send(example);
    } catch (error) {
      console.error("Error generating CSV example:", error);
      res.status(500).json({ message: "Failed to generate example" });
    }
  });

  // Configure multer for CSV uploads
  const csvUpload = multer({
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
      if (file.mimetype === "text/csv" || path.extname(file.originalname).toLowerCase() === ".csv") {
        cb(null, true);
      } else {
        cb(new Error("Only CSV files are allowed"));
      }
    },
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit for CSV
    },
  });

  // Validate CSV file
  app.post("/api/wholesalers/:id/validate-csv", isAuthenticated, csvUpload.single("csv"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const csvContent = req.file.buffer.toString("utf-8");
      const validation = await parseAndValidateCSV(csvContent);

      // Get existing products to check for duplicates
      const existingProducts = await storage.getWholesalerProductsByWholesaler(req.params.id);
      const existingCodes = new Set(existingProducts.map(p => p.productCode));

      // Create preview with duplicate detection
      const preview = validation.valid.slice(0, 50).map(row => ({
        productCode: row.productCode,
        productName: row.productName,
        category: row.category,
        wholesalePrice: parseFloat(row.wholesalePrice),
        status: existingCodes.has(row.productCode) ? 'duplicate' as const : 'valid' as const,
      }));

      // Add invalid rows to preview
      validation.invalid.slice(0, 10).forEach(({ row }) => {
        preview.push({
          productCode: row.productCode || 'N/A',
          productName: row.productName || 'N/A',
          category: row.category || 'N/A',
          wholesalePrice: parseFloat(row.wholesalePrice) || 0,
          status: 'invalid' as const,
        });
      });

      res.json({
        valid: validation.valid.length,
        invalid: validation.invalid.length,
        warnings: validation.warnings,
        errors: validation.invalid.map(({ row, errors }, idx) => ({
          row: idx + 2, // Add 2 for header row and 0-based index
          errors,
        })),
        preview,
      });
    } catch (error: any) {
      console.error("Error validating CSV:", error);
      res.status(400).json({ message: error.message || "Failed to validate CSV" });
    }
  });

  // Import CSV file
  app.post("/api/wholesalers/:id/import-csv", isAuthenticated, csvUpload.single("csv"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const wholesalerId = req.params.id;
      const updateExisting = req.body.updateExisting === "true";
      const skipDuplicates = req.body.skipDuplicates === "true";

      // Verify wholesaler exists
      const wholesaler = await storage.getWholesalerById(wholesalerId);
      if (!wholesaler) {
        return res.status(404).json({ message: "Wholesaler not found" });
      }

      // Parse and validate CSV
      const csvContent = req.file.buffer.toString("utf-8");
      const validation = await parseAndValidateCSV(csvContent);

      if (validation.valid.length === 0) {
        return res.status(400).json({ 
          message: "No valid products found in CSV",
          errors: validation.invalid,
        });
      }

      // Get existing products
      const existingProducts = await storage.getWholesalerProductsByWholesaler(wholesalerId);
      const existingMap = new Map(existingProducts.map(p => [p.productCode, p]));

      // Convert CSV rows to product data
      const productData = convertToProductData(validation.valid, wholesalerId);
      
      let imported = 0;
      let updated = 0;
      let skipped = 0;
      const errors: string[] = [];

      // Process each product
      for (const product of productData) {
        const existing = existingMap.get(product.productCode!);
        
        if (existing) {
          if (updateExisting) {
            try {
              await storage.updateWholesalerProduct(existing._id.toString(), product);
              updated++;
            } catch (error: any) {
              errors.push(`Failed to update ${product.productCode}: ${error.message}`);
            }
          } else if (skipDuplicates) {
            skipped++;
          } else {
            errors.push(`Duplicate product code: ${product.productCode}`);
          }
        } else {
          try {
            await storage.createWholesalerProduct(product);
            imported++;
          } catch (error: any) {
            errors.push(`Failed to import ${product.productCode}: ${error.message}`);
          }
        }
      }

      res.json({
        imported,
        updated,
        skipped,
        total: productData.length,
        errors: errors.length > 0 ? errors : undefined,
      });
    } catch (error: any) {
      console.error("Error importing CSV:", error);
      res.status(500).json({ message: error.message || "Failed to import CSV" });
    }
  });
}