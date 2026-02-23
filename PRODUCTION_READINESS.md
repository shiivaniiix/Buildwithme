# Production Readiness Checklist

## Environment Configuration ✅

### Environment Variables

All required environment variables are validated at startup via `lib/env.ts`:

- ✅ `DATABASE_URL` - Required
- ✅ `CLERK_SECRET_KEY` - Required
- ✅ `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Required
- ✅ `RUNNER_SERVICE_URL` - Required (no default fallback)

**Validation:** Application will fail to start with clear error messages if any required variable is missing.

### No Hardcoded URLs

- ✅ All URLs use environment variables
- ✅ No default fallbacks for critical services (e.g., `RUNNER_SERVICE_URL`)
- ✅ Runner service URL is required and validated

## Prisma Configuration ✅

### Runtime Safety

- ✅ Prisma is **never** used in Edge runtime
- ✅ Middleware does **not** import Prisma
- ✅ All Prisma usage is in API routes (Node.js runtime)
- ✅ All API routes use Node.js runtime by default (no `export const runtime = "edge"`)

### Migration Policy

- ✅ **ALWAYS USE:** `npx prisma migrate dev` (development)
- ✅ **ALWAYS USE:** `npx prisma migrate deploy` (production)
- ❌ **NEVER USE:** `prisma db push`

See `PRISMA_MIGRATION_POLICY.md` for detailed migration guidelines.

## Files Modified

1. **`lib/env.ts`** - Created environment validation module
2. **`app/api/projects/[id]/run/route.ts`** - Updated to use validated env
3. **`app/api/webhooks/clerk/route.ts`** - Updated to use validated env
4. **`prisma.config.ts`** - Updated to use validated env

## Production Deployment

### Required Steps

1. **Set all environment variables** in your hosting platform
2. **Run migrations:**
   ```bash
   npx prisma migrate deploy
   npx prisma generate
   ```
3. **Verify environment** - Application will fail fast if variables are missing
4. **Start application** - Should start without errors if all variables are set

### Environment Variables to Set

```env
DATABASE_URL=postgresql://...
CLERK_SECRET_KEY=sk_live_...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
RUNNER_SERVICE_URL=https://runner.yourdomain.com
CLERK_WEBHOOK_SECRET=whsec_... (optional)
OPENAI_API_KEY=sk-... (optional)
```

## Verification

To verify production readiness:

1. ✅ Check that `.env` has all required variables
2. ✅ Verify no hardcoded URLs exist
3. ✅ Confirm Prisma is never used in Edge runtime
4. ✅ Ensure migration policy is followed
5. ✅ Test that application fails fast with clear errors if variables are missing

## Next Steps

1. Set up production environment variables
2. Run `npx prisma migrate deploy` in production
3. Deploy application
4. Monitor for any environment-related errors

