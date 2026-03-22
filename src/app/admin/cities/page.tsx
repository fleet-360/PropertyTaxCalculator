'use client';
import * as React from 'react';
import Link from 'next/link';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import Switch from '@mui/material/Switch';
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
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CalculateIcon from '@mui/icons-material/Calculate';

interface CitySummary {
  _id: string;
  cityName: string;
  cityNameEn: string;
  slug: string;
  year: number;
  isActive: boolean;
  ordinanceUrl?: string;
  zonesCount: number;
  typesCount: number;
  createdAt: string;
  updatedAt: string;
}

export default function CitiesPage() {
  const [cities, setCities] = React.useState<CitySummary[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [snackbar, setSnackbar] = React.useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [deleteDialog, setDeleteDialog] = React.useState<{ open: boolean; city?: CitySummary }>({ open: false });

  const fetchCities = React.useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch('/api/cities?all=true');
      if (!res.ok) throw new Error('Failed to fetch cities');
      const data = await res.json();
      setCities(data.cities);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchCities();
  }, [fetchCities]);

  const handleToggleActive = async (city: CitySummary) => {
    try {
      const res = await fetch(`/api/cities/${city._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !city.isActive }),
      });
      if (!res.ok) throw new Error('Failed to update city');
      setCities((prev) =>
        prev.map((c) => (c._id === city._id ? { ...c, isActive: !c.isActive } : c))
      );
      setSnackbar({ open: true, message: `${city.cityName} ${!city.isActive ? 'הופעל' : 'הושבת'}`, severity: 'success' });
    } catch {
      setSnackbar({ open: true, message: 'שגיאה בעדכון', severity: 'error' });
    }
  };

  const handleDelete = async () => {
    const city = deleteDialog.city;
    if (!city) return;

    try {
      const res = await fetch(`/api/cities/${city._id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete city');
      setCities((prev) => prev.filter((c) => c._id !== city._id));
      setSnackbar({ open: true, message: `${city.cityName} נמחקה`, severity: 'success' });
    } catch {
      setSnackbar({ open: true, message: 'שגיאה במחיקה', severity: 'error' });
    } finally {
      setDeleteDialog({ open: false });
    }
  };

  return (
    <Box>
      {/* Page header */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a1a1a' }}>
            מחשבונים
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            ניהול ערים ותעריפי ארנונה
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          component={Link}
          href="/admin/cities/new"
        >
          הוסף עיר
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>שם העיר</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>שנה</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>פעיל</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>אזורים</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>סוגי נכס</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>פעולות</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((__, j) => (
                      <TableCell key={j}><Skeleton width="70%" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : cities.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                    <CalculateIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      אין ערים במערכת. הוסף עיר ראשונה.
                    </Typography>
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<AddIcon />}
                      component={Link}
                      href="/admin/cities/new"
                      sx={{ mt: 2 }}
                    >
                      הוסף עיר
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                cities.map((city) => (
                  <TableRow key={city._id} hover>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {city.cityName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {city.cityNameEn} ({city.slug})
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip label={city.year} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={city.isActive}
                        onChange={() => handleToggleActive(city)}
                        size="small"
                        color="success"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip label={city.zonesCount} size="small" color="info" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Chip label={city.typesCount} size="small" color="info" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="ערוך">
                          <IconButton
                            size="small"
                            component={Link}
                            href={`/admin/cities/${city._id}/edit`}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="מחק">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => setDeleteDialog({ open: true, city })}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false })}>
        <DialogTitle>מחיקת עיר</DialogTitle>
        <DialogContent>
          <DialogContentText>
            האם למחוק את &quot;{deleteDialog.city?.cityName}&quot;? פעולה זו אינה ניתנת לביטול.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false })}>ביטול</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            מחק
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
