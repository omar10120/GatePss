# Majis Gate Pass System - Production-Ready Application

A comprehensive Electronic Gate Pass System for Majis Industrial Services at Sohar Port, built with Next.js, TypeScript, Prisma, and MySQL.

## 🎯 Overview


## 📋 Tech Stack

### Frontend
- **Next.js 14** (App Router)
- **React 18** (Functional Components)
- **TypeScript**
- **Tailwind CSS**
- **Recharts** (Data visualization)
- **React Hook Form** (Form management)

### Backend
- **Next.js API Routes**
- **Prisma ORM**
- **MySQL Database**
- **JWT Authentication**
- **bcrypt** (Password hashing)
- **Nodemailer** (Email service)
- **Axios** (HTTP client)

## 🚀 Getting Started

### Prerequisites

- Node.js 22.11.0 LTS or later (Recommended)
- MySQL 8.4 LTS (or MySQL 8.0+) installed and running
- SMTP email account (Office365 configured)

### Installation

1. **Clone or navigate to the project directory**

```bash
cd "d:/My Cources/Traditional Code with AI/Gate Pss"
```

2. **Install dependencies**

```bash
npm install
```

3. **Configure environment variables**

Copy `.env.example` to `.env` and update with your values:

```bash
cp .env.example .env
```

# SMTP Configuration (Office365)
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USER=gatepass@miscoman.com
SMTP_PASSWORD=your-password-here
EMAIL_FROM=gatepass@miscoman.com
ADMIN_EMAIL_GROUP="admin@majis.com,security@majis.com"

# Application URLs
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_API_URL="http://localhost:3000/api"

# File Upload
MAX_FILE_SIZE=1048576  # 1MB
UPLOAD_DIR="./public/uploads"
```

4. **Create MySQL database**

```sql
CREATE DATABASE gate_pass_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

5. **Run database migrations**

```bash
npm run db:generate
npm run db:migrate
```

6. **Seed the database**

```bash
npm run db:seed
```

This creates:
- **Super Admin**: admin@majis.com / Admin@123
- **Sub Admin**: subadmin@majis.com / Admin@123
- All permissions

7. **Start the development server**

```bash
npm run dev
```

The application will be available at: http://localhost:3000

### Running with Docker

You can also run the entire system using Docker and Docker Compose. This is the recommended way for production-like environments.

1. **Start the containers**

```bash
docker compose up -d
```

2. **Run database migrations and seed**

```bash
docker compose exec app npx prisma@6.0.1 migrate deploy
docker compose exec app npm run db:seed
```

The application will be available at: http://localhost:3000
The MySQL database is accessible on the host at `localhost:3007`.

## 📁 Project Structure

```
gate-pass-system/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.js                # Database seeding
├── public/
│   └── uploads/               # File uploads directory
├── src/
│   ├── app/
│   │   ├── api/               # API routes
│   │   │   ├── auth/          # Authentication endpoints
│   │   │   ├── requests/      # Public request submission
│   │   │   └── admin/         # Admin endpoints
│   │   ├── gate-pass/         # Public form page
│   │   ├── admin/             # Admin portal pages
│   │   ├── globals.css        # Global styles
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Homepage
│   ├── components/            # Reusable React components
│   ├── lib/                   # Core libraries
│   │   ├── prisma.ts          # Database client
│   │   ├── auth.ts            # Authentication utilities
│   │   ├── email.ts           # Email service
│   │   └── sohar-port-api.ts  # External API integration
│   ├── middleware/            # API middleware
│   │   └── api.ts             # Auth & permission checks
│   ├── types/                 # TypeScript type definitions
│   └── utils/                 # Utility functions
│       └── helpers.ts         # Common helpers
├── .env                       # Environment variables
├── .env.example               # Environment template
├── next.config.js             # Next.js configuration
├── tailwind.config.js         # Tailwind CSS configuration
├── tsconfig.json              # TypeScript configuration
└── package.json               # Dependencies and scripts
```

## 🔌 API Endpoints

### Authentication

- `POST /api/auth/login` - Admin login
- `POST /api/auth/logout` - Admin logout

### Public Endpoints

- `POST /api/requests` - Submit gate pass request (multipart/form-data)

### Admin Endpoints (Require Authentication)

