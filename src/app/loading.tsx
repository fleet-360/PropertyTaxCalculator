import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';

export default function HomeLoading() {
  return (
    <Box
      component="main"
      id="main-content"
      role="status"
      aria-busy="true"
      aria-label="טוען את הדף"
      sx={{
        overflowX: 'hidden',
        minHeight: '100vh',
        bgcolor: 'background.default',
      }}
    >
      <Box
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
          px: { xs: 2, md: 3 },
          py: 1.5,
        }}
      >
        <Container maxWidth="lg" disableGutters>
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
            <Skeleton variant="rounded" width={160} height={40} />
            <Stack direction="row" spacing={1} sx={{ display: { xs: 'none', md: 'flex' } }}>
              <Skeleton variant="rounded" width={72} height={36} />
              <Skeleton variant="rounded" width={88} height={36} />
              <Skeleton variant="rounded" width={96} height={36} />
            </Stack>
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
        <Stack spacing={3} sx={{ alignItems: 'center', mb: 4 }}>
          <Skeleton variant="rounded" width="min(100%, 520px)" height={56} sx={{ borderRadius: 2 }} />
          <Skeleton variant="text" width="min(100%, 380px)" sx={{ fontSize: '1.25rem' }} />
          <Skeleton variant="text" width="min(100%, 280px)" />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ pt: 1 }}>
            <Skeleton variant="rounded" width={200} height={48} />
            <Skeleton variant="rounded" width={180} height={48} />
          </Stack>
        </Stack>

        <Skeleton
          variant="rounded"
          height={280}
          sx={{
            width: '100%',
            maxWidth: 900,
            mx: 'auto',
            mb: 6,
            borderRadius: 3,
            bgcolor: 'action.hover',
          }}
        />

        <Stack direction="row" spacing={2} justifyContent="center" sx={{ mb: 6, flexWrap: 'wrap', gap: 2 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} variant="rounded" width={100} height={36} />
          ))}
        </Stack>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} sx={{ mb: 6 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} variant="rounded" height={120} sx={{ flex: 1, borderRadius: 2 }} />
          ))}
        </Stack>

        <Stack spacing={2} sx={{ mb: 6 }}>
          <Skeleton variant="text" width={200} sx={{ fontSize: '1.5rem' }} />
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} variant="rounded" height={64} sx={{ borderRadius: 1 }} />
          ))}
        </Stack>

        <Skeleton variant="rounded" height={200} sx={{ borderRadius: 2, mb: 6 }} />

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} variant="rounded" height={160} sx={{ flex: 1, borderRadius: 2 }} />
          ))}
        </Stack>
      </Container>

      <Box sx={{ mt: 'auto', borderTop: 1, borderColor: 'divider', bgcolor: 'background.paper', py: 4 }}>
        <Container maxWidth="lg">
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} justifyContent="space-between">
            <Skeleton variant="text" width={140} />
            <Stack direction="row" spacing={2}>
              <Skeleton variant="text" width={80} />
              <Skeleton variant="text" width={80} />
            </Stack>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
}
