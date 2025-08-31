-- إنشاء triggers للمزامنة التلقائية بين الجداول القديمة وجدول enhanced_contacts
-- هذه الـ triggers تضمن التحديث التلقائي عند إضافة أو تحديث البيانات

-- ==============================================
-- Trigger للعملاء (clients)
-- ==============================================

-- دالة المزامنة للعملاء
CREATE OR REPLACE FUNCTION sync_client_to_enhanced_contacts()
RETURNS TRIGGER AS $$
BEGIN
    -- في حالة الإدراج أو التحديث
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        INSERT INTO enhanced_contacts (
            id, name, first_name, last_name, company_name, bio, roles, status,
            follow_up_status, priority, last_contact_date, next_contact_date,
            birthday, created_by, assigned_to, is_duplicate, notes, metadata,
            tags, language, rating_1_5, preferred_contact_method,
            created_at, updated_at
        ) VALUES (
            NEW.id, NEW.name, NEW.first_name, NEW.last_name, NEW.company_name,
            NEW.bio, ARRAY['client'], COALESCE(NEW.status, 'active'),
            COALESCE(NEW.follow_up_status, 'new'), COALESCE(NEW.priority, 'medium'),
            NEW.last_contact_date, NEW.next_contact_date, NEW.birthday,
            NEW.created_by, NEW.assigned_to, COALESCE(NEW.is_duplicate, false),
            NEW.notes, COALESCE(NEW.metadata, '{}'), COALESCE(NEW.tags, '{}'),
            COALESCE(NEW.language, 'ar'), NEW.rating, 'phone',
            COALESCE(NEW.created_at, NOW()), COALESCE(NEW.updated_at, NOW())
        )
        ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            first_name = EXCLUDED.first_name,
            last_name = EXCLUDED.last_name,
            company_name = EXCLUDED.company_name,
            bio = EXCLUDED.bio,
            status = EXCLUDED.status,
            follow_up_status = EXCLUDED.follow_up_status,
            priority = EXCLUDED.priority,
            last_contact_date = EXCLUDED.last_contact_date,
            next_contact_date = EXCLUDED.next_contact_date,
            birthday = EXCLUDED.birthday,
            assigned_to = EXCLUDED.assigned_to,
            notes = EXCLUDED.notes,
            metadata = EXCLUDED.metadata,
            tags = EXCLUDED.tags,
            language = EXCLUDED.language,
            rating_1_5 = EXCLUDED.rating_1_5,
            updated_at = NOW();

        -- مزامنة قنوات الاتصال
        IF NEW.phone IS NOT NULL THEN
            INSERT INTO enhanced_contact_channels (contact_id, channel_type, value, is_primary)
            VALUES (NEW.id, 'phone', NEW.phone, true)
            ON CONFLICT (contact_id, channel_type, value) DO NOTHING;
        END IF;

        IF NEW.whatsapp_number IS NOT NULL THEN
            INSERT INTO enhanced_contact_channels (contact_id, channel_type, value, is_primary)
            VALUES (NEW.id, 'whatsapp', NEW.whatsapp_number, false)
            ON CONFLICT (contact_id, channel_type, value) DO NOTHING;
        END IF;

        IF NEW.email IS NOT NULL THEN
            INSERT INTO enhanced_contact_channels (contact_id, channel_type, value, is_primary)
            VALUES (NEW.id, 'email', NEW.email, false)
            ON CONFLICT (contact_id, channel_type, value) DO NOTHING;
        END IF;

        RETURN NEW;
    END IF;

    -- في حالة الحذف
    IF TG_OP = 'DELETE' THEN
        DELETE FROM enhanced_contacts WHERE id = OLD.id;
        RETURN OLD;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- إنشاء trigger للعملاء
DROP TRIGGER IF EXISTS trigger_sync_clients ON clients;
CREATE TRIGGER trigger_sync_clients
    AFTER INSERT OR UPDATE OR DELETE ON clients
    FOR EACH ROW EXECUTE FUNCTION sync_client_to_enhanced_contacts();

-- ==============================================
-- Trigger للوسطاء (land_brokers)
-- ==============================================

