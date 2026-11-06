BEGIN;

CREATE TABLE document_versions (
    id BIGSERIAL PRIMARY KEY,

    document_id BIGINT NOT NULL
        REFERENCES documents(id) ON DELETE CASCADE,

    version_number INTEGER NOT NULL,

    title VARCHAR(200) NOT NULL,

    content JSONB NOT NULL,

    edited_by BIGINT NOT NULL
        REFERENCES users(id),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT document_versions_unique_number
        UNIQUE (document_id, version_number)
);

CREATE INDEX document_versions_history_idx
ON document_versions (
    document_id,
    version_number DESC
);

COMMIT;