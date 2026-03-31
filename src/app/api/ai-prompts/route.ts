import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import AiPrompt from '@/lib/models/AiPrompt';
import { verifyToken, getTokenFromRequest } from '@/lib/auth';

// ── GET /api/ai-prompts ─────────────────────────────────────────────
// List all AI prompts (admin only).
export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    await dbConnect();

    const prompts = await AiPrompt.find()
      .sort({ category: 1, key: 1 })
      .lean();

    return NextResponse.json({ prompts }, { status: 200 });
  } catch (error) {
    console.error('Error listing AI prompts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
