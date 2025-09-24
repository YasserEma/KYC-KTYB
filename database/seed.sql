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

-- Note: Platform admin user will be created when first super admin signs up
-- This is typically done through the application, not via seed data
-- as it requires proper authentication integration

-- Create audit log for seed data creation
INSERT INTO audit_logs (tenant_id, action, entity_type, metadata) VALUES
(NULL, 'SEED_DATA_CREATED', 'SYSTEM', '{"description": "Initial seed data created", "version": "1.0"}');