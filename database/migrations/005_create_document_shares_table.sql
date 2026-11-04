
CREATE TABLE document_shares (
    id BIGSERIAL PRIMARY KEY,

    document_id BIGINT NOT NULL
        REFERENCES documents(id)
        ON DELETE CASCADE,

    shared_with_user_id BIGINT NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    permission VARCHAR(10) NOT NULL
        CHECK (permission IN ('viewer', 'editor')),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT document_shares_document_user_unique
        UNIQUE (document_id, shared_with_user_id)
);

CREATE INDEX document_shares_recipient_idx
ON document_shares (shared_with_user_id, created_at DESC, id DESC);
