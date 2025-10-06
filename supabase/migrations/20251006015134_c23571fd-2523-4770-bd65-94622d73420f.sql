-- Phase 1: Document Approval & Multi-Stage Payment System
-- Tables: order_documents, document_annotations, document_reminders
-- Modifications: payment_schedules, orders

-- =====================================================
-- 1. CREATE NEW TABLES
-- =====================================================

-- Table: order_documents
CREATE TABLE IF NOT EXISTS public.order_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  
  -- Document Details
  document_type TEXT NOT NULL CHECK (document_type IN ('drawing', 'specification', 'contract', 'invoice', 'other')),
  title TEXT NOT NULL,
  description TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  
  -- File Storage
  file_id UUID REFERENCES public.files(id),
  storage_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  
  -- Status & Approval
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'viewed', 'approved', 'rejected', 'superseded')),
  requires_signature BOOLEAN DEFAULT false,
  signature_url TEXT,
  
  -- Tracking
  sent_at TIMESTAMP WITH TIME ZONE,
  first_viewed_at TIMESTAMP WITH TIME ZONE,
  last_viewed_at TIMESTAMP WITH TIME ZONE,
  view_count INTEGER DEFAULT 0,
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES auth.users(id),
  rejection_reason TEXT,
  
  -- Metadata
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_order_documents_order ON public.order_documents(order_id);
CREATE INDEX idx_order_documents_status ON public.order_documents(status);
CREATE INDEX idx_order_documents_type ON public.order_documents(document_type);

-- Table: document_annotations
CREATE TABLE IF NOT EXISTS public.document_annotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.order_documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  
  -- Annotation Data
  page_number INTEGER NOT NULL,
  annotation_type TEXT NOT NULL CHECK (annotation_type IN ('comment', 'highlight', 'drawing', 'stamp')),
  annotation_data JSONB NOT NULL,
  
  -- Tracking
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_document_annotations_document ON public.document_annotations(document_id);

-- Table: document_reminders
CREATE TABLE IF NOT EXISTS public.document_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  document_id UUID REFERENCES public.order_documents(id) ON DELETE CASCADE,
  
  -- Reminder Details
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('initial_notification', 'follow_up', 'urgent')),
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL,
  next_reminder_at TIMESTAMP WITH TIME ZONE,
  
  -- Configuration
  days_between_reminders INTEGER DEFAULT 3,
  max_reminders INTEGER DEFAULT 5,
  reminder_count INTEGER DEFAULT 0,
  
  -- Status
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'sent', 'completed', 'cancelled')),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_document_reminders_next ON public.document_reminders(next_reminder_at) WHERE status = 'scheduled';

-- =====================================================
-- 2. MODIFY EXISTING TABLES
-- =====================================================

-- Add columns to payment_schedules
ALTER TABLE public.payment_schedules 
  ADD COLUMN IF NOT EXISTS trigger_event TEXT CHECK (trigger_event IN ('order_created', 'deposit_paid', 'drawings_approved', 'production_complete', 'ready_for_delivery')),
  ADD COLUMN IF NOT EXISTS requires_document_approval BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS required_document_ids UUID[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS unlocked_at TIMESTAMP WITH TIME ZONE;

-- Add columns to orders
ALTER TABLE public.orders 
  ADD COLUMN IF NOT EXISTS drawings_status TEXT DEFAULT 'not_required' CHECK (drawings_status IN ('not_required', 'pending_upload', 'sent', 'under_review', 'approved', 'changes_requested')),
  ADD COLUMN IF NOT EXISTS drawings_approved_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS drawings_approved_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS payment_type TEXT DEFAULT 'full' CHECK (payment_type IN ('full', 'deposit'));

-- =====================================================
-- 3. CREATE DATABASE FUNCTIONS
-- =====================================================

-- Function: Track document views
CREATE OR REPLACE FUNCTION public.track_document_view(p_document_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.order_documents
  SET 
    view_count = view_count + 1,
    last_viewed_at = NOW(),
    first_viewed_at = COALESCE(first_viewed_at, NOW()),
    status = CASE 
      WHEN status = 'sent' THEN 'viewed'
      ELSE status
    END,
    updated_at = NOW()
  WHERE id = p_document_id;
END;
$$;

-- Function: Unlock progress payment when drawings approved
CREATE OR REPLACE FUNCTION public.unlock_progress_payment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    -- Update order
    UPDATE public.orders 
    SET 
      drawings_status = 'approved',
      drawings_approved_at = NOW(),
      drawings_approved_by = NEW.approved_by,
      updated_at = NOW()
    WHERE id = NEW.order_id;
    
    -- Unlock 30% payment
    UPDATE public.payment_schedules
    SET 
      unlocked_at = NOW(),
      due_date = CURRENT_DATE + INTERVAL '14 days',
      status = 'pending',
      updated_at = NOW()
    WHERE 
      order_id = NEW.order_id 
      AND trigger_event = 'drawings_approved'
      AND unlocked_at IS NULL;
      
    -- Log audit event
    PERFORM public.log_audit_event(
      p_actor_id := NEW.approved_by,
      p_scope := 'order_documents',
      p_scope_id := NEW.id,
      p_action := 'drawing_approved',
      p_after_data := json_build_object(
        'order_id', NEW.order_id,
        'document_id', NEW.id,
        'approved_at', NEW.approved_at
      )::text
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- =====================================================
-- 4. CREATE TRIGGERS
-- =====================================================

-- Trigger: Update updated_at on order_documents
CREATE TRIGGER update_order_documents_updated_at
  BEFORE UPDATE ON public.order_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: Update updated_at on document_annotations
CREATE TRIGGER update_document_annotations_updated_at
  BEFORE UPDATE ON public.document_annotations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: Auto-unlock payment on drawing approval
CREATE TRIGGER on_document_approved
  AFTER UPDATE ON public.order_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.unlock_progress_payment();

-- =====================================================
-- 5. ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on new tables
ALTER TABLE public.order_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_annotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_reminders ENABLE ROW LEVEL SECURITY;

-- Policies for order_documents
CREATE POLICY "Admins can manage all documents"
  ON public.order_documents FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Customers can view their order documents"
  ON public.order_documents FOR SELECT
  TO authenticated
  USING (
    order_id IN (
      SELECT id FROM public.orders WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Customers can approve their documents"
  ON public.order_documents FOR UPDATE
  TO authenticated
  USING (
    order_id IN (
      SELECT id FROM public.orders WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    status IN ('approved', 'rejected') AND
    approved_by = auth.uid()
  );

-- Policies for document_annotations
CREATE POLICY "Users can manage their own annotations"
  ON public.document_annotations FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all annotations"
  ON public.document_annotations FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Policies for document_reminders
CREATE POLICY "Admins can manage reminders"
  ON public.document_reminders FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert reminders"
  ON public.document_reminders FOR INSERT
  WITH CHECK (true);