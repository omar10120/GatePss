# Technical Documentation

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [API Documentation](#api-documentation)
3. [Sohar Port Integration](#sohar-port-integration)

---

## Architecture Overview

### Directory Structure

```
src/
├── app/                          # Next.js app directory
│   ├── admin/                    # Admin portal routes
│   └── api/                      # Backend API routes
├── components/                   # Component library
│   ├── ui/                       # Reusable UI components
│   ├── layout/                   # Layout components
│   └── features/                 # Feature-specific components
├── hooks/                        # Custom React hooks
├── config/                       # Configuration files
├── lib/                          # External libraries & utilities
└── utils/                        # Helper functions
```

### Key Technologies
- **Frontend:** Next.js 15 (App Router), React 18, Tailwind CSS
- **Backend:** Next.js API Routes
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** JWT (JSON Web Tokens)
- **Email:** Nodemailer

---

## API Documentation

### Base URL
- Development: `http://localhost:3000/api`
- Production: `https://your-domain.com/api`

### Authentication
Most admin endpoints require a Bearer token:
`Authorization: Bearer <your-jwt-token>`

### Core Endpoints

#### Authentication
- `POST /auth/login` - Admin login
- `POST /auth/logout` - Admin logout

#### Gate Pass Requests
- `POST /requests` - Submit new request (Public)
- `GET /admin/requests` - List requests
- `GET /admin/requests/:id` - Get request details
- `POST /admin/requests/:id/approve` - Approve request
- `POST /admin/requests/:id/reject` - Reject request

#### Dashboard
- `GET /admin/dashboard/summary` - Key statistics
- `GET /admin/dashboard/charts` - Visualization data

---

## Component Library

### UI Components (`src/components/ui/`)
- **Button**: Flexible button with variants (primary, secondary, danger, etc.)
- **Card**: Container with Header, Title, and Content sub-components
- **Modal**: Dialog component with title and footer
- **Input/Select**: Form controls with error handling
- **Badge**: Status indicators
- **StatCard**: Dashboard metric display
- **LoadingSpinner**: Loading state indicators

### Layout Components (`src/components/layout/`)
- **AdminLayout**: Main wrapper with auth check, navigation, and sidebar
- **PageHeader**: Standardized header with breadcrumbs and actions
- **Navigation**: Sidebar/Top menu component
- **Container**: Responsive width wrapper

### Custom Hooks (`src/hooks/`)
- **useAuth**: Authentication state (user, login, logout)
- **usePermissions**: Permission checking (hasPermission, isSuperAdmin)
- **useLocale**: Language switching (en/ar) and RTL support
- **useFetch**: Data fetching wrapper with loading/error states

### Usage Example
```tsx
import { AdminLayout, PageHeader } from '@/components/layout';
import { Button, Card, StatCard } from '@/components/ui';
import { useAuth } from '@/hooks';

export default function DashboardPage() {
    const { user } = useAuth();
    
    return (
        <AdminLayout>
            <PageHeader title="Dashboard" actions={<Button>Action</Button>} />
            <div className="grid grid-cols-4 gap-4">
                <StatCard title="Total" value={100} color="primary" />
            </div>
        </AdminLayout>
    );
}
```

---

## Sohar Port Integration

### Overview
The system integrates with Sohar Port's API for gate pass synchronization.

### Architecture
Located in `src/lib/sohar-port/`:
- **Client:** `client.ts` - HTTP client with retry logic
- **Send:** `send/` - Outbound operations (Create, Update)
- **Receive:** `receive/` - Inbound operations (Get, List)
- **Types:** `types.ts` - TypeScript definitions

### Configuration
Environment variables required:
```env
SOHAR_PORT_API_BASE_URL=https://api.soharport.com
SOHAR_PORT_API_KEY=your-api-key
SOHAR_PORT_API_VERSION=v1
```

### Usage Example
```typescript
import { SoharPortClient } from '@/lib/sohar-port';

const client = new SoharPortClient();
await client.send.createGatePass(requestData);
```
