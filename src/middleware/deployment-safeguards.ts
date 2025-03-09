import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { configManager } from '@/lib/config/deployment';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Type definitions
type RateLimitResponse = {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
};

// Initialize rate limiter
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

// Create a new rate limiter instance
const rateLimiter = new Ratelimit({
  redis,
  analytics: true,
  prefix: 'app_rate_limit',
  limiter: Ratelimit.slidingWindow(
    configManager.getRateLimitingConfig().maxRequests || 50,
    '1 m'
  ),
});

// Utility function to get client IP
function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Fallback to a default identifier if no IP is found
  return 'unknown-client';
}

export async function deploymentSafeguards(request: NextRequest) {
  const currentEnv = process.env.NODE_ENV || 'development';
  const rateLimitConfig = configManager.getRateLimitingConfig();
  const securityHeaders = configManager.getSecurityHeaders();

  // Create base response
  const response = NextResponse.next();

  // Apply security headers
  if (securityHeaders.strictTransportSecurity) {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains'
    );
  }

  if (securityHeaders.contentSecurityPolicy) {
    response.headers.set(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
    );
  }

  if (securityHeaders.xFrameOptions) {
    response.headers.set('X-Frame-Options', securityHeaders.xFrameOptions);
  }

  // Add other security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Apply rate limiting if enabled
  if (rateLimitConfig.enabled) {
    try {
      const clientIp = getClientIp(request);
      const result = await rateLimiter.limit(clientIp);

      // Add rate limit headers
      response.headers.set('X-RateLimit-Limit', result.limit.toString());
      response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
      response.headers.set('X-RateLimit-Reset', result.reset.toString());

      if (!result.success) {
        return new NextResponse('Too Many Requests', {
          status: 429,
          headers: {
            'Retry-After': result.reset.toString(),
            ...Object.fromEntries(response.headers),
          },
        });
      }
    } catch (error) {
      console.error('Rate limiting error:', error);
      // Continue without rate limiting on error
    }
  }

  // Add environment indicator header (for debugging)
  if (currentEnv !== 'production') {
    response.headers.set('X-Environment', currentEnv);
  }

  // Add deployment version header
  response.headers.set('X-Deploy-Version', process.env.NEXT_PUBLIC_VERSION || 'unknown');

  // Add deployment safeguards version
  response.headers.set('X-Safeguards-Version', '1.0.0');

  return response;
}

// Matcher configuration for middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public directory
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};