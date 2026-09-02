CREATE TABLE crm_tasks (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    customer_id BIGINT,
    ticket_id BIGINT,
    assigned_user_id BIGINT NOT NULL,
    created_by_user_id BIGINT NOT NULL,
    due_date TIMESTAMP WITHOUT TIME ZONE,
    priority VARCHAR(50) NOT NULL DEFAULT 'MEDIUM',
    status VARCHAR(50) NOT NULL DEFAULT 'TODO',
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITHOUT TIME ZONE,
    version BIGINT DEFAULT 0,
    CONSTRAINT fk_crm_task_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
    CONSTRAINT fk_crm_task_ticket FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE SET NULL,
    CONSTRAINT fk_crm_task_assigned FOREIGN KEY (assigned_user_id) REFERENCES users(id),
    CONSTRAINT fk_crm_task_created_by FOREIGN KEY (created_by_user_id) REFERENCES users(id)
);

CREATE INDEX idx_crm_task_assigned_status ON crm_tasks(assigned_user_id, status);
CREATE INDEX idx_crm_task_due_date ON crm_tasks(due_date);
