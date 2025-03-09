import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { monitoring } from '@/lib/monitoring';

export async function monitoringMiddleware(
  request: NextRequest,
  handler: () => Promise<NextResponse>
) {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();

  try {
    // Track request start
    await monitoring.logEvent({
      type: 'performance',
      severity: 'info',
      message: 'API Request Started',
      metadata: {
        requestId,
        method: request.method,
        path: request.nextUrl.pathname,
        query: Object.fromEntries(request.nextUrl.searchParams),
      },
      timestamp: new Date().toISOString(),
    });

    // Execute the handler
    const response = await handler();

    // Calculate duration
    const duration = Date.now() - startTime;

    // Track successful request
    await monitoring.trackApiResponse(request.nextUrl.pathname, duration);

    // Add monitoring headers
    response.headers.set('X-Request-ID', requestId);
    response.headers.set('X-Response-Time', `${duration}ms`);

    return response;
  } catch (error) {
    // Calculate duration for failed request
    const duration = Date.now() - startTime;

    // Track error
    await monitoring.trackError(error as Error, {
      requestId,
      method: request.method,
      path: request.nextUrl.pathname,
      duration,
    });

    // Return error response with monitoring headers
    const errorResponse = NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
    errorResponse.headers.set('X-Request-ID', requestId);
    errorResponse.headers.set('X-Response-Time', `${duration}ms`);

    return errorResponse;
  }
}

// Helper function to wrap API routes with monitoring
export function withMonitoring(handler: (req: NextRequest) => Promise<NextResponse>) {
  return async (request: NextRequest) => {
    return monitoringMiddleware(request, () => handler(request));
  };
}