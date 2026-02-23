/**
 * Environment Variable Validation
 * 
 * Validates and exports all required environment variables.
 * Throws error at startup if any required variable is missing.
 * 
 * This ensures production deployments fail fast with clear error messages
 * instead of runtime failures.
 */

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${key}\n` +
      `Please set ${key} in your .env file or environment configuration.`
    );
  }
  return value;
}

/**
 * Validated environment variables
 * 
 * All variables are required and will throw an error if missing.
 * This prevents silent failures in production.
 */
export const env = {
  // Database
  DATABASE_URL: requireEnv("DATABASE_URL"),

  // Clerk Authentication
  CLERK_SECRET_KEY: requireEnv("CLERK_SECRET_KEY"),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: requireEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"),

  // Runner Service
  RUNNER_SERVICE_URL: requireEnv("RUNNER_SERVICE_URL"),

  // Optional: Clerk Webhook (only required if using webhooks)
  CLERK_WEBHOOK_SECRET: process.env.CLERK_WEBHOOK_SECRET || "", // Optional

  // Optional: OpenAI API Key (only required if using AI features)
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || "", // Optional
} as const;

/**
 * Validate environment on module load
 * This will throw immediately if any required variable is missing
 */
if (typeof window === "undefined") {
  // Only validate on server-side
  try {
    // Access all required env vars to trigger validation
    const _ = [
      env.DATABASE_URL,
      env.CLERK_SECRET_KEY,
      env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
      env.RUNNER_SERVICE_URL,
    ];
  } catch (error) {
    // Error already thrown by requireEnv, just re-throw with context
    throw new Error(
      `Environment validation failed. Please check your .env file.\n` +
      `Original error: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

