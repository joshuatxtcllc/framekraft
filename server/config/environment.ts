import { z } from 'zod'

// Environment validation schema
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).pipe(z.number().min(1000).max(65535)).default('5000'),
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid URL').optional().default('postgresql://demo:demo@localhost:5432/framekraft'),
  SESSION_SECRET: z.string().min(32, 'SESSION_SECRET must be at least 32 characters').optional().default('development-secret-key-min-32-characters!!'),
  
  // Optional API keys
  ANTHROPIC_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  
  // Optional Twilio
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_PHONE_NUMBER: z.string().optional(),
})

export type Environment = z.infer<typeof envSchema>

export function validateEnvironment(): Environment {
  try {
    const env = envSchema.parse(process.env)
    
    // Additional validation warnings for optional services
    if (!env.ANTHROPIC_API_KEY && !env.OPENAI_API_KEY) {
      console.warn('⚠️  No AI API keys configured - AI features will be disabled')
    }
    
    if (!env.STRIPE_SECRET_KEY) {
      console.warn('⚠️  No Stripe keys configured - payment features will be disabled')
    }
    
    if (!env.TWILIO_ACCOUNT_SID) {
      console.warn('⚠️  No Twilio credentials configured - SMS features will be disabled')
    }
    
    console.log('✅ Environment validation passed')
    console.log(`   - Environment: ${env.NODE_ENV}`)
    console.log(`   - Port: ${env.PORT}`)
    console.log(`   - Database: ${env.DATABASE_URL.includes('localhost') ? 'Local' : 'Remote'}`)
    
    return env
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Environment validation failed:')
      error.errors.forEach(err => {
        console.error(`   - ${err.path.join('.')}: ${err.message}`)
      })
      
      console.error('\n📋 Required environment variables:')
      console.error('   - DATABASE_URL: PostgreSQL connection string')
      console.error('   - SESSION_SECRET: Random string (32+ characters)')
      console.error('\n📋 Optional environment variables:')
      console.error('   - ANTHROPIC_API_KEY: For AI features')
      console.error('   - OPENAI_API_KEY: Alternative AI provider')
      console.error('   - STRIPE_SECRET_KEY: For payment processing')
      console.error('   - TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER: For SMS')
      
      process.exit(1)
    }
    throw error
  }
}

export const env = validateEnvironment()