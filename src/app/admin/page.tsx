'use client';
import * as React from 'react';
import Link from 'next/link';
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
import Skeleton from '@mui/material/Skeleton';
import Alert from '@mui/material/Alert';
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

interface Post {
  _id: string;
  title: string;
  slug: string;
  status: 'draft' | 'published' | 'archived';
  category: string;
  author: string;
  createdAt: string;
  updatedAt: string;
}

interface PostsResponse {
  posts: Post[];
  total: number;
  page: number;
  totalPages: number;
}

const statusColorMap: Record<string, 'success' | 'warning' | 'default'> = {
  published: 'success',
  draft: 'warning',
  archived: 'default',
};

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  loading: boolean;
}

function StatCard({ title, value, icon, color, loading }: StatCardProps) {
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
            {loading ? (
              <Skeleton width={60} height={40} />
            ) : (
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {value}
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: '12px',
              backgroundColor: `${color}15`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: color,
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const [posts, setPosts] = React.useState<Post[]>([]);
  const [stats, setStats] = React.useState({
    total: 0,
    published: 0,
    cities: 0,
    activeCoupons: 0,
    totalCustomers: 0,
    newContacts: 0,
    systemEnabled: false,
    paymentEnabled: false,
  });
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError('');

        const [postsRes, couponsRes, customersRes, contactRes, systemRes, citiesRes] =
          await Promise.all([
            fetch('/api/posts?page=1&limit=5'),
            fetch('/api/coupons'),
            fetch('/api/customers?limit=1'),
            fetch('/api/contact?limit=1&status=new'),
            fetch('/api/system-config'),
            fetch('/api/cities?all=true'),
          ]);

        if (!postsRes.ok) throw new Error('Failed to fetch posts');
        const postsData: PostsResponse = await postsRes.json();
        setPosts(postsData.posts);

        const publishedCount = postsData.posts.filter((p) => p.status === 'published').length;

        let citiesCount = 0;
        if (citiesRes.ok) {
          const citiesData = await citiesRes.json();
          citiesCount = citiesData.cities?.length ?? 0;
        }

        let activeCoupons = 0;
        if (couponsRes.ok) {
          const couponsData = await couponsRes.json();
          activeCoupons = couponsData.coupons?.length ?? 0;
        }

        let totalCustomers = 0;
        if (customersRes.ok) {
          const customersData = await customersRes.json();
          totalCustomers = customersData.total ?? 0;
        }

        let newContacts = 0;
        if (contactRes.ok) {
          const contactData = await contactRes.json();
          newContacts = contactData.total ?? 0;
        }

        let systemEnabled = false;
        let paymentEnabled = false;
        if (systemRes.ok) {
          const systemData = await systemRes.json();
          systemEnabled = systemData.systemEnabled ?? false;
          paymentEnabled = systemData.paymentEnabled ?? false;
        }

        setStats({
          total: postsData.total,
          published: publishedCount,
          cities: citiesCount,
          activeCoupons,
          totalCustomers,
          newContacts,
          systemEnabled,
          paymentEnabled,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const statCards: StatCardProps[] = [
    { title: 'Total Posts', value: stats.total, icon: <ArticleIcon />, color: '#1976d2', loading },
    { title: 'Published', value: stats.published, icon: <PublishIcon />, color: '#2e7d32', loading },
    { title: 'Cities', value: stats.cities, icon: <LocationCityIcon />, color: '#9c27b0', loading },
    { title: 'Active Coupons', value: stats.activeCoupons, icon: <LocalOfferIcon />, color: '#ff9800', loading },
    { title: 'Total Customers', value: stats.totalCustomers, icon: <PeopleIcon />, color: '#00bcd4', loading },
    { title: 'New Contacts', value: stats.newContacts, icon: <ContactMailIcon />, color: '#f44336', loading },
    {
      title: 'System Status',
      value: stats.systemEnabled ? '\u05E4\u05E2\u05D9\u05DC' : '\u05DE\u05D5\u05E9\u05D1\u05EA',
      icon: <PowerSettingsNewIcon />,
      color: stats.systemEnabled ? '#4caf50' : '#f44336',
      loading,
    },
    {
      title: 'Payment Status',
      value: stats.paymentEnabled ? '\u05E4\u05E2\u05D9\u05DC' : '\u05DE\u05D5\u05E9\u05D1\u05EA',
      icon: <PaymentIcon />,
      color: stats.paymentEnabled ? '#4caf50' : '#f44336',
      loading,
    },
  ];

  return (
    <Box>
      {/* Page header */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a1a1a' }}>
            Dashboard
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            Welcome back. Here is an overview of your site.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            variant="outlined"
            startIcon={<OpenInNewIcon />}
            href="/"
            target="_blank"
            sx={{ borderColor: '#e0e0e0', color: '#555' }}
          >
            View Site
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            component={Link}
            href="/admin/posts/new"
          >
            New Post
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            component={Link}
            href="/admin/cities/new"
            color="secondary"
          >
            New City
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statCards.map((stat) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={stat.title}>
            <StatCard {...stat} />
          </Grid>
        ))}
      </Grid>

      {/* Recent Posts */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ px: 3, py: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Recent Posts
            </Typography>
            <Button
              size="small"
              component={Link}
              href="/admin/posts"
            >
              View All
            </Button>
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Title</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Category</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton width="60%" /></TableCell>
                      <TableCell><Skeleton width={80} /></TableCell>
                      <TableCell><Skeleton width={80} /></TableCell>
                      <TableCell><Skeleton width={100} /></TableCell>
                    </TableRow>
                  ))
                ) : posts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 6 }}>
                      <Typography variant="body2" color="text.secondary">
                        No posts yet. Create your first post to get started.
                      </Typography>
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<AddIcon />}
                        component={Link}
                        href="/admin/posts/new"
                        sx={{ mt: 2 }}
                      >
                        Create Post
                      </Button>
                    </TableCell>
                  </TableRow>
                ) : (
                  posts.map((post) => (
                    <TableRow
                      key={post._id}
                      hover
                      sx={{ '&:last-child td': { border: 0 } }}
                    >
                      <TableCell>
                        <Typography
                          component={Link}
                          href={`/admin/posts/${post._id}/edit`}
                          sx={{
                            color: '#1a1a1a',
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
                          label={post.status.charAt(0).toUpperCase() + post.status.slice(1)}
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
                          {new Date(post.createdAt).toLocaleDateString('en-US', {
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
