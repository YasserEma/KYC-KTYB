-- =====================================================
-- SUPABASE DATABASE SETUP SCRIPT
-- =====================================================
-- Execute this script in your Supabase SQL Editor
-- This will set up the complete KYC Platform database

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "citext";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- CUSTOM TYPES
-- =====================================================

-- User role enum
CREATE TYPE user_role AS ENUM ('ADMIN', 'MANAGER', 'ANALYST', 'VIEWER');

-- Tenant status enum
CREATE TYPE tenant_status AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- Entity type enum
CREATE TYPE entity_type AS ENUM ('INDIVIDUAL', 'ORGANIZATION');

-- List type enum
CREATE TYPE list_type AS ENUM ('SYSTEM', 'TENANT');

-- Document status enum
CREATE TYPE document_status AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');

-- Screening status enum
CREATE TYPE screening_status AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED');

-- Risk level enum
CREATE TYPE risk_level AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- Risk decision enum
CREATE TYPE risk_decision AS ENUM ('APPROVED', 'REJECTED', 'MANUAL_REVIEW');

-- Risk rule kind enum
CREATE TYPE risk_rule_kind AS ENUM ('KYC', 'KYB', 'TRANSACTION');

-- Risk rule status enum
CREATE TYPE risk_rule_status AS ENUM ('ACTIVE', 'INACTIVE', 'DRAFT');

-- =====================================================
-- TABLES
-- =====================================================

-- Profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email CITEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tenants table
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug CITEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    status tenant_status DEFAULT 'ACTIVE',
    plan TEXT DEFAULT 'basic',
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tenant domains table
CREATE TABLE tenant_domains (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    domain CITEXT UNIQUE NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User tenants table (many-to-many relationship)
CREATE TABLE user_tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    role user_role NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, tenant_id)
);

-- Lists table (for dropdown values)
CREATE TABLE lists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    key CITEXT NOT NULL,
    type list_type NOT NULL,
    description TEXT,
    items_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, key)
);

-- List values table
CREATE TABLE list_values (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    list_id UUID NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    "order" INTEGER NOT NULL,
    key CITEXT NOT NULL,
    label TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(list_id, key)
);

-- Entities table (base table for individuals and organizations)
CREATE TABLE entities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    type entity_type NOT NULL,
    reference_number TEXT,
    status TEXT DEFAULT 'DRAFT',
    risk_level risk_level,
    risk_score INTEGER,
    last_screening_at TIMESTAMPTZ,
    last_risk_assessment_at TIMESTAMPTZ,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Individuals table