#### Request Management
- `GET /api/admin/requests` - List all requests (with filters)
- `GET /api/admin/requests/:id` - Get request details
- `PUT /api/admin/requests/:id` - Update request (pending only)
- `POST /api/admin/requests/:id/approve` - Approve request
- `POST /api/admin/requests/:id/reject` - Reject request

#### Dashboard
- `GET /api/admin/dashboard/summary` - Get statistics
- `GET /api/admin/dashboard/charts` - Get chart data

#### User Management (Super Admin Only)
- `GET /api/admin/users` - List all users
- `POST /api/admin/users` - Create new user
- `PUT /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Deactivate user

#### Permissions (Super Admin Only)
- `GET /api/admin/permissions` - List all permissions

#### Activity Logs (Super Admin Only)
- `GET /api/admin/logs` - View activity logs (with filters)

#### Notifications (Authenticated Users)
- `GET /api/admin/notifications` - List notifications (with filters: isRead, actionType, dateFilter, search, pagination)
- `GET /api/admin/notifications/:id` - Get notification details
- `PUT /api/admin/notifications/:id/read` - Mark notification as read
- `PUT /api/admin/notifications/read-all` - Mark all notifications as read (optional: filter by actionType)
- `DELETE /api/admin/notifications/:id` - Delete notification
- `GET /api/admin/notifications/unread-count` - Get unread notification count (optional: filter by actionType)

## 🗄️ Database Schema

### Tables

1. **users** - Admin users with roles
2. **permissions** - Available permissions
3. **user_permissions** - User-permission assignments
4. **requests** - Gate pass requests
5. **uploads** - File attachments
6. **activity_logs** - Audit trail

### Key Relationships

- Users have many Permissions (many-to-many)
- Requests belong to User (created_by, approved_by)
- Requests have many Uploads
- Activity Logs belong to User and Request

## 👥 User Roles & Permissions

### Super Admin
- Full system access
- Manage users and permissions
- View activity logs
- Manage all requests
- View dashboard

### Sub Admin
- Permissions assigned by Super Admin
- Typically: VIEW_DASHBOARD, MANAGE_REQUESTS
- Cannot manage users or view logs

### Available Permissions

1. `VIEW_DASHBOARD` - View dashboard and statistics
2. `MANAGE_REQUESTS` - Create, edit, approve, reject requests
3. `MANAGE_USERS` - Create and manage admin users
4. `VIEW_LOGS` - View activity logs and audit trail

## 📧 Email Templates

The system sends automated emails for:

1. **Request Confirmation** - When visitor submits request
2. **Admin Notification** - When new request is submitted
3. **Request Approval** - When request is approved
4. **Request Rejection** - When request is rejected (with reason)

All emails use professional HTML templates with branding.

## 🔗 Sohar Port API Integration

### Mock Mode (Development)

Set `USE_MOCK_SOHAR_API=true` in `.env` to use the mock integration:
- Simulates API calls with 1-second delay
- 90% success rate
- Generates fake reference IDs and QR code URLs
- Logs all interactions

### Production Mode

Set `USE_MOCK_SOHAR_API=false` and configure:
- `SOHAR_PORT_API_URL` - Actual API endpoint
- `SOHAR_PORT_API_KEY` - Your API key

The system will:
1. Send request data to Sohar Port API
2. Handle success/failure responses
3. Store external reference and status
4. Log all API interactions
5. Only approve requests if API call succeeds

## 🎨 Frontend Pages

### Public Pages

1. **Homepage** (`/`)
   - Bilingual (EN/AR)
   - Feature showcase
   - Call-to-action buttons

2. **Gate Beneficiary of the permitm** (`/gate-pass`)
   - Multi-field form
   - File upload
   - Real-time validation
   - Success/error handling

### Admin Pages

1. **Login** (`/admin/login`)
   - Email/password authentication
   - Error handling

2. **Dashboard** (`/admin/dashboard`)
   - Statistics cards
   - Line chart (approved vs rejected)
   - Pie chart (status distribution)
   - Recent requests

3. **Requests List** (`/admin/requests`)
   - Filterable table
   - Search functionality
   - Pagination
   - Quick actions

4. **Request Details** (`/admin/requests/[id]`)
   - Full request information
   - Edit capability (pending only)
   - Approve/Reject actions
   - Integration status
   - Activity history

5. **User Management** (`/admin/users`) - Super Admin only
   - User list
   - Create/Edit users
   - Assign permissions
   - Activate/Deactivate

6. **Activity Logs** (`/admin/logs`) - Super Admin only
   - Filterable log table
   - Search functionality
   - Date range filtering

## 🔒 Security Features

- ✅ Password hashing with bcrypt
- ✅ JWT-based authentication
- ✅ Role-based access control (RBAC)
- ✅ Permission-based authorization
- ✅ Input validation and sanitization
- ✅ File upload validation (type, size)
- ✅ SQL injection protection (Prisma ORM)
- ✅ XSS protection
- ✅ CORS configuration
- ✅ Environment variable protection

## 📱 Responsive Design

- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Touch-friendly UI elements
- Optimized for tablets and phones

## 🌍 Internationalization (i18n)

- English (LTR)
- Arabic (RTL)
- Dynamic locale switching
- RTL-aware layouts and components
- Localized date/time formatting

## 🧪 Testing

### Manual Testing Checklist

**Public Portal:**
- [ ] Submit visitor request
- [ ] Upload passport image
- [ ] Receive confirmation email
- [ ] Verify admin notification email

**Admin Portal:**
- [ ] Login as Super Admin
- [ ] View dashboard statistics
- [ ] Filter and search requests
- [ ] Approve request (check Sohar Port integration)
- [ ] Reject request with reason
- [ ] Create Sub Admin user
- [ ] Assign permissions
- [ ] View activity logs

**Email Testing:**
- [ ] Configure SMTP settings
- [ ] Test all email templates
- [ ] Verify email delivery

## 📊 Database Scripts

```bash
# Generate Prisma Client
npm run db:generate

