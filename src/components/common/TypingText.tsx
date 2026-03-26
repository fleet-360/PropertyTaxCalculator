'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import type { SxProps, Theme } from '@mui/material/styles';
import type { TypographyProps } from '@mui/material/Typography';
import { useReducedMotion } from 'framer-motion';
import { useTypingEffect } from '@/hooks/useTypingEffect';

export interface TypingTextProps {
  /** The text to type out. A string for single-line, string[] for multi-line. */
  text: string | string[];
  /** Milliseconds per character. Default: 40 */
  speed?: number;
  /** Delay in ms before typing starts. Default: 0 */
  delay?: number;
  /** Show a blinking cursor. Default: true */
  showCursor?: boolean;
  /** Custom cursor character. Default: '|' */
  cursorChar?: string;
  /** Hide cursor after typing completes. Default: true */
  hideCursorOnComplete?: boolean;
  /** Callback fired when all text has been typed */
  onComplete?: () => void;
  /** Allow clicking to instantly complete the animation */
  skipOnClick?: boolean;
  /** Loop: restart typing after completing. Default: false */
  loop?: boolean;
  /** Pause in ms between loops. Default: 2000 */
  loopPauseMs?: number;
  /** MUI Typography variant */
  variant?: TypographyProps['variant'];
  /** Rendered HTML element. Default: 'span' */
  component?: React.ElementType;
  /** MUI sx prop for the outer container */
  sx?: SxProps<Theme>;
  /** MUI sx prop for the cursor element */
  cursorSx?: SxProps<Theme>;
  /** Accessibility: full text for screen readers */
  ariaLabel?: string;
  /**No animation */
  noAnimation?: boolean;
}

function renderTextWithBreaks(text: string): React.ReactNode {
  const parts = text.split('\n');
  if (parts.length === 1) return text;
  return parts.map((part, i) => (
    <React.Fragment key={i}>
      {part}
      {i < parts.length - 1 && <br />}
    </React.Fragment>
  ));
}

export function TypingText({
  text,
  speed = 40,
  delay = 0,
  showCursor = true,
  cursorChar = '|',
  hideCursorOnComplete = true,
  onComplete,
  skipOnClick = false,
  loop = false,
  loopPauseMs = 2000,
  variant = 'body1',
  component = 'span',
  sx,
  cursorSx,
  ariaLabel,
  noAnimation = false,
}: TypingTextProps) {
  const reducedMotion = (useReducedMotion()|| noAnimation) ;
  const flatText = Array.isArray(text) ? text.join('\n') : text;

  const { displayedText, isComplete, skip } = useTypingEffect({
    text: flatText,
    speed,
    delay,
    loop,
    loopPauseMs,
    reducedMotion,
  });

  // Track completion for onComplete callback
  const [prevComplete, setPrevComplete] = useState(false);
  useEffect(() => {
    if (isComplete && !prevComplete && onComplete) {
      onComplete();
    }
    setPrevComplete(isComplete);
  }, [isComplete, prevComplete, onComplete]);

  const handleClick = useCallback(() => {
    if (skipOnClick && !isComplete) {
      skip();
    }
  }, [skipOnClick, isComplete, skip]);

  const showCursorNow = showCursor && !(hideCursorOnComplete && isComplete && !loop);

  return (
    <Typography
      variant={variant}
      component={component}
      onClick={handleClick}
      aria-label={ariaLabel || flatText}
      role="status"
      aria-live="polite"
      sx={{
        cursor: skipOnClick && !isComplete ? 'pointer' : undefined,
        display: 'inline',
        ...((typeof sx === 'object' && sx !== null) ? sx : {}),
      }}
    >
      <Box component="span" aria-hidden={!!ariaLabel} sx={{ display: 'inline' }}>
        {renderTextWithBreaks(displayedText)}
      </Box>
      {showCursorNow && (
        <Box
          component="span"
          aria-hidden
          sx={{
            display: 'inline',
            '@keyframes typingCursorBlink': {
              '0%, 100%': { opacity: 1 },
              '50%': { opacity: 0 },
            },
            animation: reducedMotion
              ? 'none'
              : 'typingCursorBlink 0.8s step-end infinite',
            ...(hideCursorOnComplete && isComplete && !loop
              ? { opacity: 0, transition: 'opacity 0.5s ease-out' }
              : {}),
            ...((typeof cursorSx === 'object' && cursorSx !== null) ? cursorSx : {}),
          }}
        >
          {cursorChar}
        </Box>
      )}
    </Typography>
  );
}

/** Copy + phased typing UI for the calculator section speech bubble (Mia). */
export const CALCULATOR_MIA_SPEECH_TITLE =
  "👋 שלום! אני מיה, יועצת הארנונה שלך";

export const CALCULATOR_MIA_SPEECH_DESCRIPTION =
  "המחשבון שלנו מנתח את נתוני הנכס שלך ומשווה אותם לתעריפי הרשות המקומית.\n\nתוך שניות תקבל הערכה מדויקת + המלצות לחיסכון!";

export const CALCULATOR_MIA_SPEECH_STEPS = [
  "1️⃣ הזן עיר ופרטי נכס",
  "2️⃣ העלה טופס (אופציונלי)",
  "3️⃣ קבל חישוב מיידי",
] as const;

export interface CalculatorMiaSpeechBubbleTypingProps {
  title?: string;
  description?: string;
}

export function CalculatorMiaSpeechBubbleTyping({
  title,
  description,
}: CalculatorMiaSpeechBubbleTypingProps = {}) {
  const displayTitle = title ?? CALCULATOR_MIA_SPEECH_TITLE;
  const displayDescription = description ?? CALCULATOR_MIA_SPEECH_DESCRIPTION;
  const [phase, setPhase] = useState(0);

  // Reset animation phase when content changes
  useEffect(() => {
    setPhase(0);
  }, [displayTitle, displayDescription]);

  // Use a key based on content to force re-mount of TypingText and restart animation
  const contentKey = `${displayTitle}::${displayDescription}`;

  return (
    <>
      <TypingText
        key={`title-${contentKey}`}
        text={displayTitle}
        component="div"
        variant="body1"
        speed={50}
        sx={{
          fontWeight: 700,
          fontSize: "13px",
          color: "#1a3380",
          mb: 1.5,
          display: "block",
          textAlign: "left",
        }}
        onComplete={() => setPhase(1)}
        noAnimation={phase > 0}
      />

      {phase >= 1 && (
        <>
          <Box sx={{ height: 1, bgcolor: "#e5ebf7", mb: 1.5 }} />
          <TypingText
            key={`desc-${contentKey}`}
            text={displayDescription}
            component="div"
            variant="body1"
            speed={22}
            sx={{
              fontSize: "12px",
              color: "#4d668c",
              textAlign: "left",
              lineHeight: 1.6,
              mb: 0,
              display: "block",
            }}
            noAnimation={phase > 1}
          />
        </>
      )}
    </>
  );
}

export default TypingText;
