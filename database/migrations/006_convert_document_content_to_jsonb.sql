
BEGIN;

-- 1. Remove the old TEXT default.
ALTER TABLE documents
ALTER COLUMN content DROP DEFAULT;

-- 2. Convert existing text into a TipTap-compatible JSONB document.
ALTER TABLE documents
ALTER COLUMN content TYPE JSONB
USING
    CASE
        WHEN content = '' THEN
            '{"type":"doc","content":[{"type":"paragraph"}]}'::jsonb
        ELSE
            jsonb_build_object(
                'type', 'doc',
                'content', jsonb_build_array(
                    jsonb_build_object(
                        'type', 'paragraph',
                        'content', jsonb_build_array(
                            jsonb_build_object(
                                'type', 'text',
                                'text', content
                            )
                        )
                    )
                )
            )
    END;

-- 3. Set the new JSONB default.
ALTER TABLE documents
ALTER COLUMN content
SET DEFAULT '{"type":"doc","content":[{"type":"paragraph"}]}'::jsonb;

COMMIT;
