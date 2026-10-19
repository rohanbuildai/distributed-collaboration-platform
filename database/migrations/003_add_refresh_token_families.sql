
BEGIN;

-- 1. Invalidate existing refresh-token sessions.
UPDATE refresh_tokens
SET revoked_at = COALESCE(revoked_at, NOW());

-- 2. Add the family identifier.
ALTER TABLE refresh_tokens
ADD COLUMN family_id UUID;

-- 3. Backfill existing rows.
UPDATE refresh_tokens
SET family_id = gen_random_uuid()
WHERE family_id IS NULL;

-- 4. Every refresh token must belong to a family.
ALTER TABLE refresh_tokens
ALTER COLUMN family_id SET NOT NULL;

-- 5. Support efficient family-level lookups.
CREATE INDEX refresh_tokens_family_id_idx
ON refresh_tokens (family_id);

COMMIT;
