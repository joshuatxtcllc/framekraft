import type { Express } from "express";
import { storage } from "../storage";
import { insertPriceStructureSchema } from "@shared/schema";
import { isAuthenticated } from "../middleware/auth";

export function registerPricingRoutes(app: Express) {
  // Get all price structure items
  app.get("/api/pricing/structure", isAuthenticated, async (req, res) => {
    try {
      const prices = await storage.getPriceStructure();
      res.json(prices);
    } catch (error) {
      console.error("Error fetching price structure:", error);
      res.status(500).json({ message: "Failed to fetch price structure" });
    }
  });

  // Create new price structure item
  app.post("/api/pricing/structure", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertPriceStructureSchema.parse(req.body);
      const price = await storage.createPriceStructure(validatedData);
      res.status(201).json(price);
    } catch (error) {
      console.error("Error creating price structure:", error);
      res.status(500).json({ message: "Failed to create price structure item" });
    }
  });

  // Update price structure item
  app.put("/api/pricing/structure/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertPriceStructureSchema.partial().parse(req.body);
      const price = await storage.updatePriceStructure(id, validatedData);
      res.json(price);
    } catch (error) {
      console.error("Error updating price structure:", error);
      res.status(500).json({ message: "Failed to update price structure item" });
    }
  });

  // Delete price structure item
  app.delete("/api/pricing/structure/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deletePriceStructure(id);
      res.json({ message: "Price structure item deleted successfully" });
    } catch (error) {
      console.error("Error deleting price structure:", error);
      res.status(500).json({ message: "Failed to delete price structure item" });
    }
  });
}