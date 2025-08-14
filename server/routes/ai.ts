
import { Router } from 'express';
import { aiService } from '../services/aiService.js';
import { isAuthenticated } from '../middleware/auth.js';

const router = Router();

// Send message to AI assistant
router.post('/message', isAuthenticated, async (req, res) => {
  try {
    const { message, context } = req.body;
    const response = await aiService.sendMessage(message, context);
    res.json(response);
  } catch (error) {
    console.error('AI message error:', error);
    res.status(500).json({ message: 'Failed to process AI request' });
  }
});

// Get frame recommendations
router.post('/frame-recommendations', isAuthenticated, async (req, res) => {
  try {
    const { artworkDescription, dimensions, customerPreferences, budget } = req.body;
    const recommendation = await aiService.analyzeFrameRecommendation(
      artworkDescription,
      dimensions,
      customerPreferences,
      budget
    );
    res.json(recommendation);
  } catch (error) {
    console.error('Frame recommendation error:', error);
    res.status(500).json({ message: 'Failed to generate frame recommendations' });
  }
});

// Analyze artwork image
router.post('/analyze-image', isAuthenticated, async (req, res) => {
  try {
    const { imageUrl, additionalContext } = req.body;
    const analysis = await aiService.analyzeArtworkImage(imageUrl, additionalContext);
    res.json(analysis);
  } catch (error) {
    console.error('Image analysis error:', error);
    res.status(500).json({ message: 'Failed to analyze artwork image' });
  }
});

// Generate business insights
router.post('/business-insights', isAuthenticated, async (req, res) => {
  try {
    const { businessData } = req.body;
    const insights = await aiService.generateBusinessInsights(businessData);
    res.json(insights);
  } catch (error) {
    console.error('Business insights error:', error);
    res.status(500).json({ message: 'Failed to generate business insights' });
  }
});

// Analyze customer sentiment
router.post('/customer-sentiment', isAuthenticated, async (req, res) => {
  try {
    const { customerFeedback } = req.body;
    const sentiment = await aiService.analyzeCustomerSentiment(customerFeedback);
    res.json(sentiment);
  } catch (error) {
    console.error('Sentiment analysis error:', error);
    res.status(500).json({ message: 'Failed to analyze customer sentiment' });
  }
});

// Enhanced market research
router.post('/market-research', isAuthenticated, async (req, res) => {
  try {
    const { topic } = req.body;
    const research = await aiService.enhancedMarketResearch(topic);
    res.json(research);
  } catch (error) {
    console.error('Market research error:', error);
    res.status(500).json({ message: 'Failed to conduct market research' });
  }
});

// Intelligent framing advice
router.post('/intelligent-framing-advice', isAuthenticated, async (req, res) => {
  try {
    const { artworkDescription, customerContext } = req.body;
    const advice = await aiService.intelligentFramingAdvice(artworkDescription, customerContext);
    res.json(advice);
  } catch (error) {
    console.error('Intelligent framing advice error:', error);
    res.status(500).json({ message: 'Failed to generate intelligent framing advice' });
  }
});

// Real-time competitor analysis
router.get('/competitor-analysis', isAuthenticated, async (req, res) => {
  try {
    const analysis = await aiService.realTimeCompetitorAnalysis();
    res.json(analysis);
  } catch (error) {
    console.error('Competitor analysis error:', error);
    res.status(500).json({ message: 'Failed to conduct competitor analysis' });
  }
});

export default router;
