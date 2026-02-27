Now I have a comprehensive understanding of the entire Gate Pass System. Let me provide you with a detailed summary of all features:

---

## Comprehensive Gate Pass System Feature Summary

### 1. ALL API ENDPOINTS

#### Public API Endpoints (No Authentication Required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/requests` | Submit new gate pass request |
| GET | `/api/requests/check?requestNumber=` | Check request status by number |
| POST | `/api/auth/login` | Admin login (returns OTP) |
| POST | `/api/auth/send-otp` | Send OTP for login verification |
| POST | `/api/auth/verify-otp` | Verify OTP and get JWT token |
| POST | `/api/auth/logout` | Logout admin |
| GET | `/api/auth/me` | Get current authenticated user |
| GET | `/api/pass-types` | Get available pass types |
| GET | `/api/faqs` | Get FAQ list |
| POST | `/api/contact` | Submit contact form |
| GET | `/api/uploads/**` | Serve uploaded files |
| GET | `/api/settings/[key]` | Get settings by key |

#### Admin API Endpoints (Authentication + Permission Required)
| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| GET | `/api/admin/dashboard/summary` | VIEW_DASHBOARD | Get dashboard stats |
| GET | `/api/admin/dashboard/charts` | VIEW_DASHBOARD | Get chart data |
| GET | `/api/admin/requests` | MANAGE_REQUESTS | List all requests with filters |
| GET | `/api/admin/requests/[id]` | MANAGE_REQUESTS | Get request details |
| PUT | `/api/admin/requests/[id]` | MANAGE_REQUESTS | Update request |
| POST | `/api/admin/requests/[id]/approve` | MANAGE_REQUESTS | Approve request |
| POST | `/api/admin/requests/[id]/reject` | MANAGE_REQUESTS | Reject request |
| POST | `/api/admin/requests/[id]/check-sohar-status` | MANAGE_REQUESTS | Check Sohar Port status |
| GET | `/api/admin/users` | MANAGE_USERS | List all users |
| POST | `/api/admin/users` | MANAGE_USERS | Create new user |
| GET | `/api/admin/users/[id]` | MANAGE_USERS | Get user details |
| PUT | `/api/admin/users/[id]` | MANAGE_USERS | Update user |
| DELETE | `/api/admin/users/[id]` | MANAGE_USERS | Delete user |
| GET | `/api/admin/permissions` | MANAGE_USERS | Get all permissions |
| GET | `/api/admin/logs` | VIEW_LOGS | Get activity logs |
| GET | `/api/admin/notifications` | - | Get notifications |
| POST | `/api/admin/notifications/read-all` | - | Mark all as read |
| GET | `/api/admin/notifications/unread-count` | - | Get unread count |
| POST | `/api/admin/notifications/[id]/read` | - | Mark notification as read |
| GET | `/api/admin/settings` | MANAGE_SETTINGS | Get all settings |
| PUT | `/api/admin/settings` | MANAGE_SETTINGS | Update settings |
| GET | `/api/admin/pass-types` | MANAGE_SETTINGS | Get pass types |
| POST | `/api/admin/pass-types` | MANAGE_SETTINGS | Create pass type |
| PUT | `/api/admin/pass-types/[id]` | MANAGE_SETTINGS | Update pass type |
| DELETE | `/api/admin/pass-types/[id]` | MANAGE_SETTINGS | Delete pass type |
| GET | `/api/admin/faqs` | MANAGE_SETTINGS | Get FAQs |
| POST | `/api/admin/faqs` | MANAGE_SETTINGS | Create FAQ |
| PUT | `/api/admin/faqs/[id]` | MANAGE_SETTINGS | Update FAQ |
| DELETE | `/api/admin/faqs/[id]` | MANAGE_SETTINGS | Delete FAQ |

---

### 2. ALL FRONTEND PAGES/ROUTES

