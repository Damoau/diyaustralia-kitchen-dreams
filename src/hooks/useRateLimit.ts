import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface RateLimitConfig {
  maxAttempts: number;
  windowMinutes: number;
  backoffMultiplier?: number;
}

export const useRateLimit = (key: string, config: RateLimitConfig) => {
  const [isLimited, setIsLimited] = useState(false);
  const [attemptsLeft, setAttemptsLeft] = useState(config.maxAttempts);
  const { toast } = useToast();

  const checkRateLimit = (): boolean => {
    const storageKey = `rate_limit_${key}`;
    const stored = localStorage.getItem(storageKey);
    
    let attempts = 0;
    let windowStart = Date.now();
    
    if (stored) {
      try {
        const data = JSON.parse(stored);
        attempts = data.attempts || 0;
        windowStart = data.windowStart || Date.now();
      } catch (error) {
        // Reset if corrupted
        localStorage.removeItem(storageKey);
      }
    }

    const now = Date.now();
    const windowDuration = config.windowMinutes * 60 * 1000;

    // Reset window if expired
    if (now - windowStart > windowDuration) {
      attempts = 0;
      windowStart = now;
    }

    const remaining = config.maxAttempts - attempts;
    setAttemptsLeft(Math.max(0, remaining));

    if (attempts >= config.maxAttempts) {
      setIsLimited(true);
      
      const resetTime = new Date(windowStart + windowDuration);
      const resetMinutes = Math.ceil((resetTime.getTime() - now) / (60 * 1000));
      
      toast({
        title: 'Too Many Attempts',
        description: `Please wait ${resetMinutes} minutes before trying again.`,
        variant: 'destructive',
      });
      
      return false;
    }

    setIsLimited(false);
    return true;
  };

  const recordAttempt = (failed: boolean = true) => {
    if (!failed) {
      // Success - reset the counter
      localStorage.removeItem(`rate_limit_${key}`);
      setAttemptsLeft(config.maxAttempts);
      setIsLimited(false);
      return;
    }

    const storageKey = `rate_limit_${key}`;
    const stored = localStorage.getItem(storageKey);
    
    let attempts = 0;
    let windowStart = Date.now();
    
    if (stored) {
      try {
        const data = JSON.parse(stored);
        attempts = data.attempts || 0;
        windowStart = data.windowStart || Date.now();
      } catch (error) {
        // Reset if corrupted
      }
    }

    const now = Date.now();
    const windowDuration = config.windowMinutes * 60 * 1000;

    // Reset window if expired
    if (now - windowStart > windowDuration) {
      attempts = 0;
      windowStart = now;
    }

    attempts += 1;

    localStorage.setItem(storageKey, JSON.stringify({
      attempts,
      windowStart
    }));

    const remaining = Math.max(0, config.maxAttempts - attempts);
    setAttemptsLeft(remaining);

    if (attempts >= config.maxAttempts) {
      setIsLimited(true);
    }
  };

  const reset = () => {
    localStorage.removeItem(`rate_limit_${key}`);
    setAttemptsLeft(config.maxAttempts);
    setIsLimited(false);
  };

  return {
    isLimited,
    attemptsLeft,
    checkRateLimit,
    recordAttempt,
    reset,
  };
};