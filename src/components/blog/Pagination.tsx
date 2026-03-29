'use client';

import Link from 'next/link';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  basePath: string;
}

export default function Pagination({ currentPage, totalPages, basePath }: PaginationProps) {
  const theme = useTheme();

  if (totalPages <= 1) return null;

  const getPageUrl = (page: number) => {
    if (page === 1) return basePath;
    return `${basePath}?page=${page}`;
  };

  const pages: (number | 'ellipsis')[] = [];
  const delta = 2;
  const rangeStart = Math.max(2, currentPage - delta);
  const rangeEnd = Math.min(totalPages - 1, currentPage + delta);

  pages.push(1);
  if (rangeStart > 2) pages.push('ellipsis');
  for (let i = rangeStart; i <= rangeEnd; i++) {
    pages.push(i);
  }
  if (rangeEnd < totalPages - 1) pages.push('ellipsis');
  if (totalPages > 1) pages.push(totalPages);

  const borderRadiusPx =
    typeof theme.shape.borderRadius === 'number' ? theme.shape.borderRadius : 8;

  const linkStyles: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '40px',
    height: '40px',
    padding: '0 12px',
    borderRadius: `${borderRadiusPx}px`,
    textDecoration: 'none',
    fontSize: '0.9rem',
    fontWeight: 500,
    transition: 'background-color 0.2s, color 0.2s',
  };

  const activeLinkStyles: React.CSSProperties = {
    ...linkStyles,
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
  };

  const inactiveLinkStyles: React.CSSProperties = {
    ...linkStyles,
    color: theme.palette.text.secondary,
    backgroundColor: theme.palette.action.hover,
  };

  const disabledStyles: React.CSSProperties = {
    ...linkStyles,
    color: theme.palette.action.disabled,
    cursor: 'default',
    pointerEvents: 'none',
  };

  return (
    <nav aria-label="ניווט עמודים" role="navigation">
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 1,
          mt: 6,
          mb: 4,
          flexWrap: 'wrap',
        }}
      >
        {currentPage > 1 ? (
          <Link
            href={getPageUrl(currentPage - 1)}
            style={inactiveLinkStyles}
            rel="prev"
            aria-label="לעמוד הקודם"
          >
            הקודם &rarr;
          </Link>
        ) : (
          <span style={disabledStyles} aria-disabled="true">
            הקודם &rarr;
          </span>
        )}

        {pages.map((page, idx) => {
          if (page === 'ellipsis') {
            return (
              <Typography
                key={`ellipsis-${idx}`}
                component="span"
                sx={{ px: 1, color: 'text.secondary' }}
              >
                ...
              </Typography>
            );
          }

          if (page === currentPage) {
            return (
              <span
                key={page}
                style={activeLinkStyles}
                aria-current="page"
                aria-label={`עמוד ${page}, עמוד נוכחי`}
              >
                {page}
              </span>
            );
          }

          return (
            <Link
              key={page}
              href={getPageUrl(page)}
              style={inactiveLinkStyles}
              aria-label={`לעמוד ${page}`}
            >
              {page}
            </Link>
          );
        })}

        {currentPage < totalPages ? (
          <Link
            href={getPageUrl(currentPage + 1)}
            style={inactiveLinkStyles}
            rel="next"
            aria-label="לעמוד הבא"
          >
            &larr; הבא
          </Link>
        ) : (
          <span style={disabledStyles} aria-disabled="true">
            &larr; הבא
          </span>
        )}
      </Box>
    </nav>
  );
}
