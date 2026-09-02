# CRM Customer Management System

This project is a modern Customer Relationship Management (CRM) application built using a Spring Boot backend, a PostgreSQL database, and a React + TypeScript frontend built with Vite. It features role-based access control, customer and ticket management, address books, activity logs, audit logs, and an interactive dashboard.

---

## Features

- **Authentication & RBAC**: JWT-based stateless authentication with `ADMIN`, `MANAGER`, and `USER` roles.
- **Customer Management**: Detailed profiles of individual and corporate customers, including contact information and current status (Active, Inactive, Blocked).
- **Address Management**: Multiple billing and shipping addresses per customer.
- **Ticket Management & State Machine**: Structured lifecycle for support tickets (Open, In Progress, Resolved, Closed) with transition audits.
- **Ticket Operations**: Easy ticket assignment and priority management (Low, Medium, High, Critical) by authorized roles.
- **Customer Activity Timeline**: A chronological history of all operations performed on a customer's account, showing the timestamp and the performing user.
- **Audit Logs**: Comprehensive, secure system-wide logs tracking authentication, modifications, and administrative operations alongside IP addresses.
- **Interactive Dashboard**: KPI summaries (Total Customers, Active Customers, Open Tickets, Critical Tickets) and dynamic charts (Status Distribution) that act as shortcuts to lists.
- **Turkish UI**: Full Turkish localization for all user-facing interface text, tags, and states.

---

## Tech Stack

### Backend
- **Java 21**
- **Spring Boot** (Spring Security, Spring Data JPA, Spring Boot Actuator)
- **PostgreSQL**
- **Flyway** (Database migrations)
- **JWT** (JSON Web Tokens)
- **MapStruct** & **Lombok**
- **Springdoc OpenAPI** (Swagger documentation)

### Frontend
- **React 19 & TypeScript**
- **Vite** (Build tool)
- **TanStack Query** (React Query)
- **Tailwind CSS** & **Radix UI** / shadcn/ui

### Infrastructure
- **Docker & Docker Compose**
- **Nginx** (Serving the frontend & proxying requests to the backend)

---

## Architecture

The project has a clear separation between the backend (Spring Boot) and the frontend (Vite React app).

### Package Structure (Backend)
- `com.example.crm.auth`: Security configuration, JWT providers, user authentication services, and login controllers.
- `com.example.crm.customer`: Customer and Address entities, services, controllers, and repositories.
- `com.example.crm.ticket`: Support ticket lifecycle, controllers, and services.
- `com.example.crm.activity`: Customer activity logger and history.
- `com.example.crm.audit`: Security audit logger and history.
- `com.example.crm.user`: Internal system user management.

---

## Database Schema

```
  +--------------+         +--------------+
  |    users     |         |  audit_logs  |
  +--------------+         +--------------+
  | id (PK)      |<---+    | id (PK)      |
  | email        |    |    | user_id (FK) |
  | password     |    |    | action       |
  | role         |    |    | entity_type  |
  +--------------+    |    | entity_id    |
                      |    | ip_address   |
                      |    +--------------+
  +--------------+    |
  |  customers   |    |    +--------------------+
  +--------------+    |    |     activities     |
  | id (PK)      |    |    +--------------------+
  | first_name   |    |    | id (PK)            |
  | last_name    |    |    | customer_id (FK)   |
  | email        |    |    | user_id (FK) ------+
  | phone        |    |    | type               |
  | status       |    |    | description        |
  +--------------+    |    +--------------------+
    |          |      |
    v          v      |    +--------------------+
+---------+ +-------+ |    |      tickets       |
|addresses| |tickets| |    +--------------------+
+---------+ +-------+ |    | id (PK)            |
            |cust_id| |    | customer_id (FK)   |
            |user_id|-+    | assigned_user (FK) |
            +-------+      | status, priority   |
                           +--------------------+
```

---

## Running Locally (Without Docker)

### Prerequisites
- JDK 21
- Node.js (v18 or higher)
- PostgreSQL (running locally on port 5432)

### 1. Backend Setup
1. Create a PostgreSQL database named `customer_management`.
2. Configure credentials in `src/main/resources/application-dev.properties` or set environment variables:
   ```bash
   export DB_USERNAME=postgres
   export DB_PASSWORD=postgres
   ```
3. Run the Spring Boot application:
   ```bash
   mvn spring-boot:run -Dspring-boot.run.profiles=dev
   ```

### 2. Frontend Setup
1. Navigate to the `frontend` folder:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Open your browser at `http://localhost:5173`.

---

## Running with Docker Compose

### 1. Development & Demo Mode (With Full Realistic Seed Data)
To launch the full CRM system pre-populated with **45 customers, 30 tickets, 6 users, activity history, and audit logs**:
```bash
docker compose -f docker-compose.yml -f docker-compose.demo.yml up --build -d
```
Access the application at `http://localhost`.

### 2. Production Mode (Clean Setup Without Seed Data)
To launch a clean production environment:
```bash
docker compose up --build -d
```
Access the application at `http://localhost`.

---

## Environment Variables

| Variable Name | Description | Default Value |
| --- | --- | --- |
| `POSTGRES_DB` | Database Name | `customer_management` |
| `POSTGRES_USER` | Database Username | `postgres` |
| `POSTGRES_PASSWORD` | Database Password | `postgres` |
| `JWT_SECRET` | Secret key for JWT signing | `defaultSecretKeyForDevelopmentOnly...` |
| `CORS_ALLOWED_ORIGINS` | Permitted frontend origins | `http://localhost,http://localhost:80` |
| `BOOTSTRAP_ADMIN_EMAIL` | Auto-created Admin Email | `admin@example.com` |
| `BOOTSTRAP_ADMIN_PASSWORD`| Auto-created Admin Password | `admin` |
| `SPRING_PROFILES_ACTIVE` | Active Spring profile | `prod` |

---

## API Documentation & Actuator

### Swagger UI
When running in `dev` profile, you can access the Swagger documentation here:
`http://localhost:8080/swagger-ui.html`

In the `prod` profile, Swagger is **disabled** by default for security, but can be enabled by setting `SPRINGDOC_ENABLED=true`.

### Actuator Health
The system health check is exposed at:
`http://localhost:8080/actuator/health`

---

## Testing & Quality Checks

### Run Backend Tests
```bash
mvn clean test
```

### Build & Lint Frontend
```bash
cd frontend
npm run lint
npm run build
```
