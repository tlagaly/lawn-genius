import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';

export async function POST() {
  // Only allow in test environment
  if (process.env.NODE_ENV !== 'test') {
    return NextResponse.json(
      { error: 'This endpoint is only available in test environment' },
      { status: 403 }
    );
  }

  try {
    // Clean up test data
    await prisma.$transaction([
      // Clean up user data
      prisma.user.deleteMany({
        where: {
          email: {
            contains: '@example.com'
          }
        }
      }),
      // Clean up session data
      prisma.session.deleteMany({}),
      // Clean up password reset tokens
      prisma.passwordReset.deleteMany({}),
      // Clean up any test lawn profiles
      prisma.lawnProfile.deleteMany({
        where: {
          user: {
            email: {
              contains: '@example.com'
            }
          }
        }
      })
    ]);

    return NextResponse.json({
      status: 'success',
      message: 'Test resources cleaned up successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to clean up test resources:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: 'Failed to clean up test resources',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}