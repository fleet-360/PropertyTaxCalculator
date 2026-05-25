import type { SxProps, Theme } from '@mui/material/styles';

/** Figma-aligned calculator wizard design tokens (via theme.palette.brand). */
export const wizardFieldSx: SxProps<Theme> = (theme) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: '6px',
    bgcolor: theme.palette.background.paper,
    minHeight: 40,
    '& fieldset': {
      borderColor: theme.palette.brand.borderField,
    },
    '&:hover fieldset': {
      borderColor: theme.palette.brand.blueLight,
    },
    '&.Mui-focused fieldset': {
      borderColor: theme.palette.brand.blueLight,
      borderWidth: '1px',
    },
  },
  '& .MuiInputLabel-root': {
    fontSize: '13px',
    color: theme.palette.brand.textMuted,
    letterSpacing: '0.4px',
  },
});

export const wizardSectionHeaderSx: SxProps<Theme> = (theme) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-end',
  paddingInlineEnd: 1.5,
  borderInlineEnd: `2px solid ${theme.palette.brand.accent}`,
  mb: 2,
});

export const wizardSectionTitleSx: SxProps<Theme> = (theme) => ({
  fontSize: '18px',
  fontWeight: 500,
  lineHeight: '24px',
  color: theme.palette.brand.textMain,
  textAlign: 'right',
});

export const wizardInstructionSx: SxProps<Theme> = (theme) => ({
  fontSize: { xs: '16px', md: '18px' },
  fontWeight: 500,
  lineHeight: '24px',
  color: theme.palette.brand.textMain,
  mb: 1.5,
  textAlign: 'right',
});

export const wizardPrimaryButtonSx: SxProps<Theme> = (theme) => ({
  bgcolor: theme.palette.brand.blue,
  color: '#fff',
  borderRadius: '20px',
  px: 1.5,
  py: 1,
  minHeight: 32,
  fontSize: '14px',
  fontWeight: 500,
  lineHeight: 1,
  boxShadow: 'none',
  '& .MuiButton-endIcon': { ml: 0.5, mr: -0.25 },
  '& .MuiButton-startIcon': { mr: 0.5, ml: -0.25 },
  '&:hover': {
    bgcolor: theme.palette.brand.blueDark,
    boxShadow: 'none',
  },
  '&.Mui-disabled': {
    bgcolor: theme.palette.brand.disabledBg,
    color: '#fff',
  },
});

export const wizardSecondaryButtonSx: SxProps<Theme> = (theme) => ({
  bgcolor: theme.palette.background.paper,
  color: theme.palette.brand.textMutedBtn,
  border: `1px solid ${theme.palette.brand.borderBtn}`,
  borderRadius: '20px',
  px: 1.5,
  py: 1,
  minHeight: 32,
  fontSize: '14px',
  fontWeight: 500,
  lineHeight: 1,
  boxShadow: 'none',
  '& .MuiButton-endIcon': { ml: 0.5, mr: -0.25 },
  '& .MuiButton-startIcon': { mr: 0.5, ml: -0.25 },
  '&:hover': {
    bgcolor: theme.palette.background.paper,
    borderColor: theme.palette.brand.borderBtn,
  },
});

export const wizardPropertyCardSx = (
  isSelected: boolean,
): SxProps<Theme> => (theme) => ({
  cursor: 'pointer',
  bgcolor: '#FFFFFF',
  border: '1px solid',
  borderColor: isSelected ? theme.palette.brand.blue : theme.palette.brand.borderCard,
  borderRadius: '10px',
  py: '32px',
  px: { xs: 3, md: '48px' },
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 0,
  width: { xs: '100%', sm: 216 },
  maxWidth: 216,
  minHeight: 192,
  flex: '0 0 auto',
  transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
  boxShadow: isSelected ? `0 0 0 1px ${theme.palette.brand.blue}` : 'none',
  '&:hover': {
    borderColor: theme.palette.brand.blueLight,
  },
});

export const wizardUploadZoneSx: SxProps<Theme> = (theme) => ({
  border: `1px dashed ${theme.palette.brand.uploadBorder}`,
  borderRadius: '6px',
  bgcolor: theme.palette.background.paper,
  p: 4,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 1.5,
  minHeight: 208,
  cursor: 'pointer',
  transition: 'border-color 0.2s ease, background-color 0.2s ease',
  '&:hover': {
    borderColor: theme.palette.brand.blueLight,
    bgcolor: 'rgba(0, 85, 252, 0.02)',
  },
});

export const wizardResultsCardSx: SxProps<Theme> = (theme) => ({
  border: `1px solid ${theme.palette.brand.borderResults}`,
  borderRadius: '30px',
  bgcolor: theme.palette.background.paper,
  p: { xs: 2.5, md: 4 },
});

export const wizardAddLinkSx: SxProps<Theme> = (theme) => ({
  fontSize: '14px',
  fontWeight: 400,
  color: theme.palette.brand.blue,
  cursor: 'pointer',
  textAlign: 'right',
  letterSpacing: '0.5px',
  '&:hover': { textDecoration: 'underline' },
});

export const wizardNavRowSx: SxProps<Theme> = ({
  mt: 'auto',
  pt: 2,
  display: 'flex',
  gap: 4.25,
  justifyContent: 'flex-start',
  flexWrap: 'wrap',
  alignItems: 'center',
});

/** Sidebar footer actions (איפוס / צפייה בצו) — Figma Frame 2608690x */
export const wizardSidebarActionButtonSx: SxProps<Theme> = (theme) => ({
  border: `1px solid ${theme.palette.brand.accent}`,
  borderRadius: '5px',
  color: '#fff',
  px: 1.5,
  py: 0.5,
  minHeight: 33,
  fontSize: '14px',
  fontWeight: 400,
  textTransform: 'none',
  bgcolor: 'transparent',
  lineHeight: '25px',
  '&:hover': { bgcolor: 'rgba(62, 76, 232, 0.25)' },
  '&.Mui-disabled': {
    color: '#fff',
    borderColor: theme.palette.brand.accent,
    opacity: 0.6,
  },
});
