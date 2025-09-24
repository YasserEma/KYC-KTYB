-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "citext";

-- Create custom types
CREATE TYPE user_role AS ENUM ('ADMIN', 'ANALYST', 'REVIEWER');
CREATE TYPE tenant_status AS ENUM ('ACTIVE', 'SUSPENDED');
CREATE TYPE entity_type AS ENUM ('INDIVIDUAL', 'ORGANIZATION');
CREATE TYPE entity_status AS ENUM ('ACTIVE', 'INACTIVE');
CREATE TYPE screening_result AS ENUM ('CLEAR', 'HIT', 'REVIEW');
CREATE TYPE risk_level AS ENUM ('LOW', 'MEDIUM', 'HIGH');
CREATE TYPE decision_type AS ENUM ('ACCEPT', 'REJECT', 'ON_HOLD');
CREATE TYPE list_type AS ENUM ('SYSTEM', 'CUSTOM');
CREATE TYPE rule_kind AS ENUM ('KYC', 'KYB');
CREATE TYPE review_status AS ENUM ('REVIEWED', 'NEEDS_CHANGES');

-- Profiles table (extends auth.users)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email CITEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tenants table
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    status tenant_status DEFAULT 'ACTIVE',
    plan TEXT DEFAULT 'basic',
    brand JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tenant domains table
CREATE TABLE tenant_domains (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    domain TEXT UNIQUE NOT NULL,
    is_primary BOOLEAN DEFAULT false,
    verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User tenants junction table
CREATE TABLE user_tenants (
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    role user_role NOT NULL,
    added_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, tenant_id)
);

-- Lists table
CREATE TABLE lists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    key TEXT NOT NULL,
    type list_type NOT NULL,
    status TEXT DEFAULT 'ACTIVE',
    description TEXT,
    items_count INTEGER DEFAULT 0,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, key)
);

-- List values table
CREATE TABLE list_values (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    list_id UUID NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
    "order" INTEGER DEFAULT 0,
    key TEXT NOT NULL,
    label TEXT NOT NULL,
    status TEXT DEFAULT 'ACTIVE',
    used_by_count INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(list_id, key)
);

-- Entities table
CREATE TABLE entities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    type entity_type NOT NULL,
    status entity_status DEFAULT 'ACTIVE',
    name TEXT NOT NULL,
    government_id TEXT,
    nationality_codes TEXT[],
    created_by UUID NOT NULL REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Individuals table
CREATE TABLE individuals (
    entity_id UUID PRIMARY KEY REFERENCES entities(id) ON DELETE CASCADE,
    date_of_birth DATE,
    gender TEXT,
    residence_countries TEXT[],
    occupation_key TEXT,
    address TEXT,
    id_docs JSONB DEFAULT '[]'
);

-- Organizations table
CREATE TABLE organizations (
    entity_id UUID PRIMARY KEY REFERENCES entities(id) ON DELETE CASCADE,
    country_of_incorporation TEXT,
    date_of_incorporation DATE,
    legal_structure_key TEXT,
    tax_id TEXT,
    cr_number TEXT,
    address1 TEXT,
    address2 TEXT,
    contact_name TEXT,
    contact_email CITEXT,
    contact_phone TEXT
);

-- Related parties table
CREATE TABLE related_parties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    organization_entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
    kind_key TEXT NOT NULL,
    name TEXT NOT NULL,
    dob DATE,
    nationality_code TEXT,
    id_type_key TEXT,
    id_expiry DATE,
    address TEXT,
    ownership_pct NUMERIC(5,2) CHECK (ownership_pct >= 0 AND ownership_pct <= 100),
    relationship_type TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Documents table
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
    type_key TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    original_name TEXT NOT NULL,
    ext TEXT NOT NULL,
    bytes INTEGER NOT NULL,
    expires_at DATE,
    uploaded_by UUID NOT NULL REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Screening runs table
CREATE TABLE screening_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
    result screening_result NOT NULL,
    details JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Risk runs table
