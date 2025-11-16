---
description: Generate service class following Real Estate CRM patterns with RLS security
---

# Add Service Class

You are creating a new service class for the Real Estate CRM. Follow these patterns for consistency and security.

## Required Information

Ask the user for:
1. **Service name** (e.g., "appointments", "documents")
2. **Table name** in database
3. **Entity type** name (TypeScript interface)
4. **Relationships** to other tables (for joins)
5. **Special operations** needed beyond basic CRUD

## Service Template

Create file: `src/services/[service-name].service.ts`

```typescript
import { supabase } from '../config/supabase';
import type { [Entity], [Entity]Insert, [Entity]Update } from '../types';
import { insertRow, updateRow } from '../lib/db';
import { getAuthenticatedUserId } from '../lib/auth';

/**
 * Service for managing [entity plural]
 * Handles CRUD operations and business logic for [description]
 */
class [Entity]Service {
  /**
   * Get all [entities] for the authenticated user
   * @returns Promise with array of [entities]
   */
  async getAll(): Promise<[Entity][]> {
    const { data, error } = await supabase
      .from('[table_name]')
      .select(`
        *
        // Add relationships here, e.g.:
        // property:properties(*),
        // tenant:tenants(*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching [entities]:', error);
      throw error;
    }

    return (data || []) as [Entity][];
  }

  /**
   * Get a single [entity] by ID
   * @param id - The [entity] ID
   * @returns Promise with [entity] or null if not found
   */
  async getById(id: string): Promise<[Entity] | null> {
    const { data, error } = await supabase
      .from('[table_name]')
      .select(`
        *
        // Add relationships
      `)
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching [entity]:', error);
      throw error;
    }

    return data as [Entity] | null;
  }

  /**
   * Create a new [entity]
   * @param entity - The [entity] data to create
   * @returns Promise with created [entity]
   */
  async create(entity: [Entity]Insert): Promise<[Entity]> {
    // Get authenticated user ID for RLS
    const userId = await getAuthenticatedUserId();

    // Inject user_id into entity data
    const new[Entity] = await insertRow('[table_name]', {
      ...entity,
      user_id: userId,
    });

    return new[Entity];
  }

  /**
   * Update an existing [entity]
   * @param id - The [entity] ID to update
   * @param entity - The updated [entity] data
   * @returns Promise with updated [entity]
   */
  async update(id: string, entity: [Entity]Update): Promise<[Entity]> {
    const updated[Entity] = await updateRow('[table_name]', id, entity);
    return updated[Entity];
  }

  /**
   * Delete a [entity]
   * @param id - The [entity] ID to delete
   */
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('[table_name]')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting [entity]:', error);
      throw error;
    }
  }

  /**
   * Get statistics for [entities]
   * @returns Promise with statistics object
   */
  async getStats() {
    const { data, error } = await supabase
      .from('[table_name]')
      .select('*');

    if (error) throw error;

    const entities = data || [];

    return {
      total: entities.length,
      // Add more statistics as needed
    };
  }
}