#### Public Pages (No Login Required)
| Route | Description |
|-------|-------------|
| `/` | Home page (Hero, How it Works, Services, Track Section) |
| `/[locale]/` | Home page with localization |
| `/[locale]/about` | About page |
| `/[locale]/how-it-works` | How it works page |
| `/[locale]/faq` | FAQ page |
| `/[locale]/contact-us` | Contact page |
| `/[locale]/terms-and-conditions` | Terms and conditions |
| `/[locale]/privacy-policy` | Privacy policy |
| `/[locale]/RequestPermit` | Gate pass request form (public) |
| `/[locale]/ApplicationNumber` | Track application status |
| `/[locale]/admin/login` | Admin login page |

#### Admin Pages (Authentication Required)
| Route | Description |
|-------|-------------|
| `/[locale]/admin/dashboard` | Admin dashboard with KPIs |
| `/[locale]/admin/requests` | Request management list |
| `/[locale]/admin/requests/[id]` | Request details with edit/approve/reject |
| `/[locale]/admin/users` | User management |
| `/[locale]/admin/users/add` | Add new user |
| `/[locale]/admin/users/[id]` | Edit user |
| `/[locale]/admin/permits` | Permits management |
| `/[locale]/admin/activity` | Activity logs |
| `/[locale]/admin/notifications` | Notifications list |
| `/[locale]/admin/settings` | System settings |
| `/[locale]/admin/settings/components/GeneralSettings` | General settings tab |
| `/[locale]/admin/settings/components/PassTypes` | Pass types management |
| `/[locale]/admin/settings/components/FAQ` | FAQ management |
| `/[locale]/admin/unauthorized` | Unauthorized access page |

---

### 3. DATABASE MODELS/SCHEMA

#### Core Models (from prisma/schema.prisma)

| Model | Fields | Description |
|-------|--------|-------------|
| **User** | id, name, email, phoneNumber, passwordHash, role, isActive, otpCode, otpExpiresAt, createdAt, updatedAt | Admin users |
| **Request** | id, requestNumber, applicantNameEn, applicantNameAr, applicantEmail, applicantPhone, gender, profession, otherProfessions, photoPath, passportIdNumber, passportIdImagePath, nationality, identification, organization, validFrom, validTo, purposeOfVisit, dateOfVisit, requestType, status, rejectionReason, createdAt, updatedAt, approvedById, externalReference, lastIntegrationStatusCode, lastIntegrationStatusMessage, qrCodePdfUrl, passFor, passTypeId, visitduration, entityType, externalStatus | Gate pass requests |
| **Upload** | id, requestId, fileType, filePath, uploadedAt | File uploads (photos, documents) |
| **Permission** | id, key, description | RBAC permissions |
| **UserPermission** | id, userId, permissionId | User-permission mapping |
| **Notification** | id, userId, actionType, actionPerformed, actionPerformedAr, affectedEntityType, affectedEntityId, isRead, createdAt, updatedAt | Admin notifications |
| **ActivityLog** | id, timestamp, userId, actionType, actionPerformed, affectedEntityType, affectedEntityId, details | Audit trail |
| **pass_types** | id, name_en, name_ar, is_active, created_at, updated_at | Pass type definitions |
| **fqa** | id, question_en, question_ar, answer_en, answer_ar, created_at, updated_at | FAQ entries |
| **Setting** | id, key, value | System settings |

---

### 4. AUTHENTICATION FLOW

1. **Login Flow**:
   - POST `/api/auth/login` with email/password
   - Validates credentials, generates 4-digit OTP
   - Sends OTP via email (10-minute expiration)
   - Returns `requiresOTP: true`

2. **OTP Verification**:
   - POST `/api/auth/verify-otp` with email + OTP
   - Validates OTP matches and not expired
   - Generates JWT token (default: 7 days expiration)
   - Token contains: userId, email, role, permissions, permissionsDetails

3. **Token Structure**:
   ```json
   {
     "userId": number,
     "email": string,
     "role": "SUPER_ADMIN" | "SUB_ADMIN",
     "permissions": string[],
     "permissionsDetails": [{ id, key, description }]
   }
   ```

4. **Middleware Protection**:
   - `requireAuth()` - Validates JWT token and user is active
   - `requirePermission()` - Checks specific permission
   - `requireSuperAdmin()` - Super admin only

---

### 5. EMAIL NOTIFICATION TRIGGERS

