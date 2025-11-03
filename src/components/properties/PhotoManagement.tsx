import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { PhotoUpload } from './PhotoUpload';
import { PhotoGallery } from './PhotoGallery';
import { PropertyPhoto } from '../../types';
import { photosService } from '../../lib/serviceProxy';
import { toast } from 'sonner';
import { Upload, Images } from 'lucide-react';

interface PhotoManagementProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: string;
  propertyAddress: string;
}

export const PhotoManagement = ({
  open,
  onOpenChange,
  propertyId,
  propertyAddress,
}: PhotoManagementProps) => {
  const { t } = useTranslation('photo');
  const [photos, setPhotos] = useState<PropertyPhoto[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    if (open) {
      loadPhotos();
      setSelectedFiles([]);
    }
  }, [open, propertyId]);

  const loadPhotos = async () => {
    try {
      setLoading(true);
      const data = await photosService.getPhotosByPropertyId(propertyId);
      setPhotos(data);
    } catch (error) {
      console.error(t('gallery.toast.loadError'), error);
      toast.error(t('gallery.toast.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const handleFilesSelected = (files: File[]) => {
    setSelectedFiles(files);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    try {
      setUploading(true);
      setUploadProgress(0);

      const totalFiles = selectedFiles.length;
      let uploadedCount = 0;

      for (const file of selectedFiles) {
        await photosService.uploadPhoto(propertyId, file);
        uploadedCount++;
        setUploadProgress(Math.round((uploadedCount / totalFiles) * 100));
      }

      toast.success(
        t('gallery.toast.uploadSuccess', { count: totalFiles })
      );
      setSelectedFiles([]);
      await loadPhotos();
    } catch (error) {
      console.error(t('gallery.toast.uploadError'), error);
      toast.error(error instanceof Error ? error.message : t('gallery.toast.uploadError'));
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('management.title')}</DialogTitle>
          <DialogDescription>
            {propertyAddress}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="gallery" className="w-full">
          <TabsList className="w-full justify-start gap-2">
            <TabsTrigger value="gallery" className="flex items-center gap-2">
              <Images className="h-4 w-4" />
              {t('management.tabs.gallery', { count: photos.length })}
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              {t('management.tabs.upload')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="gallery" className="mt-6 space-y-4">
            <PhotoGallery
              photos={photos}
              onPhotosChange={loadPhotos}
              loading={loading}
            />
          </TabsContent>

          <TabsContent value="upload" className="mt-6 space-y-4">
            <PhotoUpload
              onFilesSelected={handleFilesSelected}
              maxFiles={10}
              currentPhotoCount={photos.length}
              uploading={uploading}
            />

            {selectedFiles.length > 0 && (
              <div className="flex items-center justify-between pt-4 border-t">
                <p className="text-sm text-gray-600">
                  {t('management.readyToUpload', { count: selectedFiles.length })}
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setSelectedFiles([])}
                    disabled={uploading}
                  >
                    {t('management.cancel')}
                  </Button>
                  <Button
                    type="button"
                    onClick={handleUpload}
                    disabled={uploading}
                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                  >
                    {uploading
                      ? t('management.uploading', { progress: uploadProgress })
                      : t('management.uploadButton', { count: selectedFiles.length })}
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
