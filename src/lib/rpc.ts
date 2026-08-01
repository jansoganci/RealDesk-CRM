import { supabase } from '../config/supabase';
import type { Database } from '../types/database.types';

// Extract valid RPC function names from Database type
type RpcFunctionName = Extract<keyof Database['public']['Functions'], string>;
type RpcArgs = Database['public']['Functions'][RpcFunctionName]['Args'];

export async function callRpc<TParams, TResult>(
  functionName: RpcFunctionName,
  params: TParams
): Promise<TResult> {
  // Database Function Args are incomplete for several RPCs; callers supply precise TParams.
  const { data, error } = await supabase.rpc(functionName, params as RpcArgs);
  if (error) throw error;
  return data as TResult;
}
