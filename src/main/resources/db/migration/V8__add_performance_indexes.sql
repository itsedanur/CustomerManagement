-- Lowercase indexes for optimized case-insensitive customer searches
CREATE INDEX idx_customers_first_name_lower ON customers (lower(first_name));
CREATE INDEX idx_customers_last_name_lower ON customers (lower(last_name));
CREATE INDEX idx_customers_email_lower ON customers (lower(email));
CREATE INDEX idx_customers_company_lower ON customers (lower(company));

-- Index for ticket filtering by ticket number (status, priority, customer_id, and assigned_user_id indexes already exist in V3)
CREATE INDEX idx_tickets_ticket_number ON tickets (ticket_number);

-- Indexes for customer activities history (timeline) queries
CREATE INDEX idx_activities_customer_id ON activities (customer_id);
CREATE INDEX idx_activities_created_at ON activities (created_at);