CREATE TABLE individuals (
    id UUID PRIMARY KEY REFERENCES entities(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    middle_name TEXT,
    last_name TEXT NOT NULL,
    full_name TEXT GENERATED ALWAYS AS (
        CASE 
            WHEN middle_name IS NOT NULL AND middle_name != '' 
            THEN first_name || ' ' || middle_name || ' ' || last_name
            ELSE first_name || ' ' || last_name
        END
    ) STORED,
    date_of_birth DATE,
    place_of_birth TEXT,
    nationality TEXT,
    id_type TEXT,
    id_number TEXT,
    id_expiry_date DATE,
    occupation TEXT,
    address JSONB,
    phone TEXT,
    email CITEXT,
    is_pep BOOLEAN DEFAULT FALSE,
    pep_details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Organizations table
CREATE TABLE organizations (
    id UUID PRIMARY KEY REFERENCES entities(id) ON DELETE CASCADE,
    legal_name TEXT NOT NULL,
    trade_name TEXT,
    registration_number TEXT,
    registration_date DATE,
    registration_country TEXT,
    legal_structure TEXT,
    industry TEXT,
    business_description TEXT,
    address JSONB,
    phone TEXT,
    email CITEXT,
    website TEXT,
    annual_revenue DECIMAL,
    employee_count INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Related parties table (for organization relationships)
CREATE TABLE related_parties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    individual_id UUID REFERENCES individuals(id) ON DELETE CASCADE,
    kind TEXT NOT NULL,
    ownership_percentage DECIMAL,
    start_date DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Documents table
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    name TEXT NOT NULL,
    file_path TEXT,
    file_size INTEGER,
    mime_type TEXT,
    status document_status DEFAULT 'PENDING',
    verification_notes TEXT,
    verified_by UUID REFERENCES profiles(id),
    verified_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Screening runs table
CREATE TABLE screening_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    status screening_status DEFAULT 'PENDING',
    provider TEXT,
    external_id TEXT,
    request_data JSONB,
    response_data JSONB,
    matches_count INTEGER DEFAULT 0,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    error_message TEXT,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Risk runs table
CREATE TABLE risk_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
    total_score INTEGER NOT NULL DEFAULT 0,
    risk_level risk_level,
    rules_applied JSONB DEFAULT '[]',
    calculation_details JSONB DEFAULT '{}',
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Risk decisions table
CREATE TABLE risk_decisions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
    risk_run_id UUID REFERENCES risk_runs(id) ON DELETE CASCADE,
    decision risk_decision NOT NULL,
    reason TEXT,
    auto_decision BOOLEAN DEFAULT FALSE,
    decided_by UUID REFERENCES profiles(id),
    decided_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Review notes table
CREATE TABLE review_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
    note TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT TRUE,
    created_by UUID NOT NULL REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Screening settings table
CREATE TABLE screening_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    json_value JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, name)
);

-- Risk rules table
CREATE TABLE risk_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    kind risk_rule_kind NOT NULL,
    weight INTEGER NOT NULL DEFAULT 0,
    status risk_rule_status DEFAULT 'DRAFT',
    conditions JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Risk rule values table
CREATE TABLE risk_rule_values (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rule_id UUID NOT NULL REFERENCES risk_rules(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    key CITEXT NOT NULL,
    label TEXT NOT NULL,
    value INTEGER NOT NULL DEFAULT 0,
    "order" INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(rule_id, key)
);

-- Audit logs table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    metadata JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Super admins table
CREATE TABLE super_admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    granted_by UUID REFERENCES profiles(id),
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    revoked_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Impersonations table
CREATE TABLE impersonations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    impersonator_id UUID NOT NULL REFERENCES profiles(id),
    target_user_id UUID NOT NULL REFERENCES profiles(id),
    tenant_id UUID REFERENCES tenants(id),
    reason TEXT,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

-- Performance indexes
CREATE INDEX idx_tenants_slug ON tenants(slug);
CREATE INDEX idx_tenant_domains_domain ON tenant_domains(domain);
CREATE INDEX idx_tenant_domains_tenant_id ON tenant_domains(tenant_id);
CREATE INDEX idx_user_tenants_user_id ON user_tenants(user_id);
CREATE INDEX idx_user_tenants_tenant_id ON user_tenants(tenant_id);
CREATE INDEX idx_lists_tenant_id_key ON lists(tenant_id, key);
CREATE INDEX idx_list_values_list_id ON list_values(list_id);
CREATE INDEX idx_entities_tenant_id ON entities(tenant_id);
CREATE INDEX idx_entities_type ON entities(type);
CREATE INDEX idx_entities_status ON entities(status);
CREATE INDEX idx_entities_risk_level ON entities(risk_level);
CREATE INDEX idx_individuals_full_name ON individuals USING gin(to_tsvector('english', full_name));
CREATE INDEX idx_organizations_legal_name ON organizations USING gin(to_tsvector('english', legal_name));
CREATE INDEX idx_related_parties_organization_id ON related_parties(organization_id);
CREATE INDEX idx_related_parties_individual_id ON related_parties(individual_id);
CREATE INDEX idx_documents_entity_id ON documents(entity_id);
CREATE INDEX idx_documents_type ON documents(type);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_screening_runs_entity_id ON screening_runs(entity_id);
CREATE INDEX idx_screening_runs_status ON screening_runs(status);
CREATE INDEX idx_risk_runs_entity_id ON risk_runs(entity_id);
CREATE INDEX idx_risk_decisions_entity_id ON risk_decisions(entity_id);
CREATE INDEX idx_review_notes_entity_id ON review_notes(entity_id);
CREATE INDEX idx_audit_logs_tenant_id ON audit_logs(tenant_id);
CREATE INDEX idx_audit_logs_entity_type_id ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- =====================================================
-- UPDATED_AT TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to tables with updated_at columns
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tenant_domains_updated_at BEFORE UPDATE ON tenant_domains FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_tenants_updated_at BEFORE UPDATE ON user_tenants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lists_updated_at BEFORE UPDATE ON lists FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_list_values_updated_at BEFORE UPDATE ON list_values FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_entities_updated_at BEFORE UPDATE ON entities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_individuals_updated_at BEFORE UPDATE ON individuals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_related_parties_updated_at BEFORE UPDATE ON related_parties FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_screening_runs_updated_at BEFORE UPDATE ON screening_runs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_risk_runs_updated_at BEFORE UPDATE ON risk_runs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_risk_decisions_updated_at BEFORE UPDATE ON risk_decisions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_review_notes_updated_at BEFORE UPDATE ON review_notes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_screening_settings_updated_at BEFORE UPDATE ON screening_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_risk_rules_updated_at BEFORE UPDATE ON risk_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_risk_rule_values_updated_at BEFORE UPDATE ON risk_rule_values FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_super_admins_updated_at BEFORE UPDATE ON super_admins FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
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

-- Helper functions for RLS policies
CREATE OR REPLACE FUNCTION get_current_tenant_id()
RETURNS UUID AS $$
BEGIN
    RETURN COALESCE(
        (current_setting('app.current_tenant_id', true))::UUID,
        NULL
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM super_admins 
        WHERE user_id = auth.uid() 
        AND is_active = true 
        AND revoked_at IS NULL
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION has_tenant_access(tenant_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_tenants 
        WHERE user_id = auth.uid() 
        AND tenant_id = tenant_uuid 
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_user_role_in_tenant(tenant_uuid UUID)
RETURNS user_role AS $$
BEGIN
    RETURN (
        SELECT role FROM user_tenants 
        WHERE user_id = auth.uid() 
        AND tenant_id = tenant_uuid 
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Super admins can view all profiles" ON profiles FOR SELECT USING (is_super_admin());

-- Tenants policies
CREATE POLICY "Users can view accessible tenants" ON tenants FOR SELECT USING (
    is_super_admin() OR has_tenant_access(id)
);
CREATE POLICY "Super admins can manage tenants" ON tenants FOR ALL USING (is_super_admin());

-- Tenant domains policies
CREATE POLICY "Users can view tenant domains" ON tenant_domains FOR SELECT USING (
    is_super_admin() OR has_tenant_access(tenant_id)
);
CREATE POLICY "Super admins can manage tenant domains" ON tenant_domains FOR ALL USING (is_super_admin());

-- User tenants policies
CREATE POLICY "Users can view own tenant relationships" ON user_tenants FOR SELECT USING (
    auth.uid() = user_id OR is_super_admin()
);
CREATE POLICY "Tenant admins can manage user relationships" ON user_tenants FOR ALL USING (
    is_super_admin() OR 
    (has_tenant_access(tenant_id) AND get_user_role_in_tenant(tenant_id) = 'ADMIN')
);

-- Lists policies (system lists visible to all, tenant lists only to tenant users)
CREATE POLICY "System lists are visible to all authenticated users" ON lists FOR SELECT USING (
    auth.role() = 'authenticated' AND tenant_id IS NULL
);
CREATE POLICY "Tenant lists are visible to tenant users" ON lists FOR SELECT USING (
    tenant_id IS NOT NULL AND (is_super_admin() OR has_tenant_access(tenant_id))
);
CREATE POLICY "Tenant admins can manage tenant lists" ON lists FOR ALL USING (
    tenant_id IS NOT NULL AND (
        is_super_admin() OR 
        (has_tenant_access(tenant_id) AND get_user_role_in_tenant(tenant_id) IN ('ADMIN', 'MANAGER'))
    )
);

-- List values policies
CREATE POLICY "System list values are visible to all authenticated users" ON list_values FOR SELECT USING (
    auth.role() = 'authenticated' AND tenant_id IS NULL
);
CREATE POLICY "Tenant list values are visible to tenant users" ON list_values FOR SELECT USING (
    tenant_id IS NOT NULL AND (is_super_admin() OR has_tenant_access(tenant_id))
);
CREATE POLICY "Tenant admins can manage tenant list values" ON list_values FOR ALL USING (
    tenant_id IS NOT NULL AND (
        is_super_admin() OR 
        (has_tenant_access(tenant_id) AND get_user_role_in_tenant(tenant_id) IN ('ADMIN', 'MANAGER'))
    )
);

-- Entities policies
CREATE POLICY "Tenant users can view tenant entities" ON entities FOR SELECT USING (
    is_super_admin() OR has_tenant_access(tenant_id)
);
CREATE POLICY "Tenant users can manage tenant entities" ON entities FOR ALL USING (
    is_super_admin() OR 
    (has_tenant_access(tenant_id) AND get_user_role_in_tenant(tenant_id) IN ('ADMIN', 'MANAGER', 'ANALYST'))
);

-- Individuals policies
CREATE POLICY "Tenant users can view tenant individuals" ON individuals FOR SELECT USING (
    EXISTS (SELECT 1 FROM entities WHERE entities.id = individuals.id AND (is_super_admin() OR has_tenant_access(entities.tenant_id)))
);
CREATE POLICY "Tenant users can manage tenant individuals" ON individuals FOR ALL USING (
    EXISTS (SELECT 1 FROM entities WHERE entities.id = individuals.id AND (
        is_super_admin() OR 
        (has_tenant_access(entities.tenant_id) AND get_user_role_in_tenant(entities.tenant_id) IN ('ADMIN', 'MANAGER', 'ANALYST'))
    ))
);

-- Organizations policies
CREATE POLICY "Tenant users can view tenant organizations" ON organizations FOR SELECT USING (
    EXISTS (SELECT 1 FROM entities WHERE entities.id = organizations.id AND (is_super_admin() OR has_tenant_access(entities.tenant_id)))
);
CREATE POLICY "Tenant users can manage tenant organizations" ON organizations FOR ALL USING (
    EXISTS (SELECT 1 FROM entities WHERE entities.id = organizations.id AND (
        is_super_admin() OR 
        (has_tenant_access(entities.tenant_id) AND get_user_role_in_tenant(entities.tenant_id) IN ('ADMIN', 'MANAGER', 'ANALYST'))
    ))
);

-- Related parties policies
CREATE POLICY "Tenant users can view tenant related parties" ON related_parties FOR SELECT USING (
    is_super_admin() OR has_tenant_access(tenant_id)
);
CREATE POLICY "Tenant users can manage tenant related parties" ON related_parties FOR ALL USING (
    is_super_admin() OR 
    (has_tenant_access(tenant_id) AND get_user_role_in_tenant(tenant_id) IN ('ADMIN', 'MANAGER', 'ANALYST'))
);

-- Documents policies
CREATE POLICY "Tenant users can view tenant documents" ON documents FOR SELECT USING (
    is_super_admin() OR has_tenant_access(tenant_id)
);
CREATE POLICY "Tenant users can manage tenant documents" ON documents FOR ALL USING (
    is_super_admin() OR 
    (has_tenant_access(tenant_id) AND get_user_role_in_tenant(tenant_id) IN ('ADMIN', 'MANAGER', 'ANALYST'))
);

-- Screening runs policies
CREATE POLICY "Tenant users can view tenant screening runs" ON screening_runs FOR SELECT USING (
    is_super_admin() OR has_tenant_access(tenant_id)
);
CREATE POLICY "Tenant users can manage tenant screening runs" ON screening_runs FOR ALL USING (
    is_super_admin() OR 
    (has_tenant_access(tenant_id) AND get_user_role_in_tenant(tenant_id) IN ('ADMIN', 'MANAGER', 'ANALYST'))
);

-- Risk runs policies
CREATE POLICY "Tenant users can view tenant risk runs" ON risk_runs FOR SELECT USING (
    is_super_admin() OR has_tenant_access(tenant_id)
);
CREATE POLICY "Tenant users can manage tenant risk runs" ON risk_runs FOR ALL USING (
    is_super_admin() OR 
    (has_tenant_access(tenant_id) AND get_user_role_in_tenant(tenant_id) IN ('ADMIN', 'MANAGER', 'ANALYST'))
);

-- Risk decisions policies
CREATE POLICY "Tenant users can view tenant risk decisions" ON risk_decisions FOR SELECT USING (
    is_super_admin() OR has_tenant_access(tenant_id)
);
CREATE POLICY "Tenant users can manage tenant risk decisions" ON risk_decisions FOR ALL USING (
    is_super_admin() OR 
    (has_tenant_access(tenant_id) AND get_user_role_in_tenant(tenant_id) IN ('ADMIN', 'MANAGER', 'ANALYST'))
);

-- Review notes policies
CREATE POLICY "Tenant users can view tenant review notes" ON review_notes FOR SELECT USING (
    is_super_admin() OR has_tenant_access(tenant_id)
);
CREATE POLICY "Tenant users can manage tenant review notes" ON review_notes FOR ALL USING (
    is_super_admin() OR 
    (has_tenant_access(tenant_id) AND get_user_role_in_tenant(tenant_id) IN ('ADMIN', 'MANAGER', 'ANALYST'))
);

-- Screening settings policies
CREATE POLICY "Tenant users can view tenant screening settings" ON screening_settings FOR SELECT USING (
    is_super_admin() OR has_tenant_access(tenant_id)
);
CREATE POLICY "Tenant admins can manage tenant screening settings" ON screening_settings FOR ALL USING (
    is_super_admin() OR 
    (has_tenant_access(tenant_id) AND get_user_role_in_tenant(tenant_id) IN ('ADMIN', 'MANAGER'))
);

-- Risk rules policies
CREATE POLICY "Tenant users can view tenant risk rules" ON risk_rules FOR SELECT USING (
    is_super_admin() OR has_tenant_access(tenant_id)
);
CREATE POLICY "Tenant admins can manage tenant risk rules" ON risk_rules FOR ALL USING (
    is_super_admin() OR 
    (has_tenant_access(tenant_id) AND get_user_role_in_tenant(tenant_id) IN ('ADMIN', 'MANAGER'))
);

-- Risk rule values policies
CREATE POLICY "Tenant users can view tenant risk rule values" ON risk_rule_values FOR SELECT USING (
    is_super_admin() OR has_tenant_access(tenant_id)
);
CREATE POLICY "Tenant admins can manage tenant risk rule values" ON risk_rule_values FOR ALL USING (
    is_super_admin() OR 
    (has_tenant_access(tenant_id) AND get_user_role_in_tenant(tenant_id) IN ('ADMIN', 'MANAGER'))
);

-- Audit logs policies
CREATE POLICY "Tenant users can view tenant audit logs" ON audit_logs FOR SELECT USING (
    is_super_admin() OR 
    (tenant_id IS NOT NULL AND has_tenant_access(tenant_id)) OR
    (tenant_id IS NULL AND is_super_admin())
);
CREATE POLICY "System creates audit logs" ON audit_logs FOR INSERT WITH CHECK (true);

-- Super admins policies
CREATE POLICY "Super admins can view super admin records" ON super_admins FOR SELECT USING (is_super_admin());
CREATE POLICY "Super admins can manage super admin records" ON super_admins FOR ALL USING (is_super_admin());

-- Impersonations policies
CREATE POLICY "Super admins can view impersonations" ON impersonations FOR SELECT USING (is_super_admin());
CREATE POLICY "Super admins can manage impersonations" ON impersonations FOR ALL USING (is_super_admin());

-- =====================================================
-- SEED DATA
-- =====================================================

-- Seed system lists (tenant_id = NULL for system-wide lists)

-- Countries list
INSERT INTO lists (id, tenant_id, name, key, type, description) VALUES
('550e8400-e29b-41d4-a716-446655440001', NULL, 'Countries', 'countries', 'SYSTEM', 'ISO country codes and names');

INSERT INTO list_values (list_id, tenant_id, "order", key, label) VALUES
('550e8400-e29b-41d4-a716-446655440001', NULL, 1, 'SA', 'Saudi Arabia'),
('550e8400-e29b-41d4-a716-446655440001', NULL, 2, 'AE', 'United Arab Emirates'),
('550e8400-e29b-41d4-a716-446655440001', NULL, 3, 'US', 'United States'),
('550e8400-e29b-41d4-a716-446655440001', NULL, 4, 'GB', 'United Kingdom'),
('550e8400-e29b-41d4-a716-446655440001', NULL, 5, 'DE', 'Germany'),
('550e8400-e29b-41d4-a716-446655440001', NULL, 6, 'FR', 'France'),
('550e8400-e29b-41d4-a716-446655440001', NULL, 7, 'CA', 'Canada'),
('550e8400-e29b-41d4-a716-446655440001', NULL, 8, 'AU', 'Australia'),
('550e8400-e29b-41d4-a716-446655440001', NULL, 9, 'JP', 'Japan'),
('550e8400-e29b-41d4-a716-446655440001', NULL, 10, 'CN', 'China');

-- Occupations list
INSERT INTO lists (id, tenant_id, name, key, type, description) VALUES
('550e8400-e29b-41d4-a716-446655440002', NULL, 'Occupations', 'occupations', 'SYSTEM', 'Common occupations for individuals');

INSERT INTO list_values (list_id, tenant_id, "order", key, label) VALUES
('550e8400-e29b-41d4-a716-446655440002', NULL, 1, 'engineer', 'Engineer'),
('550e8400-e29b-41d4-a716-446655440002', NULL, 2, 'doctor', 'Doctor'),
('550e8400-e29b-41d4-a716-446655440002', NULL, 3, 'lawyer', 'Lawyer'),
('550e8400-e29b-41d4-a716-446655440002', NULL, 4, 'teacher', 'Teacher'),
('550e8400-e29b-41d4-a716-446655440002', NULL, 5, 'businessman', 'Businessman'),
('550e8400-e29b-41d4-a716-446655440002', NULL, 6, 'consultant', 'Consultant'),
('550e8400-e29b-41d4-a716-446655440002', NULL, 7, 'manager', 'Manager'),
('550e8400-e29b-41d4-a716-446655440002', NULL, 8, 'student', 'Student'),
('550e8400-e29b-41d4-a716-446655440002', NULL, 9, 'retired', 'Retired'),
('550e8400-e29b-41d4-a716-446655440002', NULL, 10, 'unemployed', 'Unemployed');

-- Legal structures list
INSERT INTO lists (id, tenant_id, name, key, type, description) VALUES
('550e8400-e29b-41d4-a716-446655440003', NULL, 'Legal Structures', 'legal_structures', 'SYSTEM', 'Legal structures for organizations');

INSERT INTO list_values (list_id, tenant_id, "order", key, label) VALUES
('550e8400-e29b-41d4-a716-446655440003', NULL, 1, 'llc', 'Limited Liability Company'),
('550e8400-e29b-41d4-a716-446655440003', NULL, 2, 'corporation', 'Corporation'),
('550e8400-e29b-41d4-a716-446655440003', NULL, 3, 'partnership', 'Partnership'),
('550e8400-e29b-41d4-a716-446655440003', NULL, 4, 'sole_proprietorship', 'Sole Proprietorship'),
('550e8400-e29b-41d4-a716-446655440003', NULL, 5, 'nonprofit', 'Non-Profit Organization'),
('550e8400-e29b-41d4-a716-446655440003', NULL, 6, 'trust', 'Trust'),
('550e8400-e29b-41d4-a716-446655440003', NULL, 7, 'foundation', 'Foundation');

-- Document types list
INSERT INTO lists (id, tenant_id, name, key, type, description) VALUES
('550e8400-e29b-41d4-a716-446655440004', NULL, 'Document Types', 'document_types', 'SYSTEM', 'Types of documents for KYC/KYB');

INSERT INTO list_values (list_id, tenant_id, "order", key, label) VALUES
('550e8400-e29b-41d4-a716-446655440004', NULL, 1, 'passport', 'Passport'),
('550e8400-e29b-41d4-a716-446655440004', NULL, 2, 'national_id', 'National ID'),
('550e8400-e29b-41d4-a716-446655440004', NULL, 3, 'drivers_license', 'Driver''s License'),
('550e8400-e29b-41d4-a716-446655440004', NULL, 4, 'utility_bill', 'Utility Bill'),
('550e8400-e29b-41d4-a716-446655440004', NULL, 5, 'bank_statement', 'Bank Statement'),
('550e8400-e29b-41d4-a716-446655440004', NULL, 6, 'commercial_registration', 'Commercial Registration'),
('550e8400-e29b-41d4-a716-446655440004', NULL, 7, 'articles_of_incorporation', 'Articles of Incorporation'),
('550e8400-e29b-41d4-a716-446655440004', NULL, 8, 'memorandum_of_association', 'Memorandum of Association'),
('550e8400-e29b-41d4-a716-446655440004', NULL, 9, 'tax_certificate', 'Tax Certificate'),
('550e8400-e29b-41d4-a716-446655440004', NULL, 10, 'financial_statement', 'Financial Statement');

-- Related party kinds list
INSERT INTO lists (id, tenant_id, name, key, type, description) VALUES
('550e8400-e29b-41d4-a716-446655440005', NULL, 'Related Party Kinds', 'related_party_kinds', 'SYSTEM', 'Types of related parties for organizations');

INSERT INTO list_values (list_id, tenant_id, "order", key, label) VALUES
('550e8400-e29b-41d4-a716-446655440005', NULL, 1, 'director', 'Director'),
('550e8400-e29b-41d4-a716-446655440005', NULL, 2, 'shareholder', 'Shareholder'),
('550e8400-e29b-41d4-a716-446655440005', NULL, 3, 'beneficial_owner', 'Beneficial Owner'),
('550e8400-e29b-41d4-a716-446655440005', NULL, 4, 'authorized_signatory', 'Authorized Signatory'),
('550e8400-e29b-41d4-a716-446655440005', NULL, 5, 'legal_representative', 'Legal Representative'),
('550e8400-e29b-41d4-a716-446655440005', NULL, 6, 'ceo', 'Chief Executive Officer'),
('550e8400-e29b-41d4-a716-446655440005', NULL, 7, 'cfo', 'Chief Financial Officer'),
('550e8400-e29b-41d4-a716-446655440005', NULL, 8, 'secretary', 'Secretary');

-- ID types list
INSERT INTO lists (id, tenant_id, name, key, type, description) VALUES
('550e8400-e29b-41d4-a716-446655440006', NULL, 'ID Types', 'id_types', 'SYSTEM', 'Types of identification documents');

INSERT INTO list_values (list_id, tenant_id, "order", key, label) VALUES
('550e8400-e29b-41d4-a716-446655440006', NULL, 1, 'passport', 'Passport'),
('550e8400-e29b-41d4-a716-446655440006', NULL, 2, 'national_id', 'National ID'),
('550e8400-e29b-41d4-a716-446655440006', NULL, 3, 'drivers_license', 'Driver''s License'),
('550e8400-e29b-41d4-a716-446655440006', NULL, 4, 'residence_permit', 'Residence Permit'),
('550e8400-e29b-41d4-a716-446655440006', NULL, 5, 'work_permit', 'Work Permit');

-- Update items_count for all lists
UPDATE lists SET items_count = (
    SELECT COUNT(*) FROM list_values WHERE list_id = lists.id
) WHERE tenant_id IS NULL;

-- Create sample tenant
INSERT INTO tenants (id, slug, name, status, plan) VALUES
('550e8400-e29b-41d4-a716-446655440100', 'demo-bank', 'Demo Bank Ltd', 'ACTIVE', 'enterprise');

-- Create tenant domain
INSERT INTO tenant_domains (tenant_id, domain, is_primary, verified) VALUES
('550e8400-e29b-41d4-a716-446655440100', 'demo-bank.kyc-platform.com', true, true);

-- Create sample risk rules for the demo tenant
INSERT INTO risk_rules (id, tenant_id, name, kind, weight, status) VALUES
('550e8400-e29b-41d4-a716-446655440200', '550e8400-e29b-41d4-a716-446655440100', 'High Risk Countries', 'KYC', 30, 'ACTIVE'),
('550e8400-e29b-41d4-a716-446655440201', '550e8400-e29b-41d4-a716-446655440100', 'PEP Status', 'KYC', 40, 'ACTIVE'),
('550e8400-e29b-41d4-a716-446655440202', '550e8400-e29b-41d4-a716-446655440100', 'Sanctions List', 'KYC', 50, 'ACTIVE'),
('550e8400-e29b-41d4-a716-446655440203', '550e8400-e29b-41d4-a716-446655440100', 'Business Age', 'KYB', 20, 'ACTIVE'),
('550e8400-e29b-41d4-a716-446655440204', '550e8400-e29b-41d4-a716-446655440100', 'Industry Risk', 'KYB', 25, 'ACTIVE');

-- Create risk rule values
INSERT INTO risk_rule_values (rule_id, tenant_id, key, label, value, "order") VALUES
-- High Risk Countries
('550e8400-e29b-41d4-a716-446655440200', '550e8400-e29b-41d4-a716-446655440100', 'low_risk', 'Low Risk Countries', 0, 1),
('550e8400-e29b-41d4-a716-446655440200', '550e8400-e29b-41d4-a716-446655440100', 'medium_risk', 'Medium Risk Countries', 15, 2),
('550e8400-e29b-41d4-a716-446655440200', '550e8400-e29b-41d4-a716-446655440100', 'high_risk', 'High Risk Countries', 30, 3),

-- PEP Status
('550e8400-e29b-41d4-a716-446655440201', '550e8400-e29b-41d4-a716-446655440100', 'not_pep', 'Not a PEP', 0, 1),
('550e8400-e29b-41d4-a716-446655440201', '550e8400-e29b-41d4-a716-446655440100', 'pep_family', 'PEP Family Member', 20, 2),
('550e8400-e29b-41d4-a716-446655440201', '550e8400-e29b-41d4-a716-446655440100', 'pep_close', 'PEP Close Associate', 30, 3),
('550e8400-e29b-41d4-a716-446655440201', '550e8400-e29b-41d4-a716-446655440100', 'pep_direct', 'Direct PEP', 40, 4),

-- Sanctions List
('550e8400-e29b-41d4-a716-446655440202', '550e8400-e29b-41d4-a716-446655440100', 'clear', 'Clear', 0, 1),
('550e8400-e29b-41d4-a716-446655440202', '550e8400-e29b-41d4-a716-446655440100', 'potential_match', 'Potential Match', 25, 2),
('550e8400-e29b-41d4-a716-446655440202', '550e8400-e29b-41d4-a716-446655440100', 'confirmed_match', 'Confirmed Match', 50, 3),

-- Business Age
('550e8400-e29b-41d4-a716-446655440203', '550e8400-e29b-41d4-a716-446655440100', 'over_5_years', 'Over 5 Years', 0, 1),
('550e8400-e29b-41d4-a716-446655440203', '550e8400-e29b-41d4-a716-446655440100', '2_to_5_years', '2-5 Years', 5, 2),
('550e8400-e29b-41d4-a716-446655440203', '550e8400-e29b-41d4-a716-446655440100', '1_to_2_years', '1-2 Years', 10, 3),
('550e8400-e29b-41d4-a716-446655440203', '550e8400-e29b-41d4-a716-446655440100', 'under_1_year', 'Under 1 Year', 20, 4),

-- Industry Risk
('550e8400-e29b-41d4-a716-446655440204', '550e8400-e29b-41d4-a716-446655440100', 'low_risk_industry', 'Low Risk Industry', 0, 1),
('550e8400-e29b-41d4-a716-446655440204', '550e8400-e29b-41d4-a716-446655440100', 'medium_risk_industry', 'Medium Risk Industry', 12, 2),
('550e8400-e29b-41d4-a716-446655440204', '550e8400-e29b-41d4-a716-446655440100', 'high_risk_industry', 'High Risk Industry', 25, 3);

-- Create screening settings for the demo tenant
INSERT INTO screening_settings (tenant_id, name, description, json_value) VALUES
('550e8400-e29b-41d4-a716-446655440100', 'sanctions_threshold', 'Minimum match score for sanctions screening', '{"threshold": 85}'),
('550e8400-e29b-41d4-a716-446655440100', 'pep_threshold', 'Minimum match score for PEP screening', '{"threshold": 80}'),
('550e8400-e29b-41d4-a716-446655440100', 'auto_approve_threshold', 'Risk score threshold for auto-approval', '{"threshold": 30}'),
('550e8400-e29b-41d4-a716-446655440100', 'auto_reject_threshold', 'Risk score threshold for auto-rejection', '{"threshold": 80}');

-- Create audit log for seed data creation
INSERT INTO audit_logs (tenant_id, action, entity_type, metadata) VALUES
(NULL, 'SEED_DATA_CREATED', 'SYSTEM', '{"description": "Initial seed data created", "version": "1.0"}');

-- =====================================================
-- SETUP COMPLETE
-- =====================================================
-- Your Supabase database is now ready!
-- 
-- Next steps:
-- 1. Update your .env file with the Supabase credentials
-- 2. Start your development server
-- 3. Sign up for your first user account
-- 4. The first user will automatically become a super admin
-- =====================================================