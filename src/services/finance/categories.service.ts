// =====================================================
// Expense Categories Service
// CRUD operations for expense categories
// =====================================================

import { supabase } from '../../config/supabase';
import { insertRow, updateRow } from '../../lib/db';
import { getAuthenticatedUserId } from '../../lib/auth';
import type {
  ExpenseCategory,
  CreateExpenseCategoryInput,
  UpdateExpenseCategoryInput,
} from '../../types/financial';

// =====================================================
// Expense Categories CRUD
// =====================================================

/**
 * Get all expense categories (default + user's custom)
 * @param type - Optional filter by type (income/expense)
 * @returns Array of expense categories
 */
export const getCategories = async (
  type?: 'income' | 'expense'
): Promise<ExpenseCategory[]> => {
  let query = supabase
    .from('expense_categories')
    .select('*')
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (type) {
    query = query.eq('type', type);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }

  return (data || []) as ExpenseCategory[];
};

/**
 * Get a single category by ID
 * @param id - Category ID
 * @returns Expense category or null
 */
export const getCategoryById = async (
  id: string
): Promise<ExpenseCategory | null> => {
  const { data, error } = await supabase
    .from('expense_categories')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('Error fetching category:', error);
    throw error;
  }

  return data as ExpenseCategory | null;
};

/**
 * Create a new custom expense category
 * @param data - Category data
 * @returns Created category
 */
export const createCategory = async (
  data: CreateExpenseCategoryInput
): Promise<ExpenseCategory> => {
  const userId = await getAuthenticatedUserId();

  const category = await insertRow('expense_categories', {
    user_id: userId,
    name: data.name,
    type: data.type,
    parent_category: data.parent_category || null,
    monthly_budget: data.monthly_budget || null,
    icon: data.icon || null,
    color: data.color || null,
    is_default: false,
    is_active: data.is_active !== undefined ? data.is_active : true,
  });

  return category as ExpenseCategory;
};

/**
 * Update a custom expense category
 * @param id - Category ID
 * @param data - Updated category data
 * @returns Updated category
 */
export const updateCategory = async (
  id: string,
  data: UpdateExpenseCategoryInput
): Promise<ExpenseCategory> => {
  const category = await updateRow('expense_categories', id, {
    name: data.name,
    type: data.type,
    parent_category: data.parent_category,
    monthly_budget: data.monthly_budget,
    icon: data.icon,
    color: data.color,
    is_active: data.is_active,
  });

  return category as ExpenseCategory;
};

/**
 * Delete a custom expense category
 * @param id - Category ID
 * @returns True if deleted successfully
 */
export const deleteCategory = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('expense_categories')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting category:', error);
    throw error;
  }

  return true;
};
