-- Seed Data for KYC Platform
-- This script creates sample users, tenants, and entities for testing

-- First, let's get the existing tenant ID
DO $$
DECLARE
    tenant_uuid uuid;
    user1_uuid uuid := gen_random_uuid();
    user2_uuid uuid := gen_random_uuid();
    user3_uuid uuid := gen_random_uuid();
    admin_uuid uuid := gen_random_uuid();
    country_usa_uuid uuid;
    country_uk_uuid uuid;
    country_canada_uuid uuid;
BEGIN
    -- Get existing tenant ID
    SELECT id INTO tenant_uuid FROM tenants LIMIT 1;
    
    -- Get country IDs
    SELECT id INTO country_usa_uuid FROM countries WHERE alpha2 = 'US' LIMIT 1;
    SELECT id INTO country_uk_uuid FROM countries WHERE alpha2 = 'GB' LIMIT 1;
    SELECT id INTO country_canada_uuid FROM countries WHERE alpha2 = 'CA' LIMIT 1;
    
    -- Insert test users into auth.users (simulating Supabase Auth)
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
    VALUES 
        (admin_uuid, 'admin@example.com', crypt('password123', gen_salt('bf')), now(), now(), now()),
        (user1_uuid, 'john.doe@example.com', crypt('password123', gen_salt('bf')), now(), now(), now()),
        (user2_uuid, 'jane.smith@example.com', crypt('password123', gen_salt('bf')), now(), now(), now()),
        (user3_uuid, 'mike.johnson@example.com', crypt('password123', gen_salt('bf')), now(), now(), now())
    ON CONFLICT (id) DO NOTHING;
    
    -- Insert profiles
    INSERT INTO profiles (id, email, full_name, created_at, updated_at)
    VALUES 
        (admin_uuid, 'admin@example.com', 'System Administrator', now(), now()),
        (user1_uuid, 'john.doe@example.com', 'John Doe', now(), now()),
        (user2_uuid, 'jane.smith@example.com', 'Jane Smith', now(), now()),
        (user3_uuid, 'mike.johnson@example.com', 'Mike Johnson', now(), now())
    ON CONFLICT (id) DO NOTHING;
    
    -- Insert user-tenant relationships
    INSERT INTO user_tenants (user_id, tenant_id, role, is_active, created_at, updated_at)
    VALUES 
        (admin_uuid, tenant_uuid, 'ADMIN', true, now(), now()),
        (user1_uuid, tenant_uuid, 'MANAGER', true, now(), now()),
        (user2_uuid, tenant_uuid, 'ANALYST', true, now(), now()),
        (user3_uuid, tenant_uuid, 'VIEWER', true, now(), now())
    ON CONFLICT DO NOTHING;
    
    -- Insert sample individual entities
    INSERT INTO entities (
        id, tenant_id, type, reference_id, first_name, middle_name, last_name,
        date_of_birth, place_of_birth, nationality_id, address_line1, city,
        state_province, postal_code, country_id, phone, email, status,
        risk_level, created_by, updated_by, created_at, updated_at
    ) VALUES 
        (
            gen_random_uuid(), tenant_uuid, 'INDIVIDUAL', 'IND-001',
            'Robert', 'James', 'Wilson', '1985-03-15', 'New York',
            country_usa_uuid, '123 Main Street', 'New York', 'NY', '10001',
            country_usa_uuid, '+1-555-0101', 'robert.wilson@email.com', 'ACTIVE',
            'LOW', user1_uuid, user1_uuid, now(), now()
        ),
        (
            gen_random_uuid(), tenant_uuid, 'INDIVIDUAL', 'IND-002',
            'Sarah', 'Elizabeth', 'Davis', '1990-07-22', 'London',
            country_uk_uuid, '456 Oak Avenue', 'London', 'Greater London', 'SW1A 1AA',
            country_uk_uuid, '+44-20-7946-0958', 'sarah.davis@email.com', 'ACTIVE',
            'MEDIUM', user2_uuid, user2_uuid, now(), now()
        ),
        (
            gen_random_uuid(), tenant_uuid, 'INDIVIDUAL', 'IND-003',
            'Michael', 'Andrew', 'Brown', '1978-11-08', 'Toronto',
            country_canada_uuid, '789 Pine Road', 'Toronto', 'Ontario', 'M5H 2N2',
            country_canada_uuid, '+1-416-555-0123', 'michael.brown@email.com', 'PENDING',
            'HIGH', user1_uuid, user1_uuid, now(), now()
        ),
        (
            gen_random_uuid(), tenant_uuid, 'INDIVIDUAL', 'IND-004',
            'Emily', 'Rose', 'Johnson', '1992-05-14', 'Chicago',
            country_usa_uuid, '321 Elm Street', 'Chicago', 'IL', '60601',
            country_usa_uuid, '+1-312-555-0456', 'emily.johnson@email.com', 'ACTIVE',
            'LOW', user2_uuid, user2_uuid, now(), now()
        ),
        (
            gen_random_uuid(), tenant_uuid, 'INDIVIDUAL', 'IND-005',
            'David', 'Christopher', 'Miller', '1983-09-30', 'Los Angeles',
            country_usa_uuid, '654 Maple Drive', 'Los Angeles', 'CA', '90210',
            country_usa_uuid, '+1-213-555-0789', 'david.miller@email.com', 'INACTIVE',
            'MEDIUM', user3_uuid, user3_uuid, now(), now()
        );
    
    -- Insert sample organization entities
    INSERT INTO entities (
        id, tenant_id, type, reference_id, legal_name, trade_name,
        registration_number, incorporation_date, incorporation_country_id,
        address_line1, city, state_province, postal_code, country_id,
        phone, email, website, status, risk_level, created_by, updated_by,
        created_at, updated_at
    ) VALUES 
        (
            gen_random_uuid(), tenant_uuid, 'ORGANIZATION', 'ORG-001',
            'TechCorp Solutions Inc.', 'TechCorp', 'TC123456789',
            '2015-01-15', country_usa_uuid, '100 Technology Drive',
            'San Francisco', 'CA', '94105', country_usa_uuid,
            '+1-415-555-0100', 'info@techcorp.com', 'https://techcorp.com',
            'ACTIVE', 'LOW', user1_uuid, user1_uuid, now(), now()
        ),
        (
            gen_random_uuid(), tenant_uuid, 'ORGANIZATION', 'ORG-002',
            'Global Finance Ltd.', 'GlobalFin', 'GF987654321',
            '2010-06-20', country_uk_uuid, '25 Financial District',
            'London', 'Greater London', 'EC2V 8RF', country_uk_uuid,
            '+44-20-7123-4567', 'contact@globalfin.co.uk', 'https://globalfin.co.uk',
            'ACTIVE', 'MEDIUM', user2_uuid, user2_uuid, now(), now()
        ),
        (
            gen_random_uuid(), tenant_uuid, 'ORGANIZATION', 'ORG-003',
            'Maple Leaf Enterprises Corp.', 'Maple Leaf', 'ML456789123',
            '2018-03-10', country_canada_uuid, '500 Bay Street',
            'Toronto', 'Ontario', 'M5G 1M2', country_canada_uuid,
            '+1-416-555-0200', 'hello@mapleleaf.ca', 'https://mapleleaf.ca',
            'PENDING', 'HIGH', user1_uuid, user1_uuid, now(), now()
        ),
        (
            gen_random_uuid(), tenant_uuid, 'ORGANIZATION', 'ORG-004',
            'Innovation Labs LLC', 'InnoLabs', 'IL789123456',
            '2020-11-05', country_usa_uuid, '200 Innovation Way',
            'Austin', 'TX', '73301', country_usa_uuid,
            '+1-512-555-0300', 'team@innolabs.com', 'https://innolabs.com',
            'ACTIVE', 'LOW', user3_uuid, user3_uuid, now(), now()
        ),
        (
            gen_random_uuid(), tenant_uuid, 'ORGANIZATION', 'ORG-005',
            'Secure Banking Solutions PLC', 'SecureBank', 'SB321654987',
            '2005-08-12', country_uk_uuid, '1 Banking Square',
            'Manchester', 'Greater Manchester', 'M1 1AA', country_uk_uuid,
            '+44-161-555-0400', 'support@securebank.co.uk', 'https://securebank.co.uk',
            'ACTIVE', 'MEDIUM', user2_uuid, user2_uuid, now(), now()
        );
    
    -- Insert audit logs for entity creation
    INSERT INTO audit_logs (
        tenant_id, user_id, action, resource_type, resource_id,
        details, ip_address, user_agent, created_at
    )
    SELECT 
        tenant_uuid, created_by, 'CREATE', 'ENTITY', id,
        jsonb_build_object(
            'entity_type', type,
            'reference_id', reference_id,
            'name', COALESCE(legal_name, first_name || ' ' || last_name)
        ),
        '127.0.0.1', 'Seed Script', created_at
    FROM entities
    WHERE tenant_id = tenant_uuid;
    
    RAISE NOTICE 'Seed data inserted successfully!';
    RAISE NOTICE 'Tenant ID: %', tenant_uuid;
    RAISE NOTICE 'Admin User: admin@example.com (password: password123)';
    RAISE NOTICE 'Test Users: john.doe@example.com, jane.smith@example.com, mike.johnson@example.com';
    RAISE NOTICE 'All test users have password: password123';
    
END $$;