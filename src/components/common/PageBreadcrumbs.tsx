'use client';

import Link from 'next/link';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageBreadcrumbsProps {
  items: BreadcrumbItem[];
}

/**
 * Renders a small Hebrew breadcrumb row, right-aligned (RTL) inside a container.
 * The last item is shown as the current page (no link).
 */
export default function PageBreadcrumbs({ items }: PageBreadcrumbsProps) {
  return (
    <Box
      component="nav"
      aria-label="פירורי לחם"
      sx={{ py: { xs: 1.5, md: 2 } }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'flex-start',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 0.5,
            fontSize: { xs: '12px', md: '13px' },
          }}
        >
          {items.map((item, idx) => {
            const isLast = idx === items.length - 1;
            return (
              <Box
                key={`${item.label}-${idx}`}
                sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
              >
                {item.href && !isLast ? (
                  <Typography
                    component={Link}
                    href={item.href}
                    sx={(theme) => ({
                      color: theme.palette.brand.blue,
                      textDecoration: 'none',
                      fontWeight: 500,
                      '&:hover': { textDecoration: 'underline' },
                    })}
                  >
                    {item.label}
                  </Typography>
                ) : (
                  <Typography
                    sx={(theme) => ({
                      color: theme.palette.brand.blue,
                      fontWeight: 500,
                    })}
                  >
                    {item.label}
                  </Typography>
                )}
                {!isLast && (
                  <Typography
                    aria-hidden="true"
                    sx={(theme) => ({
                      color: theme.palette.brand.textMuted,
                      mx: 0.25,
                    })}
                  >
                    /
                  </Typography>
                )}
              </Box>
            );
          })}
        </Box>
      </Container>
    </Box>
  );
}
