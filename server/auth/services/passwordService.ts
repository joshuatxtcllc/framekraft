import bcrypt from 'bcryptjs';
import { securityConfig } from '../config';

export class PasswordService {
  private readonly saltRounds: number;

  constructor() {
    this.saltRounds = securityConfig.bcryptRounds;
  }

  /**
   * Hash a password using bcrypt
   */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  /**
   * Compare a plain text password with a hash
   */
  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Validate password strength
   */
  validatePasswordStrength(password: string): {
    valid: boolean;
    errors: string[];
    score: number;
  } {
    const errors: string[] = [];
    let score = 0;

    // Check minimum length
    if (password.length < securityConfig.passwordMinLength) {
      errors.push(`Password must be at least ${securityConfig.passwordMinLength} characters long`);
    } else {
      score += 1;
    }

    // Check for uppercase letters
    if (securityConfig.passwordRequireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    } else if (/[A-Z]/.test(password)) {
      score += 1;
    }

    // Check for numbers
    if (securityConfig.passwordRequireNumbers && !/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    } else if (/[0-9]/.test(password)) {
      score += 1;
    }

    // Check for special characters
    if (securityConfig.passwordRequireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    } else if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      score += 1;
    }

    // Additional strength checks
    if (password.length >= 12) score += 1;
    if (password.length >= 16) score += 1;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
    
    // Check for common patterns
    if (this.hasCommonPatterns(password)) {
      errors.push('Password contains common patterns or sequences');
      score = Math.max(0, score - 2);
    }

    // Check for repeated characters
    if (this.hasRepeatedCharacters(password)) {
      errors.push('Password contains too many repeated characters');
      score = Math.max(0, score - 1);
    }

    return {
      valid: errors.length === 0,
      errors,
      score: Math.min(5, score) // Score out of 5
    };
  }

  /**
   * Check for common patterns in password
   */
  private hasCommonPatterns(password: string): boolean {
    const commonPatterns = [
      /^123456/,
      /^password/i,
      /^qwerty/i,
      /^abc123/i,
      /^letmein/i,
      /^admin/i,
      /^welcome/i,
      /^monkey/i,
      /^dragon/i,
    ];

    const lowerPassword = password.toLowerCase();
    return commonPatterns.some(pattern => pattern.test(lowerPassword));
  }

  /**
   * Check for repeated characters
   */
  private hasRepeatedCharacters(password: string, maxRepeat: number = 3): boolean {
    const regex = new RegExp(`(.)\\1{${maxRepeat},}`);
    return regex.test(password);
  }

  /**
   * Generate a random secure password
   */
  generateSecurePassword(length: number = 16): string {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    const allChars = uppercase + lowercase + numbers + special;
    let password = '';

    // Ensure at least one character from each required category
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += special[Math.floor(Math.random() * special.length)];

    // Fill the rest randomly
    for (let i = password.length; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }

  /**
   * Check if password has been compromised (using Have I Been Pwned API)
   */
  async isPasswordCompromised(password: string): Promise<boolean> {
    try {
      const crypto = require('crypto');
      const hash = crypto.createHash('sha1').update(password).digest('hex').toUpperCase();
      const prefix = hash.substring(0, 5);
      const suffix = hash.substring(5);

      const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
      if (!response.ok) {
        // If API is down, don't block the user
        console.error('Could not check password against breach database');
        return false;
      }

      const text = await response.text();
      const hashes = text.split('\n');

      for (const line of hashes) {
        const [hashSuffix, count] = line.split(':');
        if (hashSuffix === suffix) {
          console.warn(`Password has been seen ${count} times in data breaches`);
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Error checking password breach status:', error);
      // Don't block user if service is unavailable
      return false;
    }
  }

  /**
   * Calculate password entropy
   */
  calculateEntropy(password: string): number {
    const charsets = {
      lowercase: /[a-z]/.test(password) ? 26 : 0,
      uppercase: /[A-Z]/.test(password) ? 26 : 0,
      numbers: /[0-9]/.test(password) ? 10 : 0,
      special: /[^a-zA-Z0-9]/.test(password) ? 32 : 0,
    };

    const poolSize = Object.values(charsets).reduce((a, b) => a + b, 0);
    const entropy = password.length * Math.log2(poolSize);

    return Math.round(entropy);
  }

  /**
   * Get password strength description
   */
  getPasswordStrengthLabel(score: number): string {
    const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
    return labels[Math.min(score, labels.length - 1)];
  }

  /**
   * Estimate time to crack password
   */
  estimateCrackTime(entropy: number): string {
    const guessesPerSecond = 1e10; // 10 billion guesses per second
    const seconds = Math.pow(2, entropy) / guessesPerSecond;

    if (seconds < 1) return 'Instantly';
    if (seconds < 60) return `${Math.round(seconds)} seconds`;
    if (seconds < 3600) return `${Math.round(seconds / 60)} minutes`;
    if (seconds < 86400) return `${Math.round(seconds / 3600)} hours`;
    if (seconds < 2592000) return `${Math.round(seconds / 86400)} days`;
    if (seconds < 31536000) return `${Math.round(seconds / 2592000)} months`;
    
    const years = seconds / 31536000;
    if (years < 1000) return `${Math.round(years)} years`;
    if (years < 1e6) return `${Math.round(years / 1000)} thousand years`;
    if (years < 1e9) return `${Math.round(years / 1e6)} million years`;
    return 'Billions of years';
  }
}

// Export singleton instance
export const passwordService = new PasswordService();