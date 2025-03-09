#!/usr/bin/env node
import { configManager, validateDeploymentConfig } from '../src/lib/config/deployment';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Load environment variables based on NODE_ENV
const env = process.env.NODE_ENV || 'development';
dotenv.config({ path: `.env.${env}` });

async function verifyDeployment() {
  console.log(`🔍 Verifying deployment for ${env} environment...`);
  
  try {
    // 1. Validate deployment configuration
    console.log('\n📋 Checking deployment configuration...');
    validateDeploymentConfig();
    console.log('✅ Deployment configuration is valid');

    // 2. Verify environment variables
    console.log('\n🔐 Verifying required environment variables...');
    const requiredEnvVars = [
      'DATABASE_URL',
      'NEXTAUTH_SECRET',
      'NEXTAUTH_URL',
      'UPSTASH_REDIS_REST_URL',
      'UPSTASH_REDIS_REST_TOKEN',
    ];

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    if (missingVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }
    console.log('✅ All required environment variables are present');

    // 3. Test database connection
    console.log('\n🗄️ Testing database connection...');
    const prisma = new PrismaClient();
    try {
      await prisma.$connect();
      console.log('✅ Database connection successful');
      
      // Check for pending migrations
      const { execSync } = require('child_process');
      const pendingMigrations = execSync('npx prisma migrate status --exit-code').toString();
      if (pendingMigrations.includes('pending')) {
        throw new Error('There are pending database migrations');
      }
      console.log('✅ No pending migrations');
    } finally {
      await prisma.$disconnect();
    }

    // 4. Verify Redis connection
    console.log('\n📡 Testing Redis connection...');
    const { Redis } = await import('@upstash/redis');
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
    
    await redis.ping();
    console.log('✅ Redis connection successful');

    // 5. Check security configuration
    console.log('\n🔒 Verifying security configuration...');
    const securityConfig = configManager.getSecurityConfig();
    const rateLimitConfig = configManager.getRateLimitingConfig();

    if (env === 'production') {
      if (!securityConfig.headers[env].strictTransportSecurity) {
        throw new Error('HSTS must be enabled in production');
      }
      if (!rateLimitConfig.enabled) {
        throw new Error('Rate limiting must be enabled in production');
      }
    }
    console.log('✅ Security configuration is valid');

    // 6. Verify build
    console.log('\n🏗️ Verifying build...');
    const { existsSync } = require('fs');
    if (!existsSync('.next')) {
      throw new Error('Build directory not found. Run `npm run build` first');
    }
    console.log('✅ Build verification successful');

    console.log('\n✨ All deployment checks passed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Deployment verification failed:');
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// Run verification
verifyDeployment().catch(error => {
  console.error('Deployment verification failed:', error);
  process.exit(1);
});