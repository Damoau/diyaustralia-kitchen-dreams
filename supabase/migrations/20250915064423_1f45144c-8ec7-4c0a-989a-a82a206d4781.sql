-- Admin Foundation Database Schema (Fixed)

-- Create app_role enum if not exists (adding new roles)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE app_role AS ENUM ('admin', 'sales_rep', 'customer', 'fulfilment');
    ELSE
        -- Add new roles if they don't exist
        ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'sales_rep';
        ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'fulfilment';
    END IF;
END $$;

-- Enhanced audit logs table for comprehensive tracking
CREATE TABLE IF NOT EXISTS audit_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name text NOT NULL,
    record_id uuid,
    action text NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE', or custom actions like 'cart.split'
    actor_id uuid REFERENCES auth.users(id),
    old_values jsonb,
    new_values jsonb,
    metadata jsonb, -- Additional context like reason, source, etc.
    ip_address inet,
    user_agent text,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for audit logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_record ON audit_logs(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

-- Enhanced carts table with admin features
ALTER TABLE carts ADD COLUMN IF NOT EXISTS owner_user_id uuid REFERENCES auth.users(id);
ALTER TABLE carts ADD COLUMN IF NOT EXISTS label text;
ALTER TABLE carts ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';
ALTER TABLE carts ADD COLUMN IF NOT EXISTS abandoned_at timestamptz;
ALTER TABLE carts ADD COLUMN IF NOT EXISTS abandon_reason text;
ALTER TABLE carts ADD COLUMN IF NOT EXISTS merged_from_cart_id uuid REFERENCES carts(id);
ALTER TABLE carts ADD COLUMN IF NOT EXISTS merged_into_cart_id uuid REFERENCES carts(id);
ALTER TABLE carts ADD COLUMN IF NOT EXISTS converted_quote_id uuid;
ALTER TABLE carts ADD COLUMN IF NOT EXISTS converted_order_id uuid REFERENCES orders(id);
ALTER TABLE carts ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';
ALTER TABLE carts ADD COLUMN IF NOT EXISTS source text DEFAULT 'portal'; -- 'portal', 'admin'
ALTER TABLE carts ADD COLUMN IF NOT EXISTS notes text;

-- Enhanced cart_items table
ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS locked boolean DEFAULT false;
ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS price_override_amount numeric;
ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS price_override_reason text;
ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS custom_props_hash uuid DEFAULT gen_random_uuid();
ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS attachment_file_ids uuid[] DEFAULT '{}';
ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS notes text;

-- Cart indexes for performance
CREATE INDEX IF NOT EXISTS idx_carts_status_updated ON carts(status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_carts_owner_status ON carts(owner_user_id, status);
CREATE INDEX IF NOT EXISTS idx_carts_label ON carts(label) WHERE label IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_carts_tags ON carts USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_cart_items_custom_props_hash ON cart_items(cart_id, custom_props_hash);

-- Admin sessions table for enhanced security
CREATE TABLE IF NOT EXISTS admin_sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id),
    session_token text UNIQUE NOT NULL,
    expires_at timestamptz NOT NULL,
    ip_address inet,
    user_agent text,
    two_fa_verified boolean DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    last_active_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_sessions_user ON admin_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires ON admin_sessions(expires_at);

-- Function to log audit events
CREATE OR REPLACE FUNCTION log_admin_audit(
    p_table_name text,
    p_record_id uuid,
    p_action text,
    p_old_values jsonb DEFAULT NULL,
    p_new_values jsonb DEFAULT NULL,
    p_metadata jsonb DEFAULT NULL
) RETURNS void AS $$
BEGIN
    INSERT INTO audit_logs (
        table_name,
        record_id,
        action,
        actor_id,
        old_values,
        new_values,
        metadata
    ) VALUES (
        p_table_name,
        p_record_id,
        p_action,
        auth.uid(),
        p_old_values,
        p_new_values,
        p_metadata
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies for admin tables
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view all audit logs" ON audit_logs
    FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert audit logs" ON audit_logs
    FOR INSERT WITH CHECK (true);

ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own admin sessions" ON admin_sessions
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Admins can view all admin sessions" ON admin_sessions
    FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- Enhanced cart policies for admin access
DROP POLICY IF EXISTS "Admins can manage all carts" ON carts;
CREATE POLICY "Admins can manage all carts" ON carts
    FOR ALL USING (
        has_role(auth.uid(), 'admin') OR 
        has_role(auth.uid(), 'sales_rep') OR 
        has_role(auth.uid(), 'fulfilment')
    );

DROP POLICY IF EXISTS "Admins can manage all cart items" ON cart_items;
CREATE POLICY "Admins can manage all cart items" ON cart_items
    FOR ALL USING (
        has_role(auth.uid(), 'admin') OR 
        has_role(auth.uid(), 'sales_rep') OR 
        has_role(auth.uid(), 'fulfilment')
    );