-- دالة المزامنة للوسطاء
CREATE OR REPLACE FUNCTION sync_broker_to_enhanced_contacts()
RETURNS TRIGGER AS $$
BEGIN
    -- في حالة الإدراج أو التحديث
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        INSERT INTO enhanced_contacts (
            id, name, short_name, company_name, bio, roles, status,
            follow_up_status, priority, created_by, is_duplicate, notes,
            metadata, tags, language, office_name, job_title,
            preferred_contact_method, created_at, updated_at
        ) VALUES (
            NEW.id, NEW.name, NEW.short_name, NEW.office_name, NEW.notes,
            ARRAY['broker'], COALESCE(NEW.activity_status::text, 'active'),
            'new', 'medium', NEW.created_by, false, NEW.notes,
            jsonb_build_object(
                'areas_specialization', NEW.areas_specialization,
                'office_location', NEW.office_location,
                'deals_count', NEW.deals_count,
                'total_sales_amount', NEW.total_sales_amount
            ),
            '{}', COALESCE(NEW.language, 'ar'), NEW.office_name, 'broker',
            'phone', COALESCE(NEW.created_at, NOW()), NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            short_name = EXCLUDED.short_name,
            company_name = EXCLUDED.company_name,
            bio = EXCLUDED.bio,
            status = EXCLUDED.status,
            notes = EXCLUDED.notes,
            metadata = EXCLUDED.metadata,
            language = EXCLUDED.language,
            office_name = EXCLUDED.office_name,
            updated_at = NOW();

        -- مزامنة قنوات الاتصال
        IF NEW.phone IS NOT NULL THEN
            INSERT INTO enhanced_contact_channels (contact_id, channel_type, value, is_primary)
            VALUES (NEW.id, 'phone', NEW.phone, true)
            ON CONFLICT (contact_id, channel_type, value) DO NOTHING;
        END IF;

        IF NEW.whatsapp_number IS NOT NULL THEN
            INSERT INTO enhanced_contact_channels (contact_id, channel_type, value, is_primary)
            VALUES (NEW.id, 'whatsapp', NEW.whatsapp_number, false)
            ON CONFLICT (contact_id, channel_type, value) DO NOTHING;
        END IF;

        IF NEW.email IS NOT NULL THEN
            INSERT INTO enhanced_contact_channels (contact_id, channel_type, value, is_primary)
            VALUES (NEW.id, 'email', NEW.email, false)
            ON CONFLICT (contact_id, channel_type, value) DO NOTHING;
        END IF;

        RETURN NEW;
    END IF;

    -- في حالة الحذف
    IF TG_OP = 'DELETE' THEN
        DELETE FROM enhanced_contacts WHERE id = OLD.id;
        RETURN OLD;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- إنشاء trigger للوسطاء
DROP TRIGGER IF EXISTS trigger_sync_brokers ON land_brokers;
CREATE TRIGGER trigger_sync_brokers
    AFTER INSERT OR UPDATE OR DELETE ON land_brokers
    FOR EACH ROW EXECUTE FUNCTION sync_broker_to_enhanced_contacts();

-- ==============================================
-- Trigger للملاك (property_owners)
-- ==============================================

-- دالة المزامنة للملاك
CREATE OR REPLACE FUNCTION sync_owner_to_enhanced_contacts()
RETURNS TRIGGER AS $$
BEGIN
    -- في حالة الإدراج أو التحديث
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        INSERT INTO enhanced_contacts (
            id, name, first_name, last_name, company_name, bio, roles, status,
            follow_up_status, priority, birthday, created_by, is_duplicate,
            notes, metadata, tags, language, nationality, id_type, id_number,
            id_expiry_date, bank_name, account_number, iban,
            preferred_contact_method, created_at, updated_at
        ) VALUES (
            NEW.id, NEW.name, NEW.first_name, NEW.last_name, NEW.company_name,
            NEW.bio, ARRAY['owner'], COALESCE(NEW.status, 'active'),
            COALESCE(NEW.follow_up_status, 'new'), COALESCE(NEW.priority, 'medium'),
            NEW.birthday, NEW.created_by, COALESCE(NEW.is_duplicate, false),
            NEW.notes, COALESCE(NEW.metadata, '{}'), COALESCE(NEW.tags, '{}'),
            COALESCE(NEW.language, 'ar'), NEW.nationality, NEW.id_type,
            NEW.id_number, NEW.id_expiry_date, NEW.bank_name, NEW.account_number,
            NEW.iban, 'phone', COALESCE(NEW.created_at, NOW()), NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            first_name = EXCLUDED.first_name,
            last_name = EXCLUDED.last_name,
            company_name = EXCLUDED.company_name,
            bio = EXCLUDED.bio,
            status = EXCLUDED.status,
            follow_up_status = EXCLUDED.follow_up_status,
            priority = EXCLUDED.priority,
            birthday = EXCLUDED.birthday,
            notes = EXCLUDED.notes,
            metadata = EXCLUDED.metadata,
            tags = EXCLUDED.tags,
            language = EXCLUDED.language,
            nationality = EXCLUDED.nationality,
            id_type = EXCLUDED.id_type,
            id_number = EXCLUDED.id_number,
            id_expiry_date = EXCLUDED.id_expiry_date,
            bank_name = EXCLUDED.bank_name,
            account_number = EXCLUDED.account_number,
            iban = EXCLUDED.iban,
            updated_at = NOW();

        -- مزامنة قنوات الاتصال
        IF NEW.phone IS NOT NULL THEN
            INSERT INTO enhanced_contact_channels (contact_id, channel_type, value, is_primary)
            VALUES (NEW.id, 'phone', NEW.phone, true)
            ON CONFLICT (contact_id, channel_type, value) DO NOTHING;
        END IF;

        IF NEW.whatsapp_number IS NOT NULL THEN
            INSERT INTO enhanced_contact_channels (contact_id, channel_type, value, is_primary)
            VALUES (NEW.id, 'whatsapp', NEW.whatsapp_number, false)
            ON CONFLICT (contact_id, channel_type, value) DO NOTHING;
        END IF;

        IF NEW.email IS NOT NULL THEN
            INSERT INTO enhanced_contact_channels (contact_id, channel_type, value, is_primary)
            VALUES (NEW.id, 'email', NEW.email, false)
            ON CONFLICT (contact_id, channel_type, value) DO NOTHING;
        END IF;

        RETURN NEW;
    END IF;

    -- في حالة الحذف
    IF TG_OP = 'DELETE' THEN
        DELETE FROM enhanced_contacts WHERE id = OLD.id;
        RETURN OLD;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- إنشاء trigger للملاك
DROP TRIGGER IF EXISTS trigger_sync_owners ON property_owners;
CREATE TRIGGER trigger_sync_owners
    AFTER INSERT OR UPDATE OR DELETE ON property_owners
    FOR EACH ROW EXECUTE FUNCTION sync_owner_to_enhanced_contacts();

-- ==============================================
-- Trigger للمستأجرين (tenants)
-- ==============================================

-- دالة المزامنة للمستأجرين
CREATE OR REPLACE FUNCTION sync_tenant_to_enhanced_contacts()
RETURNS TRIGGER AS $$
BEGIN
    -- في حالة الإدراج أو التحديث
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        INSERT INTO enhanced_contacts (
            id, name, first_name, last_name, company_name, bio, roles, status,
            follow_up_status, priority, birthday, created_by, is_duplicate,
            notes, metadata, tags, language, nationality, id_type, id_number,
            preferred_contact_method, created_at, updated_at
        ) VALUES (
            NEW.id, NEW.name, NEW.first_name, NEW.last_name, NEW.company_name,
            NEW.bio, ARRAY['tenant'], COALESCE(NEW.status, 'active'),
            COALESCE(NEW.follow_up_status, 'new'), COALESCE(NEW.priority, 'medium'),
            NEW.birthday, NEW.created_by, COALESCE(NEW.is_duplicate, false),
            NEW.notes, COALESCE(NEW.metadata, '{}'), COALESCE(NEW.tags, '{}'),
            COALESCE(NEW.language, 'ar'), NEW.nationality, NEW.id_type,
            NEW.id_number, 'phone', COALESCE(NEW.created_at, NOW()), NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            first_name = EXCLUDED.first_name,
            last_name = EXCLUDED.last_name,
            company_name = EXCLUDED.company_name,
            bio = EXCLUDED.bio,
            status = EXCLUDED.status,
            follow_up_status = EXCLUDED.follow_up_status,
            priority = EXCLUDED.priority,
            birthday = EXCLUDED.birthday,
            notes = EXCLUDED.notes,
            metadata = EXCLUDED.metadata,
            tags = EXCLUDED.tags,
            language = EXCLUDED.language,
            nationality = EXCLUDED.nationality,
            id_type = EXCLUDED.id_type,
            id_number = EXCLUDED.id_number,
            updated_at = NOW();

        -- مزامنة قنوات الاتصال
        IF NEW.phone IS NOT NULL THEN
            INSERT INTO enhanced_contact_channels (contact_id, channel_type, value, is_primary)
            VALUES (NEW.id, 'phone', NEW.phone, true)
            ON CONFLICT (contact_id, channel_type, value) DO NOTHING;
        END IF;

        IF NEW.whatsapp_number IS NOT NULL THEN
            INSERT INTO enhanced_contact_channels (contact_id, channel_type, value, is_primary)
            VALUES (NEW.id, 'whatsapp', NEW.whatsapp_number, false)
            ON CONFLICT (contact_id, channel_type, value) DO NOTHING;
        END IF;

        IF NEW.email IS NOT NULL THEN
            INSERT INTO enhanced_contact_channels (contact_id, channel_type, value, is_primary)
            VALUES (NEW.id, 'email', NEW.email, false)
            ON CONFLICT (contact_id, channel_type, value) DO NOTHING;
        END IF;

        RETURN NEW;
    END IF;

    -- في حالة الحذف
    IF TG_OP = 'DELETE' THEN
        DELETE FROM enhanced_contacts WHERE id = OLD.id;
        RETURN OLD;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- إنشاء trigger للمستأجرين
DROP TRIGGER IF EXISTS trigger_sync_tenants ON tenants;
CREATE TRIGGER trigger_sync_tenants
    AFTER INSERT OR UPDATE OR DELETE ON tenants
    FOR EACH ROW EXECUTE FUNCTION sync_tenant_to_enhanced_contacts();

-- ==============================================
-- Trigger عكسي من enhanced_contacts إلى الجداول الأخرى
-- ==============================================

-- دالة المزامنة العكسية
CREATE OR REPLACE FUNCTION sync_enhanced_contacts_to_pages()
RETURNS TRIGGER AS $$
DECLARE
    contact_roles text[];
BEGIN
    -- في حالة الإدراج أو التحديث
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        contact_roles := NEW.roles;
        
        -- مزامنة مع جدول العملاء
        IF 'client' = ANY(contact_roles) THEN
            INSERT INTO clients (
                id, name, first_name, last_name, company_name, bio, status,
                follow_up_status, priority, last_contact_date, next_contact_date,
                birthday, created_by, assigned_to, is_duplicate, notes,
                metadata, tags, language, rating, created_at, updated_at
            ) VALUES (
                NEW.id, NEW.name, NEW.first_name, NEW.last_name, NEW.company_name,
                NEW.bio, NEW.status, NEW.follow_up_status, NEW.priority,
                NEW.last_contact_date, NEW.next_contact_date, NEW.birthday,
                NEW.created_by, NEW.assigned_to, NEW.is_duplicate, NEW.notes,
                NEW.metadata, NEW.tags, NEW.language, NEW.rating_1_5,
                NEW.created_at, NEW.updated_at
            )
            ON CONFLICT (id) DO UPDATE SET
                name = EXCLUDED.name,
                first_name = EXCLUDED.first_name,
                last_name = EXCLUDED.last_name,
                company_name = EXCLUDED.company_name,
                bio = EXCLUDED.bio,
                status = EXCLUDED.status,
                follow_up_status = EXCLUDED.follow_up_status,
                priority = EXCLUDED.priority,
                last_contact_date = EXCLUDED.last_contact_date,
                next_contact_date = EXCLUDED.next_contact_date,
                birthday = EXCLUDED.birthday,
                assigned_to = EXCLUDED.assigned_to,
                notes = EXCLUDED.notes,
                metadata = EXCLUDED.metadata,
                tags = EXCLUDED.tags,
                language = EXCLUDED.language,
                rating = EXCLUDED.rating,
                updated_at = EXCLUDED.updated_at;
        END IF;

        -- مزامنة مع جدول الوسطاء
        IF 'broker' = ANY(contact_roles) THEN
            INSERT INTO land_brokers (
                id, name, short_name, office_name, notes, language,
                activity_status, created_at
            ) VALUES (
                NEW.id, NEW.name, NEW.short_name, NEW.office_name, NEW.notes,
                NEW.language, NEW.status::text, NEW.created_at
            )
            ON CONFLICT (id) DO UPDATE SET
                name = EXCLUDED.name,
                short_name = EXCLUDED.short_name,
                office_name = EXCLUDED.office_name,
                notes = EXCLUDED.notes,
                language = EXCLUDED.language,
                activity_status = EXCLUDED.activity_status;
        END IF;

        -- مزامنة مع جدول الملاك
        IF 'owner' = ANY(contact_roles) THEN
            INSERT INTO property_owners (
                id, name, first_name, last_name, company_name, bio, status,
                follow_up_status, priority, birthday, created_by, is_duplicate,
                notes, metadata, tags, language, nationality, id_type, id_number,
                id_expiry_date, bank_name, account_number, iban, created_at, updated_at
            ) VALUES (
                NEW.id, NEW.name, NEW.first_name, NEW.last_name, NEW.company_name,
                NEW.bio, NEW.status, NEW.follow_up_status, NEW.priority,
                NEW.birthday, NEW.created_by, NEW.is_duplicate, NEW.notes,
                NEW.metadata, NEW.tags, NEW.language, NEW.nationality,
                NEW.id_type, NEW.id_number, NEW.id_expiry_date, NEW.bank_name,
                NEW.account_number, NEW.iban, NEW.created_at, NEW.updated_at
            )
            ON CONFLICT (id) DO UPDATE SET
                name = EXCLUDED.name,
                first_name = EXCLUDED.first_name,
                last_name = EXCLUDED.last_name,
                company_name = EXCLUDED.company_name,
                bio = EXCLUDED.bio,
                status = EXCLUDED.status,
                follow_up_status = EXCLUDED.follow_up_status,
                priority = EXCLUDED.priority,
                birthday = EXCLUDED.birthday,
                notes = EXCLUDED.notes,
                metadata = EXCLUDED.metadata,
                tags = EXCLUDED.tags,
                language = EXCLUDED.language,
                nationality = EXCLUDED.nationality,
                id_type = EXCLUDED.id_type,
                id_number = EXCLUDED.id_number,
                id_expiry_date = EXCLUDED.id_expiry_date,
                bank_name = EXCLUDED.bank_name,
                account_number = EXCLUDED.account_number,
                iban = EXCLUDED.iban,
                updated_at = EXCLUDED.updated_at;
        END IF;

        -- مزامنة مع جدول المستأجرين
        IF 'tenant' = ANY(contact_roles) THEN
            INSERT INTO tenants (
                id, name, first_name, last_name, company_name, bio, status,
                follow_up_status, priority, birthday, created_by, is_duplicate,
                notes, metadata, tags, language, nationality, id_type, id_number,
                created_at, updated_at
            ) VALUES (
                NEW.id, NEW.name, NEW.first_name, NEW.last_name, NEW.company_name,
                NEW.bio, NEW.status, NEW.follow_up_status, NEW.priority,
                NEW.birthday, NEW.created_by, NEW.is_duplicate, NEW.notes,
                NEW.metadata, NEW.tags, NEW.language, NEW.nationality,
                NEW.id_type, NEW.id_number, NEW.created_at, NEW.updated_at
            )
            ON CONFLICT (id) DO UPDATE SET
                name = EXCLUDED.name,
                first_name = EXCLUDED.first_name,
                last_name = EXCLUDED.last_name,
                company_name = EXCLUDED.company_name,
                bio = EXCLUDED.bio,
                status = EXCLUDED.status,
                follow_up_status = EXCLUDED.follow_up_status,
                priority = EXCLUDED.priority,
                birthday = EXCLUDED.birthday,
                notes = EXCLUDED.notes,
                metadata = EXCLUDED.metadata,
                tags = EXCLUDED.tags,
                language = EXCLUDED.language,
                nationality = EXCLUDED.nationality,
                id_type = EXCLUDED.id_type,
                id_number = EXCLUDED.id_number,
                updated_at = EXCLUDED.updated_at;
        END IF;

        RETURN NEW;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- إنشاء trigger للمزامنة العكسية
DROP TRIGGER IF EXISTS trigger_sync_enhanced_contacts_to_pages ON enhanced_contacts;
CREATE TRIGGER trigger_sync_enhanced_contacts_to_pages
    AFTER INSERT OR UPDATE ON enhanced_contacts
    FOR EACH ROW EXECUTE FUNCTION sync_enhanced_contacts_to_pages();

-- ==============================================
-- إنشاء فهارس لتحسين الأداء
-- ==============================================

CREATE INDEX IF NOT EXISTS idx_enhanced_contacts_roles ON enhanced_contacts USING GIN(roles);
CREATE INDEX IF NOT EXISTS idx_enhanced_contact_channels_contact_type ON enhanced_contact_channels(contact_id, channel_type);

-- ==============================================
-- تعليقات للتوثيق
-- ==============================================

COMMENT ON FUNCTION sync_client_to_enhanced_contacts() IS 'دالة مزامنة العملاء مع جدول enhanced_contacts';
COMMENT ON FUNCTION sync_broker_to_enhanced_contacts() IS 'دالة مزامنة الوسطاء مع جدول enhanced_contacts';
COMMENT ON FUNCTION sync_owner_to_enhanced_contacts() IS 'دالة مزامنة الملاك مع جدول enhanced_contacts';
COMMENT ON FUNCTION sync_tenant_to_enhanced_contacts() IS 'دالة مزامنة المستأجرين مع جدول enhanced_contacts';
COMMENT ON FUNCTION sync_enhanced_contacts_to_pages() IS 'دالة المزامنة العكسية من enhanced_contacts إلى الجداول الأخرى';

-- إشعار بانتهاء التنفيذ
SELECT 'تم إنشاء جميع triggers المزامنة بنجاح!' as result;