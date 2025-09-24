-- Enable Row Level Security on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE list_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE individuals ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE related_parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE screening_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE screening_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_rule_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE super_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE impersonations ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's tenant ID
CREATE OR REPLACE FUNCTION get_current_tenant_id()
RETURNS UUID AS $$
BEGIN
    RETURN COALESCE(
        current_setting('app.current_tenant_id', true)::UUID,
        NULL
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is super admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM super_admins 
        WHERE user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user has access to tenant
CREATE OR REPLACE FUNCTION has_tenant_access(tenant_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_tenants 
        WHERE user_id = auth.uid() 
        AND tenant_id = tenant_uuid
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get user role in tenant
CREATE OR REPLACE FUNCTION get_user_role_in_tenant(tenant_uuid UUID)
RETURNS user_role AS $$
BEGIN
    RETURN (
        SELECT role FROM user_tenants 
        WHERE user_id = auth.uid() 
        AND tenant_id = tenant_uuid
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Super admins can view all profiles" ON profiles
    FOR SELECT USING (is_super_admin());

-- Tenants policies
CREATE POLICY "Users can view tenants they belong to" ON tenants
    FOR SELECT USING (
        is_super_admin() OR 
        has_tenant_access(id)
    );

CREATE POLICY "Super admins can manage all tenants" ON tenants
    FOR ALL USING (is_super_admin());

-- Tenant domains policies
CREATE POLICY "Users can view domains of their tenants" ON tenant_domains
    FOR SELECT USING (
        is_super_admin() OR 
        has_tenant_access(tenant_id)
    );

CREATE POLICY "Super admins can manage all tenant domains" ON tenant_domains
    FOR ALL USING (is_super_admin());

-- User tenants policies
CREATE POLICY "Users can view their own tenant memberships" ON user_tenants
    FOR SELECT USING (
        is_super_admin() OR 
        auth.uid() = user_id
    );

CREATE POLICY "Admins can manage tenant memberships" ON user_tenants
    FOR ALL USING (
        is_super_admin() OR 
        (has_tenant_access(tenant_id) AND get_user_role_in_tenant(tenant_id) = 'ADMIN')
    );

-- Lists policies
CREATE POLICY "Tenant isolation for lists" ON lists
    FOR ALL USING (
        is_super_admin() OR 
        (tenant_id IS NULL) OR  -- System lists
        (tenant_id = get_current_tenant_id() AND has_tenant_access(tenant_id))
    );

-- List values policies
CREATE POLICY "Tenant isolation for list values" ON list_values
    FOR ALL USING (
        is_super_admin() OR 
        (tenant_id IS NULL) OR  -- System list values
        (tenant_id = get_current_tenant_id() AND has_tenant_access(tenant_id))
    );

-- Entities policies
CREATE POLICY "Tenant isolation for entities" ON entities
    FOR ALL USING (
        is_super_admin() OR 
        (tenant_id = get_current_tenant_id() AND has_tenant_access(tenant_id))
    );

-- Individuals policies
CREATE POLICY "Tenant isolation for individuals" ON individuals
    FOR ALL USING (
        is_super_admin() OR 
        EXISTS (
            SELECT 1 FROM entities 
            WHERE entities.id = individuals.entity_id 
            AND entities.tenant_id = get_current_tenant_id() 
            AND has_tenant_access(entities.tenant_id)
        )
    );

-- Organizations policies
CREATE POLICY "Tenant isolation for organizations" ON organizations
    FOR ALL USING (
        is_super_admin() OR 
        EXISTS (
            SELECT 1 FROM entities 
            WHERE entities.id = organizations.entity_id 
            AND entities.tenant_id = get_current_tenant_id() 
            AND has_tenant_access(entities.tenant_id)
        )
    );

-- Related parties policies
CREATE POLICY "Tenant isolation for related parties" ON related_parties
    FOR ALL USING (
        is_super_admin() OR 
        (tenant_id = get_current_tenant_id() AND has_tenant_access(tenant_id))
    );

-- Documents policies
CREATE POLICY "Tenant isolation for documents" ON documents
    FOR ALL USING (
        is_super_admin() OR 
        (tenant_id = get_current_tenant_id() AND has_tenant_access(tenant_id))
    );

-- Screening runs policies
CREATE POLICY "Tenant isolation for screening runs" ON screening_runs
    FOR ALL USING (
        is_super_admin() OR 
        (tenant_id = get_current_tenant_id() AND has_tenant_access(tenant_id))
    );

-- Risk runs policies
CREATE POLICY "Tenant isolation for risk runs" ON risk_runs
    FOR ALL USING (
        is_super_admin() OR 
        (tenant_id = get_current_tenant_id() AND has_tenant_access(tenant_id))
    );

-- Risk decisions policies
CREATE POLICY "Tenant isolation for risk decisions" ON risk_decisions
    FOR ALL USING (
        is_super_admin() OR 
        (tenant_id = get_current_tenant_id() AND has_tenant_access(tenant_id))
    );

-- Review notes policies
CREATE POLICY "Tenant isolation for review notes" ON review_notes
    FOR ALL USING (
        is_super_admin() OR 
        (tenant_id = get_current_tenant_id() AND has_tenant_access(tenant_id))
    );

-- Screening settings policies
CREATE POLICY "Tenant isolation for screening settings" ON screening_settings
    FOR ALL USING (
        is_super_admin() OR 
        (tenant_id = get_current_tenant_id() AND has_tenant_access(tenant_id))
    );

-- Risk rules policies
CREATE POLICY "Tenant isolation for risk rules" ON risk_rules
    FOR ALL USING (
        is_super_admin() OR 
        (tenant_id = get_current_tenant_id() AND has_tenant_access(tenant_id))
    );

-- Risk rule values policies
CREATE POLICY "Tenant isolation for risk rule values" ON risk_rule_values
    FOR ALL USING (
        is_super_admin() OR 
        (tenant_id = get_current_tenant_id() AND has_tenant_access(tenant_id))
    );

-- Audit logs policies
CREATE POLICY "Tenant isolation for audit logs" ON audit_logs
    FOR SELECT USING (
        is_super_admin() OR 
        (tenant_id IS NULL) OR  -- System audit logs
        (tenant_id = get_current_tenant_id() AND has_tenant_access(tenant_id))
    );

CREATE POLICY "Users can insert audit logs for their tenant" ON audit_logs
    FOR INSERT WITH CHECK (
        is_super_admin() OR 
        (tenant_id = get_current_tenant_id() AND has_tenant_access(tenant_id))
    );

-- Super admins policies
CREATE POLICY "Only super admins can view super admin table" ON super_admins
    FOR SELECT USING (is_super_admin());

CREATE POLICY "Only super admins can manage super admin table" ON super_admins
    FOR ALL USING (is_super_admin());

-- Impersonations policies
CREATE POLICY "Only super admins can manage impersonations" ON impersonations
    FOR ALL USING (is_super_admin());