# Create migration
npm run db:migrate

# Open Prisma Studio (Database GUI)
npm run db:studio

# Seed database
npm run db:seed
```

## 🚀 Deployment

### Build for Production

```bash
npm run build
npm start
```

### Environment Variables for Production

Update `.env` with production values:
- Use strong JWT secret
- Configure production database
- Set up production SMTP
- Configure Sohar Port API credentials
- Set `USE_MOCK_SOHAR_API=false`

### Deployment Platforms

This application can be deployed to:
- **Vercel** (Recommended for Next.js)
- **AWS** (EC2, ECS, or Amplify)
- **DigitalOcean**
- **Heroku**
- **Self-hosted** (VPS with Node.js)

**Note:** Ensure MySQL database is accessible from your deployment platform.

## 📝 Scripts

```json
{
  "dev": "next dev",                    // Start development server
  "build": "next build",                // Build for production
  "start": "next start",                // Start production server
  "lint": "next lint",                  // Run ESLint
  "db:migrate": "prisma migrate dev",   // Run database migrations
  "db:generate": "prisma generate",     // Generate Prisma Client
  "db:studio": "prisma studio",         // Open database GUI
  "db:seed": "node prisma/seed.js"      // Seed database
}
```

## 🐛 Troubleshooting

### Database Connection Issues

```bash
# Test MySQL connection
mysql -u root -p

# Check if database exists
SHOW DATABASES;

# Verify DATABASE_URL in .env
```

### Email Not Sending

- For Office365, ensure the account has SMTP enabled
- Verify the password is correct (may require app-specific password if MFA is enabled)
- Check SMTP settings: smtp.office365.com, port 587, TLS encryption
- Ensure firewall allows outbound connections on port 587

### File Upload Issues

- Ensure `public/uploads` directory exists and is writable
- Check `MAX_FILE_SIZE` in `.env`
- Verify file type restrictions

### Prisma Issues

```bash
# Reset database (WARNING: Deletes all data)
npx prisma migrate reset

# Format schema
npx prisma format
```

## 📞 Support

For issues or questions:
1. Check this README
2. Review error logs in console
3. Check Prisma Studio for database state
4. Review activity logs in admin portal

## 📄 License

Proprietary - Majis Industrial Services © 2024

## 🎉 Credits

Built with modern web technologies:
- Next.js
- React
- TypeScript
- Prisma
- Tailwind CSS
- MySQL

---

**Version:** 1.0.0  
**Last Updated:** November 2024  
**Status:** Production Ready ✅
