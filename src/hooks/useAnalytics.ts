import { useCallback } from 'react';

export interface AnalyticsEvent {
  event: string;
  properties?: Record<string, any>;
  timestamp?: number;
}

export const useAnalytics = () => {
  const track = useCallback((event: string, properties?: Record<string, any>) => {
    const analyticsEvent: AnalyticsEvent = {
      event,
      properties: {
        ...properties,
        url: window.location.href,
        referrer: document.referrer,
        user_agent: navigator.userAgent,
        timestamp: Date.now(),
      },
      timestamp: Date.now(),
    };

    // Log to console for development
    console.log('Analytics Event:', analyticsEvent);

    // Store in localStorage for admin review
    try {
      const stored = localStorage.getItem('analytics_events') || '[]';
      const events = JSON.parse(stored);
      events.push(analyticsEvent);
      
      // Keep only last 100 events
      if (events.length > 100) {
        events.splice(0, events.length - 100);
      }
      
      localStorage.setItem('analytics_events', JSON.stringify(events));
    } catch (error) {
      console.error('Failed to store analytics event:', error);
    }

    // Send to external analytics service (placeholder)
    // In production, this would send to Google Analytics, Mixpanel, etc.
  }, []);

  const trackCheckoutEvent = useCallback((
    step: 'started' | 'identify_viewed' | 'identify_completed' | 'identify_failed' | 'cart_merged' | 'quotes_surfaced',
    properties?: Record<string, any>
  ) => {
    const eventMap = {
      started: 'CheckoutStarted',
      identify_viewed: 'IdentifyViewed', 
      identify_completed: 'IdentifyCompleted',
      identify_failed: 'IdentifyFailed',
      cart_merged: 'CartMerged',
      quotes_surfaced: 'QuotesSurfaced',
    };

    track(eventMap[step], properties);
  }, [track]);

  const getEvents = useCallback(() => {
    try {
      const stored = localStorage.getItem('analytics_events') || '[]';
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }, []);

  return {
    track,
    trackCheckoutEvent,
    getEvents,
  };
};
