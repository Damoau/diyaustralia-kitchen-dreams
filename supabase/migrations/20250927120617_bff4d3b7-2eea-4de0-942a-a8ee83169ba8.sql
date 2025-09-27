-- Create comprehensive user behavior tracking and simulation system

-- User sessions table for complete journey tracking
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  total_actions INTEGER DEFAULT 0,
  pages_visited TEXT[] DEFAULT '{}',
  user_agent TEXT,
  ip_address INET,
  referrer TEXT,
  device_type TEXT,
  browser_info JSONB,
  session_duration_ms INTEGER,
  conversion_events JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User interactions table for granular action tracking  
CREATE TABLE IF NOT EXISTS public.user_interactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- 'click', 'form_fill', 'navigation', 'scroll', 'hover', 'error'
  target_element TEXT, -- CSS selector or element description
  page_url TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB, -- Additional context like form values, error messages, etc.
  mouse_x INTEGER,
  mouse_y INTEGER,
  viewport_width INTEGER,
  viewport_height INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Simulation reports for daily automated testing
CREATE TABLE IF NOT EXISTS public.simulation_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  report_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_simulations INTEGER NOT NULL DEFAULT 0,
  passed_simulations INTEGER NOT NULL DEFAULT 0,
  failed_simulations INTEGER NOT NULL DEFAULT 0,
  pass_rate NUMERIC(5,2) GENERATED ALWAYS AS (
    CASE WHEN total_simulations > 0 
         THEN ROUND((passed_simulations::NUMERIC / total_simulations::NUMERIC) * 100, 2)
         ELSE 0 
    END
  ) STORED,
  average_duration_ms INTEGER,
  failure_patterns JSONB DEFAULT '[]',
  performance_metrics JSONB DEFAULT '{}',
  user_behavior_patterns JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(report_date)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_id ON public.user_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_started_at ON public.user_sessions(started_at);

CREATE INDEX IF NOT EXISTS idx_user_interactions_session_id ON public.user_interactions(session_id);
CREATE INDEX IF NOT EXISTS idx_user_interactions_user_id ON public.user_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_interactions_timestamp ON public.user_interactions(timestamp);
CREATE INDEX IF NOT EXISTS idx_user_interactions_action_type ON public.user_interactions(action_type);

CREATE INDEX IF NOT EXISTS idx_simulation_reports_date ON public.simulation_reports(report_date DESC);

-- Enable RLS
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simulation_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage all user sessions" ON public.user_sessions
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own sessions" ON public.user_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert user sessions" ON public.user_sessions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can manage all user interactions" ON public.user_interactions
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own interactions" ON public.user_interactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert user interactions" ON public.user_interactions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can manage simulation reports" ON public.simulation_reports
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Function to end user session
CREATE OR REPLACE FUNCTION public.end_user_session(p_session_id TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_started_at TIMESTAMP WITH TIME ZONE;
  v_total_actions INTEGER;
BEGIN
  -- Get session start time and count actions
  SELECT started_at INTO v_started_at
  FROM user_sessions 
  WHERE session_id = p_session_id;
  
  SELECT COUNT(*) INTO v_total_actions
  FROM user_interactions 
  WHERE session_id = p_session_id;
  
  -- Update session with end data
  UPDATE public.user_sessions 
  SET 
    ended_at = now(),
    total_actions = v_total_actions,
    session_duration_ms = EXTRACT(EPOCH FROM (now() - v_started_at)) * 1000,
    pages_visited = (
      SELECT array_agg(DISTINCT page_url)
      FROM user_interactions 
      WHERE session_id = p_session_id
    )
  WHERE session_id = p_session_id;
END;
$$;

-- Function to create simulation report
CREATE OR REPLACE FUNCTION public.create_simulation_report(
  p_date DATE,
  p_total INTEGER,
  p_passed INTEGER,
  p_failed INTEGER,
  p_avg_duration INTEGER,
  p_failure_patterns JSONB DEFAULT '[]',
  p_performance_metrics JSONB DEFAULT '{}',
  p_user_patterns JSONB DEFAULT '[]'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_report_id UUID;
BEGIN
  INSERT INTO public.simulation_reports (
    report_date,
    total_simulations,
    passed_simulations,
    failed_simulations,
    average_duration_ms,
    failure_patterns,
    performance_metrics,
    user_behavior_patterns
  ) VALUES (
    p_date,
    p_total,
    p_passed,
    p_failed,
    p_avg_duration,
    p_failure_patterns,
    p_performance_metrics,
    p_user_patterns
  ) 
  ON CONFLICT (report_date) 
  DO UPDATE SET
    total_simulations = EXCLUDED.total_simulations,
    passed_simulations = EXCLUDED.passed_simulations,
    failed_simulations = EXCLUDED.failed_simulations,
    average_duration_ms = EXCLUDED.average_duration_ms,
    failure_patterns = EXCLUDED.failure_patterns,
    performance_metrics = EXCLUDED.performance_metrics,
    user_behavior_patterns = EXCLUDED.user_behavior_patterns,
    created_at = now()
  RETURNING id INTO v_report_id;
  
  RETURN v_report_id;
END;
$$;