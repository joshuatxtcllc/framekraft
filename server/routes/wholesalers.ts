import type { Express } from "express";
import { storage } from "../storage";
import { insertWholesalerSchema } from "@shared/schema";
import { isAuthenticated } from "../middleware/auth";

export function registerWholesalerRoutes(app: Express) {
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

  // Create new wholesaler
  app.post("/api/wholesalers", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertWholesalerSchema.parse(req.body);
      const wholesaler = await storage.createWholesaler(validatedData);
      res.status(201).json(wholesaler);
    } catch (error) {
      console.error("Error creating wholesaler:", error);
      res.status(500).json({ message: "Failed to create wholesaler" });
    }
  });

  // Get products for a specific wholesaler
  app.get("/api/wholesalers/:id/products", isAuthenticated, async (req, res) => {
    try {
      const wholesalerId = parseInt(req.params.id);
      const products = await storage.getWholesalerProducts(wholesalerId);
      res.json(products);
    } catch (error) {
      console.error("Error fetching wholesaler products:", error);
      res.status(500).json({ message: "Failed to fetch wholesaler products" });
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
}