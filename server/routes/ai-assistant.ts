import { Router } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { AIChatSession } from '../models';
import * as storage from '../mongoStorage';

const router = Router();

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

// SYSTEM PROMPT - Strict guidelines for AI behavior
const SYSTEM_PROMPT = `You are FrameCraft AI Assistant, a specialized business assistant for a custom framing shop management system.

STRICT RULES AND GUIDELINES:
1. You MUST focus ONLY on business-related topics for custom framing shops
2. You MUST NOT provide any harmful, illegal, or unethical advice
3. You MUST protect user privacy and never share sensitive information
4. You MUST be professional, helpful, and accurate in all responses
5. You MUST refuse requests unrelated to framing business operations

YOUR CAPABILITIES:
- Business Analysis: Analyze sales, revenue, expenses, and profitability
- Customer Service: Provide framing recommendations, pricing guidance, and service tips
- Production Management: Optimize workflows, manage schedules, track orders
- Inventory Management: Monitor stock levels, suggest reorders, track suppliers
- Marketing Support: Generate content ideas, promotional strategies, customer engagement
- Quality Control: Suggest quality standards, inspection processes
- Financial Planning: Budget analysis, expense tracking, pricing strategies
- Design Consultation: Frame styles, mat colors, glass options, preservation techniques

CONTEXT AWARENESS:
- You have access to the user's business data including orders, customers, and inventory
- You should provide personalized recommendations based on their specific business
- You should reference actual data when available and relevant
- You should maintain conversation context across messages

RESPONSE GUIDELINES:
- Be concise but thorough
- Use bullet points for clarity when listing multiple items
- Provide actionable insights and specific recommendations
- Include relevant metrics or data when available
- Suggest next steps or follow-up actions when appropriate`;

// Validation schemas
const sendMessageSchema = z.object({
  message: z.string().min(1).max(4000),
  sessionId: z.string().optional(),
  context: z.object({
    capability: z.string().optional(),
    orderContext: z.string().optional(),
    customerContext: z.string().optional(),
  }).optional(),
});

const createSessionSchema = z.object({
  sessionName: z.string().min(1).max(100),
  context: z.string().default('general'),
});

// Helper function to get user ID from request
async function getUserId(req: any): Promise<string | null> {
  // Check for demo user
  if (req.cookies?.accessToken === 'demo-token' || req.cookies?.sessionId === 'demo-session') {
    return 'demo-user-id';
  }

  // Get from session or token (implement based on your auth system)
  const sessionId = req.cookies?.sessionId;
  if (sessionId) {
    const session = await storage.Session.findOne({ sid: sessionId });
    if (session && session.expire > new Date()) {
      return session.sess.userId;
    }
  }

  return null;
}

// Get or create chat session
router.get('/sessions', async (req, res) => {
  try {
    const userId = await getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const sessions = await AIChatSession.find({ 
      userId,
      isActive: true 
    })
    .sort({ lastActivity: -1 })
    .limit(10)
    .select('sessionName context lastActivity totalTokens createdAt');

    res.json({ sessions });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ error: 'Failed to fetch chat sessions' });
  }
});

