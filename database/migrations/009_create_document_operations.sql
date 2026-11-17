
BEGIN;

CREATE TABLE document_operations (
    id BIGSERIAL PRIMARY KEY,

    document_id BIGINT NOT NULL
        REFERENCES documents(id) ON DELETE CASCADE,

    user_id BIGINT NOT NULL
        REFERENCES users(id) ON DELETE CASCADE,

    operation_id UUID NOT NULL,

    request_payload JSONB NOT NULL,

    response_payload JSONB,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT document_operations_unique
        UNIQUE (document_id, user_id, operation_id),

    CONSTRAINT document_operations_request_object
        CHECK (jsonb_typeof(request_payload) = 'object')
);

COMMIT;
