'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export interface UseTypingEffectOptions {
  text: string;
  speed?: number;
  delay?: number;
  loop?: boolean;
  loopPauseMs?: number;
  reducedMotion?: boolean;
}

export interface UseTypingEffectReturn {
  displayedText: string;
  isTyping: boolean;
  isComplete: boolean;
  skip: () => void;
  restart: () => void;
}

export function useTypingEffect({
  text,
  speed = 40,
  delay = 0,
  loop = false,
  loopPauseMs = 2000,
  reducedMotion = false,
}: UseTypingEffectOptions): UseTypingEffectReturn {
  const [charIndex, setCharIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isComplete = charIndex >= text.length;
  const displayedText = reducedMotion ? text : text.substring(0, charIndex);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const skip = useCallback(() => {
    clearTimer();
    setCharIndex(text.length);
    setIsTyping(false);
  }, [text.length, clearTimer]);

  const restart = useCallback(() => {
    clearTimer();
    setCharIndex(0);
    setHasStarted(false);
  }, [clearTimer]);

  // Reset when text changes
  useEffect(() => {
    clearTimer();
    setCharIndex(0);
    setHasStarted(false);
    setIsTyping(false);
  }, [text, clearTimer]);

  // Main typing effect
  useEffect(() => {
    if (reducedMotion || text.length === 0) return;

    if (!hasStarted) {
      timerRef.current = setTimeout(() => {
        setHasStarted(true);
        setIsTyping(true);
      }, delay);
      return clearTimer;
    }

    if (charIndex < text.length) {
      timerRef.current = setTimeout(() => {
        setCharIndex((prev) => prev + 1);
      }, speed);
    } else {
      setIsTyping(false);

      if (loop) {
        timerRef.current = setTimeout(() => {
          setCharIndex(0);
          setIsTyping(true);
        }, loopPauseMs);
      }
    }

    return clearTimer;
  }, [text, speed, delay, loop, loopPauseMs, reducedMotion, charIndex, hasStarted, clearTimer]);

  return {
    displayedText,
    isTyping: reducedMotion ? false : isTyping,
    isComplete: reducedMotion ? true : isComplete,
    skip,
    restart,
  };
}
