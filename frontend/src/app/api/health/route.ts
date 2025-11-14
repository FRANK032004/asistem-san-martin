/**
 * ============================================================
 * HEALTH CHECK API - Frontend Next.js
 * ============================================================
 */

import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Verificar conexión con backend
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    
    let backendStatus = 'unknown';
    try {
      const response = await fetch(`${backendUrl}/health`, {
        method: 'GET',
        cache: 'no-store',
        signal: AbortSignal.timeout(5000), // 5 segundos timeout
      });
      backendStatus = response.ok ? 'healthy' : 'unhealthy';
    } catch {
      backendStatus = 'unreachable';
    }

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'frontend',
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      backend: {
        status: backendStatus,
        url: backendUrl,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        service: 'frontend',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
