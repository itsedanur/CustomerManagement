# Project Architecture Documentation

This document describes the architectural layout, modules, and behavioral design patterns of the CRM Customer Management system.

---

## 1. System Topology

The system follows a classic **Client-Server decoupled architecture**, consisting of a React Single Page Application (SPA), a Spring Boot REST API, and a PostgreSQL relational database.

```
       +-----------------------+
       |   React SPA Client    |
       |  (Nginx / Port 80)    |
       +-----------------------+
                   |
         HTTP REST | (JSON over JWT)
                   v
       +-----------------------+
       |  Spring Boot Service  |
       |     (Port 8080)       |
       +-----------------------+
                   |
          JDBC     | (Hikari Connection Pool)
                   v
       +-----------------------+
       |  PostgreSQL Database  |
       |     (Port 5432)       |
       +-----------------------+
```

### Request Flow
1. **Frontend**: Requests are initiated via `axios` and managed asynchronously using `TanStack Query`. JWT token is attached as an `Authorization: Bearer <token>` header.
2. **Nginx Web Server**: Serves frontend assets. In production, Nginx proxies requests matching `/api/*` and `/actuator/*` directly to the Backend service.
3. **Spring Security**: Inspects request headers. If a valid token is found, establishes the `SecurityContext`. Public endpoints (like `/api/auth/login`, `/actuator/health`, `/swagger-ui.html`) bypass standard JWT filter requirements.
4. **Controllers**: Decouples network layers by matching request mapping rules and parsing inputs into DTOs.
5. **Services**: Orchestrates business rules, transactions, timeline logs, and audit logs.
6. **Repositories (Spring Data JPA)**: Performs transactional ORM queries to PostgreSQL.

---

## 2. Key Architectural Features

### A. Flyway Database Migrations
Database schemas are versioned and managed using **Flyway Database Migrations** (located in `src/main/resources/db/migration`). 
- On backend startup, Flyway automatically checks the target schema and applies pending migrations (`V1` to `V7`).
- In the `prod` profile, database schema verification (`spring.jpa.hibernate.ddl-auto=validate`) prevents Hibernate from making automatic changes, ensuring schema consistency.

### B. Müşteri Aktiviteleri (Customer Activities) vs Sistem Denetim Kayıtları (Audit Logs)
To separate concerns:
1. **Customer Activities**: Represents account-specific events related directly to a customer profile (e.g. ticket created, address updated). These are stored in the `activities` table and displayed on the Customer Profile's Timeline tab.
2. **Audit Logs**: Represents system-wide security logs intended for system administrators (e.g. user logged in, customer deleted). These capture:
   - Action type (LOGIN, CUSTOMER_DELETE, etc.)
   - Target entity type and ID
   - IP address of the requester (extracted via `HttpServletRequest.getRemoteAddr()`)
   - Actor user ID (extracted from SecurityContext)
   - Details of the payload or action

### C. Ticket State Machine
Ticket statuses are managed through a strict transition state machine configured in the backend's service layer.
```
      [ OPEN ] ----(start)----> [ IN_PROGRESS ] ----(resolve)----> [ RESOLVED ]
         |                            |                                |
      (close)                      (close)                          (close)
         |                            |                                |
         +----------------------------v--------------------------------+
                                      |
                                  [ CLOSED ] <---(reopen)--- [ RESOLVED ]
```
- Status transitions generate both **Customer Activities** (e.g., `TICKET_STATUS_CHANGED`) and **Audit Logs** to preserve the audit trail.
- Only authorized roles (`ADMIN`, `MANAGER`) can update assignment or modify priority settings.

### D. CORS & Security
In production, CORS is tightly restricted to the domains configured under `cors.allowed-origins` property (loaded from `.env` in Compose environments). Spring Security intercepts requests, validating JWT validity and ensuring stateless operations.
