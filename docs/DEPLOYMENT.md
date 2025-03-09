# Deployment Guide

## Overview

This document outlines the deployment process for Lawn Genius, including environment setup, deployment procedures, and safeguards.

## Environments

The application supports three environments:

- **Development**: Local development environment
- **Staging**: Pre-production testing environment
- **Production**: Live production environment

## Prerequisites

Before deploying, ensure you have:

1. Required environment variables in the appropriate `.env` file
2. Database access credentials
3. Redis credentials for rate limiting
4. Necessary API keys for external services

## Environment Configuration

Each environment has its own configuration file:

- `.env.development` - Local development
- `.env.staging` - Staging environment
- `.env.production` - Production environment

Required environment variables:

```bash
# Database
DATABASE_URL=

# Authentication
NEXTAUTH_SECRET=
NEXTAUTH_URL=

# Rate Limiting
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# External Services
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
RESEND_API_KEY=
OPENWEATHER_API_KEY=
```

## Deployment Process

### 1. Verify Deployment

Before deploying, run the verification script:

```bash
# For staging
npm run verify:staging

# For production
npm run verify:production
```

This checks:
- Environment configuration
- Database connection
- Redis connection
- Security settings
- Build status

### 2. Database Migrations

Deploy database changes:

```bash
# For staging
npm run migrate:staging

# For production
npm run migrate:production
```

### 3. Build and Deploy

Deploy to the target environment:

```bash
# For staging
npm run deploy:staging

# For production
npm run deploy:production
```

### 4. Rollback Procedure

If issues occur, rollback using:

```bash
# For staging
npm run rollback:staging

# For production
npm run rollback:production
```

## Deployment Safeguards

### 1. Environment Protection

- Staging and production environments are protected
- Required status checks must pass
- Pull request reviews required for production
- Automated tests must pass

### 2. Security Measures

- Rate limiting enabled in staging/production
- Strict security headers
- Environment-specific database access
- Encrypted credentials

### 3. Monitoring

- Error tracking
- Performance monitoring
- Resource usage tracking
- Automated alerts

## CI/CD Pipeline

The CI/CD pipeline includes:

1. **Validation**
   - Type checking
   - Linting
   - Unit tests

2. **E2E Testing**
   - Playwright tests
   - Integration tests

3. **Build**
   - Environment-specific builds
   - Asset optimization

4. **Deployment**
   - Environment promotion
   - Database migrations
   - Configuration validation

## Branch Protection

Main branch is protected with:

- Required status checks
- Required reviews
- No direct pushes
- Up-to-date branch requirement

## Monitoring and Alerts

The application is monitored for:

- Error rates
- Response times
- Resource usage
- Security issues

Alerts are configured for:
- High error rates
- Slow response times
- Failed deployments
- Security incidents

## Troubleshooting

### Common Issues

1. **Deployment Verification Failed**
   - Check environment variables
   - Verify database connection
   - Check Redis connection
   - Validate security settings

2. **Database Migration Issues**
   - Backup database first
   - Check migration history
   - Verify database permissions
   - Review migration logs

3. **Build Failures**
   - Check dependency versions
   - Verify environment variables
   - Review build logs
   - Check for type errors

### Support

For deployment issues:
1. Check deployment logs
2. Review error messages
3. Verify environment configuration
4. Contact DevOps team if needed

## Best Practices

1. **Before Deployment**
   - Run verification checks
   - Review changes
   - Check dependencies
   - Backup data

2. **During Deployment**
   - Monitor logs
   - Watch for errors
   - Check performance
   - Verify functionality

3. **After Deployment**
   - Verify application status
   - Check monitoring
   - Test critical paths
   - Document issues

## Security Considerations

1. **Environment Isolation**
   - Separate databases
   - Isolated services
   - Environment-specific keys
   - Rate limiting

2. **Access Control**
   - Role-based access
   - IP restrictions
   - Audit logging
   - Session management

3. **Data Protection**
   - Encryption at rest
   - Secure credentials
   - Regular backups
   - Data masking