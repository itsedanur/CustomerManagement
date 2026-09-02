CREATE INDEX IF NOT EXISTS idx_customer_note_created ON customer_notes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ticket_note_created ON ticket_notes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_crm_task_customer ON crm_tasks(customer_id);
CREATE INDEX IF NOT EXISTS idx_crm_task_ticket ON crm_tasks(ticket_id);
