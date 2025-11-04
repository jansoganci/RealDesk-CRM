# API Documentation

This document describes the service layer API for the Real Estate CRM application. All services follow a consistent pattern and interact with Supabase backend.

## 📋 Table of Contents

- [Service Overview](#service-overview)
- [Common Patterns](#common-patterns)
- [Properties Service](#properties-service)
- [Owners Service](#owners-service)
- [Tenants Service](#tenants-service)
- [Contracts Service](#contracts-service)
- [Reminders Service](#reminders-service)
- [Inquiries Service](#inquiries-service)
- [Photos Service](#photos-service)
- [Error Handling](#error-handling)
- [Type Definitions](#type-definitions)

## Service Overview

All services follow a consistent CRUD pattern:

```typescript
class Service {
  async getAll(): Promise<Entity[]>
  async getById(id: string): Promise<Entity | null>
  async create(data: EntityInsert): Promise<Entity>
  async update(id: string, data: EntityUpdate): Promise<Entity>
  async delete(id: string): Promise<void>
}
```

## Common Patterns

### Service Proxy

Services are accessed through a proxy that can switch between real and mock implementations:

```typescript
import { propertiesService } from '@/lib/serviceProxy';

// Automatically uses real or mock service based on demo mode
const properties = await propertiesService.getAll();
```

### Error Handling

All services throw errors that should be caught and handled:

```typescript
try {
  const property = await propertiesService.create(data);
} catch (error) {
  // Handle error (show toast, log, etc.)
  console.error('Failed to create property:', error);
}
```

### Type Safety

All services are fully typed with TypeScript:

```typescript
import type { Property, PropertyInsert, PropertyUpdate } from '@/types';

const property: Property = await propertiesService.getById(id);
```

## Properties Service

**Location**: `src/services/properties.service.ts`

### Methods

#### `getAll(): Promise<PropertyWithOwner[]>`

Retrieves all properties with owner and contract information.

**Returns**: Array of properties with nested owner and active contract data

**Example**:
```typescript
const properties = await propertiesService.getAll();
// Returns: PropertyWithOwner[]
```

#### `getById(id: string): Promise<PropertyWithOwner | null>`

Retrieves a single property by ID.

**Parameters**:
- `id: string` - Property UUID

**Returns**: Property with owner and contract data, or `null` if not found

**Example**:
```typescript
const property = await propertiesService.getById('uuid-here');
```

#### `create(data: PropertyInsert): Promise<Property>`

Creates a new property.

**Parameters**:
- `data: PropertyInsert` - Property data (name, city, district, owner_id, etc.)

**Returns**: Created property

**Example**:
```typescript
const newProperty = await propertiesService.create({
  name: 'Apartment 101',
  city: 'Istanbul',
  district: 'Kadıköy',
  owner_id: 'owner-uuid',
  status: 'Empty'
});
```

#### `update(id: string, data: PropertyUpdate): Promise<Property>`

Updates an existing property.

**Parameters**:
- `id: string` - Property UUID
- `data: PropertyUpdate` - Partial property data

**Returns**: Updated property

**Example**:
```typescript
const updated = await propertiesService.update(id, {
  status: 'Occupied',
  rent_amount: 5000,
  currency: 'TRY'
});
```

#### `delete(id: string): Promise<void>`

Deletes a property.

**Parameters**:
- `id: string` - Property UUID

**Throws**: Error if property has active contracts or photos

**Example**:
```typescript
await propertiesService.delete(id);
```

## Owners Service

**Location**: `src/services/owners.service.ts`

### Methods

#### `getAll(): Promise<OwnerWithProperties[]>`

Retrieves all owners with their properties.

**Returns**: Array of owners with nested properties

#### `getById(id: string): Promise<OwnerWithProperties | null>`

Retrieves a single owner by ID with properties.

#### `create(data: OwnerInsert): Promise<Owner>`

Creates a new owner.

**Required Fields**:
- `name: string`
- `phone: string`
- `email?: string`
- `address?: string`

#### `update(id: string, data: OwnerUpdate): Promise<Owner>`

Updates an existing owner.

#### `delete(id: string): Promise<void>`

Deletes an owner (only if no properties exist).

## Tenants Service

**Location**: `src/services/tenants.service.ts`

### Methods

#### `getAll(): Promise<TenantWithProperty[]>`

Retrieves all tenants with their assigned properties.

#### `getById(id: string): Promise<TenantWithProperty | null>`

Retrieves a single tenant by ID.

#### `getByPropertyId(propertyId: string): Promise<Tenant[]>`

Retrieves all tenants assigned to a specific property.

#### `getUnassigned(): Promise<Tenant[]>`

Retrieves tenants without property assignments.

#### `create(data: TenantInsert): Promise<Tenant>`

Creates a new tenant.

#### `update(id: string, data: TenantUpdate): Promise<Tenant>`

Updates an existing tenant.

#### `delete(id: string): Promise<void>`

Deletes a tenant.

#### `createWithContract(data: TenantWithContractData): Promise<TenantWithContractResult>`

Creates a tenant and contract atomically using RPC function.

**Parameters**:
```typescript
{
  tenant: {
    name: string;
    phone: string;
    email?: string;
    notes?: string;
  };
  contract: {
    property_id: string;
    start_date: string;
    end_date: string;
    rent_amount: number;
    currency: 'USD' | 'TRY';
    rent_increase_reminder_enabled?: boolean;
    rent_increase_reminder_days?: number;
  };
  pdfFile?: File;
}
```

**Returns**: Created tenant and contract

**Example**:
```typescript
const result = await tenantsService.createWithContract({
  tenant: {
    name: 'John Doe',
    phone: '+90 555 123 4567',
    email: 'john@example.com'
  },
  contract: {
    property_id: 'property-uuid',
    start_date: '2025-01-01',
    end_date: '2025-12-31',
    rent_amount: 5000,
    currency: 'TRY'
  }
});
```

## Contracts Service

**Location**: `src/services/contracts.service.ts`

### Methods

#### `getAll(): Promise<ContractWithDetails[]>`

Retrieves all contracts with tenant and property details.

#### `getById(id: string): Promise<ContractWithDetails | null>`

Retrieves a single contract by ID.

#### `getByTenantId(tenantId: string): Promise<Contract[]>`

Retrieves all contracts for a specific tenant.

#### `getByPropertyId(propertyId: string): Promise<Contract[]>`

Retrieves all contracts for a specific property.

#### `getActiveContracts(): Promise<ContractWithDetails[]>`

Retrieves all active contracts.

#### `getExpiringSoon(days: number = 30): Promise<ContractWithDetails[]>`

Retrieves contracts expiring within the specified number of days.

#### `create(data: ContractInsert): Promise<Contract>`

Creates a new contract.

**Required Fields**:
- `tenant_id: string`
- `property_id: string`
- `start_date: string`
- `end_date: string`
- `rent_amount: number`
- `currency: 'USD' | 'TRY'`

#### `update(id: string, data: ContractUpdate): Promise<Contract>`

Updates an existing contract.

#### `delete(id: string): Promise<void>`

Deletes a contract and updates property status if needed.

#### `uploadPdf(contractId: string, file: File): Promise<string>`

Uploads a PDF file for a contract.

**Returns**: Public URL of uploaded PDF

**Example**:
```typescript
const pdfUrl = await contractsService.uploadPdf(contractId, file);
```

#### `getPdfUrl(contractId: string): Promise<string | null>`

Retrieves the PDF URL for a contract.

## Reminders Service

**Location**: `src/services/reminders.service.ts`

### Methods

#### `getAll(): Promise<ReminderWithDetails[]>`

Retrieves all reminders with contract details.

#### `getUpcoming(): Promise<ReminderWithDetails[]>`

Retrieves upcoming reminders.

#### `getOverdue(): Promise<ReminderWithDetails[]>`

Retrieves overdue reminders.

#### `getByContractId(contractId: string): Promise<Reminder[]>`

Retrieves reminders for a specific contract.

## Inquiries Service

**Location**: `src/services/inquiries.service.ts`

### Methods

#### `getAll(): Promise<Inquiry[]>`

Retrieves all property inquiries.

#### `getById(id: string): Promise<Inquiry | null>`

Retrieves a single inquiry by ID.

#### `getActive(): Promise<Inquiry[]>`

Retrieves active inquiries.

#### `create(data: InquiryInsert): Promise<Inquiry>`

Creates a new inquiry.

#### `update(id: string, data: InquiryUpdate): Promise<Inquiry>`

Updates an existing inquiry.

#### `delete(id: string): Promise<void>`

Deletes an inquiry.

#### `matchProperties(inquiryId: string): Promise<Property[]>`

Matches properties based on inquiry criteria (budget, location).

#### `getMatches(inquiryId: string): Promise<InquiryMatch[]>`

Retrieves property matches for an inquiry.

#### `createMatch(inquiryId: string, propertyId: string): Promise<InquiryMatch>`

Creates a match between an inquiry and property.

## Photos Service

**Location**: `src/services/photos.service.ts`

### Methods

#### `upload(propertyId: string, file: File, order: number): Promise<PropertyPhoto>`

Uploads a photo for a property.

**Parameters**:
- `propertyId: string` - Property UUID
- `file: File` - Image file (JPEG, PNG, WebP)
- `order: number` - Display order (0-based)

**Returns**: Created photo record

**Example**:
```typescript
const photo = await photosService.upload(propertyId, file, 0);
```

#### `delete(photoId: string): Promise<void>`

Deletes a photo.

#### `reorder(propertyId: string, photoIds: string[]): Promise<void>`

Reorders photos for a property atomically.

**Parameters**:
- `propertyId: string` - Property UUID
- `photoIds: string[]` - Array of photo IDs in desired order

**Example**:
```typescript
await photosService.reorder(propertyId, ['id1', 'id2', 'id3']);
```

#### `getByPropertyId(propertyId: string): Promise<PropertyPhoto[]>`

Retrieves all photos for a property, ordered by display order.

## Error Handling

### Error Types

Services throw various error types:

```typescript
import {
  AppError,
  ERROR_PROPERTY_NOT_FOUND,
  ERROR_TENANT_NAME_REQUIRED,
  // ... more error codes
} from '@/lib/errorCodes';
```

### Error Mapping

Errors are automatically mapped to user-friendly messages:

```typescript
import { mapErrorToMessage } from '@/lib/errorMapper';

try {
  await propertiesService.create(data);
} catch (error) {
  const message = mapErrorToMessage(error);
  toast.error(message);
}
```

### Common Error Scenarios

1. **Validation Errors**: Missing required fields
2. **Not Found Errors**: Entity doesn't exist
3. **Constraint Violations**: Foreign key constraints, unique constraints
4. **Permission Errors**: RLS policy violations
5. **File Upload Errors**: Size limits, file type restrictions

## Type Definitions

### Core Types

```typescript
// Property
interface Property {
  id: string;
  name: string;
  city: string;
  district: string;
  owner_id: string;
  status: 'Empty' | 'Occupied' | 'Inactive';
  rent_amount?: number;
  currency?: 'USD' | 'TRY';
  listing_url?: string;
  created_at: string;
  updated_at: string;
}

// Owner
interface Owner {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  created_at: string;
  updated_at: string;
}

// Tenant
interface Tenant {
  id: string;
  name: string;
  phone: string;
  email?: string;
  property_id?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Contract
interface Contract {
  id: string;
  tenant_id: string;
  property_id: string;
  start_date: string;
  end_date: string;
  rent_amount: number;
  currency: 'USD' | 'TRY';
  status: 'Active' | 'Archived' | 'Inactive';
  pdf_url?: string;
  rent_increase_reminder_enabled: boolean;
  rent_increase_reminder_days?: number;
  created_at: string;
  updated_at: string;
}

// Inquiry
interface Inquiry {
  id: string;
  name: string;
  phone: string;
  email?: string;
  preferred_city?: string;
  preferred_district?: string;
  min_budget?: number;
  max_budget?: number;
  status: 'active' | 'matched' | 'contacted' | 'closed';
  notes?: string;
  created_at: string;
  updated_at: string;
}
```

### Extended Types

```typescript
// With relationships
interface PropertyWithOwner extends Property {
  owner: Owner;
  photos?: PropertyPhoto[];
  activeContract?: Contract;
  activeTenant?: Tenant;
}

interface TenantWithProperty extends Tenant {
  property?: Property;
}

interface ContractWithDetails extends Contract {
  tenant: Tenant;
  property: Property;
}
```

## RPC Functions

### Database RPC Functions

These are called internally by services:

#### `create_tenant_with_contract`

Creates a tenant and contract atomically.

**Parameters**:
```typescript
{
  tenant_data: {
    name: string;
    phone: string;
    email?: string;
    property_id: string;
    notes?: string;
  };
  contract_data: {
    start_date: string;
    end_date: string;
    rent_amount: number;
    currency: string;
    rent_increase_reminder_enabled: boolean;
    rent_increase_reminder_days?: number;
  };
}
```

#### `create_contract_and_update_property`

Creates a contract and updates property status.

#### `update_contract_status`

Updates contract status and property status if needed.

#### `reorder_property_photos`

Atomically reorders property photos.

---

For detailed type definitions, see `src/types/database.ts` and `src/types/index.ts`.
For service implementation details, see `src/services/`.

