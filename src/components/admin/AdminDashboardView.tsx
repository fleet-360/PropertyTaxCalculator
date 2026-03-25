'use client';

import * as React from 'react';
import Link from 'next/link';
import { alpha, useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Chip from '@mui/material/Chip';
import ArticleIcon from '@mui/icons-material/Article';
import PublishIcon from '@mui/icons-material/Publish';
import LocationCityIcon from '@mui/icons-material/LocationCity';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import PeopleIcon from '@mui/icons-material/People';
import ContactMailIcon from '@mui/icons-material/ContactMail';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import PaymentIcon from '@mui/icons-material/Payment';
import AddIcon from '@mui/icons-material/Add';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import type { PostListItem } from '@/lib/types/post';
import type { DashboardStats } from '@/lib/admin/getAdminDashboardData';
import type { StatCardProps, StatPaletteColor } from '@/lib/types/admin';

const statusColorMap: Record<string, 'success' | 'warning' | 'default'> = {
  published: 'success',
  draft: 'warning',
  archived: 'default',
};

const statusLabelHe: Record<string, string> = {
  published: 'מפורסם',
  draft: 'טיוטה',
  archived: 'בארכיון',
};

function StatCard({ title, value, icon, color }: StatCardProps) {
  const theme = useTheme();
  const main = theme.palette[color].main;

  return (
    <Card
      sx={{
        height: '100%',
        position: 'relative',
        overflow: 'visible',
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box>
            <Typography
              variant="body2"
              sx={{ color: 'text.secondary', fontWeight: 500, mb: 0.5 }}
            >
              {title}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              {value}
            </Typography>
          </Box>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: '12px',
              backgroundColor: alpha(main, 0.12),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: main,
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

export interface AdminDashboardViewProps {
  posts: PostListItem[];
  stats: DashboardStats;
}

export default function AdminDashboardView({ posts, stats }: AdminDashboardViewProps) {
  const statCards: StatCardProps[] = [
    { title: 'סה״כ מאמרים', value: stats.total, icon: <ArticleIcon />, color: 'primary' },
    { title: 'מפורסמים', value: stats.published, icon: <PublishIcon />, color: 'success' },
    { title: 'ערים', value: stats.cities, icon: <LocationCityIcon />, color: 'secondary' },
    { title: 'קופונים פעילים', value: stats.activeCoupons, icon: <LocalOfferIcon />, color: 'warning' },
    { title: 'לקוחות', value: stats.totalCustomers, icon: <PeopleIcon />, color: 'primary' },
    { title: 'פניות חדשות', value: stats.newContacts, icon: <ContactMailIcon />, color: 'error' },
    {
      title: 'סטטוס מערכת',
      value: stats.systemEnabled ? 'פעיל' : 'מושבת',
      icon: <PowerSettingsNewIcon />,
      color: (stats.systemEnabled ? 'success' : 'error') as StatPaletteColor,
    },
    {
      title: 'סטטוס תשלום',
      value: stats.paymentEnabled ? 'פעיל' : 'מושבת',
      icon: <PaymentIcon />,
      color: (stats.paymentEnabled ? 'success' : 'error') as StatPaletteColor,
    },
  ];

  return (
    <Box>
      <Box
        sx={{
          mb: 4,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary' }}>
            לוח בקרה
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            סקירה כללית של האתר והמערכת
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            startIcon={<OpenInNewIcon />}
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            sx={{ borderColor: 'divider', color: 'text.secondary' }}
            aria-label="פתיחת האתר בלשונית חדשה"
          >
            צפייה באתר
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            component={Link}
            href="/admin/posts/new"
          >
            מאמר חדש
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            component={Link}
            href="/admin/cities/new"
            color="secondary"
          >
            עיר חדשה
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statCards.map((stat) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={stat.title}>
            <StatCard {...stat} />
          </Grid>
        ))}
      </Grid>

      <Card>
        <CardContent sx={{ p: 0 }}>
          <Box
            sx={{
              px: 3,
              py: 2.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              מאמרים אחרונים
            </Typography>
            <Button size="small" component={Link} href="/admin/posts">
              הצג הכל
            </Button>
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>כותרת</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>סטטוס</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>קטגוריה</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>תאריך</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {posts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 6 }}>
                      <Typography variant="body2" color="text.secondary">
                        אין עדיין מאמרים. צור את המאמר הראשון כדי להתחיל.
                      </Typography>
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<AddIcon />}
                        component={Link}
                        href="/admin/posts/new"
                        sx={{ mt: 2 }}
                      >
                        צור מאמר
                      </Button>
                    </TableCell>
                  </TableRow>
                ) : (
                  posts.map((post) => (
                    <TableRow key={post._id} hover sx={{ '&:last-child td': { border: 0 } }}>
                      <TableCell>
                        <Typography
                          component={Link}
                          href={`/admin/posts/${post._id}/edit`}
                          sx={{
                            color: 'text.primary',
                            fontWeight: 500,
                            textDecoration: 'none',
                            '&:hover': { color: 'primary.main' },
                          }}
                        >
                          {post.title}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={statusLabelHe[post.status] ?? post.status}
                          color={statusColorMap[post.status]}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {post.category}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {new Date(post.createdAt).toLocaleDateString('he-IL', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
}
