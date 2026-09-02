CREATE TABLE ticket_notes (
    id BIGSERIAL PRIMARY KEY,
    ticket_id BIGINT NOT NULL,
    author_user_id BIGINT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    version BIGINT DEFAULT 0,
    CONSTRAINT fk_ticket_note_ticket FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
    CONSTRAINT fk_ticket_note_author FOREIGN KEY (author_user_id) REFERENCES users(id)
);

CREATE INDEX idx_ticket_note_ticket ON ticket_notes(ticket_id);
