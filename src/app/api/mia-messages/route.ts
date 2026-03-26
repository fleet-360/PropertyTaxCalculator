import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import MiaMessage from '@/lib/models/MiaMessage';
import { verifyToken, getTokenFromRequest } from '@/lib/auth';

// ── GET /api/mia-messages ────────────────────────────────────────────
// Public: returns all active messages.
// With ?all=true + admin auth: returns all messages (including inactive).
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const all = searchParams.get('all') === 'true';

    if (all) {
      const token = getTokenFromRequest(request);
      if (!token || !verifyToken(token)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      const messages = await MiaMessage.find().sort({ messageId: 1 }).lean();
      return NextResponse.json({ messages }, { status: 200 });
    }

    const messages = await MiaMessage.find({ isActive: true })
      .select('messageId title description')
      .lean();

    return NextResponse.json({ messages }, { status: 200 });
  } catch (error) {
    console.error('Error listing mia messages:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ── POST /api/mia-messages ───────────────────────────────────────────
// Admin only: create a new message.
export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token || !verifyToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const body = await request.json();
    const message = await MiaMessage.create(body);
    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error('Error creating mia message:', error);

    if (error instanceof Error && error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.message },
        { status: 400 },
      );
    }

    if (
      error instanceof Error &&
      'code' in error &&
      (error as Record<string, unknown>).code === 11000
    ) {
      return NextResponse.json(
        { error: 'Message with this messageId already exists' },
        { status: 409 },
      );
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ── PUT /api/mia-messages ────────────────────────────────────────────
// Admin only: update a message by messageId (passed in body).
export async function PUT(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token || !verifyToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const body = await request.json();
    const { messageId, ...updates } = body;

    if (!messageId) {
      return NextResponse.json({ error: 'messageId is required' }, { status: 400 });
    }

    const updated = await MiaMessage.findOneAndUpdate(
      { messageId },
      { $set: updates },
      { new: true },
    );

    if (!updated) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error('Error updating mia message:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