CREATE TABLE risk_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
    score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
    level risk_level NOT NULL,
    details JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Risk decisions table
CREATE TABLE risk_decisions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
    decided_by UUID NOT NULL REFERENCES profiles(id),
    decided_role user_role NOT NULL,
    decision decision_type NOT NULL,
    rationale TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Review notes table
CREATE TABLE review_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
    reviewer_user_id UUID NOT NULL REFERENCES profiles(id),
    note TEXT NOT NULL,
    status review_status DEFAULT 'REVIEWED',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Screening settings table
CREATE TABLE screening_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'ACTIVE',
    json_value JSONB DEFAULT '{}',
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, name)
);

-- Risk rules table
CREATE TABLE risk_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    kind rule_kind NOT NULL,
    weight INTEGER NOT NULL CHECK (weight >= 0 AND weight <= 100),
    status TEXT DEFAULT 'ACTIVE',
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, name)
);

-- Risk rule values table
CREATE TABLE risk_rule_values (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    rule_id UUID NOT NULL REFERENCES risk_rules(id) ON DELETE CASCADE,
    key TEXT NOT NULL,
    label TEXT NOT NULL,
    value NUMERIC NOT NULL,
    status TEXT DEFAULT 'ACTIVE',
    "order" INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit logs table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    actor_user_id UUID REFERENCES profiles(id),
    actor_role user_role,
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id UUID,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Super admins table
CREATE TABLE super_admins (
    user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Impersonations table
CREATE TABLE impersonations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    super_admin_user_id UUID NOT NULL REFERENCES profiles(id),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    reason TEXT NOT NULL
);

-- Create indexes for performance
CREATE INDEX idx_tenants_slug ON tenants(slug);
CREATE INDEX idx_tenants_status ON tenants(status);

CREATE INDEX idx_tenant_domains_tenant_id ON tenant_domains(tenant_id);
CREATE INDEX idx_tenant_domains_domain ON tenant_domains(domain);
CREATE INDEX idx_tenant_domains_primary ON tenant_domains(is_primary) WHERE is_primary = true;

CREATE INDEX idx_user_tenants_tenant_id ON user_tenants(tenant_id);
CREATE INDEX idx_user_tenants_role ON user_tenants(role);

CREATE INDEX idx_entities_tenant_id_created_at ON entities(tenant_id, created_at DESC);
CREATE INDEX idx_entities_tenant_id_status ON entities(tenant_id, status);
CREATE INDEX idx_entities_tenant_id_type ON entities(tenant_id, type);
CREATE INDEX idx_entities_name ON entities(name);

CREATE INDEX idx_documents_tenant_id_entity_id ON documents(tenant_id, entity_id);
CREATE INDEX idx_documents_tenant_id_created_at ON documents(tenant_id, created_at DESC);

CREATE INDEX idx_screening_runs_tenant_id_entity_id ON screening_runs(tenant_id, entity_id, created_at DESC);
CREATE INDEX idx_risk_runs_tenant_id_entity_id ON risk_runs(tenant_id, entity_id, created_at DESC);
CREATE INDEX idx_risk_decisions_tenant_id_entity_id ON risk_decisions(tenant_id, entity_id, created_at DESC);

CREATE INDEX idx_lists_tenant_id_key ON lists(tenant_id, key);
CREATE INDEX idx_list_values_list_id_order ON list_values(list_id, "order");

CREATE INDEX idx_audit_logs_tenant_id_created_at ON audit_logs(tenant_id, created_at DESC);
CREATE INDEX idx_audit_logs_actor_user_id ON audit_logs(actor_user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_entities_updated_at BEFORE UPDATE ON entities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lists_updated_at BEFORE UPDATE ON lists FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_list_values_updated_at BEFORE UPDATE ON list_values FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_screening_settings_updated_at BEFORE UPDATE ON screening_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_risk_rules_updated_at BEFORE UPDATE ON risk_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_risk_rule_values_updated_at BEFORE UPDATE ON risk_rule_values FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();