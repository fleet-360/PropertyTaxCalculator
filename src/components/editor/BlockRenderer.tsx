import React from 'react';
import {
  BlockData,
  HeadingData,
  ParagraphData,
  ImageData,
  VideoData,
  HtmlData,
  QuoteData,
  ListData,
  DividerData,
  ButtonData,
  SpacerData,
  normalizeBlockTextAlignment,
} from './types';
import { headingPlainTextToAnchorId } from '@/lib/headingAnchorId';

interface BlockRendererProps {
  blocks: BlockData[];
}

/**
 * Parses YouTube and Vimeo URLs and returns an embeddable URL.
 */
function parseVideoUrl(url: string): string | null {
  if (!url) return null;

  const youtubePatterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of youtubePatterns) {
    const match = url.match(pattern);
    if (match) {
      return `https://www.youtube.com/embed/${match[1]}`;
    }
  }

  const vimeoMatch = url.match(/(?:vimeo\.com\/)(\d+)/);
  if (vimeoMatch) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  }

  if (url.includes('embed') || url.includes('player')) {
    return url;
  }

  return null;
}

function RenderHeading({ data }: { data: HeadingData }) {
  const Tag = (data.level || 'h2') as keyof React.JSX.IntrinsicElements;
  const style: React.CSSProperties = {
    textAlign: normalizeBlockTextAlignment(data.alignment),
  };
  if (data.color && data.color !== '#000000') {
    style.color = data.color;
  }

  // Generate an id from heading text for anchor linking (same rules as TableOfContents)
  const plainHeading = data.text ? data.text.replace(/<[^>]*>/g, '').trim() : '';
  const anchor = plainHeading ? headingPlainTextToAnchorId(plainHeading) : '';
  const id = anchor || undefined;

  return <Tag id={id} style={style}>{data.text}</Tag>;
}

function RenderParagraph({ data }: { data: ParagraphData }) {
  const style: React.CSSProperties = {
    lineHeight: 1.7,
    textAlign: normalizeBlockTextAlignment(data.alignment),
  };
  if (data.fontSize && data.fontSize !== 16) {
    style.fontSize = `${data.fontSize}px`;
  }
  return (
    <div dir="rtl" lang="he" style={style} dangerouslySetInnerHTML={{ __html: data.html }} />
  );
}

function RenderImage({ data }: { data: ImageData }) {
  if (!data.url) return null;

  const figureStyle: React.CSSProperties = {
    margin: '1.5rem 0',
    textAlign: normalizeBlockTextAlignment(data.alignment, { defaultAlign: 'center' }),
  };

  const img = (
    <img
      src={data.url}
      alt={data.alt || ''}
      title={data.title || undefined}
      loading={data.loading || 'lazy'}
      style={{
        maxWidth: '100%',
        width: data.width || '100%',
        height: 'auto',
        borderRadius: '8px',
      }}
    />
  );

  const wrappedImg = data.link ? (
    <a href={data.link} target="_blank" rel="noopener noreferrer">
      {img}
    </a>
  ) : (
    img
  );

  return (
    <figure className="blog-image" style={figureStyle}>
      {wrappedImg}
      {data.caption && (
        <figcaption
          style={{
            textAlign: 'center',
            fontSize: '0.875rem',
            color: '#666',
            marginTop: '0.5rem',
            fontStyle: 'italic',
          }}
        >
          {data.caption}
        </figcaption>
      )}
    </figure>
  );
}

function RenderVideo({ data }: { data: VideoData }) {
  const embedUrl = parseVideoUrl(data.url);
  if (!embedUrl) return null;

  return (
    <figure className="blog-video" style={{ margin: '1.5rem 0' }}>
      <div
        style={{
          position: 'relative',
          width: '100%',
          paddingBottom: '56.25%',
          height: 0,
          overflow: 'hidden',
          borderRadius: '8px',
        }}
      >
        <iframe
          src={embedUrl}
          title={data.iframeTitle || 'Embedded video'}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            border: 'none',
          }}
        />
      </div>
      {data.caption && (
        <figcaption
          style={{
            textAlign: 'center',
            fontSize: '0.875rem',
            color: '#666',
            marginTop: '0.5rem',
            fontStyle: 'italic',
          }}
        >
          {data.caption}
        </figcaption>
      )}
    </figure>
  );
}

function RenderHtml({ data }: { data: HtmlData }) {
  if (!data.code) return null;
  return (
    <div
      className="blog-html"
      dangerouslySetInnerHTML={{ __html: data.code }}
    />
  );
}

