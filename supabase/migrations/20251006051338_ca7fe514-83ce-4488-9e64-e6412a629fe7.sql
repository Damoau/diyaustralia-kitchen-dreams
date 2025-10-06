-- Add DocuSeal tracking fields to order_documents
ALTER TABLE public.order_documents
ADD COLUMN IF NOT EXISTS docuseal_submission_id TEXT,
ADD COLUMN IF NOT EXISTS docuseal_template_id TEXT,
ADD COLUMN IF NOT EXISTS signing_method TEXT DEFAULT 'custom' CHECK (signing_method IN ('custom', 'docuseal')),
ADD COLUMN IF NOT EXISTS docuseal_status TEXT,
ADD COLUMN IF NOT EXISTS docuseal_completed_at TIMESTAMPTZ;

-- Create index for DocuSeal lookups
CREATE INDEX IF NOT EXISTS idx_order_documents_docuseal_submission 
ON public.order_documents(docuseal_submission_id) 
WHERE docuseal_submission_id IS NOT NULL;

-- Add comment
COMMENT ON COLUMN public.order_documents.signing_method IS 'Method used for signing: custom (simple approval) or docuseal (legal e-signature)';
COMMENT ON COLUMN public.order_documents.docuseal_status IS 'DocuSeal submission status: pending, completed, declined, expired';