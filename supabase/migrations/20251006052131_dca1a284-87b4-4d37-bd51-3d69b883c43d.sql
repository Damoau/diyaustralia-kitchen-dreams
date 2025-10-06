-- Drop document_annotations table (no longer needed with DocuSeal)
DROP TABLE IF EXISTS public.document_annotations CASCADE;

-- Remove annotation-related fields from order_documents if they exist
ALTER TABLE public.order_documents 
DROP COLUMN IF EXISTS annotation_data CASCADE;