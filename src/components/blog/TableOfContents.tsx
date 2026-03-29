'use client';

import { useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

interface TocBlock {
  id: string;
  type: string;
  data: Record<string, any>;
  order: number;
}

interface TableOfContentsProps {
  blocks: TocBlock[];
}

interface TocEntry {
  id: string;
  text: string;
  level: number;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim();
}

function getAnchorId(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/** Offset below fixed header when scrolling to a heading */
const SCROLL_TOP_PADDING_PX = 100;

export default function TableOfContents({ blocks }: TableOfContentsProps) {
  const headings = useMemo(() => {
    const entries: TocEntry[] = [];
    const sorted = [...blocks].sort((a, b) => a.order - b.order);

    for (const block of sorted) {
      if (block.type === 'heading' && block.data?.text) {
        const plainText = stripHtml(block.data.text);
        if (!plainText) continue;
        const levelStr = block.data.level || 'h2';
        const level = parseInt(levelStr.replace('h', ''), 10) || 2;
        entries.push({
          id: block.id as string,
          text: plainText,
          level,
        });
      }
    }

    return entries;
  }, [blocks]);

  if (headings.length < 2) return null;

  const minLevel = Math.min(...headings.map((h) => h.level));

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      const y =
        element.getBoundingClientRect().top + window.scrollY - SCROLL_TOP_PADDING_PX;
      window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
      window.history.pushState(null, '', `#${id}`);
    }
  };

  return (
    <Box
      component="nav"
      aria-label="תוכן עניינים"
      sx={{
        position: 'sticky',
        top: 100,
        p: 3,
        backgroundColor: '#f9fafb',
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        maxHeight: 'calc(100vh - 140px)',
        overflowY: 'auto',
      }}
    >
      <Typography
        variant="subtitle2"
        sx={{
          fontWeight: 700,
          mb: 2,
          textTransform: 'uppercase',
          fontSize: '0.7rem',
          letterSpacing: 1.5,
          color: 'text.secondary',
        }}
      >
        בעמוד זה
      </Typography>
      <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0 }}>
        {headings.map((heading, idx) => (
          <Box
            component="li"
            key={`${heading.id}-${idx}`}
            sx={{
              pl: (heading.level - minLevel) * 2,
              mb: 0.5,
            }}
          >
            <a
              href={`#${heading.id}`}
              onClick={(e) => handleClick(e, heading.id)}
              style={{
                display: 'block',
                padding: '4px 8px',
                fontSize: '0.85rem',
                lineHeight: 1.5,
                color: '#555',
                textDecoration: 'none',
                borderRadius: '4px',
                transition: 'color 0.2s, background-color 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#1976d2';
                e.currentTarget.style.backgroundColor = 'rgba(25, 118, 210, 0.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#555';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              {heading.text}
            </a>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
