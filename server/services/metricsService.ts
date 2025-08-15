
import { storage } from '../storage';

class MetricsService {
  private metricsCache: any = null;
  private lastCalculated: Date | null = null;
  private cacheValidityMs = 5 * 60 * 1000; // 5 minutes

  async getDashboardMetrics() {
    try {
      // Check if cache is still valid
      if (this.metricsCache && this.lastCalculated && 
          (Date.now() - this.lastCalculated.getTime()) < this.cacheValidityMs) {
        return this.metricsCache;
      }

      // Try to get stored metrics first
      const storedMetrics = await this.getStoredMetrics();
      
      // Calculate fresh metrics
      const metrics = await this.calculateMetrics();
      
      // Compare with stored metrics for consistency check
      if (storedMetrics && this.areMetricsConsistent(storedMetrics, metrics)) {
        console.log('Metrics consistent with stored values');
      } else {
        console.log('Metrics inconsistency detected, using calculated values');
      }
      
      // Store in database for persistence
      await this.storeMetrics(metrics);
      
      // Update cache
      this.metricsCache = metrics;
      this.lastCalculated = new Date();
      
      return metrics;
    } catch (error) {
      console.error('Error in getDashboardMetrics:', error);
      
      // Return cached metrics if available, otherwise return default
      if (this.metricsCache) {
        return this.metricsCache;
      }
      
      return this.getDefaultMetrics();
    }
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

      // Additional sales metrics
      const previousMonth = new Date();
      previousMonth.setMonth(previousMonth.getMonth() - 1);
      previousMonth.setDate(1);
      
      const previousMonthOrders = orders.filter(order => {
        const orderDate = new Date(order.createdAt!);
        return orderDate >= previousMonth && orderDate < currentMonth;
      });
      
      const previousMonthRevenue = previousMonthOrders.reduce(
        (sum, order) => sum + parseFloat(order.totalAmount), 0
      );
      
      // Calculate growth percentages
      const revenueGrowth = previousMonthRevenue > 0 
        ? ((monthlyRevenue - previousMonthRevenue) / previousMonthRevenue) * 100 
        : monthlyRevenue > 0 ? 100 : 0;
      
      const previousMonthCustomers = customers.filter(customer => {
        const customerDate = new Date(customer.createdAt!);
        return customerDate >= previousMonth && customerDate < currentMonth;
      }).length;
      
      const customerGrowth = previousMonthCustomers > 0 
        ? ((newCustomersThisMonth - previousMonthCustomers) / previousMonthCustomers) * 100 
        : newCustomersThisMonth > 0 ? 100 : 0;

      // Sales velocity metrics
      const thisWeek = new Date();
      thisWeek.setDate(thisWeek.getDate() - 7);
      
      const weeklyOrders = orders.filter(order => 
        new Date(order.createdAt!) >= thisWeek
      ).length;

      const weeklyRevenue = orders.filter(order => 
        new Date(order.createdAt!) >= thisWeek
      ).reduce((sum, order) => sum + parseFloat(order.totalAmount), 0);

      // Order status breakdown
      const ordersByStatus = orders.reduce((acc, order) => {
        acc[order.status] = (acc[order.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

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
        calculatedAt: new Date().toISOString(),
        // Enhanced sales metrics
        previousMonthRevenue: Number(previousMonthRevenue.toFixed(2)),
        revenueGrowth: Number(revenueGrowth.toFixed(1)),
        customerGrowth: Number(customerGrowth.toFixed(1)),
        weeklyOrders,
        weeklyRevenue: Number(weeklyRevenue.toFixed(2)),
        ordersByStatus,
        topCustomers: customers
          .filter(c => c.totalSpent && parseFloat(c.totalSpent) > 0)
          .sort((a, b) => parseFloat(b.totalSpent || "0") - parseFloat(a.totalSpent || "0"))
          .slice(0, 5)
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
  
  private async getStoredMetrics() {
    try {
      const storedMetrics = await storage.getBusinessMetrics();
      if (storedMetrics.length === 0) return null;
      
      // Convert stored metrics back to dashboard format
      const metricsMap = storedMetrics.reduce((acc, metric) => {
        acc[metric.metricType] = parseFloat(metric.value);
        return acc;
      }, {} as Record<string, number>);
      
      return {
        monthlyRevenue: metricsMap.monthly_revenue || 0,
        activeOrders: metricsMap.active_orders || 0,
        totalCustomers: metricsMap.total_customers || 0,
        completionRate: metricsMap.completion_rate || 0,
        averageOrderValue: metricsMap.average_order_value || 0,
        retrievedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error retrieving stored metrics:', error);
      return null;
    }
  }

  private areMetricsConsistent(stored: any, calculated: any): boolean {
    const tolerance = 0.01; // Allow 1% difference for floating point
    
    const keys = ['monthlyRevenue', 'activeOrders', 'totalCustomers', 'completionRate', 'averageOrderValue'];
    
    return keys.every(key => {
      const storedVal = stored[key] || 0;
      const calcVal = calculated[key] || 0;
      
      // For integer values, check exact match
      if (key === 'activeOrders' || key === 'totalCustomers') {
        return storedVal === calcVal;
      }
      
      // For floating point values, allow small tolerance
      const diff = Math.abs(storedVal - calcVal);
      const avg = (storedVal + calcVal) / 2;
      return diff <= (avg * tolerance);
    });
  }

  private getDefaultMetrics() {
    return {
      monthlyRevenue: 0,
      activeOrders: 0,
      totalCustomers: 0,
      completionRate: 0,
      newCustomersThisMonth: 0,
      totalRevenue: 0,
      averageOrderValue: 0,
      totalOrders: 0,
      recentOrders: [],
      calculatedAt: new Date().toISOString(),
      // Enhanced sales metrics defaults
      previousMonthRevenue: 0,
      revenueGrowth: 0,
      customerGrowth: 0,
      weeklyOrders: 0,
      weeklyRevenue: 0,
      ordersByStatus: {},
      topCustomers: []
    };
  }
}

export const metricsService = new MetricsService();
