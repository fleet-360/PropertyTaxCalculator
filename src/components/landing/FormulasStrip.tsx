import { Box } from '@mui/material';
import { Fragment } from 'react';

type FormulaItem = {
  text: string;
  dir?: 'ltr' | 'rtl';
};

/** User-provided formulas from reference strip, plus two extras (Hebrew + short math) */
const FORMULA_ITEMS: FormulaItem[] = [
  { text: '[f(x+h) − f(x)] / h', dir: 'ltr' },
  { text: 'Δ% = (New − Old) / Old', dir: 'ltr' },
  { text: 'V = πr²h / 3', dir: 'ltr' },
  { text: 'Total Tax = (Rate × Area)', dir: 'ltr' },
  { text: 'A = ∫(x² + y²) dx', dir: 'ltr' },
  { text: "f′(x) = lim(h→0) [f(x+h) − f(x)] / h", dir: 'ltr' },
  { text: 'ארנונה שנתית = שטח × תעריף למ״ר', dir: 'rtl' },
  { text: 'E = mc²', dir: 'ltr' },
];

const SEPARATOR = '•';

const stripSans = {
  fontSize: '0.8125rem',
  color: '#b8c5d3',
  fontFamily:
    'ui-sans-serif, system-ui, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  letterSpacing: '0.01em',
} as const;

const stripMono = {
  ...stripSans,
  fontFamily:
    'ui-monospace, "Cascadia Code", "Segoe UI Mono", Menlo, Monaco, Consolas, monospace',
} as const;

function FormulaSequence({ items }: { items: FormulaItem[] }) {
  return (
    <>
      {items.map((item, i) => (
        <Fragment key={`${item.text}-${i}`}>
          {i > 0 && (
            <Box
              component="span"
              aria-hidden
              sx={{
                px: 1.25,
                color: '#c5d3e0',
                flexShrink: 0,
                userSelect: 'none',
                lineHeight: 1,
              }}
            >
              {SEPARATOR}
            </Box>
          )}
          <Box
            component="span"
            dir={item.dir ?? 'ltr'}
            sx={{
              flexShrink: 0,
              whiteSpace: 'nowrap',
              unicodeBidi: 'isolate',
              ...(item.dir === 'ltr' ? stripMono : stripSans),
            }}
          >
            {item.text}
          </Box>
        </Fragment>
      ))}
    </>
  );
}

export default function FormulasStrip() {
  return (
    <Box
      aria-hidden="true"
      sx={{
        height: 56,
        overflow: 'hidden',
        position: 'relative',
        bgcolor: '#ffffff',
        borderBottom: '1px solid',
        borderColor: 'rgba(0,0,0,0.04)',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          height: '100%',
          width: 'max-content',
          animation: 'marquee 50s linear infinite',
          whiteSpace: 'nowrap',
          '@keyframes marquee': {
            '0%': { transform: 'translateX(0)' },
            '100%': { transform: 'translateX(-50%)' },
          },
          '@media (prefers-reduced-motion: reduce)': {
            animation: 'none',
          },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            flexShrink: 0,
            height: '100%',
            px: 2,
          }}
        >
          <FormulaSequence items={FORMULA_ITEMS} />
        </Box>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            flexShrink: 0,
            height: '100%',
            px: 2,
          }}
        >
          <FormulaSequence items={FORMULA_ITEMS} />
        </Box>
      </Box>
    </Box>
  );
}
