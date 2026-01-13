import { supabase } from '../config/supabase';
import type { Database } from '../types/database.types';

type Tables = Database['public']['Tables'];
type TableName = keyof Tables;

/**
 * Type-safe insert helper.
 * Input is validated against DB schema, output is typed to match Row.
 * Note: Uses 'as any' internally because Supabase's generic from()
 * doesn't support dynamic table names with full type inference.
 */
export async function insertRow<T extends TableName>(
  table: T,
  values: Tables[T]['Insert']
): Promise<Tables[T]['Row']> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from(table) as any)
    .insert(values)
    .select()
    .single();
  if (error) throw error;
  return data as Tables[T]['Row'];
}

/**
 * Type-safe update helper.
 * Input is validated against DB schema, output is typed to match Row.
 */
export async function updateRow<T extends TableName>(
  table: T,
  id: string,
  values: Tables[T]['Update']
): Promise<Tables[T]['Row']> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from(table) as any)
    .update(values)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Tables[T]['Row'];
}


