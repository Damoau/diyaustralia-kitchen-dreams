import { useEffect, useCallback, useRef } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

interface UserInteraction {
  sessionId: string;
  userId?: string;
  actionType: 'click' | 'form_fill' | 'navigation' | 'scroll' | 'hover' | 'error';
  targetElement: string;
  pageUrl: string;
  metadata?: any;
  mouseX?: number;
  mouseY?: number;
  viewportWidth: number;
  viewportHeight: number;
}

interface UserSession {
  sessionId: string;
  userId?: string;
  userAgent: string;
  ipAddress?: string;
  referrer: string;
  deviceType: string;
  browserInfo: any;
}

export const useUserActionTracking = () => {
  const { user } = useAuth();
  const sessionIdRef = useRef<string>();
  const interactionQueueRef = useRef<UserInteraction[]>([]);
  const lastFlushRef = useRef<number>(Date.now());
  const isTrackingRef = useRef<boolean>(true);

  // Generate or get session ID
  const getSessionId = useCallback(() => {
    if (!sessionIdRef.current) {
      sessionIdRef.current = localStorage.getItem('user_session_id') || uuidv4();
      localStorage.setItem('user_session_id', sessionIdRef.current);
    }
    return sessionIdRef.current;
  }, []);

  // Initialize session tracking
  const initializeSession = useCallback(async () => {
    if (!isTrackingRef.current) return;

    const sessionId = getSessionId();
    const sessionData: UserSession = {
      sessionId,
      userId: user?.id,
      userAgent: navigator.userAgent,
      referrer: document.referrer,
      deviceType: /Mobile|Android|iPhone|iPad/.test(navigator.userAgent) ? 'mobile' : 'desktop',
      browserInfo: {
        language: navigator.language,
        cookieEnabled: navigator.cookieEnabled,
        onLine: navigator.onLine,
        screen: {
          width: screen.width,
          height: screen.height,
          colorDepth: screen.colorDepth
        }
      }
    };

    try {
      const { data, error } = await supabase.functions.invoke('record-user-session', {
        body: { action: 'start_session', sessionData }
      });

      if (error) {
        console.warn('Failed to initialize session tracking:', error);
      } else {
        console.log('Session tracking initialized:', sessionId);
      }
    } catch (error) {
      console.warn('Error initializing session:', error);
    }
  }, [user?.id, getSessionId]);

  // Record user interaction
  const recordInteraction = useCallback((
    actionType: UserInteraction['actionType'],
    targetElement: string,
    metadata?: any,
    mouseX?: number,
    mouseY?: number
  ) => {
    if (!isTrackingRef.current) return;

    const interaction: UserInteraction = {
      sessionId: getSessionId(),
      userId: user?.id,
      actionType,
      targetElement,
      pageUrl: window.location.href,
      metadata,
      mouseX,
      mouseY,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight
    };

    interactionQueueRef.current.push(interaction);

    // Flush queue if it gets too large or enough time has passed
    if (interactionQueueRef.current.length >= 10 || Date.now() - lastFlushRef.current > 5000) {
      flushInteractionQueue();
    }
  }, [user?.id, getSessionId]);

  // Flush interaction queue to backend
  const flushInteractionQueue = useCallback(async () => {
    if (interactionQueueRef.current.length === 0) return;

    const interactions = [...interactionQueueRef.current];
    interactionQueueRef.current = [];
    lastFlushRef.current = Date.now();

    try {
      // Send interactions in batches
      for (const interaction of interactions) {
        await supabase.functions.invoke('record-user-session', {
          body: { action: 'record_interaction', interactionData: interaction }
        });
      }
    } catch (error) {
      console.warn('Error flushing interaction queue:', error);
      // Re-add failed interactions back to queue
      interactionQueueRef.current.unshift(...interactions);
    }
  }, []);

  // Track clicks
  const trackClick = useCallback((event: MouseEvent) => {
    if (!isTrackingRef.current) return;

    const target = event.target as HTMLElement;
    const targetDescription = getElementDescription(target);
    
    recordInteraction(
      'click',
      targetDescription,
      {
        tagName: target.tagName,
        className: target.className,
        id: target.id,
        textContent: target.textContent?.slice(0, 100)
      },
      event.clientX,
      event.clientY
    );
  }, [recordInteraction]);

  // Track form interactions
  const trackFormInteraction = useCallback((event: Event) => {
    if (!isTrackingRef.current) return;

    const target = event.target as HTMLInputElement;
    const targetDescription = getElementDescription(target);
    
    recordInteraction(
      'form_fill',
      targetDescription,
      {
        type: target.type,
        name: target.name,
        value: target.type === 'password' ? '[REDACTED]' : target.value?.slice(0, 50),
        required: target.required
      }
    );
  }, [recordInteraction]);

  // Track navigation
  const trackNavigation = useCallback(() => {
    if (!isTrackingRef.current) return;

    recordInteraction(
      'navigation',
      window.location.pathname,
      {
        url: window.location.href,
        title: document.title,
        referrer: document.referrer
      }
    );
  }, [recordInteraction]);

  // Track errors
  const trackError = useCallback((error: Error, context?: string) => {
    if (!isTrackingRef.current) return;

    recordInteraction(
      'error',
      context || 'unknown',
      {
        message: error.message,
        stack: error.stack?.slice(0, 500),
        name: error.name,
        context
      }
    );
  }, [recordInteraction]);

  // End session
  const endSession = useCallback(async () => {
    await flushInteractionQueue();
    
    try {
      await supabase.functions.invoke('record-user-session', {
        body: { action: 'end_session', sessionData: { sessionId: getSessionId() } }
      });
    } catch (error) {
      console.warn('Error ending session:', error);
    }
  }, [flushInteractionQueue, getSessionId]);

  // Setup event listeners
  useEffect(() => {
    if (!isTrackingRef.current) return;

    // Initialize session on mount
    initializeSession();

    // Add event listeners
    document.addEventListener('click', trackClick);
    document.addEventListener('input', trackFormInteraction);
    window.addEventListener('beforeunload', endSession);

    // Track initial page load
    trackNavigation();

    // Setup page visibility change listener
    const handleVisibilityChange = () => {
      if (document.hidden) {
        flushInteractionQueue();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Setup periodic flushing
    const flushInterval = setInterval(flushInteractionQueue, 10000);

    return () => {
      document.removeEventListener('click', trackClick);
      document.removeEventListener('input', trackFormInteraction);
      window.removeEventListener('beforeunload', endSession);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(flushInterval);
      
      // Final flush on unmount
      flushInteractionQueue();
    };
  }, [
    initializeSession,
    trackClick,
    trackFormInteraction,
    trackNavigation,
    endSession,
    flushInteractionQueue
  ]);

  // Enable/disable tracking
  const setTrackingEnabled = useCallback((enabled: boolean) => {
    isTrackingRef.current = enabled;
    if (!enabled) {
      // Flush and clear queue when disabling
      flushInteractionQueue();
    }
  }, [flushInteractionQueue]);

  return {
    recordInteraction,
    trackError,
    trackNavigation,
    flushInteractionQueue,
    setTrackingEnabled,
    sessionId: getSessionId()
  };
};

// Helper function to describe DOM elements
function getElementDescription(element: HTMLElement): string {
  const parts = [];
  
  if (element.tagName) {
    parts.push(element.tagName.toLowerCase());
  }
  
  if (element.id) {
    parts.push(`#${element.id}`);
  }
  
  if (element.className) {
    const classes = element.className.split(' ').filter(c => c.trim());
    if (classes.length > 0) {
      parts.push(`.${classes.slice(0, 3).join('.')}`);
    }
  }
  
  return parts.join('') || 'unknown-element';
}

// Export a singleton instance for use across the app
let globalTracker: ReturnType<typeof useUserActionTracking> | null = null;

export const getGlobalTracker = () => globalTracker;
export const setGlobalTracker = (tracker: ReturnType<typeof useUserActionTracking>) => {
  globalTracker = tracker;
};