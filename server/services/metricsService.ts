
import { storage } from '../storage';

class MetricsService {
  private metricsCache: any = null;
  private lastCalculated: Date | null = null;
  private cacheValidityMs = 5 * 60 * 1000; // 5 minutes

  async getDashboardMetrics() {
    // Check if cache is still valid
    if (this.metricsCache && this.lastCalculated && 
        (Date.now() - this.lastCalculated.getTime()) < this.cacheValidityMs) {
      return this.metricsCache;
    }

    // Calculate fresh metrics
    const metrics = await this.calculateMetrics();
    
    // Store in database for persistence
    await this.storeMetrics(metrics);
    
    // Update cache
    this.metricsCache = metrics;
    this.lastCalculated = new Date();
    
    return metrics;
  }

  private async calculateMetrics() {
    try {
      const orders = await storage.getOrders();
      const customers = await storage.getCustomers();

      const currentMonth = new Date();
      currentMonth.setDate(1);

      const monthlyOrders = orders.filter(order => 
        new Date(order.createdAt!) >= currentMonth
      );

      const monthlyRevenue = monthlyOrders.reduce(
        (sum, order) => sum + parseFloat(order.totalAmount), 0
      );

      const activeOrders = orders.filter(order => 
        !['completed', 'cancelled'].includes(order.status)
      ).length;

      const completedOrders = orders.filter(order => order.status === 'completed').length;
      const completionRate = orders.length > 0 ? (completedOrders / orders.length) * 100 : 0;

      const newCustomersThisMonth = customers.filter(customer => 
        new Date(customer.createdAt!) >= currentMonth
      ).length;

      const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.totalAmount), 0);
      const averageOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;

      return {
        monthlyRevenue: Number(monthlyRevenue.toFixed(2)),
        activeOrders,
        totalCustomers: customers.length,
        completionRate: Number(completionRate.toFixed(1)),
        newCustomersThisMonth,
        totalRevenue: Number(totalRevenue.toFixed(2)),
        averageOrderValue: Number(averageOrderValue.toFixed(2)),
        totalOrders: orders.length,
        recentOrders: orders.slice(0, 5),
        calculatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error calculating metrics:', error);
      throw error;
    }
  }

  private async storeMetrics(metrics: any) {
    try {
      // Store key metrics in database for persistence
      const metricsToStore = [
        { type: 'monthly_revenue', value: metrics.monthlyRevenue },
        { type: 'active_orders', value: metrics.activeOrders },
        { type: 'total_customers', value: metrics.totalCustomers },
        { type: 'completion_rate', value: metrics.completionRate },
        { type: 'average_order_value', value: metrics.averageOrderValue }
      ];

      for (const metric of metricsToStore) {
        await storage.storeBusinessMetric(metric.type, metric.value);
      }
    } catch (error) {
      console.error('Error storing metrics:', error);
      // Don't throw here - metrics calculation should succeed even if storage fails
    }
  }

  // Force refresh of metrics cache
  async refreshMetrics() {
    this.metricsCache = null;
    this.lastCalculated = null;
    return this.getDashboardMetrics();
  }
}

export const metricsService = new MetricsService();
