-- ============================================================
-- DDL Script — Fitness Center Management System
-- PostgreSQL — Physical Data Model (3NF)
-- Generated from ER Diagram
-- ============================================================

-- ── ENUMS (PostgreSQL custom types) ──

CREATE TYPE user_role AS ENUM ('admin', 'member');
CREATE TYPE subscription_status AS ENUM ('active', 'pending_payment', 'payment_failed', 'expired', 'cancelled');
CREATE TYPE subscription_type AS ENUM ('standard', 'personalized');
CREATE TYPE reservation_status AS ENUM ('confirmed', 'cancelled', 'cancelled_expired');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
CREATE TYPE equipment_condition AS ENUM ('new', 'good', 'fair', 'needs_repair', 'decommissioned');

-- ══════════════════════════════════
-- 1. USERS
-- ══════════════════════════════════
CREATE TABLE users (
    id              SERIAL          PRIMARY KEY,
    email           VARCHAR(255)    NOT NULL UNIQUE,
    hashed_password VARCHAR(255)    NOT NULL,
    role            user_role       NOT NULL,
    is_active       BOOLEAN         NOT NULL DEFAULT TRUE,
    is_locked       BOOLEAN         NOT NULL DEFAULT FALSE,
    login_attempts  INTEGER         NOT NULL DEFAULT 0 CHECK (login_attempts >= 0),
    created_at      TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP       NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users (email);
CREATE INDEX idx_users_role ON users (role);

-- ══════════════════════════════════
-- 2. MEMBERS
-- ══════════════════════════════════
CREATE TABLE members (
    id                  SERIAL          PRIMARY KEY,
    user_id             INTEGER         NOT NULL UNIQUE
                                        REFERENCES users(id) ON DELETE CASCADE,
    first_name          VARCHAR(100)    NOT NULL,
    last_name           VARCHAR(100)    NOT NULL,
    phone               VARCHAR(20)     NOT NULL,
    subscription_status VARCHAR(20)     NOT NULL DEFAULT 'none'
                                        CHECK (subscription_status IN ('none', 'active', 'restricted', 'expired')),
    created_at          TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP       NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_members_user_id ON members (user_id);
CREATE INDEX idx_members_status ON members (subscription_status);

-- ══════════════════════════════════
-- 3. TRAINERS
-- ══════════════════════════════════
-- NOTA: Antrenorii NU au credențiale de acces.
--       Nu există FK către users. (SRS v1.2, §2.3)
CREATE TABLE trainers (
    id              SERIAL          PRIMARY KEY,
    first_name      VARCHAR(100)    NOT NULL,
    last_name       VARCHAR(100)    NOT NULL,
    phone           VARCHAR(20)     NOT NULL,
    specialization  VARCHAR(100),
    is_active       BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP       NOT NULL DEFAULT NOW()
);

-- ══════════════════════════════════
-- 4. SUBSCRIPTION_TYPES (Catalog)
-- ══════════════════════════════════
CREATE TABLE subscription_types (
    id              SERIAL          PRIMARY KEY,
    name            VARCHAR(50)     NOT NULL UNIQUE,
    base_fee        NUMERIC(10,2)   NOT NULL CHECK (base_fee > 0),
    duration_days   INTEGER         NOT NULL DEFAULT 30 CHECK (duration_days > 0),
    is_active       BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP       NOT NULL DEFAULT NOW()
);

-- ══════════════════════════════════
-- 5. SUBSCRIPTIONS
-- ══════════════════════════════════
CREATE TABLE subscriptions (
    id              SERIAL              PRIMARY KEY,
    member_id       INTEGER             NOT NULL
                                        REFERENCES members(id) ON DELETE CASCADE,
    type_id         INTEGER             NOT NULL
                                        REFERENCES subscription_types(id),
    type            subscription_type   NOT NULL,
    base_fee        NUMERIC(10,2)       NOT NULL CHECK (base_fee >= 0),
    pt_sessions     INTEGER             NOT NULL DEFAULT 0 CHECK (pt_sessions >= 0),
    total_amount    NUMERIC(10,2)       NOT NULL CHECK (total_amount >= 0),
    start_date      DATE                NOT NULL,
    end_date        DATE                NOT NULL,
    status          subscription_status NOT NULL DEFAULT 'pending_payment',
    created_at      TIMESTAMP           NOT NULL DEFAULT NOW(),
    --
    CHECK (end_date > start_date)
);

CREATE INDEX idx_subscriptions_member ON subscriptions (member_id);
CREATE INDEX idx_subscriptions_status ON subscriptions (status);
CREATE INDEX idx_subscriptions_end_date ON subscriptions (end_date);

COMMENT ON TABLE subscriptions IS 'Formula REQ-8: total_amount = base_fee + (pt_sessions * 50)';

-- ══════════════════════════════════
-- 6. PAYMENTS
-- ══════════════════════════════════
CREATE TABLE payments (
    id                  SERIAL          PRIMARY KEY,
    subscription_id     INTEGER         NOT NULL
                                        REFERENCES subscriptions(id) ON DELETE CASCADE,
    amount              NUMERIC(10,2)   NOT NULL CHECK (amount > 0),
    currency            VARCHAR(3)      NOT NULL DEFAULT 'RON',
    gateway_session_id  VARCHAR(255),
    gateway_reference   VARCHAR(255),
    status              payment_status  NOT NULL DEFAULT 'pending',
    paid_at             TIMESTAMP,
    created_at          TIMESTAMP       NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_subscription ON payments (subscription_id);
CREATE INDEX idx_payments_gateway_session ON payments (gateway_session_id);

-- ══════════════════════════════════
-- 7. FACILITIES
-- ══════════════════════════════════
CREATE TABLE facilities (
    id              SERIAL          PRIMARY KEY,
    name            VARCHAR(100)    NOT NULL UNIQUE,
    capacity        INTEGER         NOT NULL CHECK (capacity > 0),
    description     TEXT,
    is_active       BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP       NOT NULL DEFAULT NOW()
);

-- ══════════════════════════════════
-- 8. CLASSES (Training Sessions)
-- ══════════════════════════════════
CREATE TABLE classes (
    id              SERIAL          PRIMARY KEY,
    trainer_id      INTEGER         NOT NULL
                                    REFERENCES trainers(id) ON DELETE RESTRICT,
    facility_id     INTEGER         NOT NULL
                                    REFERENCES facilities(id) ON DELETE RESTRICT,
    name            VARCHAR(100)    NOT NULL,
    description     TEXT,
    start_time      TIMESTAMP       NOT NULL,
    end_time        TIMESTAMP       NOT NULL,
    capacity        INTEGER         NOT NULL CHECK (capacity > 0),
    created_at      TIMESTAMP       NOT NULL DEFAULT NOW(),
    --
    CHECK (end_time > start_time)
);

CREATE INDEX idx_classes_trainer ON classes (trainer_id);
CREATE INDEX idx_classes_facility ON classes (facility_id);
CREATE INDEX idx_classes_start_time ON classes (start_time);

-- ══════════════════════════════════
-- 9. RESERVATIONS
-- ══════════════════════════════════
CREATE TABLE reservations (
    id              SERIAL              PRIMARY KEY,
    member_id       INTEGER             NOT NULL
                                        REFERENCES members(id) ON DELETE CASCADE,
    class_id        INTEGER             NOT NULL
                                        REFERENCES classes(id) ON DELETE CASCADE,
    reserved_at     TIMESTAMP           NOT NULL DEFAULT NOW(),
    status          reservation_status  NOT NULL DEFAULT 'confirmed'
);

-- Partial unique index: previne duplicarea rezervărilor confirmate
CREATE UNIQUE INDEX idx_reservations_unique_confirmed
    ON reservations (member_id, class_id)
    WHERE status = 'confirmed';

CREATE INDEX idx_reservations_member ON reservations (member_id);
CREATE INDEX idx_reservations_class ON reservations (class_id);
CREATE INDEX idx_reservations_status ON reservations (status);

-- ══════════════════════════════════
-- 10. EQUIPMENT
-- ══════════════════════════════════
CREATE TABLE equipment (
    id              SERIAL              PRIMARY KEY,
    facility_id     INTEGER             NOT NULL
                                        REFERENCES facilities(id) ON DELETE CASCADE,
    name            VARCHAR(100)        NOT NULL,
    category        VARCHAR(50)         NOT NULL,
    quantity        INTEGER             NOT NULL DEFAULT 1 CHECK (quantity >= 0),
    condition       equipment_condition NOT NULL DEFAULT 'good',
    notes           TEXT,
    created_at      TIMESTAMP           NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP           NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_equipment_facility ON equipment (facility_id);

-- ══════════════════════════════════
-- 11. RESTRICTED_CLIENTS
-- ══════════════════════════════════
CREATE TABLE restricted_clients (
    id              SERIAL          PRIMARY KEY,
    member_id       INTEGER         NOT NULL UNIQUE
                                    REFERENCES members(id) ON DELETE CASCADE,
    subscription_id INTEGER         NOT NULL
                                    REFERENCES subscriptions(id),
    restricted_at   TIMESTAMP       NOT NULL DEFAULT NOW(),
    reason          VARCHAR(100)    NOT NULL
);

CREATE INDEX idx_restricted_member ON restricted_clients (member_id);

COMMENT ON TABLE restricted_clients IS 'REQ-6: Populat automat de Cron Job la expirarea abonamentelor.';

-- ══════════════════════════════════
-- TRIGGER: auto-update updated_at
-- ══════════════════════════════════
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_members_updated_at
    BEFORE UPDATE ON members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_subscription_types_updated_at
    BEFORE UPDATE ON subscription_types
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_equipment_updated_at
    BEFORE UPDATE ON equipment
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