// Get specific session with messages
router.get('/sessions/:sessionId', async (req, res) => {
  try {
    const userId = await getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const session = await AIChatSession.findOne({
      _id: req.params.sessionId,
      userId,
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({ session });
  } catch (error) {
    console.error('Error fetching session:', error);
    res.status(500).json({ error: 'Failed to fetch session' });
  }
});

// Create new chat session
router.post('/sessions', async (req, res) => {
  try {
    const userId = await getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const data = createSessionSchema.parse(req.body);

    const session = new AIChatSession({
      userId,
      sessionName: data.sessionName,
      context: data.context,
      messages: [{
        role: 'system',
        content: SYSTEM_PROMPT,
        timestamp: new Date(),
      }],
      totalTokens: 0,
      lastActivity: new Date(),
      isActive: true,
    });

    await session.save();

    res.json({ 
      sessionId: session._id,
      session: {
        id: session._id,
        sessionName: session.sessionName,
        context: session.context,
        lastActivity: session.lastActivity,
      }
    });
  } catch (error: any) {
    console.error('Error creating session:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to create session' });
  }
});

// Send message to AI
router.post('/message', async (req, res) => {
  try {
    const userId = await getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const data = sendMessageSchema.parse(req.body);

    // Get or create session
    let session;
    if (data.sessionId) {
      session = await AIChatSession.findOne({
        _id: data.sessionId,
        userId,
        isActive: true,
      });
    }

    if (!session) {
      // Create new session if not found
      const sessionName = `Chat ${new Date().toLocaleDateString()}`;
      session = new AIChatSession({
        userId,
        sessionName,
        context: data.context?.capability || 'general',
        messages: [{
          role: 'system',
          content: SYSTEM_PROMPT,
          timestamp: new Date(),
        }],
        totalTokens: 0,
        lastActivity: new Date(),
        isActive: true,
      });
    }

    // Add user message to session
    session.messages.push({
      role: 'user',
      content: data.message,
      timestamp: new Date(),
    });

    // Prepare context for AI
    let contextualInfo = '';
    
    // Add business metrics if available
    try {
      const metrics = await storage.getDashboardMetrics();
      contextualInfo += `\nCurrent Business Metrics:
- Total Customers: ${metrics.totalCustomers}
- Active Orders: ${metrics.activeOrders}
- Today's Revenue: $${metrics.todayRevenue.toFixed(2)}
- Month's Revenue: $${metrics.monthRevenue.toFixed(2)}`;
    } catch (e) {
      console.log('Could not fetch metrics');
    }

    // Add order context if provided
    if (data.context?.orderContext) {
      try {
        const order = await storage.getOrder(data.context.orderContext);
        if (order) {
          contextualInfo += `\nOrder Context: Order #${order.orderNumber} - ${order.description}, Status: ${order.status}`;
        }
      } catch (e) {
        console.log('Could not fetch order context');
      }
    }

    // Add customer context if provided
    if (data.context?.customerContext) {
      try {
        const customer = await storage.getCustomer(data.context.customerContext);
        if (customer) {
          contextualInfo += `\nCustomer Context: ${customer.firstName} ${customer.lastName}, Total Spent: $${customer.totalSpent}`;
        }
      } catch (e) {
        console.log('Could not fetch customer context');
      }
    }

    // Prepare messages for Claude API
    const claudeMessages = session.messages
      .filter(msg => msg.role !== 'system')
      .slice(-10) // Last 10 messages for context
      .map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      }));

    // Add contextual information to the latest user message
    if (contextualInfo && claudeMessages.length > 0) {
      claudeMessages[claudeMessages.length - 1].content += contextualInfo;
    }

    const startTime = Date.now();

    // Call Claude API
    const completion = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      temperature: 0.7,
      system: SYSTEM_PROMPT,
      messages: claudeMessages,
    });

    const processingTime = Date.now() - startTime;

    // Extract the response
    const aiResponse = completion.content[0].type === 'text' 
      ? completion.content[0].text 
      : 'I apologize, but I was unable to generate a response.';

    // Add AI response to session
    session.messages.push({
      role: 'assistant',
      content: aiResponse,
      timestamp: new Date(),
      metadata: {
        model: 'claude-3-5-sonnet-20241022',
        tokens: completion.usage?.output_tokens,
        processingTime,
      },
    });

    // Update session metadata
    session.totalTokens += (completion.usage?.input_tokens || 0) + (completion.usage?.output_tokens || 0);
    session.lastActivity = new Date();

    // Save session
    await session.save();

    // Send response
    res.json({
      content: aiResponse,
      sessionId: session._id,
      metadata: {
        model: 'claude-3-5-sonnet-20241022',
        tokens: completion.usage?.output_tokens,
        processingTime,
        totalTokens: session.totalTokens,
      },
    });

  } catch (error: any) {
    console.error('Error processing AI message:', error);
    
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    
    if (error.status === 401) {
      return res.status(500).json({ 
        error: 'AI service configuration error. Please check your API key.' 
      });
    }

    if (error.status === 429) {
      return res.status(429).json({ 
        error: 'Rate limit exceeded. Please try again later.' 
      });
    }

    res.status(500).json({ 
      error: 'Failed to process message. Please try again.' 
    });
  }
});

// Delete a chat session
router.delete('/sessions/:sessionId', async (req, res) => {
  try {
    const userId = await getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const result = await AIChatSession.findOneAndUpdate(
      {
        _id: req.params.sessionId,
        userId,
      },
      {
        isActive: false,
      }
    );

    if (!result) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting session:', error);
    res.status(500).json({ error: 'Failed to delete session' });
  }
});

