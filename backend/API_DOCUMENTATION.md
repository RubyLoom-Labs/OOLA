# OOLA CRM - API Documentation (V1)

Complete reference for all REST endpoints exposed by the OOLA CRM backend.

---

## Global Specifications & Headers

### Base URL
```
http://localhost:8000/api/v1
```

### Standard Headers
```http
Accept: application/json
Content-Type: application/json
Authorization: Bearer <SANCTUM_TOKEN>
```

### Soft Deletion Policy
All records with `is_delete: 1` are automatically excluded from `GET` endpoints via backend global scopes.

---

## Table of Contents
1. [Authentication & Profile](#1-authentication--profile)
2. [Companies](#2-companies)
3. [Company Types & Company Sizes](#3-company-types--company-sizes)
4. [Contacts & Phone Numbers](#4-contacts--phone-numbers)
5. [Leads & Pipelines](#5-leads--pipelines)
6. [Projects & Stages](#6-projects--stages)
7. [Tasks, Subtasks & Timers](#7-tasks-subtasks--timers)
8. [Quotations & Templates](#8-quotations--templates)
9. [Payments & Expenses](#9-payments--expenses)
10. [Hosting & Infrastructure](#10-hosting--infrastructure)
11. [Calendar & Reminders](#11-calendar--reminders)
12. [Employee Management](#12-employee-management)
13. [Communication Hub](#13-communication-hub)
14. [Notifications & Activity Logs](#14-notifications--activity-logs)
15. [Dashboard & Reports](#15-dashboard--reports)
16. [Users, Roles & Permissions](#16-users-roles--permissions)

---

## 1. Authentication & Profile

### `POST /api/v1/auth/login` (Public)
Authenticate user and obtain a Sanctum Bearer Token.

#### Request Payload
```json
{
  "email": "admin@ooralabz.com",
  "password": "password123"
}
```

#### Response Structure (`200 OK`)
```json
{
  "message": "Login successful.",
  "token": "1|qWbX4n7Y8K9vP2M1...",
  "user": {
    "id": 1,
    "name": "Alex Morgan",
    "email": "admin@ooralabz.com",
    "phone": "+94 77 123 4567",
    "role": "Super Admin",
    "designation": "Principal Architect & Lead",
    "department": "Executive",
    "status": "Active",
    "permissions": [
      "lead.view",
      "lead.create",
      "company.view",
      "project.manage"
    ]
  }
}
```

---

### `GET /api/v1/auth/me`
Fetch authenticated user details.

#### Response Structure (`200 OK`)
```json
{
  "id": 1,
  "name": "Alex Morgan",
  "email": "admin@ooralabz.com",
  "phone": "+94 77 123 4567",
  "role": "Super Admin",
  "designation": "Principal Architect & Lead",
  "department": "Executive",
  "status": "Active"
}
```

---

### `POST /api/v1/auth/logout`
Revoke current Sanctum token.

#### Response Structure (`200 OK`)
```json
{
  "message": "Logged out successfully."
}
```

---

## 2. Companies

### `GET /api/v1/companies/next-code`
Get the upcoming sequentially generated company code (Ascending `CO000001` format).

#### Response Structure (`200 OK`)
```json
{
  "next_code": "CO000002"
}
```

---

### `GET /api/v1/companies/lookup` (or `/api/v1/companies/active-list`)
Fetch active companies (`status = 1`, `is_delete = 0`) returning only `id`, `company_name`, and `company_code` for lightweight dropdowns and select options. Supports fast search by company name or company code.

#### Query Parameters
- `search` / `q`: string (searches both `company_name` and `company_code` e.g., `?search=Apex` or `?search=CO000001`)
- `name`: string (filters specifically by `company_name`)
- `code`: string (filters specifically by `company_code`)
- `limit`: integer (optional max records to return)

#### Response Structure (`200 OK`)
```json
{
  "data": [
    {
      "id": 1,
      "company_name": "Apex Global Logistics",
      "company_code": "CO000001"
    },
    {
      "id": 2,
      "company_name": "Nexus Global Innovations",
      "company_code": "CO000002"
    }
  ]
}
```

---

### `GET /api/v1/companies`
List companies with pagination, searching, sorting, and relations.

#### Query Parameters
- `search`: string (searches `company_name`, `company_code`, `email`, `owner_name`, `city`, `industry`, `phoneNumbers`)
- `status`: boolean (`1` = active, `0` = inactive)
- `company_type_id`: integer
- `company_size_id`: integer
- `industry`: string
- `sort_by`: string (`id`, `company_code`, `company_name`, `email`, `status`, `created_at`, `updated_at`)
- `sort_dir`: `asc` | `desc` (default `asc`)
- `per_page`: integer (default `15`, `0` = all)

#### Response Structure (`200 OK`)
```json
{
  "data": [
    {
      "id": 1,
      "company_code": "CO000001",
      "company_name": "Apex Global Logistics",
      "company_type_id": 2,
      "company_type": {
        "id": 2,
        "name": "Customer",
        "status": true
      },
      "email": "contact@apexlogistics.com",
      "industry": "Logistics & Supply Chain",
      "company_size_id": 3,
      "company_size": {
        "id": 3,
        "name": "51–200",
        "status": true
      },
      "status": true,
      "company_description": "Leading enterprise logistics & freight forwarding provider.",
      "website": "https://apexlogistics.com",
      "logo": null,
      "logo_url": null,
      "owner_name": "David Vance",
      "owner_birthday": "1982-05-14",
      "address_line_1": "45 Colombo Business Tower",
      "address_line_2": "Galle Road",
      "city": "Colombo",
      "state": "Western Province",
      "postal_code": "00300",
      "country": "Sri Lanka",
      "phone_numbers": [
        {
          "id": 1,
          "phone_number": "+94 11 234 5678",
          "type": "Work",
          "is_primary": true,
          "is_whatsapp": false,
          "notes": "Head Office Hotline"
        }
      ],
      "primary_phone_number": {
        "id": 1,
        "phone_number": "+94 11 234 5678",
        "type": "Work",
        "is_primary": true
      },
      "contacts_count": 1,
      "leads_count": 1,
      "projects_count": 1,
      "created_at": "2026-09-30T14:00:00.000000Z",
      "updated_at": "2026-09-30T14:00:00.000000Z"
    }
  ],
  "meta": {
    "current_page": 1,
    "last_page": 1,
    "per_page": 15,
    "total": 1
  }
}
```

---

### `POST /api/v1/companies`
Create a new Company record.

#### Request Payload
| Field | Type | Required | Description |
|---|---|---|---|
| `company_name` | string | **Yes** | Full company name |
| `company_type_id` | integer | **Yes** | Foreign key to `company_types` |
| `email` | string (email) | **Yes** | Company email address |
| `industry` | string | No | Business domain / industry |
| `company_size_id` | integer | No | Foreign key to `company_sizes` |
| `status` | boolean | No | `1` = Active, `0` = Inactive (default: `1`) |
| `company_description` | string | No | Overview / description |
| `website` | string (URL) | No | Company website |
| `logo` | file / string | No | Logo image file or path |
| `owner_name` | string | No | Owner / key executive name |
| `owner_birthday` | string (date `YYYY-MM-DD`) | No | Owner birthday |
| `address_line_1` | string | No | Address line 1 |
| `address_line_2` | string | No | Address line 2 |
| `city` | string | No | City |
| `state` | string | No | State / Province |
| `postal_code` | string | No | Postal code |
| `country` | string | No | Country (default `Sri Lanka`) |
| `phone_numbers` | array | No | Multiple contact phone numbers |

```json
{
  "company_name": "Nexus Global Innovations",
  "company_type_id": 1,
  "email": "contact@nexusglobal.io",
  "industry": "Software Engineering",
  "company_size_id": 2,
  "status": true,
  "company_description": "AI & Enterprise Cloud Development.",
  "website": "https://nexusglobal.io",
  "owner_name": "Alexander Vance",
  "owner_birthday": "1988-06-15",
  "address_line_1": "100 Innovation Way",
  "address_line_2": "Kollupitiya",
  "city": "Colombo",
  "state": "Western Province",
  "postal_code": "00300",
  "country": "Sri Lanka",
  "phone_numbers": [
    {
      "phone_number": "+94 77 123 4567",
      "type": "Mobile",
      "is_primary": true,
      "is_whatsapp": true,
      "notes": "Direct VIP hotline"
    },
    {
      "phone_number": "+94 11 200 3000",
      "type": "Work",
      "is_primary": false,
      "is_whatsapp": false,
      "notes": "HQ Reception"
    }
  ]
}
```

#### Response Structure (`201 Created`)
```json
{
  "data": {
    "id": 2,
    "company_code": "CO000002",
    "company_name": "Nexus Global Innovations",
    "company_type_id": 1,
    "company_type": {
      "id": 1,
      "name": "Prospect",
      "status": true
    },
    "email": "contact@nexusglobal.io",
    "industry": "Software Engineering",
    "company_size_id": 2,
    "company_size": {
      "id": 2,
      "name": "11–50",
      "status": true
    },
    "status": true,
    "company_description": "AI & Enterprise Cloud Development.",
    "website": "https://nexusglobal.io",
    "logo": null,
    "logo_url": null,
    "owner_name": "Alexander Vance",
    "owner_birthday": "1988-06-15",
    "address_line_1": "100 Innovation Way",
    "address_line_2": "Kollupitiya",
    "city": "Colombo",
    "state": "Western Province",
    "postal_code": "00300",
    "country": "Sri Lanka",
    "phone_numbers": [
      {
        "id": 2,
        "phone_number": "+94 77 123 4567",
        "type": "Mobile",
        "is_primary": true,
        "is_whatsapp": true,
        "notes": "Direct VIP hotline"
      },
      {
        "id": 3,
        "phone_number": "+94 11 200 3000",
        "type": "Work",
        "is_primary": false,
        "is_whatsapp": false,
        "notes": "HQ Reception"
      }
    ],
    "primary_phone_number": {
      "id": 2,
      "phone_number": "+94 77 123 4567",
      "type": "Mobile",
      "is_primary": true
    },
    "created_at": "2026-09-30T14:10:00.000000Z",
    "updated_at": "2026-09-30T14:10:00.000000Z"
  }
}
```

---

### `GET /api/v1/companies/{id}`
Retrieve detailed company record with contacts and relationships.

#### Response Structure (`200 OK`)
```json
{
  "data": {
    "id": 1,
    "company_code": "CO000001",
    "company_name": "Apex Global Logistics",
    "company_type_id": 2,
    "company_type": {
      "id": 2,
      "name": "Customer",
      "status": true
    },
    "email": "contact@apexlogistics.com",
    "industry": "Logistics & Supply Chain",
    "company_size_id": 3,
    "company_size": {
      "id": 3,
      "name": "51–200",
      "status": true
    },
    "status": true,
    "company_description": "Leading enterprise logistics & freight forwarding provider.",
    "website": "https://apexlogistics.com",
    "logo": null,
    "logo_url": null,
    "owner_name": "David Vance",
    "owner_birthday": "1982-05-14",
    "address_line_1": "45 Colombo Business Tower",
    "address_line_2": "Galle Road",
    "city": "Colombo",
    "state": "Western Province",
    "postal_code": "00300",
    "country": "Sri Lanka",
    "phone_numbers": [
      {
        "id": 1,
        "phone_number": "+94 11 234 5678",
        "type": "Work",
        "is_primary": true,
        "is_whatsapp": false
      }
    ],
    "contacts": [
      {
        "id": 1,
        "company_id": 1,
        "first_name": "Sarah",
        "last_name": "Connor",
        "full_name": "Sarah Connor",
        "designation": "Chief Operations Officer",
        "email": "sarah.c@apexlogistics.com",
        "phone": "+94 77 987 6543",
        "status": "Active"
      }
    ],
    "created_at": "2026-09-30T14:00:00.000000Z",
    "updated_at": "2026-09-30T14:00:00.000000Z"
  }
}
```

---

### `PUT /api/v1/companies/{id}`
Update company record.

#### Request Payload
```json
{
  "company_name": "Nexus Global Enterprises",
  "status": true,
  "industry": "Enterprise FinTech",
  "phone_numbers": [
    {
      "id": 2,
      "phone_number": "+94 77 123 4567",
      "type": "Mobile",
      "is_primary": true,
      "is_whatsapp": true
    }
  ]
}
```

#### Response Structure (`200 OK`)
```json
{
  "data": {
    "id": 2,
    "company_code": "CO000002",
    "company_name": "Nexus Global Enterprises",
    "status": true,
    "industry": "Enterprise FinTech",
    "updated_at": "2026-09-30T14:15:00.000000Z"
  }
}
```

---

### `DELETE /api/v1/companies/{id}`
Perform logical delete (`is_delete = 1`). Record is instantly removed from standard API queries.

#### Response Structure (`200 OK`)
```json
{
  "message": "Company removed successfully."
}
```

---

### `POST /api/v1/companies/{id}/restore`
Restore a logically deleted company.

#### Response Structure (`200 OK`)
```json
{
  "message": "Company restored successfully.",
  "data": {
    "id": 2,
    "company_code": "CO000002",
    "company_name": "Nexus Global Enterprises"
  }
}
```

---

## 3. Company Types & Company Sizes

### `GET /api/v1/company-types`
Exposes active company types (`status = 1`, `is_delete = 0`) to frontend dropdowns.

#### Response Structure (`200 OK`)
```json
{
  "data": [
    { "id": 5, "name": "Agency", "status": true },
    { "id": 2, "name": "Customer", "status": true },
    { "id": 7, "name": "Other", "status": true },
    { "id": 3, "name": "Partner", "status": true },
    { "id": 1, "name": "Prospect", "status": true },
    { "id": 6, "name": "Reseller", "status": true },
    { "id": 4, "name": "Vendor", "status": true }
  ]
}
```

---

### `GET /api/v1/company-sizes`
Exposes active company sizes (`status = 1`, `is_delete = 0`) to frontend dropdowns.

#### Response Structure (`200 OK`)
```json
{
  "data": [
    { "id": 1, "name": "1–10", "status": true },
    { "id": 2, "name": "11–50", "status": true },
    { "id": 3, "name": "51–200", "status": true },
    { "id": 4, "name": "201–500", "status": true },
    { "id": 5, "name": "501–1000", "status": true },
    { "id": 6, "name": "1000+", "status": true }
  ]
}
```

---

## 4. Contacts & Phone Numbers

### `GET /api/v1/contacts`
List contacts with searching, filtering, and pagination.

#### Query Parameters
- `company_id`: integer
- `status`: string (`Active`, `Inactive`)
- `search`: string (`company`, `first_name`, `last_name`, `email`, `phone`, `designation`, `website`, `address`)
- `sort_by`: `id`, `company`, `first_name`, `last_name`, `designation`, `email`, `status`, `created_at`
- `sort_dir`: `asc` | `desc`

#### Response Structure (`200 OK`)
```json
{
  "data": [
    {
      "id": 1,
      "company_id": 1,
      "company_name": "Apex Global Logistics",
      "first_name": "Sarah",
      "last_name": "Connor",
      "full_name": "Sarah Connor",
      "email": "sarah.c@apexlogistics.com",
      "phone": "+94 77 987 6543",
      "designation": "Chief Operations Officer",
      "website": "https://apexlogistics.com",
      "address": "45 Colombo Business Tower",
      "birthday": "1988-06-15",
      "status": "Active",
      "phone_numbers": [
        {
          "id": 1,
          "phone_number": "+94 77 987 6543",
          "type": "Mobile",
          "is_primary": true,
          "is_whatsapp": true
        }
      ],
      "primary_phone_number": {
        "id": 1,
        "phone_number": "+94 77 987 6543",
        "type": "Mobile",
        "is_primary": true
      },
      "created_at": "2026-09-30T14:00:00.000000Z",
      "updated_at": "2026-09-30T14:00:00.000000Z"
    }
  ],
  "meta": {
    "current_page": 1,
    "last_page": 1,
    "per_page": 15,
    "total": 1
  }
}
```

---

### `POST /api/v1/contacts`
Create a new contact.

#### Request Payload
```json
{
  "company_id": 1,
  "first_name": "Sarah",
  "last_name": "Connor",
  "designation": "Chief Operations Officer",
  "email": "sarah.c@apexlogistics.com",
  "phone": "+94 77 987 6543",
  "website": "https://apexlogistics.com",
  "address": "45 Colombo Business Tower",
  "birthday": "1988-06-15",
  "status": "Active",
  "phone_numbers": [
    {
      "phone_number": "+94 77 987 6543",
      "type": "Mobile",
      "is_primary": true,
      "is_whatsapp": true,
      "notes": "Direct VIP mobile"
    }
  ]
}
```

#### Response Structure (`201 Created`)
```json
{
  "data": {
    "id": 1,
    "company_id": 1,
    "company_name": "Apex Global Logistics",
    "first_name": "Sarah",
    "last_name": "Connor",
    "full_name": "Sarah Connor",
    "email": "sarah.c@apexlogistics.com",
    "phone": "+94 77 987 6543",
    "designation": "Chief Operations Officer",
    "website": "https://apexlogistics.com",
    "address": "45 Colombo Business Tower",
    "birthday": "1988-06-15",
    "status": "Active",
    "phone_numbers": [
      {
        "id": 1,
        "phone_number": "+94 77 987 6543",
        "type": "Mobile",
        "is_primary": true,
        "is_whatsapp": true
      }
    ],
    "created_at": "2026-09-30T14:00:00.000000Z",
    "updated_at": "2026-09-30T14:00:00.000000Z"
  }
}
```

---

### `GET /api/v1/contacts/{id}`
Retrieve a single contact with full details, company information, and all associated projects.

#### Response Structure (`200 OK`)
```json
{
  "data": {
    "id": 1,
    "company_id": 1,
    "company_name": "Apex Global Logistics",
    "first_name": "Sarah",
    "last_name": "Connor",
    "full_name": "Sarah Connor",
    "email": "sarah.c@apexlogistics.com",
    "phone": "+94 77 987 6543",
    "designation": "Chief Operations Officer",
    "website": "https://apexlogistics.com",
    "address": "45 Colombo Business Tower",
    "birthday": "1988-06-15",
    "status": "Active",
    "phone_numbers": [
      {
        "id": 1,
        "phone_number": "+94 77 987 6543",
        "type": "Mobile",
        "is_primary": true,
        "is_whatsapp": true
      }
    ],
    "primary_phone_number": {
      "id": 1,
      "phone_number": "+94 77 987 6543",
      "type": "Mobile",
      "is_primary": true
    },
    "company": {
      "id": 1,
      "company_code": "CO000001",
      "company_name": "Apex Global Logistics",
      "company_type_id": 2,
      "company_type": {
        "id": 2,
        "name": "Customer",
        "status": true
      },
      "email": "contact@apexlogistics.com",
      "industry": "Logistics & Supply Chain",
      "company_size_id": 3,
      "company_size": {
        "id": 3,
        "name": "51–200",
        "status": true
      },
      "status": true,
      "website": "https://apexlogistics.com",
      "city": "Colombo",
      "state": "Western Province",
      "country": "Sri Lanka"
    },
    "projects": [
      {
        "id": 1,
        "project_code": "PRJ-2026-001",
        "project_title": "Enterprise Cloud Architecture",
        "status": "In Progress",
        "stage": "Development",
        "budget": "2500000.00",
        "quoted_amount": "2750000.00",
        "start_date": "2026-04-01",
        "expected_end_date": "2026-08-31",
        "created_at": "2026-09-30T14:00:00.000000Z"
      }
    ],
    "projects_count": 1,
    "created_at": "2026-09-30T14:00:00.000000Z",
    "updated_at": "2026-09-30T14:00:00.000000Z"
  }
}
```

---

### `GET /api/v1/contacts/{id}/projects`
Get project history and statistics for this contact.

#### Response Structure (`200 OK`)
```json
{
  "contact_id": 1,
  "company": "Apex Global Logistics",
  "full_name": "Sarah Connor",
  "projects_count": 1,
  "projects": [
    {
      "id": 1,
      "project_code": "PRJ-2026-001",
      "project_title": "Enterprise Cloud Architecture",
      "status": "In Progress",
      "stage": "Development",
      "budget": "2500000.00",
      "quoted_amount": "2750000.00",
      "start_date": "2026-04-01",
      "expected_end_date": "2026-08-31",
      "created_at": "2026-09-30T14:00:00.000000Z"
    }
  ]
}
```

---

## 5. Leads & Pipelines

### `GET /api/v1/leads/kanban`
Retrieve leads structured by pipeline stages.

#### Response Structure (`200 OK`)
```json
{
  "stages": [
    {
      "id": 1,
      "name": "New Lead",
      "slug": "new",
      "color": "#3B82F6",
      "leads": [
        {
          "id": 1,
          "lead_code": "LEAD-2026-001",
          "lead_title": "Enterprise ERP Platform",
          "company_id": 1,
          "estimated_value": "4500000.00",
          "priority": "High",
          "assigned_users": [
            { "id": 1, "name": "Alex Morgan" }
          ]
        }
      ]
    }
  ]
}
```

---

### `POST /api/v1/leads`
Create a new lead.

#### Request Payload
```json
{
  "lead_title": "Enterprise Cloud Migration",
  "customer_id": 1,
  "contact_id": 1,
  "lead_stage_id": 1,
  "lead_source_id": 2,
  "estimated_value": 3500000,
  "priority": "High",
  "assigned_user_ids": [1]
}
```

#### Response Structure (`201 Created`)
```json
{
  "data": {
    "id": 2,
    "lead_code": "LEAD-2026-002",
    "lead_title": "Enterprise Cloud Migration",
    "estimated_value": "3500000.00",
    "priority": "High",
    "stage": {
      "id": 1,
      "name": "New Lead"
    }
  }
}
```

---

### `POST /api/v1/leads/{id}/stage`
Update a lead's stage (Kanban drag-and-drop).

#### Request Payload
```json
{
  "lead_stage_id": 2
}
```

#### Response Structure (`200 OK`)
```json
{
  "message": "Lead stage updated successfully.",
  "data": {
    "id": 2,
    "lead_stage_id": 2
  }
}
```

---

## 6. Projects & Stages

### `GET /api/v1/projects`
List projects with filters and stage summaries.

#### Response Structure (`200 OK`)
```json
{
  "data": [
    {
      "id": 1,
      "project_code": "PRJ-2026-001",
      "project_title": "Custom Enterprise ERP Platform",
      "customer_id": 1,
      "contact_id": 1,
      "status": "In Progress",
      "stage": {
        "id": 2,
        "name": "In Progress",
        "slug": "in-progress"
      },
      "budget": "4500000.00",
      "quoted_amount": "4950000.00",
      "total_paid": "1500000.00",
      "outstanding_balance": "3450000.00",
      "start_date": "2026-04-01",
      "expected_end_date": "2026-08-31",
      "tasks_count": 8,
      "completed_tasks_count": 3
    }
  ]
}
```

---

### `POST /api/v1/projects`
Create a new project.

#### Request Payload
```json
{
  "project_title": "Fleet Management Mobile App",
  "customer_id": 1,
  "contact_id": 1,
  "project_stage_id": 1,
  "budget": 2000000,
  "quoted_amount": 2200000,
  "start_date": "2026-10-01",
  "expected_end_date": "2026-12-31"
}
```

#### Response Structure (`201 Created`)
```json
{
  "data": {
    "id": 2,
    "project_code": "PRJ-2026-002",
    "project_title": "Fleet Management Mobile App",
    "budget": "2000000.00",
    "quoted_amount": "2200000.00"
  }
}
```

---

## 7. Tasks, Subtasks & Timers

### `POST /api/v1/tasks/{task}/timer/start`
Start active timer for a task.

#### Response Structure (`200 OK`)
```json
{
  "message": "Timer started successfully.",
  "time_entry": {
    "id": 1,
    "task_id": 1,
    "user_id": 1,
    "started_at": "2026-09-30T14:30:00.000000Z",
    "is_running": true
  }
}
```

---

### `POST /api/v1/tasks/{task}/timer/stop`
Stop and record duration for a task timer.

#### Response Structure (`200 OK`)
```json
{
  "message": "Timer stopped successfully.",
  "time_entry": {
    "id": 1,
    "task_id": 1,
    "duration_minutes": 45,
    "ended_at": "2026-09-30T15:15:00.000000Z"
  }
}
```

---

### `POST /api/v1/subtasks/{id}/toggle`
Toggle completion state of a subtask.

#### Response Structure (`200 OK`)
```json
{
  "message": "Subtask toggled successfully.",
  "data": {
    "id": 1,
    "title": "Design Database ERD",
    "is_completed": true
  }
}
```

---

## 8. Quotations & Templates

### `POST /api/v1/quotations`
Create quotation with dynamic line items and auto-calculated totals.

#### Request Payload
```json
{
  "customer_id": 1,
  "project_id": 1,
  "title": "ERP Phase 1 Quotation",
  "currency": "LKR",
  "tax_rate": 8.0,
  "discount_amount": 50000,
  "items": [
    {
      "item_name": "Architecture & Cloud Design",
      "description": "System specification & database design",
      "quantity": 1,
      "unit_price": 500000
    },
    {
      "item_name": "API & Core Backend Engine",
      "description": "Laravel 11 REST API Implementation",
      "quantity": 1,
      "unit_price": 1200000
    }
  ]
}
```

#### Response Structure (`201 Created`)
```json
{
  "data": {
    "id": 1,
    "quotation_number": "QUO-2026-0001",
    "subtotal": "1700000.00",
    "discount_amount": "50000.00",
    "tax_amount": "132000.00",
    "total_amount": "1782000.00",
    "status": "Draft"
  }
}
```

---

### `POST /api/v1/quotations/{id}/approve`
Approve quotation and update project/customer status.

#### Response Structure (`200 OK`)
```json
{
  "message": "Quotation approved successfully.",
  "data": {
    "id": 1,
    "status": "Approved"
  }
}
```

---

## 9. Payments & Expenses

### `POST /api/v1/payments`
Record incoming customer payment.

#### Request Payload
```json
{
  "customer_id": 1,
  "project_id": 1,
  "amount": 500000,
  "payment_method": "Bank Transfer",
  "payment_date": "2026-09-30",
  "reference_number": "TXN-984214",
  "notes": "Milestone 1 Advance Payment"
}
```

#### Response Structure (`201 Created`)
```json
{
  "data": {
    "id": 1,
    "payment_code": "PAY-2026-0001",
    "amount": "500000.00",
    "payment_method": "Bank Transfer",
    "status": "Completed"
  }
}
```

---

### `GET /api/v1/projects/{projectId}/ledger`
Get financial ledger balance, total invoiced, total paid, and balance due for a project.

#### Response Structure (`200 OK`)
```json
{
  "project_id": 1,
  "project_code": "PRJ-2026-001",
  "total_budget": "4500000.00",
  "total_paid": "1500000.00",
  "outstanding_balance": "3000000.00",
  "payments": [
    {
      "id": 1,
      "amount": "500000.00",
      "payment_date": "2026-09-30",
      "reference_number": "TXN-984214"
    }
  ]
}
```

---

## 10. Hosting & Infrastructure

### `GET /api/v1/hosting-domains`
List managed domain names and SSL/expiration dates.

#### Response Structure (`200 OK`)
```json
{
  "data": [
    {
      "id": 1,
      "domain_name": "apexlogistics.com",
      "customer_id": 1,
      "registrar": "Cloudflare",
      "expires_at": "2027-05-14",
      "ssl_status": "Active",
      "auto_renew": true
    }
  ]
}
```

---

## 11. Calendar & Reminders

### `POST /api/v1/calendar-events`
Create a scheduled meeting / calendar event.

#### Request Payload
```json
{
  "title": "Quarterly Strategy Review with Apex Logistics",
  "start_time": "2026-10-05T10:00:00",
  "end_time": "2026-10-05T11:30:00",
  "location": "Boardroom / Google Meet",
  "customer_id": 1,
  "assigned_user_ids": [1]
}
```

#### Response Structure (`201 Created`)
```json
{
  "data": {
    "id": 1,
    "title": "Quarterly Strategy Review with Apex Logistics",
    "start_time": "2026-10-05T10:00:00.000000Z",
    "end_time": "2026-10-05T11:30:00.000000Z"
  }
}
```

---

## 12. Employee Management

### `GET /api/v1/employees`
List employees with department and designation relations.

#### Response Structure (`200 OK`)
```json
{
  "data": [
    {
      "id": 1,
      "employee_code": "EMP-001",
      "first_name": "David",
      "last_name": "Miller",
      "email": "david.m@ooralabz.com",
      "department": { "id": 1, "name": "Engineering" },
      "designation": { "id": 1, "name": "Senior Full Stack Engineer" },
      "status": "Active"
    }
  ]
}
```

---

## 13. Notifications & Activity Logs

### `GET /api/v1/notifications`
Get unread & recent notifications.

#### Response Structure (`200 OK`)
```json
{
  "unread_count": 2,
  "data": [
    {
      "id": 1,
      "title": "New Company Registered",
      "message": "Nexus Global Innovations was created.",
      "is_read": false,
      "created_at": "2026-09-30T14:10:00.000000Z"
    }
  ]
}
```

---

## 14. Dashboard & Reports

### `GET /api/v1/dashboard`
Get real-time operational dashboard stats.

#### Response Structure (`200 OK`)
```json
{
  "stats": {
    "total_companies": 12,
    "active_leads": 8,
    "active_projects": 5,
    "total_monthly_revenue": "8450000.00",
    "pending_quotations_count": 3
  }
}
```

---

### `GET /api/v1/reports/sales`
Get sales conversions and quarterly volume.

#### Response Structure (`200 OK`)
```json
{
  "total_revenue": "18450000.00",
  "pipeline_conversion_rate": "34.5%",
  "closed_deals_count": 14
}
```

---

## Summary of All Model Endpoints

| Model / Domain | Endpoint | Methods |
|---|---|---|
| **Auth** | `/api/v1/auth/login`, `/me`, `/logout`, `/profile` | `POST`, `GET`, `PUT` |
| **Company Types** | `/api/v1/company-types` | `GET`, `POST`, `PUT`, `DELETE` |
| **Company Sizes** | `/api/v1/company-sizes` | `GET`, `POST`, `PUT`, `DELETE` |
| **Companies** | `/api/v1/companies`, `/next-code`, `/lookup`, `/{id}/restore` | `GET`, `POST`, `PUT`, `DELETE` |
| **Contacts** | `/api/v1/contacts`, `/{id}/restore`, `/{id}/projects` | `GET`, `POST`, `PUT`, `DELETE` |
| **Phone Numbers** | `/api/v1/contact-phone-numbers` | `GET`, `POST`, `PUT`, `DELETE` |
| **Leads** | `/api/v1/leads`, `/kanban`, `/{id}/stage`, `/{id}/users` | `GET`, `POST`, `PUT`, `DELETE` |
| **Projects** | `/api/v1/projects`, `/kanban`, `/{id}/stage`, `/stages` | `GET`, `POST`, `PUT`, `DELETE` |
| **Tasks & Timers** | `/api/v1/tasks`, `/kanban`, `/timer/start`, `/timer/stop` | `GET`, `POST`, `PUT`, `DELETE` |
| **Quotations** | `/api/v1/quotations`, `/{id}/approve`, `/{id}/reject` | `GET`, `POST`, `PUT`, `DELETE` |
| **Payments** | `/api/v1/payments`, `/projects/{id}/ledger` | `GET`, `POST`, `PUT`, `DELETE` |
| **Expenses** | `/api/v1/expenses`, `/{id}/approve`, `/{id}/reject` | `GET`, `POST`, `PUT`, `DELETE` |
| **Hosting** | `/api/v1/hosting-domains`, `/hosting-servers`, `/hosting-services` | `GET`, `POST`, `PUT`, `DELETE` |
| **Calendar** | `/api/v1/calendar-events`, `/reminders` | `GET`, `POST`, `PUT`, `DELETE` |
| **Employees** | `/api/v1/employees`, `/departments`, `/designations`, `/leave-requests` | `GET`, `POST`, `PUT`, `DELETE` |
| **Communication** | `/api/v1/email-templates`, `/whatsapp-templates`, `/communication-logs` | `GET`, `POST`, `PUT` |
| **Dashboard** | `/api/v1/dashboard`, `/sales-pipeline`, `/today-tasks` | `GET` |
| **Reports** | `/api/v1/reports/sales`, `/reports/projects`, `/reports/financials` | `GET` |
