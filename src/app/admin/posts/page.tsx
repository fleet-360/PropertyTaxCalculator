'use client';
import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import InputAdornment from '@mui/material/InputAdornment';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TablePagination from '@mui/material/TablePagination';
import TableSortLabel from '@mui/material/TableSortLabel';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import Checkbox from '@mui/material/Checkbox';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Skeleton from '@mui/material/Skeleton';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import Menu from '@mui/material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

interface Post {
  _id: string;
  title: string;
  slug: string;
  excerpt?: string;
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

type SortField = 'title' | 'status' | 'category' | 'author' | 'createdAt';
type SortDirection = 'asc' | 'desc';

const statusColorMap: Record<string, 'success' | 'warning' | 'default'> = {
  published: 'success',
  draft: 'warning',
  archived: 'default',
};

export default function PostsListPage() {
  const router = useRouter();

  // Data state
  const [posts, setPosts] = React.useState<Post[]>([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  // Filters state
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('');
  const [categoryFilter, setCategoryFilter] = React.useState('');
  const [categories, setCategories] = React.useState<string[]>([]);

  // Pagination
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);

  // Sorting
  const [sortField, setSortField] = React.useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = React.useState<SortDirection>('desc');

  // Selection
  const [selected, setSelected] = React.useState<string[]>([]);

  // Dialogs
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<{ id: string; title: string } | null>(null);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = React.useState(false);

  // Bulk actions menu
  const [bulkMenuAnchor, setBulkMenuAnchor] = React.useState<null | HTMLElement>(null);

  // Snackbar
  const [snackbar, setSnackbar] = React.useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // Debounced search
  const searchTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const [debouncedSearch, setDebouncedSearch] = React.useState('');

  React.useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(0);
    }, 400);
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [search]);

  // Fetch posts
  const fetchPosts = React.useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams({
        page: String(page + 1),
        limit: String(rowsPerPage),
        sort: `${sortField}:${sortDirection}`,
      });

      if (debouncedSearch) params.set('search', debouncedSearch);
      if (statusFilter) params.set('status', statusFilter);
      if (categoryFilter) params.set('category', categoryFilter);

      const res = await fetch(`/api/posts?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch posts');

      const data: PostsResponse = await res.json();
      setPosts(data.posts);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, debouncedSearch, statusFilter, categoryFilter, sortField, sortDirection]);

  React.useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Fetch categories for filter
  React.useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch('/api/posts?page=1&limit=200');
        if (res.ok) {
          const data: PostsResponse = await res.json();
          const cats = [...new Set(data.posts.map((p) => p.category).filter(Boolean))];
          setCategories(cats);
        }
      } catch {
        // Silently fail — category filter just won't have options
      }
    }
    fetchCategories();
  }, []);

  // Handlers
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setPage(0);
  };

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelected(posts.map((p) => p._id));
    } else {
      setSelected([]);
    }
  };

  const handleSelectOne = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/posts/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete post');
      setSnackbar({ open: true, message: 'Post deleted successfully', severity: 'success' });
      setSelected((prev) => prev.filter((s) => s !== id));
      fetchPosts();
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to delete post', severity: 'error' });
    }
  };

  const handleBulkDelete = async () => {
    try {
      const results = await Promise.allSettled(
        selected.map((id) => fetch(`/api/posts/${id}`, { method: 'DELETE' }))
      );
      const failed = results.filter((r) => r.status === 'rejected').length;
      if (failed > 0) {
        setSnackbar({ open: true, message: `Deleted ${selected.length - failed} posts, ${failed} failed`, severity: 'warning' as 'error' });
      } else {
        setSnackbar({ open: true, message: `${selected.length} post(s) deleted successfully`, severity: 'success' });
      }
      setSelected([]);
      fetchPosts();
    } catch {
      setSnackbar({ open: true, message: 'Failed to delete posts', severity: 'error' });
    }
    setBulkDeleteDialogOpen(false);
  };

  const handleBulkStatusChange = async (newStatus: string) => {
    try {
      await Promise.all(
        selected.map((id) =>
          fetch(`/api/posts/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus }),
          })
        )
      );
      setSnackbar({ open: true, message: `Status updated for ${selected.length} post(s)`, severity: 'success' });
      setSelected([]);
      fetchPosts();
    } catch {
      setSnackbar({ open: true, message: 'Failed to update status', severity: 'error' });
    }
    setBulkMenuAnchor(null);
  };

  const handleDuplicate = async (id: string) => {
    try {
      const res = await fetch(`/api/posts/${id}/duplicate`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to duplicate post');
      setSnackbar({ open: true, message: 'Post duplicated successfully', severity: 'success' });
      fetchPosts();
    } catch {
      setSnackbar({ open: true, message: 'Failed to duplicate post', severity: 'error' });
    }
  };

  const isSelected = (id: string) => selected.includes(id);
  const allSelected = posts.length > 0 && selected.length === posts.length;
  const someSelected = selected.length > 0 && selected.length < posts.length;

  return (
    <Box>
      {/* Page Header */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a1a1a' }}>
            Posts
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            Manage your blog posts
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          component={Link}
          href="/admin/posts/new"
        >
          New Post
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Filters Bar */}
      <Paper sx={{ p: 2, mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          placeholder="Search posts..."
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
            },
          }}
          sx={{ minWidth: 250, flex: 1 }}
        />
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Status</InputLabel>
          <Select
            label="Status"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(0);
            }}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="draft">Draft</MenuItem>
            <MenuItem value="published">Published</MenuItem>
            <MenuItem value="archived">Archived</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Category</InputLabel>
          <Select
            label="Category"
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(0);
            }}
          >
            <MenuItem value="">All Categories</MenuItem>
            {categories.map((cat) => (
              <MenuItem key={cat} value={cat}>
                {cat}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Paper>

      {/* Bulk actions bar */}
      {selected.length > 0 && (
        <Paper
          sx={{
            p: 1.5,
            mb: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            backgroundColor: 'primary.main',
            color: '#fff',
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 500, pl: 1 }}>
            {selected.length} selected
          </Typography>
          <Button
            size="small"
            variant="outlined"
            sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.5)' }}
            onClick={(e) => setBulkMenuAnchor(e.currentTarget)}
          >
            Change Status
          </Button>
          <Button
            size="small"
            variant="outlined"
            startIcon={<DeleteIcon />}
            sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.5)' }}
            onClick={() => setBulkDeleteDialogOpen(true)}
          >
            Delete
          </Button>
          <Menu
            anchorEl={bulkMenuAnchor}
            open={Boolean(bulkMenuAnchor)}
            onClose={() => setBulkMenuAnchor(null)}
          >
            <MenuItem onClick={() => handleBulkStatusChange('draft')}>Draft</MenuItem>
            <MenuItem onClick={() => handleBulkStatusChange('published')}>Published</MenuItem>
            <MenuItem onClick={() => handleBulkStatusChange('archived')}>Archived</MenuItem>
          </Menu>
        </Paper>
      )}

      {/* Posts Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={someSelected}
                    checked={allSelected}
                    onChange={handleSelectAll}
                  />
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortField === 'title'}
                    direction={sortField === 'title' ? sortDirection : 'asc'}
                    onClick={() => handleSort('title')}
                  >
                    Title
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortField === 'status'}
                    direction={sortField === 'status' ? sortDirection : 'asc'}
                    onClick={() => handleSort('status')}
                  >
                    Status
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortField === 'category'}
                    direction={sortField === 'category' ? sortDirection : 'asc'}
                    onClick={() => handleSort('category')}
                  >
                    Category
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortField === 'author'}
                    direction={sortField === 'author' ? sortDirection : 'asc'}
                    onClick={() => handleSort('author')}
                  >
                    Author
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortField === 'createdAt'}
                    direction={sortField === 'createdAt' ? sortDirection : 'asc'}
                    onClick={() => handleSort('createdAt')}
                  >
                    Date
                  </TableSortLabel>
                </TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                Array.from({ length: rowsPerPage }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell padding="checkbox"><Skeleton width={20} /></TableCell>
                    <TableCell><Skeleton width="70%" /></TableCell>
                    <TableCell><Skeleton width={80} /></TableCell>
                    <TableCell><Skeleton width={80} /></TableCell>
                    <TableCell><Skeleton width={60} /></TableCell>
                    <TableCell><Skeleton width={90} /></TableCell>
                    <TableCell><Skeleton width={80} /></TableCell>
                  </TableRow>
                ))
              ) : posts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                    <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                      No posts found
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {debouncedSearch || statusFilter || categoryFilter
                        ? 'Try adjusting your filters.'
                        : 'Create your first post to get started.'}
                    </Typography>
                    {!debouncedSearch && !statusFilter && !categoryFilter && (
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<AddIcon />}
                        component={Link}
                        href="/admin/posts/new"
                      >
                        Create Post
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                posts.map((post) => {
                  const checked = isSelected(post._id);
                  return (
                    <TableRow key={post._id} hover selected={checked}>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={checked}
                          onChange={() => handleSelectOne(post._id)}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography
                          component={Link}
                          href={`/admin/posts/${post._id}/edit`}
                          sx={{
                            color: '#1a1a1a',
                            fontWeight: 500,
                            textDecoration: 'none',
                            '&:hover': { color: 'primary.main', textDecoration: 'underline' },
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
                          {post.author}
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
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              onClick={() => router.push(`/admin/posts/${post._id}/edit`)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Duplicate">
                            <IconButton
                              size="small"
                              onClick={() => handleDuplicate(post._id)}
                            >
                              <ContentCopyIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => {
                                setDeleteTarget({ id: post._id, title: post.title });
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={(_, newPage) => {
            setPage(newPage);
            setSelected([]);
          }}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
            setSelected([]);
          }}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </Paper>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Post</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete &quot;{deleteTarget?.title}&quot;? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => {
              if (deleteTarget) handleDelete(deleteTarget.id);
              setDeleteDialogOpen(false);
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog
        open={bulkDeleteDialogOpen}
        onClose={() => setBulkDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Selected Posts</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete {selected.length} selected post(s)? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleBulkDelete}
          >
            Delete All
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
