import { Router } from 'express'
import { z } from 'zod'
import * as storage from '../mongoStorage'
import { validateQuery } from '../middleware/validation'

const router = Router()

// Public order tracking schema
const orderTrackingSchema = z.object({
  orderNumber: z.string().min(1, 'Order number is required'),
  lastName: z.string().min(1, 'Last name is required').optional()
})

// Public order tracking endpoint (no authentication required)
router.get('/track-order', validateQuery(orderTrackingSchema), async (req, res) => {
  try {
    const { orderNumber, lastName } = req.query as { orderNumber: string; lastName?: string }

    // Find order by order number
    const orders = await storage.getOrders()
    const order = orders.find(o => o.orderNumber === orderNumber)

    if (!order) {
      return res.status(404).json({ 
        message: 'Order not found',
        error: 'ORDER_NOT_FOUND'
      })
    }

    // Get customer info for verification
    const customers = await storage.getCustomers()
    const customer = customers.find(c => c.id === order.customerId)

    if (!customer) {
      return res.status(404).json({ 
        message: 'Customer information not found',
        error: 'CUSTOMER_NOT_FOUND'
      })
    }

    // Optional last name verification for security
    if (lastName && customer.lastName.toLowerCase() !== lastName.toLowerCase()) {
      return res.status(403).json({ 
        message: 'Invalid order information',
        error: 'VERIFICATION_FAILED'
      })
    }

    // Map order status to customer-friendly stages
    const getOrderStages = (currentStatus: string) => {
      const stages = [
        { 
          name: 'Order Received', 
          status: 'completed',
          description: 'Your order has been received and is being processed',
          icon: '📋'
        },
        { 
          name: 'Measuring & Planning', 
          status: currentStatus === 'pending' ? 'current' : 'completed',
          description: 'Taking precise measurements and planning your frame',
          icon: '📏'
        },
        { 
          name: 'Materials Ordered', 
          status: ['pending', 'measuring'].includes(currentStatus) ? 'pending' : 
                  currentStatus === 'designing' ? 'current' : 'completed',
          description: 'Ordering your custom frame materials and components',
          icon: '📦'
        },
        { 
          name: 'Production', 
          status: ['pending', 'measuring', 'designing'].includes(currentStatus) ? 'pending' : 
                  ['cutting', 'assembly'].includes(currentStatus) ? 'current' : 'completed',
          description: 'Cutting, assembly, and finishing your custom frame',
          icon: '🔨'
        },
        { 
          name: 'Quality Check', 
          status: ['pending', 'measuring', 'designing', 'cutting', 'assembly'].includes(currentStatus) ? 'pending' : 
                  currentStatus === 'ready' ? 'current' : 'completed',
          description: 'Final inspection and quality assurance',
          icon: '✅'
        },
        { 
          name: 'Ready for Pickup', 
          status: currentStatus === 'completed' ? 'completed' : 
                  currentStatus === 'ready' ? 'current' : 'pending',
          description: 'Your frame is ready! We\'ll contact you for pickup',
          icon: '🎉'
        }
      ]
      return stages
    }

    // Public order information (filtered for customer view)
    const publicOrderInfo = {
      orderNumber: order.orderNumber,
      status: order.status,
      description: order.description,
      frameStyle: order.frameStyle,
      matColor: order.matColor,
      glassType: order.glassType,
      totalPrice: order.totalPrice,
      estimatedCompletion: order.estimatedCompletion,
      createdAt: order.createdAt,
      priority: order.priority,
      customer: {
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        phone: customer.phone,
      },
      stages: getOrderStages(order.status),
      businessInfo: {
        name: "Jay's Frames",
        address: "218 W 27th St, Houston, TX 77008",
        phone: "(832) 893-3794",
        email: "info@jaysframes.com",
        hours: "Mon-Fri: 9AM-6PM, Sat: 10AM-4PM, Sun: Closed"
      }
    }

    res.json(publicOrderInfo)
  } catch (error) {
    console.error('Order tracking error:', error)
    res.status(500).json({ 
      message: 'Unable to retrieve order information',
      error: 'INTERNAL_ERROR'
    })
  }
})

export { router as publicRoutes }