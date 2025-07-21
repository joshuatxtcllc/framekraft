import type { Express } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { storage } from "../storage";
import { isAuthenticated } from "../middleware/auth";

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), 'uploads', 'catalogs');

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage_config = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Create unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage_config,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept PDF, Excel, and CSV files
    const allowedTypes = [
      'application/pdf',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
      'application/csv'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, Excel, and CSV files are allowed.'));
    }
  }
});

export function registerFileUploadRoutes(app: Express) {
  // Upload wholesaler catalog
  app.post('/api/wholesalers/:id/upload-catalog', 
    isAuthenticated, 
    upload.single('catalog'), 
    async (req, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({ message: 'No file uploaded' });
        }

        const wholesalerId = parseInt(req.params.id);
        const fileName = req.file.filename;
        const originalName = req.file.originalname;
        const fileUrl = `/uploads/catalogs/${fileName}`;

        // Update wholesaler with catalog info
        await storage.updateWholesaler(wholesalerId, {
          catalogFileName: originalName,
          catalogFileUrl: fileUrl,
          catalogUploadedAt: new Date(),
        });

        res.json({
          message: 'Catalog uploaded successfully',
          fileName: originalName,
          fileUrl,
          uploadedAt: new Date(),
        });
      } catch (error: any) {
        console.error('Error uploading catalog:', error);
        res.status(500).json({ message: error.message || 'Failed to upload catalog' });
      }
    }
  );

  // Download wholesaler catalog
  app.get('/api/wholesalers/:id/download-catalog', isAuthenticated, async (req, res) => {
    try {
      const wholesalerId = parseInt(req.params.id);
      const wholesaler = await storage.getWholesaler(wholesalerId);
      
      if (!wholesaler || !wholesaler.catalogFileUrl) {
        return res.status(404).json({ message: 'Catalog not found' });
      }

      const filePath = path.join(process.cwd(), wholesaler.catalogFileUrl);
      
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: 'Catalog file not found on server' });
      }

      res.download(filePath, wholesaler.catalogFileName || 'catalog.pdf');
    } catch (error: any) {
      console.error('Error downloading catalog:', error);
      res.status(500).json({ message: 'Failed to download catalog' });
    }
  });

  // Serve uploaded files statically
  app.get('/uploads/catalogs/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(uploadDir, filename);
    
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.status(404).json({ message: 'File not found' });
    }
  });

  // Delete wholesaler catalog
  app.delete('/api/wholesalers/:id/catalog', isAuthenticated, async (req, res) => {
    try {
      const wholesalerId = parseInt(req.params.id);
      const wholesaler = await storage.getWholesaler(wholesalerId);
      
      if (!wholesaler || !wholesaler.catalogFileUrl) {
        return res.status(404).json({ message: 'Catalog not found' });
      }

      // Delete physical file
      const filePath = path.join(process.cwd(), wholesaler.catalogFileUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      // Update wholesaler record
      await storage.updateWholesaler(wholesalerId, {
        catalogFileName: null,
        catalogFileUrl: null,
        catalogUploadedAt: null,
      });

      res.json({ message: 'Catalog deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting catalog:', error);
      res.status(500).json({ message: 'Failed to delete catalog' });
    }
  });
}