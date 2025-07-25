
import { Router } from 'express';
import { isAuthenticated } from '../middleware/auth.js';

const router = Router();

// In-memory storage for demo purposes
// In production, these would be stored in the database
let businessSettings = {
  companyName: "Jay's Frames",
  address: "123 Main St",
  city: "Houston",
  state: "TX",
  zipCode: "77008",
  phone: "(713) 555-0123",
  email: "info@jaysframes.com",
  website: "https://jaysframes.com",
  taxRate: 8.25,
  defaultMarkup: 3.5,
  laborRate: 38,
  overheadCost: 54,
};

let notificationSettings = {
  emailNotifications: true,
  orderUpdates: true,
  paymentReminders: true,
  lowInventory: true,
  dailyReports: false,
};

let displaySettings = {
  theme: 'light',
  compactMode: false,
  showPriceBreakdown: true,
  defaultCurrency: 'USD',
  dateFormat: 'MM/DD/YYYY',
  timeFormat: '12h',
};

// Business Settings Routes
router.get('/business', isAuthenticated, (req, res) => {
  res.json(businessSettings);
});

router.put('/business', isAuthenticated, (req, res) => {
  businessSettings = { ...businessSettings, ...req.body };
  res.json(businessSettings);
});

// Notification Settings Routes
router.get('/notifications', isAuthenticated, (req, res) => {
  res.json(notificationSettings);
});

router.put('/notifications', isAuthenticated, (req, res) => {
  notificationSettings = { ...notificationSettings, ...req.body };
  res.json(notificationSettings);
});

// Display Settings Routes
router.get('/display', isAuthenticated, (req, res) => {
  res.json(displaySettings);
});

router.put('/display', isAuthenticated, (req, res) => {
  displaySettings = { ...displaySettings, ...req.body };
  res.json(displaySettings);
});

export default router;
