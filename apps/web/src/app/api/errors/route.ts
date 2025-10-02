import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const errorData = await request.json();
    
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Client Error Report:', errorData);
    }
    
    // In production, you would send this to your error monitoring service
    // Examples:
    // - Send to Sentry
    // - Store in database
    // - Send to logging service
    // - Send email alerts for critical errors
    
    const errorReport = {
      ...errorData,
      serverTimestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || 'unknown',
    };
    
    // Example: Log to file or external service
    if (process.env.NODE_ENV === 'production') {
      // Here you would integrate with your monitoring service
      // await sendToMonitoringService(errorReport);
    }
    
    return NextResponse.json(
      { message: 'Error reported successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Failed to process error report:', error);
    return NextResponse.json(
      { message: 'Failed to process error report' },
      { status: 500 }
    );
  }
}