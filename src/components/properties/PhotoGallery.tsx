import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { COLORS } from '@/config/colors';
import { PropertyPhoto } from '../../types';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import {
  Dialog,
  DialogContent,
} from '../ui/dialog';
import { Trash2, MoveUp, MoveDown, Image as ImageIcon, X, GripVertical } from 'lucide-react';
import { photosService } from '../../lib/serviceProxy';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { toast } from 'sonner';

interface PhotoGalleryProps {
  photos: PropertyPhoto[];
  onPhotosChange: () => void;
  loading?: boolean;
}

export const PhotoGallery = ({ photos, onPhotosChange, loading = false }: PhotoGalleryProps) => {
  const { t } = useTranslation('photo');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [photoToDelete, setPhotoToDelete] = useState<PropertyPhoto | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerPhotoIndex, setViewerPhotoIndex] = useState(0);
  const [reordering, setReordering] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const handleDeleteClick = (photo: PropertyPhoto) => {
    setPhotoToDelete(photo);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!photoToDelete) return;

    try {
      setDeleting(true);
      await photosService.deletePhoto(photoToDelete.id);
      onPhotosChange();
      setDeleteDialogOpen(false);
      setPhotoToDelete(null);
      toast.success(t('gallery.toast.deleteSuccess'));
    } catch (error) {
      toast.error(t('gallery.toast.deleteError'));
    } finally {
      setDeleting(false);
    }
  };

  const handleMoveUp = async (photo: PropertyPhoto, currentIndex: number) => {
    if (currentIndex === 0 || reordering) return;

    try {
      setReordering(true);
      const newPhotos = [...photos];
      [newPhotos[currentIndex], newPhotos[currentIndex - 1]] = [
        newPhotos[currentIndex - 1],
        newPhotos[currentIndex],
      ];

      await photosService.reorderPhotos(
        photo.property_id,
        newPhotos.map(p => p.id)
      );
      onPhotosChange();
    } catch (error) {
      toast.error(t('gallery.toast.reorderError'));
    } finally {
      setReordering(false);
    }
  };

  const handleMoveDown = async (photo: PropertyPhoto, currentIndex: number) => {
    if (currentIndex === photos.length - 1 || reordering) return;

    try {
      setReordering(true);
      const newPhotos = [...photos];
      [newPhotos[currentIndex], newPhotos[currentIndex + 1]] = [
        newPhotos[currentIndex + 1],
        newPhotos[currentIndex],
      ];

      await photosService.reorderPhotos(
        photo.property_id,
        newPhotos.map(p => p.id)
      );
      onPhotosChange();
    } catch (error) {
      toast.error(t('gallery.toast.reorderError'));
    } finally {
      setReordering(false);
    }
  };

  const handleViewPhoto = (index: number) => {
    setViewerPhotoIndex(index);
    setViewerOpen(true);
  };

  const handleNextPhoto = () => {
    setViewerPhotoIndex((prev) => (prev + 1) % photos.length);
  };

  const handlePrevPhoto = () => {
    setViewerPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  if (loading) {
    return (
      <Card className="p-8 shadow-lg border-gray-100 bg-white/80 backdrop-blur-sm">
        <div className={`text-center ${COLORS.muted.textLight}`}>{t('gallery.loading')}</div>
      </Card>
    );
  }

  if (photos.length === 0) {
    return (
      <Card className="p-8 shadow-lg border-gray-100 bg-white/80 backdrop-blur-sm">
        <div className="flex flex-col items-center justify-center text-center space-y-3">
          <div className="p-3 bg-gray-100 rounded-full">
            <ImageIcon className="h-6 w-6 text-gray-500" />
          </div>
          <div>
            <p className="font-medium text-gray-900">{t('gallery.emptyState.title')}</p>
            <p className="text-sm text-gray-500 mt-1">{t('gallery.emptyState.description')}</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <>
      <TooltipProvider>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {photos.map((photo, index) => (
          <Card
            key={photo.id}
            className="group relative overflow-hidden rounded-xl border bg-card text-card-foreground shadow hover:shadow-xl transition-shadow"
            draggable
            onDragStart={() => setDragIndex(index)}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = 'move';
            }}
            onDrop={async (e) => {
              e.preventDefault();
              if (dragIndex === null || dragIndex === index || reordering) return;
              try {
                setReordering(true);
                const newPhotos = [...photos];
                const [moved] = newPhotos.splice(dragIndex, 1);
                newPhotos.splice(index, 0, moved);
                await photosService.reorderPhotos(photo.property_id, newPhotos.map(p => p.id));
                onPhotosChange();
              } catch (error) {
                toast.error(t('gallery.toast.reorderError'));
              } finally {
                setReordering(false);
                setDragIndex(null);
              }
            }}
          >
            <div className={`aspect-square ${COLORS.gray.bg100}`}>
              <img
                src={photosService.getPhotoUrl(photo.file_path)}
                alt={`Property photo ${index + 1}`}
                className="w-full h-full object-cover cursor-pointer"
                onClick={() => handleViewPhoto(index)}
              />
            </div>

            <div className="absolute inset-x-0 bottom-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="flex items-center justify-center gap-2 p-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon"
                      variant="secondary"
                      className="bg-white/90 hover:bg-white min-h-[44px] min-w-[44px] md:h-8 md:w-8 cursor-grab active:cursor-grabbing"
                      aria-label={t('gallery.tooltips.dragToReorder')}
                    >
                      <GripVertical className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{t('gallery.tooltips.dragToReorder')}</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon"
                      variant="secondary"
                      onClick={() => handleMoveUp(photo, index)}
                      disabled={index === 0 || reordering}
                      className="bg-white/90 hover:bg-white min-h-[44px] min-w-[44px] md:h-8 md:w-8"
                      aria-label={t('gallery.tooltips.moveUp')}
                    >
                      <MoveUp className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{t('gallery.tooltips.moveUp')}</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon"
                      variant="secondary"
                      onClick={() => handleMoveDown(photo, index)}
                      disabled={index === photos.length - 1 || reordering}
                      className="bg-white/90 hover:bg-white min-h-[44px] min-w-[44px] md:h-8 md:w-8"
                      aria-label={t('gallery.tooltips.moveDown')}
                    >
                      <MoveDown className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{t('gallery.tooltips.moveDown')}</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon"
                      variant="destructive"
                      onClick={() => handleDeleteClick(photo)}
                      disabled={reordering}
                      className="min-h-[44px] min-w-[44px] md:h-8 md:w-8"
                      aria-label={t('gallery.tooltips.delete')}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{t('gallery.tooltips.delete')}</TooltipContent>
                </Tooltip>
              </div>
            </div>

            {index === 0 && (
              <div className="absolute top-2 left-2">
                <Badge className="shadow">{t('gallery.badges.primary')}</Badge>
              </div>
            )}
          </Card>
        ))}
      </div>
      </TooltipProvider>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('gallery.deleteDialog.title')}</AlertDialogTitle>
            <AlertDialogDescription>{t('gallery.deleteDialog.description')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>{t('gallery.deleteDialog.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? t('common.deleting') : t('gallery.deleteDialog.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={viewerOpen} onOpenChange={setViewerOpen}>
        <DialogContent className="max-w-4xl p-0">
          <div className="relative bg-black">
            <button
              onClick={() => setViewerOpen(false)}
              className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="relative">
              <img
                src={photosService.getPhotoUrl(photos[viewerPhotoIndex].file_path)}
                alt={`Property photo ${viewerPhotoIndex + 1}`}
                className="w-full h-auto max-h-[80vh] object-contain"
              />

              {photos.length > 1 && (
                <>
                  <button
                    onClick={handlePrevPhoto}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
                  >
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={handleNextPhoto}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
                  >
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>

                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/50 rounded-full text-white text-sm">
                    {viewerPhotoIndex + 1} / {photos.length}
                  </div>
                </>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
