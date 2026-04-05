import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import AiPrompt from '@/lib/models/AiPrompt';
import { verifyToken, getTokenFromRequest } from '@/lib/auth';
import { invalidatePromptCache } from '@/lib/prompts/getPrompt';

// ── GET /api/ai-prompts/[key] ───────────────────────────────────────
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> },
) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { key } = await params;
    await dbConnect();

    const prompt = await AiPrompt.findOne({ key }).lean();
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });
    }

    return NextResponse.json({ prompt }, { status: 200 });
  } catch (error) {
    console.error('Error fetching AI prompt:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ── PUT /api/ai-prompts/[key] ───────────────────────────────────────
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> },
) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { key } = await params;
    await dbConnect();

    const body = await request.json();

    // Only allow updating specific fields
    const updateFields: Record<string, unknown> = {};
    if (typeof body.content === 'string') updateFields.content = body.content;
    if (typeof body.label === 'string') updateFields.label = body.label;
    if (typeof body.description === 'string') updateFields.description = body.description;
    if (typeof body.isActive === 'boolean') updateFields.isActive = body.isActive;

    if (Object.keys(updateFields).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    // Auto-increment version if content changed
    const existingPrompt = await AiPrompt.findOne({ key });
    if (!existingPrompt) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });
    }

    if (updateFields.content && updateFields.content !== existingPrompt.content) {
      updateFields.version = (existingPrompt.version || 1) + 1;
    }

    updateFields.lastModifiedBy = (payload as { email?: string }).email || 'admin';

    const updated = await AiPrompt.findOneAndUpdate(
      { key },
      { $set: updateFields },
      { new: true, runValidators: true },
    ).lean();

    if (!updated) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });
    }

    // Invalidate the in-memory cache for this prompt
    invalidatePromptCache(key);

    return NextResponse.json({ prompt: updated }, { status: 200 });
  } catch (error) {
    console.error('Error updating AI prompt:', error);

    if (error instanceof Error && error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.message },
        { status: 400 },
      );
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