// Export singleton instance
export const [serviceName]Service = new [Entity]Service();
```

## Common Patterns

### 1. Fetch with Relationships

```typescript
async getAll(): Promise<PropertyWithOwner[]> {
  const { data, error } = await supabase
    .from('properties')
    .select(`
      *,
      owner:property_owners(*),
      photos:property_photos(*),
      contracts(
        id,
        status,
        tenant:tenants(*)
      )
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as PropertyWithOwner[];
}
```

### 2. Conditional Queries

```typescript
async getByStatus(status: string): Promise<Entity[]> {
  const { data, error } = await supabase
    .from('table_name')
    .select('*')
    .eq('status', status)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}
```

### 3. Date Range Queries

```typescript
async getByDateRange(startDate: string, endDate: string): Promise<Entity[]> {
  const { data, error } = await supabase
    .from('table_name')
    .select('*')
    .gte('date_field', startDate)
    .lte('date_field', endDate)
    .order('date_field', { ascending: false });

  if (error) throw error;
  return data || [];
}
```

### 4. Count/Statistics

```typescript
async getStats() {
  const { data, error } = await supabase
    .from('table_name')
    .select('status, count');

  if (error) throw error;

  return {
    total: data?.length || 0,
    active: data?.filter(d => d.status === 'active').length || 0,
    inactive: data?.filter(d => d.status === 'inactive').length || 0,
  };
}
```

### 5. Using RPC Functions

```typescript
async complexOperation(data: any): Promise<any> {
  const { data: result, error } = await supabase
    .rpc('function_name', {
      param1: data.param1,
      param2: data.param2,
    });

  if (error) {
    console.error('Error calling RPC:', error);
    throw error;
  }

  return result;
}
```

### 6. File Upload to Storage

```typescript
async uploadFile(file: File, entityId: string): Promise<string> {
  const userId = await getAuthenticatedUserId();
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}/${entityId}/${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from('bucket-name')
    .upload(fileName, file);

  if (uploadError) throw uploadError;

  // Get public URL
  const { data } = supabase.storage
    .from('bucket-name')
    .getPublicUrl(fileName);

  return data.publicUrl;
}
```

## After Creating Service

### 1. Add to Service Proxy

Update `src/lib/serviceProxy.ts`:

```typescript
// Import real service
import { [serviceName]Service as real[ServiceName]Service } from '../services/[service-name].service';

// Import mock service (optional)
import { mock[ServiceName]Service } from '../services/mockServices/[service-name].service';

// Export type
export type [ServiceName]ServiceType = typeof real[ServiceName]Service;

// Create proxy
export const [serviceName]Service = new Proxy(real[ServiceName]Service, {
  get(target, prop) {
    const service = isDemoMode() ? mock[ServiceName]Service : target;
    const value = (service as any)[prop];

    if (typeof value === 'function') {
      return value.bind(service);
    }

    return value;
  }
}) as typeof real[ServiceName]Service;
```

### 2. Create Mock Service (Optional)

Create `src/services/mockServices/[service-name].service.ts` for demo mode:

```typescript
// Mock data
let mockData: Entity[] = [
  // ... sample data
];

class Mock[Entity]Service {
  async getAll(): Promise<Entity[]> {
    return [...mockData];
  }

  async getById(id: string): Promise<Entity | null> {
    return mockData.find(item => item.id === id) || null;
  }

  async create(entity: EntityInsert): Promise<Entity> {
    const newEntity = {
      ...entity,
      id: crypto.randomUUID(),
      user_id: 'mock-user-id',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as Entity;

    mockData.push(newEntity);
    return newEntity;
  }

  async update(id: string, entity: EntityUpdate): Promise<Entity> {
    const index = mockData.findIndex(item => item.id === id);
    if (index === -1) throw new Error('Not found');

    mockData[index] = {
      ...mockData[index],
      ...entity,
      updated_at: new Date().toISOString(),
    };

    return mockData[index];
  }

  async delete(id: string): Promise<void> {
    mockData = mockData.filter(item => item.id !== id);
  }

  async getStats() {
    return { total: mockData.length };
  }

  resetData() {
    mockData = [/* reset to original */];
  }
}

export const mock[ServiceName]Service = new Mock[Entity]Service();
```

## Service Best Practices

1. **Always inject user_id** in create operations
2. **Use helper functions** from `src/lib/db.ts` (insertRow, updateRow)
3. **Handle errors** with try-catch and meaningful error messages
4. **Add JSDoc comments** for all public methods
5. **Use TypeScript types** for all parameters and returns
6. **Order results** by created_at or relevant field
7. **Use maybeSingle()** for single record queries
8. **Validate data** before database operations
9. **Use transactions** for multi-step operations (RPC functions)
10. **Log errors** for debugging

## Testing the Service

Test your service:

```typescript
// In component or test file
import { [serviceName]Service } from '@/lib/serviceProxy';

// Test create
const entity = await [serviceName]Service.create({
  field1: 'value1',
  field2: 'value2',
});

// Test getAll
const all = await [serviceName]Service.getAll();

// Test getById
const one = await [serviceName]Service.getById(entity.id);

// Test update
const updated = await [serviceName]Service.update(entity.id, {
  field1: 'new value',
});

// Test delete
await [serviceName]Service.delete(entity.id);
```

Now, please provide the service details and I'll generate the complete service class for you!
