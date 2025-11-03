import { supabase } from '../config/supabase';
import type { PropertyPhoto } from '../types';
import type {
  RpcPropertyPhotoInsertParams,
  RpcPropertyPhotoInsertResult,
  RpcPropertyPhotosReorderParams,
  RpcPropertyPhotoDeleteParams,
  RpcPropertyPhotoDeleteResult,
} from '../types/rpc';
import { callRpc } from '../lib/rpc';
import {
  AppError,
  ERROR_PHOTO_INVALID_FILE_TYPE,
  ERROR_PHOTO_FILE_SIZE_EXCEEDED,
  ERROR_PHOTO_NOT_FOUND,
} from '../lib/errorCodes';

class PhotosService {
  private readonly BUCKET_NAME = 'property-photos';
  private readonly MAX_FILE_SIZE = 5 * 1024 * 1024;
  private readonly ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  async getPhotosByPropertyId(propertyId: string): Promise<PropertyPhoto[]> {
    const { data, error } = await supabase
      .from('property_photos')
      .select('*')
      .eq('property_id', propertyId)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return (data || []) as PropertyPhoto[];
  }

  async uploadPhoto(propertyId: string, file: File): Promise<PropertyPhoto> {
    if (!this.ALLOWED_TYPES.includes(file.type)) {
      throw new AppError(ERROR_PHOTO_INVALID_FILE_TYPE);
    }

    if (file.size > this.MAX_FILE_SIZE) {
      throw new AppError(ERROR_PHOTO_FILE_SIZE_EXCEEDED);
    }

    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${propertyId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from(this.BUCKET_NAME)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) throw uploadError;

    try {
      const args: RpcPropertyPhotoInsertParams = { p_property_id: propertyId, p_file_path: fileName };
      const data = await callRpc<RpcPropertyPhotoInsertParams, RpcPropertyPhotoInsertResult>('rpc_property_photo_insert', args);
      return data;
    } catch (err) {
      try {
        await supabase.storage.from(this.BUCKET_NAME).remove([fileName]);
      } catch (cleanupErr) {
        console.warn('Failed to cleanup uploaded image after DB error:', cleanupErr);
      }
      throw err;
    }
  }

  async deletePhoto(photoId: string): Promise<void> {
    // Fetch property_id to satisfy RPC contract
    interface PhotoMeta {
      property_id: string;
    }
    const { data: meta, error: metaError } = await supabase
      .from('property_photos')
      .select('property_id')
      .eq('id', photoId)
      .maybeSingle();
    if (metaError) throw metaError;
    const propertyId = (meta as PhotoMeta | null)?.property_id;
    if (!propertyId) throw new AppError(ERROR_PHOTO_NOT_FOUND);

    const delArgs: RpcPropertyPhotoDeleteParams = { p_property_id: propertyId, p_photo_id: photoId };
    const filePath = await callRpc<RpcPropertyPhotoDeleteParams, RpcPropertyPhotoDeleteResult>('rpc_property_photo_delete', delArgs);
    try {
      await supabase.storage.from(this.BUCKET_NAME).remove([filePath]);
    } catch (err) {
      console.warn('Failed to delete file from storage:', err);
    }
  }

  async reorderPhotos(propertyId: string, photoIds: string[]): Promise<void> {
    const reArgs: RpcPropertyPhotosReorderParams = { p_property_id: propertyId, p_photo_ids: photoIds };
    await callRpc<RpcPropertyPhotosReorderParams, void>('rpc_property_photos_reorder', reArgs);
  }

  getPhotoUrl(filePath: string): string {
    const { data } = supabase.storage
      .from(this.BUCKET_NAME)
      .getPublicUrl(filePath);

    return data.publicUrl;
  }

  async getPhotoCount(propertyId: string): Promise<number> {
    const { count, error } = await supabase
      .from('property_photos')
      .select('*', { count: 'exact', head: true })
      .eq('property_id', propertyId);

    if (error) throw error;
    return count || 0;
  }
}

export const photosService = new PhotosService();
