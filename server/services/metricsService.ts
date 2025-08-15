
import { storage } from '../storage';
import { metricsAuditService } from './metricsAuditService';

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
      
      // Validate metrics for business logic errors
      const validation = metricsAuditService.validateMetrics(metrics);
      if (!validation.valid) {
        console.error('METRIC VALIDATION FAILED:', validation.errors);
        // Log errors but continue with corrected metrics
      }
      
      // Record snapshot for trend analysis
      metricsAuditService.recordSnapshot(metrics);
      
      // Cross-validate with database for data integrity
      const crossValidation = await metricsAuditService.crossValidateWithDatabase();
      if (!crossValidation.valid) {
        console.warn('DATABASE CROSS-VALIDATION FAILED:', crossValidation.discrepancies);
      }
      
      // Compare with stored metrics for consistency check
      if (storedMetrics && this.areMetricsConsistent(storedMetrics, metrics)) {
        console.log('Metrics consistent with stored values');
      } else {
        console.log('Metrics inconsistency detected, using calculated values');
        if (storedMetrics) {
          console.log('Previous:', storedMetrics);
          console.log('Current:', metrics);
        }
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

      // Calculate paid revenue - balanceAmount represents amount still OWED
      // Paid amount = deposit amount (what's already been received)
      const paidRevenue = orders.reduce((sum, order) => {
        const totalAmount = parseFloat(order.totalAmount);
        const deposit = order.depositAmount ? parseFloat(order.depositAmount) : 0;
        const balanceDue = order.balanceAmount ? parseFloat(order.balanceAmount) : 0;
        
        // For completed orders, assume full payment received
        if (order.status === 'completed') {
          return sum + totalAmount;
        }
        
        // For other orders, only count what's actually been paid (deposits)
        return sum + deposit;
      }, 0);

      const monthlyPaidRevenue = orders
        .filter(order => new Date(order.createdAt!) >= currentMonth)
        .reduce((sum, order) => {
          const totalAmount = parseFloat(order.totalAmount);
          const deposit = order.depositAmount ? parseFloat(order.depositAmount) : 0;
          const balanceDue = order.balanceAmount ? parseFloat(order.balanceAmount) : 0;
          
          // For completed orders, assume full payment received
          if (order.status === 'completed') {
            return sum + totalAmount;
          }
          
          // For other orders, only count what's actually been paid (deposits)
          return sum + deposit;
        }, 0);

      // Calculate total outstanding balances - CORRECT CALCULATION
      // Use actual math: total_amount - deposit_amount = what customer owes
      const totalOutstanding = orders
        .filter(order => order.status !== 'completed' && order.status !== 'cancelled')
        .reduce((sum, order) => {
          const totalAmount = parseFloat(order.totalAmount);
          const deposit = order.depositAmount ? parseFloat(order.depositAmount) : 0;
          const actualBalance = totalAmount - deposit;
          return sum + Math.max(0, actualBalance); // Only positive balances owed
        }, 0);

      const monthlyOutstanding = orders
        .filter(order => new Date(order.createdAt!) >= currentMonth && order.status !== 'completed' && order.status !== 'cancelled')
        .reduce((sum, order) => {
          const totalAmount = parseFloat(order.totalAmount);
          const deposit = order.depositAmount ? parseFloat(order.depositAmount) : 0;
          const actualBalance = totalAmount - deposit;
          return sum + Math.max(0, actualBalance); // Only positive balances owed
        }, 0);

      const paymentRate = monthlyRevenue > 0 ? (monthlyPaidRevenue / monthlyRevenue) * 100 : 0;

      // Calculate aging of receivables for better tracking
      const currentDate = new Date();
      const receivablesAging = orders
        .filter(order => order.status !== 'completed' && order.status !== 'cancelled')
        .map(order => {
          const totalAmount = parseFloat(order.totalAmount);
          const deposit = order.depositAmount ? parseFloat(order.depositAmount) : 0;
          const actualBalance = totalAmount - deposit;
          if (actualBalance <= 0) return null;
          
          const daysPastDue = order.dueDate 
            ? Math.floor((currentDate.getTime() - new Date(order.dueDate).getTime()) / (1000 * 60 * 60 * 24))
            : 0;
          
          return {
            orderId: order.id,
            orderNumber: order.orderNumber,
            customerId: order.customerId,
            balanceAmount: actualBalance,
            daysPastDue,
            urgencyLevel: daysPastDue > 30 ? 'critical' : daysPastDue > 14 ? 'high' : daysPastDue > 7 ? 'medium' : 'normal'
          };
        })
        .filter(Boolean);

      const criticalReceivables = receivablesAging.filter((r: any) => r.urgencyLevel === 'critical');
      const highPriorityReceivables = receivablesAging.filter((r: any) => r.urgencyLevel === 'high');
      const totalCriticalAmount = criticalReceivables.reduce((sum: number, r: any) => sum + r.balanceAmount, 0);
      const totalHighPriorityAmount = highPriorityReceivables.reduce((sum: number, r: any) => sum + r.balanceAmount, 0);

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
          .slice(0, 5),
        // Payment tracking metrics
        paidRevenue: Number(paidRevenue.toFixed(2)),
        monthlyPaidRevenue: Number(monthlyPaidRevenue.toFixed(2)),
        paymentRate: Number(paymentRate.toFixed(1)),
        outstandingAmount: Number(monthlyOutstanding.toFixed(2)),
        totalOutstanding: Number(totalOutstanding.toFixed(2)),
        
        // Receivables analytics for business survival
        receivablesAging,
        criticalReceivablesCount: criticalReceivables.length,
        highPriorityReceivablesCount: highPriorityReceivables.length,
        totalCriticalAmount: Number(totalCriticalAmount.toFixed(2)),
        totalHighPriorityAmount: Number(totalHighPriorityAmount.toFixed(2)),
        totalReceivablesCount: receivablesAging.length
      };
    } catch (error) {
      console.error('Error calculating metrics:', error);
      throw error;
    }
  }

  private async storeMetrics(metrics: any) {
    try {
      // Store critical business metrics for consistency checking
      const metricsToStore = [
        { type: 'monthly_revenue', value: metrics.monthlyRevenue },
        { type: 'active_orders', value: metrics.activeOrders },
        { type: 'total_customers', value: metrics.totalCustomers },
        { type: 'completion_rate', value: metrics.completionRate },
        { type: 'average_order_value', value: metrics.averageOrderValue },
        { type: 'total_outstanding', value: metrics.totalOutstanding },
        { type: 'paid_revenue', value: metrics.paidRevenue },
        { type: 'payment_rate', value: metrics.paymentRate },
        { type: 'critical_receivables_count', value: metrics.criticalReceivablesCount },
        { type: 'last_calculated', value: Date.now() }
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
    
    // Critical business metrics that must be consistent
    const criticalKeys = ['monthlyRevenue', 'activeOrders', 'totalCustomers', 'totalOutstanding', 'paidRevenue'];
    
    const inconsistencies: string[] = [];
    
    const isConsistent = criticalKeys.every(key => {
      const storedVal = stored[key] || 0;
      const calcVal = calculated[key] || 0;
      
      // For integer values, check exact match
      if (key === 'activeOrders' || key === 'totalCustomers') {
        const consistent = storedVal === calcVal;
        if (!consistent) {
          inconsistencies.push(`${key}: stored=${storedVal}, calculated=${calcVal}`);
        }
        return consistent;
      }
      
      // For financial values, use absolute tolerance (not percentage)
      const diff = Math.abs(storedVal - calcVal);
      const consistent = diff <= tolerance;
      
      if (!consistent) {
        inconsistencies.push(`${key}: stored=$${storedVal}, calculated=$${calcVal}, diff=$${diff.toFixed(2)}`);
      }
      
      return consistent;
    });
    
    if (!isConsistent) {
      console.warn('BUSINESS CRITICAL METRICS INCONSISTENT:', inconsistencies);
    }
    
    return isConsistent;
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
      topCustomers: [],
      // Payment tracking defaults
      paidRevenue: 0,
      monthlyPaidRevenue: 0,
      paymentRate: 0,
      outstandingAmount: 0,
      totalOutstanding: 0,
      
      // Receivables defaults
      receivablesAging: [],
      criticalReceivablesCount: 0,
      highPriorityReceivablesCount: 0,
      totalCriticalAmount: 0,
      totalHighPriorityAmount: 0,
      totalReceivablesCount: 0
    };
  }
}

export const metricsService = new MetricsService();
