import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Post from '@/lib/models/Post';
import { verifyToken, getTokenFromRequest } from '@/lib/auth';
import slugify from 'slugify';

// ── GET /api/posts ─────────────────────────────────────────────────────
// List posts with pagination, search, filtering, and sorting.
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);

    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '10', 10)));
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const category = searchParams.get('category') || '';
    const sort = searchParams.get('sort') || '-createdAt';

    // Build filter query
    const filter: Record<string, unknown> = {};

    if (search) {
      filter.title = { $regex: search, $options: 'i' };
    }

    if (status) {
      filter.status = status;
    }

    if (category) {
      filter.category = category;
    }

    // Build sort object from sort string (e.g., "-createdAt" or "title")
    const sortObj: Record<string, 1 | -1> = {};
    if (sort.startsWith('-')) {
      sortObj[sort.substring(1)] = -1;
    } else {
      sortObj[sort] = 1;
    }

    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      Post.find(filter)
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .lean(),
      Post.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json(
      { posts, total, page, totalPages },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error listing posts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ── POST /api/posts ────────────────────────────────────────────────────
// Create a new post. Requires authentication.
export async function POST(request: NextRequest) {
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

    // Auto-generate slug from title if not provided
    if (!body.slug && body.title) {
      body.slug = slugify(body.title, {
        lower: true,
        strict: true,
        trim: true,
      });
    }

    // Handle slug uniqueness: if slug exists, append -1, -2, etc.
    if (body.slug) {
      let slug = body.slug;
      let slugExists = await Post.findOne({ slug });
      let counter = 1;

      while (slugExists) {
        slug = `${body.slug}-${counter}`;
        slugExists = await Post.findOne({ slug });
        counter++;
      }

      body.slug = slug;
    }

    // Set publishedAt to now if status is 'published'
    if (body.status === 'published' && !body.publishedAt) {
      body.publishedAt = new Date();
    }

    const post = await Post.create(body);

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error('Error creating post:', error);

    // Handle Mongoose validation errors
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
