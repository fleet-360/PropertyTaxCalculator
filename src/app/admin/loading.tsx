import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Skeleton from '@mui/material/Skeleton';
import Paper from '@mui/material/Paper';

export default function AdminLoading() {
  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Skeleton variant="text" width={220} height={40} />
        <Skeleton variant="text" width={320} height={24} sx={{ mt: 0.5 }} />
      </Box>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {Array.from({ length: 8 }).map((_, i) => (
          <Grid key={i} size={{ xs: 12, sm: 6, md: 3 }}>
            <Paper sx={{ p: 3 }}>
              <Skeleton width="50%" height={20} sx={{ mb: 1 }} />
              <Skeleton width="35%" height={36} />
            </Paper>
          </Grid>
        ))}
      </Grid>
      <Paper sx={{ p: 0 }}>
        <Box sx={{ px: 3, py: 2 }}>
          <Skeleton width={160} height={28} />
        </Box>
        <Box sx={{ px: 2, pb: 2 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} height={48} sx={{ mb: 1 }} />
          ))}
        </Box>
      </Paper>
    </Box>
  );
}
