import { storage } from '../storage';

interface MetricsSnapshot {
  timestamp: Date;
  monthlyRevenue: number;
  activeOrders: number;
  totalCustomers: number;
  totalOutstanding: number;
  paidRevenue: number;
  orderCount: number;
  completedOrderCount: number;
  dataChecksum: string;
}

class MetricsAuditService {
  private snapshots: MetricsSnapshot[] = [];
  private maxSnapshots = 24; // Keep 24 hours of snapshots

  // Create a checksum for data integrity verification
  private createDataChecksum(metrics: any): string {
    const dataString = JSON.stringify({
      monthlyRevenue: metrics.monthlyRevenue,
      activeOrders: metrics.activeOrders,
      totalCustomers: metrics.totalCustomers,
      totalOutstanding: metrics.totalOutstanding,
      paidRevenue: metrics.paidRevenue
    });
    
    // Simple hash function for checksum
    let hash = 0;
    for (let i = 0; i < dataString.length; i++) {
      const char = dataString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  }

  // Validate metrics against business rules
  validateMetrics(metrics: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Revenue validation
    if (metrics.monthlyRevenue < 0) {
      errors.push('Monthly revenue cannot be negative');
    }

    // Outstanding balance validation
    if (metrics.totalOutstanding < 0) {
      errors.push('Total outstanding cannot be negative - check payment calculations');
    }

    // Paid revenue validation
    if (metrics.paidRevenue < 0) {
      errors.push('Paid revenue cannot be negative');
    }

    // Payment rate validation
    if (metrics.paymentRate > 150) {
      errors.push('Payment rate over 150% suggests calculation error');
    }

    // Order count validation
    if (metrics.activeOrders < 0) {
      errors.push('Active orders count cannot be negative');
    }

    // Business logic validation
    if (metrics.monthlyRevenue > 0 && metrics.paidRevenue > metrics.monthlyRevenue * 2) {
      errors.push('Paid revenue significantly exceeds monthly revenue - verify calculations');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Track metric changes over time
  recordSnapshot(metrics: any): void {
    const snapshot: MetricsSnapshot = {
      timestamp: new Date(),
      monthlyRevenue: metrics.monthlyRevenue || 0,
      activeOrders: metrics.activeOrders || 0,
      totalCustomers: metrics.totalCustomers || 0,
      totalOutstanding: metrics.totalOutstanding || 0,
      paidRevenue: metrics.paidRevenue || 0,
      orderCount: metrics.totalOrders || 0,
      completedOrderCount: metrics.completedOrders || 0,
      dataChecksum: this.createDataChecksum(metrics)
    };

    this.snapshots.push(snapshot);

    // Keep only recent snapshots
    if (this.snapshots.length > this.maxSnapshots) {
      this.snapshots = this.snapshots.slice(-this.maxSnapshots);
    }

    // Detect suspicious changes
    this.detectAnomalies(snapshot);
  }

  // Detect unusual metric changes that might indicate calculation errors
  private detectAnomalies(current: MetricsSnapshot): void {
    if (this.snapshots.length < 2) return;

    const previous = this.snapshots[this.snapshots.length - 2];
    const changeThreshold = 0.2; // 20% change threshold

    // Check for dramatic changes in key metrics
    const revenueChange = Math.abs(current.monthlyRevenue - previous.monthlyRevenue) / (previous.monthlyRevenue || 1);
    const outstandingChange = Math.abs(current.totalOutstanding - previous.totalOutstanding) / (previous.totalOutstanding || 1);

    if (revenueChange > changeThreshold) {
      console.warn(`METRIC ANOMALY: Monthly revenue changed by ${(revenueChange * 100).toFixed(1)}% from $${previous.monthlyRevenue} to $${current.monthlyRevenue}`);
    }

    if (outstandingChange > changeThreshold && previous.totalOutstanding > 0) {
      console.warn(`METRIC ANOMALY: Outstanding balance changed by ${(outstandingChange * 100).toFixed(1)}% from $${previous.totalOutstanding} to $${current.totalOutstanding}`);
    }

    // Check for sign flips (positive to negative or vice versa)
    if ((previous.totalOutstanding >= 0 && current.totalOutstanding < 0) || 
        (previous.totalOutstanding < 0 && current.totalOutstanding >= 0)) {
      console.error(`CRITICAL ANOMALY: Outstanding balance sign changed from $${previous.totalOutstanding} to $${current.totalOutstanding}`);
    }
  }

  // Get recent metric history for debugging
  getRecentHistory(hours: number = 6): MetricsSnapshot[] {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.snapshots.filter(s => s.timestamp >= cutoff);
  }

  // Cross-validate metrics with raw database data
  async crossValidateWithDatabase(): Promise<{ valid: boolean; discrepancies: string[] }> {
    try {
      const orders = await storage.getOrders();
      const customers = await storage.getCustomers();
      
      const currentMonth = new Date();
      currentMonth.setDate(1);

      // Direct database calculations
      const monthlyOrders = orders.filter(order => new Date(order.createdAt!) >= currentMonth);
      const dbMonthlyRevenue = monthlyOrders.reduce((sum, order) => sum + parseFloat(order.totalAmount), 0);
      const dbActiveOrders = orders.filter(order => !['completed', 'cancelled'].includes(order.status)).length;
      const dbTotalCustomers = customers.length;
      
      // Calculate correct outstanding
      const dbTotalOutstanding = orders
        .filter(order => order.status !== 'completed' && order.status !== 'cancelled')
        .reduce((sum, order) => {
          const totalAmount = parseFloat(order.totalAmount);
          const deposit = order.depositAmount ? parseFloat(order.depositAmount) : 0;
          const actualBalance = totalAmount - deposit;
          return sum + Math.max(0, actualBalance);
        }, 0);

      const discrepancies: string[] = [];
      
      // Compare with latest snapshot
      if (this.snapshots.length > 0) {
        const latest = this.snapshots[this.snapshots.length - 1];
        
        if (Math.abs(latest.monthlyRevenue - dbMonthlyRevenue) > 0.01) {
          discrepancies.push(`Monthly revenue: Cached $${latest.monthlyRevenue} vs DB $${dbMonthlyRevenue}`);
        }
        
        if (latest.activeOrders !== dbActiveOrders) {
          discrepancies.push(`Active orders: Cached ${latest.activeOrders} vs DB ${dbActiveOrders}`);
        }
        
        if (latest.totalCustomers !== dbTotalCustomers) {
          discrepancies.push(`Total customers: Cached ${latest.totalCustomers} vs DB ${dbTotalCustomers}`);
        }
        
        if (Math.abs(latest.totalOutstanding - dbTotalOutstanding) > 0.01) {
          discrepancies.push(`Total outstanding: Cached $${latest.totalOutstanding} vs DB $${dbTotalOutstanding}`);
        }
      }

      return {
        valid: discrepancies.length === 0,
        discrepancies
      };
    } catch (error) {
      console.error('Error in cross-validation:', error);
      return {
        valid: false,
        discrepancies: ['Failed to perform database cross-validation']
      };
    }
  }
}

export const metricsAuditService = new MetricsAuditService();