'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import InputLabel from '@mui/material/InputLabel';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import Checkbox from '@mui/material/Checkbox';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Switch from '@mui/material/Switch';
import Snackbar from '@mui/material/Snackbar';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import Alert from '@mui/material/Alert';
import type { ICouponData, CouponFormData } from '@/lib/types/coupon';

const defaultFormData: CouponFormData = {
  code: '',
  discountType: 'percentage',
  discountValue: '',
  isOneTimeUse: true,
  expiresAt: '',
};

function getStatusChip(coupon: ICouponData) {
  if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
    return <Chip label="פג תוקף" color="error" size="small" variant="outlined" />;
  }
  if (coupon.isActive) {
    return <Chip label="פעיל" color="success" size="small" variant="outlined" />;
  }
  return <Chip label="לא פעיל" color="default" size="small" variant="outlined" />;
}

export default function CouponsPageClient({ initialCoupons }: { initialCoupons: ICouponData[] }) {
  const router = useRouter();
  const [coupons, setCoupons] = React.useState(initialCoupons);

  React.useEffect(() => {
    setCoupons(initialCoupons);
  }, [initialCoupons]);

  const [formDialogOpen, setFormDialogOpen] = React.useState(false);
  const [editingCoupon, setEditingCoupon] = React.useState<ICouponData | null>(null);
  const [formData, setFormData] = React.useState<CouponFormData>(defaultFormData);
  const [formLoading, setFormLoading] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<ICouponData | null>(null);
  const [snackbar, setSnackbar] = React.useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  const handleOpenCreate = () => {
    setEditingCoupon(null);
    setFormData(defaultFormData);
    setFormDialogOpen(true);
  };

  const handleOpenEdit = (coupon: ICouponData) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: String(coupon.discountValue),
      isOneTimeUse: coupon.isOneTimeUse,
      expiresAt: coupon.expiresAt ? coupon.expiresAt.split('T')[0] : '',
    });
    setFormDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.code.trim() || !formData.discountValue) return;

    try {
      setFormLoading(true);
      const body: Record<string, unknown> = {
        code: formData.code.trim().toUpperCase(),
        discountType: formData.discountType,
        discountValue: Number(formData.discountValue),
        isOneTimeUse: formData.isOneTimeUse,
      };
      if (formData.expiresAt) {
        body.expiresAt = formData.expiresAt;
      }

      const isEdit = !!editingCoupon;
      const url = isEdit ? `/api/coupons/${editingCoupon._id}` : '/api/coupons';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error((errData as { error?: string } | null)?.error || 'שמירה נכשלה');
      }

      setSnackbar({
        open: true,
        message: isEdit ? 'הקופון עודכן בהצלחה' : 'הקופון נוצר בהצלחה',
        severity: 'success',
      });
      setFormDialogOpen(false);
      router.refresh();
    } catch (err) {
      setSnackbar({
        open: true,
        message: err instanceof Error ? err.message : 'שגיאה בשמירת הקופון',
        severity: 'error',
      });
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleActive = async (coupon: ICouponData) => {
    try {
      const res = await fetch(`/api/coupons/${coupon._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !coupon.isActive }),
      });
      if (!res.ok) throw new Error('עדכון נכשל');
      setSnackbar({
        open: true,
        message: `הקופון ${!coupon.isActive ? 'הופעל' : 'הושבת'}`,
        severity: 'success',
      });
      router.refresh();
    } catch {
      setSnackbar({ open: true, message: 'שגיאה בעדכון הקופון', severity: 'error' });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/coupons/${deleteTarget._id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('מחיקה נכשלה');
      setSnackbar({ open: true, message: 'הקופון נמחק בהצלחה', severity: 'success' });
      router.refresh();
    } catch {
      setSnackbar({ open: true, message: 'שגיאה במחיקת הקופון', severity: 'error' });
    } finally {
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
    }
  };

  const formatDiscount = (coupon: ICouponData) =>
    coupon.discountType === 'percentage'
      ? `${coupon.discountValue}%`
      : `${coupon.discountValue}\u20AA`;

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
            קופונים
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            ניהול קופונים והנחות
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate}>
          הוסף קופון
        </Button>
      </Box>

      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>קוד</TableCell>
                <TableCell>הנחה</TableCell>
                <TableCell>סוג</TableCell>
                <TableCell>חד פעמי</TableCell>
                <TableCell>פעיל</TableCell>
                <TableCell>תפוגה</TableCell>
                <TableCell>נוצר</TableCell>
                <TableCell align="right">פעולות</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {coupons.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                    <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                      לא נמצאו קופונים
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      צור את הקופון הראשון כדי להתחיל.
                    </Typography>
                    <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleOpenCreate}>
                      הוסף קופון
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                coupons.map((coupon) => (
                  <TableRow key={coupon._id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: 'monospace' }}>
                        {coupon.code}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{formatDiscount(coupon)}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={coupon.discountType === 'percentage' ? 'אחוז' : 'קבוע'}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      {coupon.isOneTimeUse && (
                        <Chip label="חד פעמי" size="small" color="info" variant="outlined" />
                      )}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Switch
                          size="small"
                          checked={coupon.isActive}
                          onChange={() => handleToggleActive(coupon)}
                          inputProps={{ 'aria-label': `הפעלת קופון ${coupon.code}` }}
                        />
                        {getStatusChip(coupon)}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {coupon.expiresAt
                          ? new Date(coupon.expiresAt).toLocaleDateString('he-IL')
                          : '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(coupon.createdAt).toLocaleDateString('he-IL')}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                        <Tooltip title="ערוך">
                          <IconButton size="small" onClick={() => handleOpenEdit(coupon)} aria-label="עריכה">
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="מחק">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => {
                              setDeleteTarget(coupon);
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
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={formDialogOpen} onClose={() => setFormDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingCoupon ? 'עריכת קופון' : 'קופון חדש'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="קוד קופון"
              required
              fullWidth
              value={formData.code}
              onChange={(e) => setFormData((prev) => ({ ...prev, code: e.target.value }))}
              slotProps={{ htmlInput: { style: { textTransform: 'uppercase' } } }}
            />
            <FormControl fullWidth>
              <InputLabel>סוג הנחה</InputLabel>
              <Select
                label="סוג הנחה"
                value={formData.discountType}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    discountType: e.target.value as 'percentage' | 'fixed',
                  }))
                }
              >
                <MenuItem value="percentage">אחוז (%)</MenuItem>
                <MenuItem value="fixed">סכום קבוע (&#8362;)</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="ערך הנחה"
              required
              fullWidth
              type="number"
              value={formData.discountValue}
              onChange={(e) => setFormData((prev) => ({ ...prev, discountValue: e.target.value }))}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.isOneTimeUse}
                  onChange={(e) => setFormData((prev) => ({ ...prev, isOneTimeUse: e.target.checked }))}
                />
              }
              label="חד פעמי"
            />
            <TextField
              label="תאריך תפוגה"
              type="date"
              fullWidth
              value={formData.expiresAt}
              onChange={(e) => setFormData((prev) => ({ ...prev, expiresAt: e.target.value }))}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFormDialogOpen(false)} disabled={formLoading}>
            ביטול
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={formLoading || !formData.code.trim() || !formData.discountValue}
          >
            {formLoading ? 'שומר...' : editingCoupon ? 'עדכן' : 'צור'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>מחיקת קופון</DialogTitle>
        <DialogContent>
          <DialogContentText>
            האם למחוק את הקופון &quot;{deleteTarget?.code}&quot;? פעולה זו אינה ניתנת לביטול.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>ביטול</Button>
          <Button color="error" variant="contained" onClick={handleDelete}>
            מחק
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
