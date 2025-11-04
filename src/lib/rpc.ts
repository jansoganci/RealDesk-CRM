import { supabase } from '../config/supabase';
import type { Database } from '../types/database';

// Extract valid RPC function names from Database type
type RpcFunctionName = keyof Database['public']['Functions'];

export async function callRpc<TParams, TResult>(
  functionName: RpcFunctionName,
  params: TParams
): Promise<TResult> {
  // RPC functions are not fully typed in the Database schema, but we can type the params and result
  const { data, error } = await supabase.rpc(functionName, params as any);
  if (error) throw error;
  return data as TResult;
}


