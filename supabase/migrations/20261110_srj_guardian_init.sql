-- ====================================================================
-- SRJ GUARDIAN DATABASE SCHEMA
-- Community: SUNDA RANTAU JOGJA (SRJ)
-- AI Security, Community Moderation, & Social Care Engine
-- ====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ADMINS TABLE
CREATE TABLE IF NOT EXISTS admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'MODERATOR_ADMIN' CHECK (role IN ('SUPER_ADMIN', 'MODERATOR_ADMIN', 'SOCIAL_CARE_VOLUNTEER')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_login TIMESTAMPTZ
);

-- 3. WHATSAPP CONNECTIONS
CREATE TABLE IF NOT EXISTS whatsapp_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instance_name TEXT UNIQUE NOT NULL DEFAULT 'SRJ_GUARDIAN_PRIMARY',
    phone_number TEXT,
    bot_name TEXT DEFAULT 'SRJ GUARDIAN',
    status TEXT NOT NULL DEFAULT 'DISCONNECTED' CHECK (status IN ('DISCONNECTED', 'PAIRING', 'CONNECTED', 'ERROR')),
    qr_code_data TEXT,
    last_connected_at TIMESTAMPTZ,
    co_admin_verified BOOLEAN DEFAULT FALSE,
    webhook_secret TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. MONITORED GROUPS
CREATE TABLE IF NOT EXISTS monitored_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_jid TEXT UNIQUE NOT NULL, -- e.g. 12036304@g.us
    group_name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    auto_scan_urls BOOLEAN DEFAULT TRUE,
    auto_mod_content BOOLEAN DEFAULT TRUE,
    social_care_enabled BOOLEAN DEFAULT TRUE,
    auto_delete_threats BOOLEAN DEFAULT FALSE, -- Only active if bot is verified admin
    rules_summary TEXT DEFAULT 'SILIH ASAH, SILIH ASIH, SILIH ASUH. Anti-flexing kontekstual, no spam, no hate speech, care for urang Sunda di rantau.',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. URL SCAN RESULTS
CREATE TABLE IF NOT EXISTS url_scan_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    url TEXT NOT NULL,
    normalized_url TEXT NOT NULL,
    domain TEXT NOT NULL,
    threat_status TEXT NOT NULL CHECK (threat_status IN ('AMAN', 'MENCURIGAKAN', 'BERBAHAYA')),
    risk_score INTEGER NOT NULL DEFAULT 0, -- 0 - 100
    redirect_chain JSONB DEFAULT '[]'::jsonb,
    threat_reasons JSONB DEFAULT '[]'::jsonb,
    vendor_results JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    ssrf_safe BOOLEAN DEFAULT TRUE,
    scanned_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. SECURITY LOGS
CREATE TABLE IF NOT EXISTS security_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    group_jid TEXT NOT NULL,
    group_name TEXT NOT NULL,
    sender_jid TEXT NOT NULL,
    sender_name TEXT,
    message_id TEXT NOT NULL,
    threat_type TEXT NOT NULL CHECK (threat_type IN ('PHISHING', 'MALWARE', 'SCAM', 'INAPPROPRIATE_MEDIA', 'SUSPICIOUS_LINK', 'SPAM', 'CREDENTIAL_THEFT')),
    risk_level TEXT NOT NULL CHECK (risk_level IN ('AMAN', 'MENCURIGAKAN', 'BERBAHAYA')),
    raw_content TEXT,
    media_url TEXT,
    ai_analysis TEXT NOT NULL,
    action_taken TEXT NOT NULL DEFAULT 'REPORTED_ADMIN' CHECK (action_taken IN ('NONE', 'REPORTED_ADMIN', 'MESSAGE_DELETED', 'PENDING_ADMIN_DECISION')),
    admin_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (admin_status IN ('PENDING', 'ACKNOWLEDGED', 'RESOLVED', 'FALSE_POSITIVE')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. MODERATION LOGS (COMMUNITY RULES)
CREATE TABLE IF NOT EXISTS moderation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    group_jid TEXT NOT NULL,
    group_name TEXT NOT NULL,
    sender_jid TEXT NOT NULL,
    sender_name TEXT,
    message_id TEXT NOT NULL,
    rule_violation TEXT NOT NULL CHECK (rule_violation IN ('FLEXING', 'INSULT', 'PROVOCATION', 'BULLYING', 'SPAM_PROMO', 'SILIH_ASIH_BREACH', 'HOAX')),
    confidence_score NUMERIC(4, 2) DEFAULT 0.0,
    context_analysis TEXT NOT NULL,
    raw_content TEXT,
    admin_decision TEXT NOT NULL DEFAULT 'PENDING' CHECK (admin_decision IN ('PENDING', 'NO_ACTION', 'WARNED_PRIVATELY', 'SANCTIONED', 'DISMISSED')),
    reviewed_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. HELP REPORTS (AI SOCIAL CARE)
CREATE TABLE IF NOT EXISTS help_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    group_jid TEXT NOT NULL,
    group_name TEXT NOT NULL,
    sender_jid TEXT NOT NULL,
    sender_name TEXT,
    message_id TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('PEKERJAAN', 'BANTUAN_SOSIAL', 'KESEHATAN_DARURAT', 'TEMPAT_TINGGAL', 'INFORMASI_LAIN')),
    urgency TEXT NOT NULL CHECK (urgency IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    summary TEXT NOT NULL,
    excerpt TEXT NOT NULL,
    raw_message TEXT NOT NULL,
    admin_notes TEXT,
    status TEXT NOT NULL DEFAULT 'NEW' CHECK (status IN ('NEW', 'CONTACTED', 'IN_PROGRESS', 'RESOLVED')),
    assigned_admin TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. SYSTEM SETTINGS
CREATE TABLE IF NOT EXISTS system_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_security_logs_timestamp ON security_logs (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_security_logs_risk ON security_logs (risk_level);
CREATE INDEX IF NOT EXISTS idx_moderation_logs_timestamp ON moderation_logs (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_help_reports_status ON help_reports (status, urgency);
CREATE INDEX IF NOT EXISTS idx_url_scan_normalized ON url_scan_results (normalized_url);
CREATE INDEX IF NOT EXISTS idx_monitored_groups_jid ON monitored_groups (group_jid);

-- 11. DEFAULT SYSTEM SETTINGS SEED
INSERT INTO system_settings (key, value, description)
VALUES 
    ('ai_settings', '{"sensitivity": "balanced", "model": "gemini-2.5-flash", "autoDeleteDangerous": false, "privateNotifyAdmin": true}'::jsonb, 'General AI moderation parameters'),
    ('admin_notifications', '{"primaryAdminPhone": "+6281234567890", "channels": ["WHATSAPP_PRIVATE", "DASHBOARD"]}'::jsonb, 'Private alert recipient credentials'),
    ('sunda_rules_config', '{"antiFlexingContextual": true, "silihAsahAsihAsuhGuiding": true, "respectRantauStruggles": true}'::jsonb, 'Cultural moderation guide flags')
ON CONFLICT (key) DO NOTHING;
