import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Post from '@/lib/models/Post';
import { verifyToken, getTokenFromRequest } from '@/lib/auth';
import slugify from 'slugify';
import mongoose from 'mongoose';

type RouteParams = { params: Promise<{ id: string }> };

// ── POST /api/posts/[id]/duplicate ─────────────────────────────────────
// Duplicate an existing post. Requires authentication.
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
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

    const { id } = await params;

    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid post ID format' },
        { status: 400 }
      );
    }

    // Find the original post
    const originalPost = await Post.findById(id).lean();

    if (!originalPost) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // Create a copy, removing fields that should not be duplicated
    const { _id, createdAt, updatedAt, ...postData } = originalPost as unknown as Record<string, unknown>;

    // Set new title and reset status
    const newTitle = `Copy of ${postData.title}`;
    postData.title = newTitle;
    postData.status = 'draft';
    postData.publishedAt = undefined;

    // Generate a new unique slug
    let baseSlug = slugify(newTitle, {
      lower: true,
      strict: true,
      trim: true,
    });

    let slug = baseSlug;
    let slugExists = await Post.findOne({ slug });
    let counter = 1;

    while (slugExists) {
      slug = `${baseSlug}-${counter}`;
      slugExists = await Post.findOne({ slug });
      counter++;
    }

    postData.slug = slug;

    // Create the duplicate post
    const newPost = await Post.create(postData);

    return NextResponse.json(newPost, { status: 201 });
  } catch (error) {
    console.error('Error duplicating post:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
