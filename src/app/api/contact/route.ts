import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import ContactRequest from '@/lib/models/ContactRequest';

// ── POST /api/contact ────────────────────────────────────────────────
// Create a new contact request (public).
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();

    const contactRequest = await ContactRequest.create(body);

    return NextResponse.json(
      { success: true, id: contactRequest._id },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating contact request:', error);

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
