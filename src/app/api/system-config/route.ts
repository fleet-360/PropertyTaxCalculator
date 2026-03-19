import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import SystemConfig from '@/lib/models/SystemConfig';
import { verifyToken, getTokenFromRequest } from '@/lib/auth';

// ── GET /api/system-config ───────────────────────────────────────────
// Return current system config (public, singleton pattern).
export async function GET() {
  try {
    await dbConnect();

    const config = await SystemConfig.getConfig();

    return NextResponse.json(config, { status: 200 });
  } catch (error) {
    console.error('Error fetching system config:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ── PUT /api/system-config ───────────────────────────────────────────
// Update system config (admin only).
export async function PUT(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    await dbConnect();

    const body = await request.json();

    // Get or create the config document, then update it
    const config = await SystemConfig.getConfig();

    const updatedConfig = await SystemConfig.findByIdAndUpdate(
      config._id,
      { $set: body },
      { new: true, runValidators: true }
    );

    if (!updatedConfig) {
      return NextResponse.json(
        { error: 'Failed to update system config' },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedConfig, { status: 200 });
  } catch (error) {
    console.error('Error updating system config:', error);

    if (error instanceof Error && error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
