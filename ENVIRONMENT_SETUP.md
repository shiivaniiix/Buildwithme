# Environment Configuration Guide

## Required Environment Variables

All environment variables must be set in your `.env` file. The application will **fail to start** if any required variable is missing.

### Required Variables

```env
# Database
DATABASE_URL=postgresql://user:password@host:port/database

# Clerk Authentication
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...

# Runner Service
RUNNER_SERVICE_URL=http://localhost:3001
```

### Optional Variables

```env
# Clerk Webhooks (only if using webhooks)
CLERK_WEBHOOK_SECRET=whsec_...

# OpenAI API (only if using AI features)
OPENAI_API_KEY=sk-...
```

## Environment Validation

The application uses `lib/env.ts` to validate all required environment variables at startup. If any required variable is missing, the application will throw a clear error message indicating which variable is missing.

## Production Configuration

### Vercel

1. Go to your Vercel project settings
2. Navigate to "Environment Variables"
3. Add all required variables:
   - `DATABASE_URL` (from your database provider)
   - `CLERK_SECRET_KEY` (from Clerk Dashboard)
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (from Clerk Dashboard)
   - `RUNNER_SERVICE_URL` (your runner service URL, e.g., `https://runner.yourdomain.com`)

### Other Platforms

Set environment variables according to your hosting platform's documentation. All variables listed in the "Required Variables" section must be set.

## Runner Service URL

The `RUNNER_SERVICE_URL` must point to your code execution service:

- **Development:** `http://localhost:3001`
- **Production:** `https://runner.yourdomain.com` (or your runner service URL)

**Important:** Never hardcode URLs. Always use environment variables.

## Verification

To verify your environment is configured correctly:

1. Check that `.env` file exists with all required variables
2. Start the application - it should fail fast with a clear error if any variable is missing
3. Check application logs for any environment-related errors

## Troubleshooting

### Error: "Missing required environment variable: X"

**Solution:** Add the missing variable to your `.env` file or environment configuration.

### Error: "RUNNER_SERVICE_URL not set"

**Solution:** 
- For local development: `RUNNER_SERVICE_URL=http://localhost:3001`
- For production: Set `RUNNER_SERVICE_URL` to your runner service URL

### Application starts but API calls fail

**Solution:** Check that all environment variables are properly set and accessible to the application runtime.

