
import { Router } from "express";
import { z } from "zod";
import { isAuthenticated } from "../middleware/auth.js";
import { storage } from "../storage.js";
import { insertInventorySchema } from "../../shared/schema.js";

const router = Router();

// Get all inventory items
router.get("/api/inventory", isAuthenticated, async (req, res) => {
  try {
    const items = await storage.getInventory();
    res.json(items);
  } catch (error) {
    console.error("Error fetching inventory:", error);
    res.status(500).json({ message: "Failed to fetch inventory" });
  }
});

// Create new inventory item
router.post("/api/inventory", isAuthenticated, async (req, res) => {
  try {
    const validatedData = insertInventorySchema.parse(req.body);
    const item = await storage.createInventoryItem(validatedData);
    res.json(item);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid data", errors: error.errors });
    }
    console.error("Error creating inventory item:", error);
    res.status(500).json({ message: "Failed to create inventory item" });
  }
});

// Update inventory item
router.put("/api/inventory/:id", isAuthenticated, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const validatedData = insertInventorySchema.parse(req.body);
    const item = await storage.updateInventoryItem(id, validatedData);
    res.json(item);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid data", errors: error.errors });
    }
    console.error("Error updating inventory item:", error);
    res.status(500).json({ message: "Failed to update inventory item" });
  }
});

// Delete inventory item
router.delete("/api/inventory/:id", isAuthenticated, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await storage.deleteInventoryItem(id);
    res.json({ message: "Inventory item deleted successfully" });
  } catch (error) {
    console.error("Error deleting inventory item:", error);
    res.status(500).json({ message: "Failed to delete inventory item" });
  }
});

// Update stock quantity
router.patch("/api/inventory/:id/stock", isAuthenticated, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { quantity } = req.body;
    
    if (typeof quantity !== 'number' || quantity < 0) {
      return res.status(400).json({ message: "Invalid quantity" });
    }
    
    const item = await storage.updateInventoryStock(id, quantity);
    res.json(item);
  } catch (error) {
    console.error("Error updating stock:", error);
    res.status(500).json({ message: "Failed to update stock" });
  }
});

export default router;
