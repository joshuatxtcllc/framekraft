interface IntegrationSettings {
  gmail: {
    enabled: boolean;
    maxRetries: number;
    cooldownMs: number;
  };
  openai: {
    enabled: boolean;
    maxRetries: number;
    cooldownMs: number;
  };
  stripe: {
    enabled: boolean;
    maxRetries: number;
    cooldownMs: number;
  };
  perplexity: {
    enabled: boolean;
    maxRetries: number;
    cooldownMs: number;
  };
}

class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(
    private maxFailures = 3,
    private cooldownMs = 60000 // 1 minute
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.cooldownMs) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN - service temporarily unavailable');
      }
    }

    try {
      const result = await fn();
      if (this.state === 'HALF_OPEN') {
        this.reset();
      }
      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }

  private recordFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.maxFailures) {
      this.state = 'OPEN';
    }
  }

  private reset() {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  getState() {
    return {
      state: this.state,
      failures: this.failures,
      lastFailureTime: this.lastFailureTime
    };
  }
}

export class SettingsService {
  private settings: IntegrationSettings = {
    gmail: { enabled: true, maxRetries: 3, cooldownMs: 60000 },
    openai: { enabled: false, maxRetries: 3, cooldownMs: 60000 },
    stripe: { enabled: true, maxRetries: 3, cooldownMs: 30000 },
    perplexity: { enabled: false, maxRetries: 2, cooldownMs: 120000 }
  };

  private circuitBreakers = new Map<string, CircuitBreaker>();

  getSettings(): IntegrationSettings {
    return { ...this.settings };
  }

  updateSettings(newSettings: Partial<IntegrationSettings>) {
    this.settings = { ...this.settings, ...newSettings };
  }

  isEnabled(service: keyof IntegrationSettings): boolean {
    return this.settings[service].enabled;
  }

  getCircuitBreaker(service: string): CircuitBreaker {
    if (!this.circuitBreakers.has(service)) {
      const config = this.settings[service as keyof IntegrationSettings];
      this.circuitBreakers.set(service, new CircuitBreaker(
        config?.maxRetries || 3,
        config?.cooldownMs || 60000
      ));
    }
    return this.circuitBreakers.get(service)!;
  }

  getServiceStatus() {
    const status: Record<string, any> = {};

    for (const [service, breaker] of this.circuitBreakers.entries()) {
      status[service] = {
        enabled: this.isEnabled(service as keyof IntegrationSettings),
        circuitBreaker: breaker.getState()
      };
    }

    return status;
  }
}

export const settingsService = new SettingsService();