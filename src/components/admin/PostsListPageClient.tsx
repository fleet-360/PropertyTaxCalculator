'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
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
import Alert from '@mui/material/Alert';
import type { PostListItem, PostSortField, SortDirection } from '@/lib/types/post';

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

function buildPostsHref(
  pathname: string,
  state: {
    page: number;
    limit: number;
    search: string;
    status: string;
    category: string;
    sort: string;
    dir: SortDirection;
  }
) {
  const q = new URLSearchParams();
  q.set('page', String(state.page));
  q.set('limit', String(state.limit));
  if (state.search) q.set('search', state.search);
  if (state.status) q.set('status', state.status);
  if (state.category) q.set('category', state.category);
  q.set('sort', state.sort);
  q.set('dir', state.dir);
  return `${pathname}?${q}`;
}

export interface PostsListPageClientProps {
  posts: PostListItem[];
  total: number;
  page: number;
  limit: number;
  search: string;
  status: string;
  category: string;
  sortField: PostSortField;
  sortDirection: SortDirection;
  categories: string[];
}

export default function PostsListPageClient({
  posts,
  total,
  page,
  limit,
  search,
  status,
  category,
  sortField,
  sortDirection,
  categories,
}: PostsListPageClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [searchInput, setSearchInput] = React.useState(search);
  const [selected, setSelected] = React.useState<string[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<{ id: string; title: string } | null>(null);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = React.useState(false);
  const [bulkMenuAnchor, setBulkMenuAnchor] = React.useState<null | HTMLElement>(null);
  const [snackbar, setSnackbar] = React.useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning';
  }>({ open: false, message: '', severity: 'success' });

  React.useEffect(() => {
    setSearchInput(search);
  }, [search]);

  const urlState = React.useMemo(
    () => ({ page, limit, search, status, category, sort: sortField, dir: sortDirection }),
    [page, limit, search, status, category, sortField, sortDirection]
  );

  React.useEffect(() => {
    const t = setTimeout(() => {
      if (searchInput === search) return;
      router.replace(
        buildPostsHref(pathname, { ...urlState, search: searchInput, page: 0 })
      );
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput, search, router, pathname, urlState]);

  const navigate = (patch: Partial<typeof urlState>) => {
    router.push(buildPostsHref(pathname, { ...urlState, ...patch }));
  };

  const handleSort = (field: PostSortField) => {
    if (sortField === field) {
      navigate({
        sort: field,
        dir: sortDirection === 'asc' ? 'desc' : 'asc',
        page: 0,
      });
    } else {
      navigate({ sort: field, dir: 'asc', page: 0 });
    }
    setSelected([]);
  };

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelected(posts.map((p) => p._id));
    } else {
      setSelected([]);
    }
  };

  const handleSelectOne = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  };

  const refresh = () => {
    setSelected([]);
    router.refresh();
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/posts/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('מחיקה נכשלה');
      setSnackbar({ open: true, message: 'המאמר נמחק', severity: 'success' });
      setSelected((prev) => prev.filter((s) => s !== id));
      refresh();
    } catch {
      setSnackbar({ open: true, message: 'מחיקה נכשלה', severity: 'error' });
    }
  };

  const handleBulkDelete = async () => {
    try {
      const results = await Promise.allSettled(
        selected.map((id) => fetch(`/api/posts/${id}`, { method: 'DELETE' }))
      );
      const failed = results.filter((r) => r.status === 'rejected').length;
      if (failed > 0) {
        setSnackbar({
          open: true,
          message: `נמחקו ${selected.length - failed} מאמרים, ${failed} נכשלו`,
          severity: 'warning',
        });
      } else {
        setSnackbar({
          open: true,
          message: `נמחקו ${selected.length} מאמרים`,
          severity: 'success',
        });
      }
      setSelected([]);
      refresh();
    } catch {
      setSnackbar({ open: true, message: 'מחיקה נכשלה', severity: 'error' });
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
      setSnackbar({
        open: true,
        message: `עודכן סטטוס ל־${selected.length} מאמרים`,
        severity: 'success',
      });
      setSelected([]);
      refresh();
    } catch {
      setSnackbar({ open: true, message: 'עדכון סטטוס נכשל', severity: 'error' });
    }
    setBulkMenuAnchor(null);
  };

  const handleDuplicate = async (id: string) => {
    try {
      const res = await fetch(`/api/posts/${id}/duplicate`, { method: 'POST' });
      if (!res.ok) throw new Error('שכפול נכשל');
      setSnackbar({ open: true, message: 'המאמר שוכפל', severity: 'success' });
      refresh();
    } catch {
      setSnackbar({ open: true, message: 'שכפול נכשל', severity: 'error' });
    }
  };

  const isSelected = (id: string) => selected.includes(id);
  const allSelected = posts.length > 0 && selected.length === posts.length;
  const someSelected = selected.length > 0 && selected.length < posts.length;

  return (
    <Box>
      <Box
        sx={{
          mb: 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary' }}>
            מאמרים
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            ניהול מאמרי הבלוג
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} component={Link} href="/admin/posts/new">
          מאמר חדש
        </Button>
      </Box>

      <Paper sx={{ p: 2, mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          placeholder="חיפוש לפי כותרת..."
          size="small"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          aria-label="חיפוש מאמרים"
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
          <InputLabel>סטטוס</InputLabel>
          <Select
            label="סטטוס"
            value={status}
            onChange={(e) => navigate({ status: e.target.value, page: 0 })}
          >
            <MenuItem value="">הכל</MenuItem>
            <MenuItem value="draft">טיוטה</MenuItem>
            <MenuItem value="published">מפורסם</MenuItem>
            <MenuItem value="archived">בארכיון</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>קטגוריה</InputLabel>
          <Select
            label="קטגוריה"
            value={category}
            onChange={(e) => navigate({ category: e.target.value, page: 0 })}
          >
            <MenuItem value="">כל הקטגוריות</MenuItem>
            {categories.map((cat) => (
              <MenuItem key={cat} value={cat}>
                {cat}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Paper>

      {selected.length > 0 && (
        <Paper
          sx={{
            p: 1.5,
            mb: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 500, pl: 1 }}>
            נבחרו {selected.length}
          </Typography>
          <Button
            size="small"
            variant="outlined"
            sx={{ color: 'inherit', borderColor: 'rgba(255,255,255,0.5)' }}
            onClick={(e) => setBulkMenuAnchor(e.currentTarget)}
          >
            שינוי סטטוס
          </Button>
          <Button
            size="small"
            variant="outlined"
            startIcon={<DeleteIcon />}
            sx={{ color: 'inherit', borderColor: 'rgba(255,255,255,0.5)' }}
            onClick={() => setBulkDeleteDialogOpen(true)}
          >
            מחיקה
          </Button>
          <Menu
            anchorEl={bulkMenuAnchor}
            open={Boolean(bulkMenuAnchor)}
            onClose={() => setBulkMenuAnchor(null)}
          >
            <MenuItem onClick={() => handleBulkStatusChange('draft')}>טיוטה</MenuItem>
            <MenuItem onClick={() => handleBulkStatusChange('published')}>מפורסם</MenuItem>
            <MenuItem onClick={() => handleBulkStatusChange('archived')}>בארכיון</MenuItem>
          </Menu>
        </Paper>
      )}

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
                    inputProps={{ 'aria-label': 'בחירת כל המאמרים' }}
                  />
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortField === 'title'}
                    direction={sortField === 'title' ? sortDirection : 'asc'}
                    onClick={() => handleSort('title')}
                  >
                    כותרת
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortField === 'status'}
                    direction={sortField === 'status' ? sortDirection : 'asc'}
                    onClick={() => handleSort('status')}
                  >
                    סטטוס
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortField === 'category'}
                    direction={sortField === 'category' ? sortDirection : 'asc'}
                    onClick={() => handleSort('category')}
                  >
                    קטגוריה
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortField === 'author'}
                    direction={sortField === 'author' ? sortDirection : 'asc'}
                    onClick={() => handleSort('author')}
                  >
                    מחבר
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortField === 'createdAt'}
                    direction={sortField === 'createdAt' ? sortDirection : 'asc'}
                    onClick={() => handleSort('createdAt')}
                  >
                    תאריך
                  </TableSortLabel>
                </TableCell>
                <TableCell align="right">פעולות</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {posts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                    <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                      לא נמצאו מאמרים
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {search || status || category ? 'נסה לשנות את המסננים.' : 'צור את המאמר הראשון.'}
                    </Typography>
                    {!search && !status && !category && (
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<AddIcon />}
                        component={Link}
                        href="/admin/posts/new"
                      >
                        צור מאמר
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
                          inputProps={{ 'aria-label': `בחירת ${post.title}` }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography
                          component={Link}
                          href={`/admin/posts/${post._id}/edit`}
                          sx={{
                            color: 'text.primary',
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
                          {post.author}
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
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                          <Tooltip title="עריכה">
                            <IconButton
                              size="small"
                              component={Link}
                              href={`/admin/posts/${post._id}/edit`}
                              aria-label="עריכה"
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="שכפול">
                            <IconButton
                              size="small"
                              onClick={() => handleDuplicate(post._id)}
                              aria-label="שכפול"
                            >
                              <ContentCopyIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="מחיקה">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => {
                                setDeleteTarget({ id: post._id, title: post.title });
                                setDeleteDialogOpen(true);
                              }}
                              aria-label="מחיקה"
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
            navigate({ page: newPage });
            setSelected([]);
          }}
          rowsPerPage={limit}
          onRowsPerPageChange={(e) => {
            navigate({ limit: parseInt(e.target.value, 10), page: 0 });
            setSelected([]);
          }}
          rowsPerPageOptions={[5, 10, 25, 50]}
          labelRowsPerPage="שורות בעמוד:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} מתוך ${count}`}
        />
      </Paper>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>מחיקת מאמר</DialogTitle>
        <DialogContent>
          <DialogContentText>
            למחוק את &quot;{deleteTarget?.title}&quot;? לא ניתן לבטל.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>ביטול</Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => {
              if (deleteTarget) handleDelete(deleteTarget.id);
              setDeleteDialogOpen(false);
            }}
          >
            מחק
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={bulkDeleteDialogOpen} onClose={() => setBulkDeleteDialogOpen(false)}>
        <DialogTitle>מחיקת מאמרים נבחרים</DialogTitle>
        <DialogContent>
          <DialogContentText>
            למחוק {selected.length} מאמרים? לא ניתן לבטל.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkDeleteDialogOpen(false)}>ביטול</Button>
          <Button color="error" variant="contained" onClick={handleBulkDelete}>
            מחק הכל
          </Button>
        </DialogActions>
      </Dialog>

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
