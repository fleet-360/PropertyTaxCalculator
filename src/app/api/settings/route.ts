import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Settings from '@/lib/models/Settings';
import { verifyToken, getTokenFromRequest } from '@/lib/auth';

// ── GET /api/settings ──────────────────────────────────────────────────
// Return current settings (singleton pattern via getSettings).
export async function GET() {
  try {
    await dbConnect();

    const settings = await Settings.getSettings();

    return NextResponse.json(settings, { status: 200 });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ── PUT /api/settings ──────────────────────────────────────────────────
// Update settings. Requires authentication.
export async function PUT(request: NextRequest) {
  try {
    // Verify authentication
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    await dbConnect();

    const body = await request.json();

    // Get or create the settings document, then update it
    const settings = await Settings.getSettings();

    const updatedSettings = await Settings.findByIdAndUpdate(
      settings._id,
      { $set: body },
      { new: true, runValidators: true }
    );

    if (!updatedSettings) {
      return NextResponse.json(
        { error: 'Failed to update settings' },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedSettings, { status: 200 });
  } catch (error) {
    console.error('Error updating settings:', error);

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