function RenderQuote({ data }: { data: QuoteData }) {
  const isBordered = data.style === 'bordered';
  return (
    <blockquote
      className={`blog-quote blog-quote--${data.style}`}
      style={{
        margin: '1.5rem 0',
        padding: '1rem 1.5rem',
        borderLeft: isBordered ? '4px solid #1976d2' : 'none',
        backgroundColor: isBordered ? '#f8f9fa' : 'transparent',
        borderRadius: isBordered ? '0 8px 8px 0' : 0,
        fontStyle: 'italic',
        color: '#555',
      }}
    >
      <p>{data.text}</p>
      {data.author && (
        <cite
          style={{
            display: 'block',
            marginTop: '0.5rem',
            fontStyle: 'normal',
            fontWeight: 600,
            fontSize: '0.9rem',
            color: '#777',
          }}
        >
          &mdash; {data.author}
        </cite>
      )}
    </blockquote>
  );
}

function RenderList({ data }: { data: ListData }) {
  const Tag = data.type === 'ordered' ? 'ol' : 'ul';
  return (
    <Tag className="blog-list">
      {data.items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </Tag>
  );
}

function RenderDivider({ data }: { data: DividerData }) {
  const d = data || {};
  return (
    <hr
      className="blog-divider"
      style={{
        border: 'none',
        borderTop: `2px ${d.style || 'solid'} ${d.color || '#ccc'}`,
        width: d.width || '100%',
        margin: '2rem auto',
      }}
    />
  );
}

function RenderButton({ data: rawData }: { data: ButtonData }) {
  const data = rawData || {} as ButtonData;
  const isFilled = data.style === 'filled';
  const color = data.color || '#1976d2';

  const sizeMap: Record<string, React.CSSProperties> = {
    small: { padding: '6px 16px', fontSize: '0.875rem' },
    medium: { padding: '8px 24px', fontSize: '1rem' },
    large: { padding: '12px 32px', fontSize: '1.125rem' },
  };
  const sizeStyle = sizeMap[data.size || 'medium'] || sizeMap.medium;

  const baseStyle: React.CSSProperties = {
    display: 'inline-block',
    ...sizeStyle,
    backgroundColor: isFilled ? color : 'transparent',
    color: isFilled ? '#ffffff' : color,
    border: isFilled ? 'none' : `2px solid ${color}`,
    borderRadius: '6px',
    textDecoration: 'none',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'opacity 0.2s',
  };

  const relAttr = [
    data.rel,
    data.target === '_blank' ? 'noopener' : '',
  ]
    .filter(Boolean)
    .join(' ')
    .trim() || undefined;

  if (data.tag === 'button') {
    return (
      <div className="blog-button-wrapper" style={{ textAlign: 'center', margin: '1rem 0' }}>
        <button type="button" style={baseStyle} className="blog-button">
          {data.text || 'Button'}
        </button>
      </div>
    );
  }

  return (
    <div className="blog-button-wrapper" style={{ textAlign: 'center', margin: '1rem 0' }}>
      <a
        href={data.url || '#'}
        target={data.target || '_self'}
        rel={relAttr}
        style={baseStyle}
        className="blog-button"
      >
        {data.text || 'Button'}
      </a>
    </div>
  );
}

function RenderSpacer({ data }: { data: SpacerData }) {
  return (
    <div
      className="blog-spacer"
      style={{ height: `${data.height || 40}px` }}
      aria-hidden="true"
    />
  );
}

function renderBlock(block: BlockData) {
  const data = block.data || {};
  switch (block.type) {
    case 'heading':
      return <RenderHeading data={data as HeadingData} />;
    case 'paragraph':
      return <RenderParagraph data={data as ParagraphData} />;
    case 'image':
      return <RenderImage data={data as ImageData} />;
    case 'video':
      return <RenderVideo data={data as VideoData} />;
    case 'html':
      return <RenderHtml data={data as HtmlData} />;
    case 'quote':
      return <RenderQuote data={data as QuoteData} />;
    case 'list':
      return <RenderList data={data as ListData} />;
    case 'divider':
      return <RenderDivider data={data as DividerData} />;
    case 'button':
      return <RenderButton data={data as ButtonData} />;
    case 'spacer':
      return <RenderSpacer data={data as SpacerData} />;
    default:
      return null;
  }
}

/**
 * BlockRenderer -- renders blocks as semantic HTML for the public-facing blog view.
 * This component does NOT use MUI. It outputs clean, semantic HTML wrapped in
 * a `.blog-content` container that can be styled with a separate stylesheet.
 *
 * This component is suitable for SSR (no 'use client' directive).
 */
export default function BlockRenderer({ blocks }: BlockRendererProps) {
  const sortedBlocks = [...blocks].sort((a, b) => a.order - b.order);

  return (
    <article className="blog-content">
      {sortedBlocks.map((block) => (
        <div key={block.id} id={block.id as string} className={`blog-block blog-block--${block.type}`}>
          {renderBlock(block)}
        </div>
      ))}
    </article>
  );
}
