"""
init_db.py — Create the full PostgreSQL schema for the CWPP dashboard.

Run once to bootstrap the database:
    python init_db.py

Tables created
--------------
Layer A  – Infrastructure
  organizations       Top-level AWS Organisation container.
  accounts            Individual AWS accounts (members + management).
  regions             Active regions per account.

Layer B  – Inventory
  resources           Central registry of every discovered AWS asset.
  workload_metadata   Deep OS/runtime details for workloads (EC2, Lambda, etc.).

Layer C  – Security / Findings
  vulnerabilities     Static CVE library (no duplication per finding).
  scan_results        Links a resource to a CVE with state tracking.
"""

import sys
from database import get_db_connection

# ---------------------------------------------------------------------------
# DDL statements – executed in dependency order
# ---------------------------------------------------------------------------

SCHEMA_SQL = """
-- ===================================================
-- LAYER A: INFRASTRUCTURE
-- ===================================================

CREATE TABLE IF NOT EXISTS organizations (
    org_id              TEXT PRIMARY KEY,
    management_account_id TEXT NOT NULL,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS accounts (
    account_id          TEXT PRIMARY KEY,
    org_id              TEXT REFERENCES organizations(org_id),
    account_name        TEXT NOT NULL,
    role_arn            TEXT,                        -- IAM role used to assume into this account
    status              TEXT NOT NULL DEFAULT 'Active',  -- Active | Suspended
    last_scanned_at     TIMESTAMPTZ,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS regions (
    id                  SERIAL PRIMARY KEY,
    region_name         TEXT NOT NULL,
    account_id          TEXT NOT NULL REFERENCES accounts(account_id) ON DELETE CASCADE,
    is_enabled          BOOLEAN DEFAULT TRUE,
    UNIQUE (region_name, account_id)
);

-- ===================================================
-- LAYER B: INVENTORY
-- ===================================================

CREATE TABLE IF NOT EXISTS resources (
    arn                 TEXT PRIMARY KEY,            -- Globally unique AWS ARN
    resource_id         TEXT,                        -- e.g., i-0abc123 for EC2
    resource_type       TEXT NOT NULL,               -- EC2 | Lambda | ECR | EKS | ECS_Task
    account_id          TEXT NOT NULL REFERENCES accounts(account_id) ON DELETE CASCADE,
    region              TEXT NOT NULL,
    tags                JSONB DEFAULT '{}',          -- {"Env": "Prod", "Owner": "Platform"}
    first_seen_at       TIMESTAMPTZ DEFAULT NOW(),
    last_seen_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast tag queries: WHERE tags->>'Environment' = 'Production'
CREATE INDEX IF NOT EXISTS idx_resources_tags ON resources USING GIN (tags);
-- Index for per-account dashboard filters
CREATE INDEX IF NOT EXISTS idx_resources_account ON resources (account_id);

CREATE TABLE IF NOT EXISTS workload_metadata (
    arn                 TEXT PRIMARY KEY REFERENCES resources(arn) ON DELETE CASCADE,
    os_distro           TEXT,                        -- e.g., Amazon Linux 2
    kernel_version      TEXT,
    agent_status        TEXT DEFAULT 'Not Installed', -- Installed | Not Installed | Outdated
    runtime             TEXT,                        -- e.g., python3.11 (for Lambda)
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ===================================================
-- LAYER C: SECURITY & FINDINGS
-- ===================================================

CREATE TABLE IF NOT EXISTS vulnerabilities (
    cve_id              TEXT PRIMARY KEY,            -- e.g., CVE-2023-1234
    severity            TEXT NOT NULL,               -- Critical | High | Medium | Low
    cvss_score          NUMERIC(4,2),                -- e.g., 9.80
    description         TEXT,
    published_at        DATE
);

-- Partial index: fast lookup of only open findings
CREATE INDEX IF NOT EXISTS idx_vulns_severity ON vulnerabilities (severity);

CREATE TABLE IF NOT EXISTS scan_results (
    finding_id          SERIAL PRIMARY KEY,
    resource_arn        TEXT NOT NULL REFERENCES resources(arn) ON DELETE CASCADE,
    cve_id              TEXT NOT NULL REFERENCES vulnerabilities(cve_id),
    package_name        TEXT,
    workload_display    TEXT,                        -- human-friendly name for the UI
    status              TEXT NOT NULL DEFAULT 'Open', -- Open | Fixed | Suppressed
    first_seen_at       TIMESTAMPTZ DEFAULT NOW(),
    last_seen_at        TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (resource_arn, cve_id, package_name)     -- no duplicate findings per package
);

CREATE INDEX IF NOT EXISTS idx_scan_results_resource ON scan_results (resource_arn);
CREATE INDEX IF NOT EXISTS idx_scan_results_status   ON scan_results (status);
CREATE INDEX IF NOT EXISTS idx_scan_results_cve      ON scan_results (cve_id);
"""

# ---------------------------------------------------------------------------
# Seed data – safe to re-run (INSERT OR IGNORE equivalent via ON CONFLICT)
# ---------------------------------------------------------------------------

SEED_SQL = """
-- Seed a dummy organisation (replace with your real Org ID)
INSERT INTO organizations (org_id, management_account_id)
VALUES ('o-exampleorgid12', '000000000000')
ON CONFLICT (org_id) DO NOTHING;

-- Seed the three client accounts from the old MASTER_TARGETS list
INSERT INTO accounts (account_id, org_id, account_name, role_arn, status)
VALUES
  ('610732543389', 'o-exampleorgid12', 'Prem Patel',    'arn:aws:iam::610732543389:role/CWPP-Scanner-Role', 'Active'),
  ('310652789217', 'o-exampleorgid12', 'Vraj Lalwala',  'arn:aws:iam::310652789217:role/CWPP-SR-VL',         'Active'),
  ('951257755436', 'o-exampleorgid12', 'Jay Chantbara', 'arn:aws:iam::951257755436:role/CWPP-SR-JC',         'Active')
ON CONFLICT (account_id) DO NOTHING;

-- Seed a few well-known CVEs as starter data for the vulnerability library
INSERT INTO vulnerabilities (cve_id, severity, cvss_score, description)
VALUES
  ('CVE-2023-1234', 'Critical', 9.8,  'OpenSSL buffer overflow allowing remote code execution.'),
  ('CVE-2023-5678', 'High',     8.1,  'nginx request smuggling vulnerability.'),
  ('CVE-2023-9012', 'Medium',   5.5,  'Bash privilege escalation via environment variables.'),
  ('CVE-2024-1122', 'Low',      3.1,  'Python3 denial-of-service via malformed HTTP request.')
ON CONFLICT (cve_id) DO NOTHING;
"""


def init_db():
    print("🔌 Connecting to PostgreSQL...")
    try:
        conn = get_db_connection()
    except Exception as e:
        print(f"❌ Could not connect to the database.\n   → {e}")
        print("\n   Make sure PostgreSQL is running and DATABASE_URL in .env is correct.")
        sys.exit(1)

    cursor = conn.cursor()

    print("🏗️  Creating schema...")
    cursor.execute(SCHEMA_SQL)

    print("🌱 Seeding initial data...")
    cursor.execute(SEED_SQL)

    conn.commit()
    cursor.close()
    conn.close()

    print("✅ PostgreSQL database 'cwpp_db' initialised successfully!")
    print("   Tables: organizations, accounts, regions, resources,")
    print("           workload_metadata, vulnerabilities, scan_results")


if __name__ == "__main__":
    init_db()