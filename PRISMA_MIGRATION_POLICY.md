# Prisma Migration Policy

## Overview

This document defines the migration policy for Prisma database schema changes in this project.

## Core Policy

### ✅ **ALWAYS USE: `prisma migrate`**

**Development:**
```bash
npx prisma migrate dev --name descriptive_migration_name
```

**Production:**
```bash
npx prisma migrate deploy
```

### ❌ **NEVER USE: `prisma db push`**

`prisma db push` is **forbidden** in this project because:
- It does not create migration files
- It cannot be tracked in Git
- It makes production deployments unreliable
- It prevents rollback capabilities
- It breaks team collaboration workflows

## Workflow

### 1. Development Workflow

1. **Make schema changes** in `prisma/schema.prisma`
2. **Create migration:**
   ```bash
   npx prisma migrate dev --name add_user_username_field
   ```
3. **Review migration file** in `prisma/migrations/`
4. **Commit both** schema and migration files to Git:
   ```bash
   git add prisma/schema.prisma prisma/migrations/
   git commit -m "feat: add username field to User model"
   ```

### 2. Production Deployment

1. **Run migrations:**
   ```bash
   npx prisma migrate deploy
   ```
2. **Generate Prisma Client:**
   ```bash
   npx prisma generate
   ```

### 3. Team Collaboration

- **Always pull latest migrations** before making schema changes
- **Never edit existing migration files** (create new migrations instead)
- **Resolve conflicts** by creating new migrations that reconcile differences

## Migration Naming Convention

Use descriptive names that explain what the migration does:

✅ **Good:**
- `add_file_model`
- `add_user_username_field`
- `add_project_github_fields`
- `make_username_unique`

❌ **Bad:**
- `migration1`
- `update`
- `fix`
- `changes`

## Rollback

If you need to rollback a migration:

1. **Create a new migration** that reverses the changes
2. **Never delete migration files** from `prisma/migrations/`
3. **Test rollback** in development before applying to production

## Emergency Situations

If you absolutely must make a quick schema change:

1. **Create a migration** (even if it's just a hotfix)
2. **Document the emergency** in the migration name or commit message
3. **Follow up** with a proper migration if needed

## Verification

Before deploying to production, verify:

- [ ] All migrations are committed to Git
- [ ] Migration files are in `prisma/migrations/` directory
- [ ] No `prisma db push` commands were used
- [ ] Migration names are descriptive
- [ ] Schema changes match migration files

## CI/CD Integration

Your CI/CD pipeline should:

1. **Run migrations** before deployment:
   ```bash
   npx prisma migrate deploy
   ```
2. **Generate Prisma Client:**
   ```bash
   npx prisma generate
   ```
3. **Fail the build** if migrations are missing or invalid

## Summary

- ✅ Use `prisma migrate dev` for development
- ✅ Use `prisma migrate deploy` for production
- ✅ Commit all migrations to Git
- ❌ Never use `prisma db push`
- ✅ Always create descriptive migration names

