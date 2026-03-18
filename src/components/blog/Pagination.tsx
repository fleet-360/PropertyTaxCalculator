import Link from 'next/link';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  basePath: string;
}

export default function Pagination({ currentPage, totalPages, basePath }: PaginationProps) {
  if (totalPages <= 1) return null;

  const getPageUrl = (page: number) => {
    if (page === 1) return basePath;
    return `${basePath}?page=${page}`;
  };

  // Build page numbers to show
  const pages: (number | 'ellipsis')[] = [];
  const delta = 2; // pages around current
  const rangeStart = Math.max(2, currentPage - delta);
  const rangeEnd = Math.min(totalPages - 1, currentPage + delta);

  pages.push(1);
  if (rangeStart > 2) pages.push('ellipsis');
  for (let i = rangeStart; i <= rangeEnd; i++) {
    pages.push(i);
  }
  if (rangeEnd < totalPages - 1) pages.push('ellipsis');
  if (totalPages > 1) pages.push(totalPages);

  const linkStyles: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '40px',
    height: '40px',
    padding: '0 12px',
    borderRadius: '8px',
    textDecoration: 'none',
    fontSize: '0.9rem',
    fontWeight: 500,
    transition: 'background-color 0.2s, color 0.2s',
  };

  const activeLinkStyles: React.CSSProperties = {
    ...linkStyles,
    backgroundColor: '#1976d2',
    color: '#fff',
  };

  const inactiveLinkStyles: React.CSSProperties = {
    ...linkStyles,
    color: '#555',
    backgroundColor: '#f5f5f5',
  };

  const disabledStyles: React.CSSProperties = {
    ...linkStyles,
    color: '#ccc',
    cursor: 'default',
    pointerEvents: 'none',
  };

  return (
    <nav aria-label="Pagination" role="navigation">
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
        {/* Previous */}
        {currentPage > 1 ? (
          <Link
            href={getPageUrl(currentPage - 1)}
            style={inactiveLinkStyles}
            rel="prev"
            aria-label="Go to previous page"
          >
            &larr; Previous
          </Link>
        ) : (
          <span style={disabledStyles} aria-disabled="true">
            &larr; Previous
          </span>
        )}

        {/* Page Numbers */}
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
                aria-label={`Page ${page}, current page`}
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
              aria-label={`Go to page ${page}`}
            >
              {page}
            </Link>
          );
        })}

        {/* Next */}
        {currentPage < totalPages ? (
          <Link
            href={getPageUrl(currentPage + 1)}
            style={inactiveLinkStyles}
            rel="next"
            aria-label="Go to next page"
          >
            Next &rarr;
          </Link>
        ) : (
          <span style={disabledStyles} aria-disabled="true">
            Next &rarr;
          </span>
        )}
      </Box>
    </nav>
  );
}