// Generate business insights for dashboard
router.post('/business-insights', async (req, res) => {
  try {
    const userId = await getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { businessData } = req.body;

    // Prepare context for insights
    let contextInfo = `Analyze this business data and provide actionable insights:
    - Monthly Revenue: $${businessData?.monthlyRevenue || 0}
    - Customer Count: ${businessData?.customerCount || 0}
    - Average Order Value: $${businessData?.averageOrderValue || 0}
    - Recent Orders: ${businessData?.recentOrders?.length || 0} orders`;

    if (businessData?.recentOrders?.length > 0) {
      const orderSummary = businessData.recentOrders.slice(0, 5).map((order: any) => 
        `Order #${order.orderNumber}: ${order.status}, $${order.totalAmount}`
      ).join('\n');
      contextInfo += `\n\nRecent Orders:\n${orderSummary}`;
    }

    const prompt = `${contextInfo}

Please provide 3-5 specific, actionable business insights in JSON format. Each insight should have:
- type: one of 'revenue_opportunity', 'efficiency_improvement', 'customer_retention', 'inventory_alert'
- title: A clear, concise title (max 50 chars)
- description: Detailed explanation (max 200 chars)
- action_items: Array of 2-3 specific actions to take
- impact_score: Number from 1-10 indicating potential impact
- confidence: Number from 0-1 indicating confidence in the insight

Return ONLY a JSON array of insights, no other text.`;

    // Call Claude API
    const completion = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1500,
      temperature: 0.7,
      system: `You are a business analyst AI for a custom framing shop. Provide actionable, specific insights based on the data provided. Focus on practical improvements that can increase revenue, efficiency, or customer satisfaction. Return only valid JSON.`,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    // Parse the response
    let insights = [];
    try {
      const responseText = completion.content[0].type === 'text' 
        ? completion.content[0].text 
        : '[]';
      
      // Clean the response and parse JSON
      const cleanedResponse = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      insights = JSON.parse(cleanedResponse);
      
      // Validate insights structure
      if (!Array.isArray(insights)) {
        insights = [];
      }
    } catch (parseError) {
      console.error('Error parsing AI insights:', parseError);
      // Provide default insights if parsing fails
      insights = [
        {
          type: 'revenue_opportunity',
          title: 'Optimize Pricing Strategy',
          description: 'Review pricing for popular frame styles to maximize revenue without losing customers.',
          action_items: [
            'Analyze competitor pricing',
            'Test premium pricing on luxury frames',
            'Offer bundle discounts for multiple items'
          ],
          impact_score: 7,
          confidence: 0.75
        },
        {
          type: 'efficiency_improvement',
          title: 'Streamline Order Processing',
          description: 'Reduce order processing time by optimizing workflow and inventory management.',
          action_items: [
            'Implement batch processing for similar orders',
            'Update inventory tracking system',
            'Train staff on efficient techniques'
          ],
          impact_score: 6,
          confidence: 0.8
        }
      ];
    }

    res.json(insights);

  } catch (error: any) {
    console.error('Error generating business insights:', error);
    
    // Return default insights on error
    res.json([
      {
        type: 'revenue_opportunity',
        title: 'Focus on Customer Retention',
        description: 'Implement a loyalty program to increase repeat business from existing customers.',
        action_items: [
          'Create a points-based reward system',
          'Send personalized follow-up emails',
          'Offer exclusive discounts to repeat customers'
        ],
        impact_score: 8,
        confidence: 0.85
      },
      {
        type: 'efficiency_improvement',
        title: 'Optimize Inventory Management',
        description: 'Review stock levels and reorder points to reduce carrying costs.',
        action_items: [
          'Analyze slow-moving inventory',
          'Negotiate better terms with suppliers',
          'Implement just-in-time ordering'
        ],
        impact_score: 6,
        confidence: 0.7
      },
      {
        type: 'customer_retention',
        title: 'Enhance Customer Experience',
        description: 'Improve customer satisfaction through better communication and service.',
        action_items: [
          'Send order status updates',
          'Create a customer feedback system',
          'Offer design consultations'
        ],
        impact_score: 7,
        confidence: 0.8
      }
    ]);
  }
});

// Get AI usage statistics
router.get('/stats', async (req, res) => {
  try {
    const userId = await getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalSessions, todaySessions, totalTokens] = await Promise.all([
      AIChatSession.countDocuments({ userId, isActive: true }),
      AIChatSession.countDocuments({ 
        userId, 
        isActive: true,
        createdAt: { $gte: today }
      }),
      AIChatSession.aggregate([
        { $match: { userId, isActive: true } },
        { $group: { _id: null, total: { $sum: '$totalTokens' } } }
      ]),
    ]);

    res.json({
      totalSessions,
      todaySessions,
      totalTokens: totalTokens[0]?.total || 0,
      tokensRemaining: 100000 - (totalTokens[0]?.total || 0), // Example limit
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

export default router;