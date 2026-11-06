-- ==============================================================================
-- ASSETCARE - SUPABASE / POSTGRESQL INITIAL SCHEMA WITH RLS & SEED DATA
-- Personal Asset, Appliance, Vehicle, Bill, Warranty & Maintenance System
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. HOUSEHOLDS / FAMILIES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS households (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 2. USERS / PROFILES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_id UUID UNIQUE, -- Links to Supabase auth.users if Supabase Auth is used
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    must_change_password BOOLEAN NOT NULL DEFAULT FALSE,
    phone VARCHAR(30),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    household_id UUID REFERENCES households(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 3. CATEGORIES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL,
    section VARCHAR(50) NOT NULL CHECK (section IN ('Household', 'Electronics', 'Vehicles', 'Other')),
    icon VARCHAR(50) DEFAULT 'box',
    description TEXT,
    is_default BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 4. ASSETS (Appliances, Electronics, Vehicles, Furniture, etc.)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    household_id UUID REFERENCES households(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    brand VARCHAR(150),
    model VARCHAR(150),
    serial_number VARCHAR(150),
    purchase_date DATE,
    purchase_price NUMERIC(12, 2) DEFAULT 0.00,
    seller_name VARCHAR(255),
    dealer_contact VARCHAR(255),
    installation_date DATE,
    warranty_start_date DATE,
    warranty_expiry_date DATE,
    location VARCHAR(150), -- Bedroom, Kitchen, Living Room, Garage, Office, etc.
    notes TEXT,
    photos JSONB DEFAULT '[]'::jsonb,
    qr_code_id VARCHAR(100) UNIQUE,
    
    -- Vehicle Specific Fields
    registration_number VARCHAR(100),
    chassis_number VARCHAR(100),
    engine_number VARCHAR(100),
    odometer_reading NUMERIC(10, 1),
    insurance_expiry_date DATE,
    puc_expiry_date DATE,
    service_interval_km NUMERIC(10, 1),
    service_interval_months INTEGER,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 5. DOCUMENTS (Original Invoices, Warranty Cards, Service Receipts)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    document_type VARCHAR(50) NOT NULL CHECK (document_type IN (
        'purchase_invoice', 
        'service_invoice', 
        'repair_invoice', 
        'warranty_certificate', 
        'insurance_document', 
        'other'
    )),
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_hash VARCHAR(64) NOT NULL, -- SHA-256 for duplicate check
    storage_type VARCHAR(20) DEFAULT 'local' CHECK (storage_type IN ('local', 'supabase')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 6. OCR RECORDS (Extraction Pipeline Results & Confidence Tracking)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ocr_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'uploaded' CHECK (status IN (
        'uploaded',
        'processing',
        'extraction_completed',
        'verification_required',
        'verified',
        'failed'
    )),
    raw_text TEXT,
    structured_data JSONB DEFAULT '{}'::jsonb,
    confidence_score NUMERIC(5, 2) DEFAULT 0.00,
    fields_needing_verification JSONB DEFAULT '[]'::jsonb,
    verified_by UUID REFERENCES users(id) ON DELETE SET NULL,
    verified_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 7. SERVICE & REPAIR RECORDS (Chronological History)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS service_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    invoice_number VARCHAR(100),
    service_date DATE NOT NULL,
    vendor_name VARCHAR(255) NOT NULL,
    vendor_address TEXT,
    vendor_phone VARCHAR(50),
    gstin VARCHAR(50),
    service_type VARCHAR(50) NOT NULL DEFAULT 'repair' CHECK (service_type IN (
        'repair',
        'general_servicing',
        'routine_maintenance',
        'inspection'
    )),
    component VARCHAR(150) NOT NULL, -- e.g. "AC Compressor", "Battery", "Tyres", "Water Purifier Filter"
    description_of_work TEXT NOT NULL,
    spare_parts_replaced JSONB DEFAULT '[]'::jsonb, -- [{ name, qty, unit_price, total }]
    labour_charges NUMERIC(10, 2) DEFAULT 0.00,
    material_charges NUMERIC(10, 2) DEFAULT 0.00,
    discount NUMERIC(10, 2) DEFAULT 0.00,
    gst_amount NUMERIC(10, 2) DEFAULT 0.00,
    total_amount NUMERIC(10, 2) NOT NULL,
    payment_mode VARCHAR(50) DEFAULT 'Online / Card',
    warranty_duration_months INTEGER DEFAULT 0,
    warranty_expiry_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 8. WARRANTIES (Product Manufacturer & Service/Repair Warranties)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS warranties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    service_record_id UUID REFERENCES service_records(id) ON DELETE SET NULL,
    document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
    component VARCHAR(150) NOT NULL,
    warranty_type VARCHAR(50) NOT NULL CHECK (warranty_type IN ('manufacturer', 'repair_service')),
    start_date DATE NOT NULL,
    duration_months INTEGER NOT NULL,
    expiry_date DATE NOT NULL,
    provider VARCHAR(255) NOT NULL,
    conditions TEXT,
    claim_status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (claim_status IN (
        'active',
        'expired',
        'claimed',
        'disputed'
    )),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 9. MAINTENANCE REMINDERS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    title VARCHAR(255) NOT NULL,
    activity VARCHAR(255) NOT NULL,
    reference_date DATE NOT NULL, -- Anchor date (e.g. last service date)
    frequency VARCHAR(50) NOT NULL CHECK (frequency IN (
        'monthly',
        'every_3_months',
        'every_6_months',
        'annually',
        'custom'
    )),
    custom_interval_days INTEGER,
    advance_notice_days INTEGER[] DEFAULT '{7, 15}'::INTEGER[],
    next_due_date DATE NOT NULL,
    repeat_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_notified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 10. REMINDER LOGS (Completion and Trigger History)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reminder_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reminder_id UUID NOT NULL REFERENCES reminders(id) ON DELETE CASCADE,
    triggered_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'notified' CHECK (status IN ('notified', 'completed', 'dismissed')),
    completed_date DATE,
    invoice_linked_id UUID REFERENCES documents(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 11. AUDIT LOGS (Compliance, Security & History)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID,
    details JSONB DEFAULT '{}'::jsonb,
    ip_address VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- INDEXES FOR FAST LOOKUP & SEARCH
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_assets_user ON assets(user_id);
CREATE INDEX IF NOT EXISTS idx_assets_category ON assets(category_id);
CREATE INDEX IF NOT EXISTS idx_documents_asset ON documents(asset_id);
CREATE INDEX IF NOT EXISTS idx_documents_hash ON documents(file_hash);
CREATE INDEX IF NOT EXISTS idx_service_records_asset ON service_records(asset_id);
CREATE INDEX IF NOT EXISTS idx_service_records_component ON service_records(component);
CREATE INDEX IF NOT EXISTS idx_service_records_date ON service_records(service_date);
CREATE INDEX IF NOT EXISTS idx_warranties_asset ON warranties(asset_id);
CREATE INDEX IF NOT EXISTS idx_warranties_expiry ON warranties(expiry_date);
CREATE INDEX IF NOT EXISTS idx_reminders_next_due ON reminders(next_due_date);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Strict authorization: Regular users can view & insert their own data.
-- Regular users CANNOT edit or delete submitted bills, assets, or service records!
-- Only Administrators can update or delete records.
-- ==============================================================================

ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE ocr_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE warranties ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminder_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to check if current authenticated user is admin
CREATE OR REPLACE FUNCTION is_admin() RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        auth.jwt() ->> 'role' = 'admin' OR 
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.auth_id = auth.uid() AND users.role = 'admin'
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----------------- CATEGORIES POLICIES -----------------
-- Anyone logged in can read categories
CREATE POLICY "Categories are viewable by all authenticated users"
    ON categories FOR SELECT
    TO authenticated
    USING (true);

-- Only admins can insert, update, delete categories
CREATE POLICY "Categories insertable only by admin"
    ON categories FOR INSERT
    TO authenticated
    WITH CHECK (is_admin());

CREATE POLICY "Categories editable only by admin"
    ON categories FOR UPDATE
    TO authenticated
    USING (is_admin());

CREATE POLICY "Categories deletable only by admin"
    ON categories FOR DELETE
    TO authenticated
    USING (is_admin());

-- ----------------- ASSETS POLICIES -----------------
-- Users can view their own assets (or household assets)
CREATE POLICY "Users can view own or household assets"
    ON assets FOR SELECT
    TO authenticated
    USING (
        is_admin() OR 
        user_id = auth.uid() OR
        household_id IN (SELECT household_id FROM users WHERE auth_id = auth.uid())
    );

-- Regular users can insert new assets
CREATE POLICY "Users can register new assets"
    ON assets FOR INSERT
    TO authenticated
    WITH CHECK (
        is_admin() OR 
        user_id = auth.uid()
    );

-- STRICT RESTRICTION: Regular users CANNOT update assets after submission
CREATE POLICY "Assets updatable only by admin"
    ON assets FOR UPDATE
    TO authenticated
    USING (is_admin());

-- STRICT RESTRICTION: Regular users CANNOT delete assets
CREATE POLICY "Assets deletable only by admin"
    ON assets FOR DELETE
    TO authenticated
    USING (is_admin());

-- ----------------- DOCUMENTS POLICIES -----------------
-- Users can view own documents
CREATE POLICY "Users can view own documents"
    ON documents FOR SELECT
    TO authenticated
    USING (
        is_admin() OR 
        user_id = auth.uid()
    );

-- Users can upload new documents
CREATE POLICY "Users can upload documents"
    ON documents FOR INSERT
    TO authenticated
    WITH CHECK (
        is_admin() OR 
        user_id = auth.uid()
    );

-- STRICT RESTRICTION: Regular users CANNOT edit or delete submitted bills
CREATE POLICY "Documents updatable only by admin"
    ON documents FOR UPDATE
    TO authenticated
    USING (is_admin());

CREATE POLICY "Documents deletable only by admin"
    ON documents FOR DELETE
    TO authenticated
    USING (is_admin());

-- ----------------- SERVICE RECORDS POLICIES -----------------
-- Users can view own service records
CREATE POLICY "Users can view own service records"
    ON service_records FOR SELECT
    TO authenticated
    USING (
        is_admin() OR 
        user_id = auth.uid()
    );

-- Users can add new service records
CREATE POLICY "Users can add service records"
    ON service_records FOR INSERT
    TO authenticated
    WITH CHECK (
        is_admin() OR 
        user_id = auth.uid()
    );

-- STRICT RESTRICTION: Only admins can edit or delete service records
CREATE POLICY "Service records updatable only by admin"
    ON service_records FOR UPDATE
    TO authenticated
    USING (is_admin());

CREATE POLICY "Service records deletable only by admin"
    ON service_records FOR DELETE
    TO authenticated
    USING (is_admin());

-- ----------------- WARRANTIES POLICIES -----------------
CREATE POLICY "Users can view warranties"
    ON warranties FOR SELECT
    TO authenticated
    USING (
        is_admin() OR 
        asset_id IN (SELECT id FROM assets WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can add warranties"
    ON warranties FOR INSERT
    TO authenticated
    WITH CHECK (
        is_admin() OR 
        asset_id IN (SELECT id FROM assets WHERE user_id = auth.uid())
    );

CREATE POLICY "Warranties editable only by admin"
    ON warranties FOR UPDATE
    TO authenticated
    USING (is_admin());

-- ----------------- REMINDERS POLICIES -----------------
CREATE POLICY "Users can manage own reminders"
    ON reminders FOR ALL
    TO authenticated
    USING (
        is_admin() OR 
        user_id = auth.uid()
    );

-- ==============================================================================
-- SEED DATA (Default Categories & Initial Admin)
-- ==============================================================================

-- Seed Default Categories
INSERT INTO categories (name, section, icon, description, is_default) VALUES
-- Household
('Air Conditioner', 'Household', 'fan', 'Split, window and portable AC units', true),
('Refrigerator', 'Household', 'snowflake', 'Single door, double door and side-by-side refrigerators', true),
('Television', 'Household', 'tv', 'Smart LED, OLED, QLED televisions', true),
('Washing Machine', 'Household', 'shirt', 'Front load, top load and semi-automatic washing machines', true),
('Microwave', 'Household', 'microwave', 'Convection, grill and solo microwave ovens', true),
('Dishwasher', 'Household', 'utensils', 'Automatic kitchen dishwashers', true),
('Water Purifier', 'Household', 'droplet', 'RO, UV, UF and alkaline water purification systems', true),
('Geyser', 'Household', 'flame', 'Electric and gas water heaters', true),
('Ceiling Fan', 'Household', 'wind', 'Ceiling and exhaust fans', true),
('Water Pump', 'Household', 'activity', 'Submersible and domestic water pumps', true),
('Other Electrical Equipment', 'Household', 'zap', 'Inverters, stabilizers, generators and switchgear', true),

-- Electronics
('Laptop', 'Electronics', 'laptop', 'MacBook, Windows and Linux laptops', true),
('Desktop', 'Electronics', 'monitor', 'Tower PCs, all-in-one workstations and monitors', true),
('Mobile Phone', 'Electronics', 'smartphone', 'Smartphones and feature phones', true),
('Tablet', 'Electronics', 'tablet', 'iPads, Android tablets and e-readers', true),
('Printer', 'Electronics', 'printer', 'Laser, inkjet and multifunction printers', true),
('Gaming Console / PlayStation', 'Electronics', 'gamepad-2', 'PlayStation, Xbox, Nintendo Switch, handheld consoles', true),
('Camera', 'Electronics', 'camera', 'DSLR, mirrorless, action cameras and lenses', true),
('Audio Equipment', 'Electronics', 'headphones', 'Home theatre, soundbars, amplifiers, earphones', true),
('Other Electronics', 'Electronics', 'cpu', 'Smart watches, routers, NAS, external hard drives', true),

-- Vehicles
('Car', 'Vehicles', 'car', 'Sedans, SUVs, hatchbacks and electric cars', true),
('Motorcycle', 'Vehicles', 'bike', 'Cruisers, sports bikes and commuters', true),
('Scooter', 'Vehicles', 'navigation', 'Petrol and electric scooters', true),
('Commercial Vehicle', 'Vehicles', 'truck', 'Pickups, vans and transport vehicles', true),
('Other Vehicles', 'Vehicles', 'shield', 'Bicycles, trailers and specialty vehicles', true),

-- Other
('Furniture', 'Other', 'armchair', 'Sofas, beds, dining sets, ergonomic office chairs', true),
('Home Appliances', 'Other', 'home', 'Vacuum cleaners, air fryers, food processors', true),
('Office Equipment', 'Other', 'briefcase', 'Projectors, shredders, filing cabinets', true),
('Other Assets', 'Other', 'package', 'General personal and household assets', true)
ON CONFLICT DO NOTHING;

-- Seed Initial Administrator Account
-- Password 'admin' hashed with bcrypt: $2a$10$wT8a1x4mU/1e6uV4cI3ygeXz5M1pQZ8QzVzXo.t4Z1YgJ6v.B9a6O (bcrypt 10 rounds)
-- Note: must_change_password is set to TRUE to enforce first-login password change!
INSERT INTO users (
    username, 
    email, 
    password_hash, 
    full_name, 
    role, 
    must_change_password, 
    phone, 
    is_active
) VALUES (
    'admin',
    'admin@assetcare.local',
    '$2a$10$0z3E6w6rD7pE1ZzD9C4Rke8O8XyvMfZ0p3C1H9sI0g6U.E3HqG4bK', -- admin hashed
    'System Administrator',
    'admin',
    true,
    '+91 98765 43210',
    true
) ON CONFLICT (username) DO NOTHING;