| Trigger | Email Function | Recipients |
|---------|---------------|------------|
| Request submitted | `sendRequestConfirmationEmail()` | Applicant |
| New request submitted | `sendAdminNotificationEmail()` | Admin group |
| Request approved | `sendRequestApprovalEmail()` | Applicant |
| Request rejected | `sendRequestRejectionEmail()` | Applicant |
| OTP for login | `sendOTPEmail()` | Admin user |
| Contact form submission | `sendContactFormEmail()` | Admin group |

#### Email Configuration (SMTP):
- Host: `smtp.office365.com` (configurable)
- Port: 587 (configurable)
- From: `gatepass@miscoman.com` (configurable via `EMAIL_FROM`)

---

### 6. EXTERNAL INTEGRATIONS

#### Sohar Port API Integration
Located in: `src/lib/sohar-port/`

**Configuration** (environment variables):
- `SOHAR_PORT_BASE_URL` - API base URL
- `SOHAR_PORT_USERNAME` - Basic auth username
- `SOHAR_PORT_PASSWORD` - Basic auth password
- `SOHAR_PORT_API_KEY` - Alternative Bearer token
- `SOHAR_PORT_MOCK_MODE` - Enable mock mode for testing
- `SOHAR_PORT_TIMEOUT` - Request timeout (ms)
- `SOHAR_PORT_RETRY_ATTEMPTS` - Retry count

**Send Operations**:
- `createGatePass()` - Submit gate pass to Sohar Port

**Receive Operations**:
- `getGatePass()` - Get gate pass details by external reference
- `listGatePasses()` - List gate passes with filters

**Features**:
- Basic Auth / Bearer token authentication
- Proxy support
- Request/Response logging
- Retry logic with exponential backoff
- Mock mode for testing

---

### 7. USER ROLES AND PERMISSIONS

#### Roles:
| Role | Description |
|------|-------------|
| **SUPER_ADMIN** | Full system access, all permissions |
| **SUB_ADMIN** | Limited access based on assigned permissions |

#### Permissions:
| Key | Description |
|-----|-------------|
| `VIEW_DASHBOARD` | Access admin dashboard |
| `MANAGE_REQUESTS` | View, approve, reject requests |
| `MANAGE_PERMITS` | Manage permits |
| `MANAGE_USERS` | Create, edit, delete users |
| `VIEW_LOGS` | View activity logs |
| `MANAGE_SETTINGS` | Manage system settings, pass types, FAQs |

---

### 8. FILE UPLOAD FUNCTIONALITY

**Upload Endpoint**: `/api/uploads/[...path]`

**Supported File Types**:
- Images: JPG, JPEG, PNG
- Documents: PDF

**Max File Size**: 1MB (configurable via `MAX_FILE_SIZE`)

**Upload Process**:
1. Files submitted via FormData in request body
2. Server validates file type and size
3. Files saved to `public/uploads/passports/` (local) or as base64 (Vercel)
4. File paths stored in database (Upload model)
5. Files served via `/api/uploads/**` route

**Stored File Types**:
- `PHOTO` - Applicant photo
- `PASSPORT_ID_IMAGE` - Passport/ID image
- `OTHER_DOCUMENT_1` - Additional document 1
- `OTHER_DOCUMENT_2` - Additional document 2

---

### KEY TESTING AREAS

1. **Authentication**: Login, OTP, token expiration, permission checks
2. **Request Submission**: Form validation, file uploads, email triggers
3. **Admin Workflow**: Approval, rejection, editing requests
4. **Sohar Port Integration**: API calls, mock mode, error handling
5. **Notifications**: Creation, read/unread, counts
6. **File Management**: Upload, retrieval, validation
7. **User Management**: CRUD operations, permissions assignment
8. **Settings**: Pass types, FAQs, general settings
9. **Public Features**: Tracking, contact form, form validation
10. **i18n**: English and Arabic localization

---

This comprehensive codebase is a **Gate Pass Management System** for Majis Industrial Services, integrating with **Sohar Port** for external approval processing. The system supports both **Port** and **Freezone** entity types with various pass types and durations.