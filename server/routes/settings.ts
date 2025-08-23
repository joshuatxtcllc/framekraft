import { Router } from 'express';
import { isAuthenticated } from '../replitAuth';
import * as storage from '../mongoStorage';

const router = Router();

// Business Settings Routes
router.get('/business', isAuthenticated, async (req, res) => {
  try {
    const settings = await storage.getBusinessSettings();
    res.json(settings);
  } catch (error) {
    console.error('Error fetching business settings:', error);
    res.status(500).json({ message: 'Failed to fetch business settings' });
  }
});

router.put('/business', isAuthenticated, async (req, res) => {
  try {
    const settings = await storage.updateBusinessSettings(req.body);
    res.json(settings);
  } catch (error) {
    console.error('Error updating business settings:', error);
    res.status(500).json({ message: 'Failed to update business settings' });
  }
});

// Notification Settings Routes
router.get('/notifications', isAuthenticated, async (req, res) => {
  try {
    const settings = await storage.getNotificationSettings();
    res.json(settings);
  } catch (error) {
    console.error('Error fetching notification settings:', error);
    res.status(500).json({ message: 'Failed to fetch notification settings' });
  }
});

router.put('/notifications', isAuthenticated, async (req, res) => {
  try {
    const settings = await storage.updateNotificationSettings(req.body);
    res.json(settings);
  } catch (error) {
    console.error('Error updating notification settings:', error);
    res.status(500).json({ message: 'Failed to update notification settings' });
  }
});

// Display Settings Routes
router.get('/display', isAuthenticated, async (req, res) => {
  try {
    const settings = await storage.getDisplaySettings();
    res.json(settings);
  } catch (error) {
    console.error('Error fetching display settings:', error);
    res.status(500).json({ message: 'Failed to fetch display settings' });
  }
});

router.put('/display', isAuthenticated, async (req, res) => {
  try {
    const settings = await storage.updateDisplaySettings(req.body);
    res.json(settings);
  } catch (error) {
    console.error('Error updating display settings:', error);
    res.status(500).json({ message: 'Failed to update display settings' });
  }
});

export default router;