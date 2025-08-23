import type { Express, Request } from "express";
import * as storage from "../mongoStorage";
import { insertPriceStructureSchema } from "@shared/schema";

// Extend Express Request type to include user
interface AuthenticatedRequest extends Request {
  user?: any;
}

export function registerPricingRoutes(app: Express, isAuthenticated: any) {
  // Get all price structure items for the authenticated user
  app.get("/api/pricing/structure", isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user?._id?.toString() || req.user?.id;
      const prices = await storage.getPriceStructures(userId);
      res.json(prices);
    } catch (error) {
      console.error("Error fetching price structure:", error);
      res.status(500).json({ message: "Failed to fetch price structure" });
    }
  });

  // Create new price structure item for the authenticated user
  app.post("/api/pricing/structure", isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user?._id?.toString() || req.user?.id;
      const validatedData = insertPriceStructureSchema.parse(req.body);
      // Add userId to the data
      const priceData = { ...validatedData, userId };
      const price = await storage.createPriceStructure(priceData);
      res.status(201).json(price);
    } catch (error) {
      console.error("Error creating price structure:", error);
      res.status(500).json({ message: "Failed to create price structure item" });
    }
  });

  // Update price structure item for the authenticated user
  app.put("/api/pricing/structure/:id", isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user?._id?.toString() || req.user?.id;
      const id = req.params.id;
      const validatedData = insertPriceStructureSchema.partial().parse(req.body);
      
      // First check if the price structure belongs to this user
      const existingPrice = await storage.getPriceStructureById(id);
      if (!existingPrice || (existingPrice.userId && existingPrice.userId !== userId)) {
        return res.status(404).json({ message: "Price structure item not found" });
      }
      
      const price = await storage.updatePriceStructure(id, validatedData);
      res.json(price);
    } catch (error) {
      console.error("Error updating price structure:", error);
      res.status(500).json({ message: "Failed to update price structure item" });
    }
  });

  // Delete price structure item for the authenticated user
  app.delete("/api/pricing/structure/:id", isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user?._id?.toString() || req.user?.id;
      const id = req.params.id;
      
      // First check if the price structure belongs to this user
      const existingPrice = await storage.getPriceStructureById(id);
      if (!existingPrice || (existingPrice.userId && existingPrice.userId !== userId)) {
        return res.status(404).json({ message: "Price structure item not found" });
      }
      
      await storage.deletePriceStructure(id);
      res.json({ message: "Price structure item deleted successfully" });
    } catch (error) {
      console.error("Error deleting price structure:", error);
      res.status(500).json({ message: "Failed to delete price structure item" });
    }
  });
}