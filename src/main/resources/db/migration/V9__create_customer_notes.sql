CREATE TABLE customer_notes (
    id BIGSERIAL PRIMARY KEY,
    customer_id BIGINT NOT NULL,
    author_user_id BIGINT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    version BIGINT DEFAULT 0,
    CONSTRAINT fk_customer_note_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    CONSTRAINT fk_customer_note_author FOREIGN KEY (author_user_id) REFERENCES users(id)
);

CREATE INDEX idx_customer_note_customer ON customer_notes(customer_id);
