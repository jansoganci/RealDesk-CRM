import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, UserMinus, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

import { organizationService } from '@/services/organization.service';
import type { OrgMemberWithUser } from '@/types/org';

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { MemberAvatar } from './MemberAvatar';
import { RoleBadge } from './RoleBadge';

interface RemoveMemberDialogProps {
  isOpen: boolean;
  onClose: () => void;
  member: OrgMemberWithUser;
  onSuccess?: () => void;
}

export function RemoveMemberDialog({
  isOpen,
  onClose,
  member,
  onSuccess,
}: RemoveMemberDialogProps) {
  const { t } = useTranslation(['team', 'common']);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const userName = member.user?.raw_user_meta_data?.full_name || member.user?.email || 'Unknown';
  const userEmail = member.user?.email || '';
  const avatarUrl = member.user?.raw_user_meta_data?.avatar_url || null;

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await organizationService.removeMember(member.id);
      toast.success(t('team:success.memberRemoved'));
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Failed to remove member:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : t('team:errors.removeFailed');
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <UserMinus className="h-5 w-5" />
            {t('team:removeDialog.title')}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <p>{t('team:removeDialog.description', { name: userName })}</p>

              {/* Member info */}
              <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                <MemberAvatar
                  name={userName}
                  email={userEmail}
                  avatarUrl={avatarUrl}
                  size="md"
                />
                <div className="flex-1">
                  <p className="font-medium text-foreground">{userName}</p>
                  <p className="text-sm text-muted-foreground">{userEmail}</p>
                </div>
                <RoleBadge role={member.role} size="sm" />
              </div>

              {/* Warning */}
              <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/15 p-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
                <p className="text-sm text-destructive">
                  {t('team:removeDialog.warning')}
                </p>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            {t('team:removeDialog.cancel')}
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('team:removeDialog.removing')}
              </>
            ) : (
              <>
                <UserMinus className="mr-2 h-4 w-4" />
                {t('team:removeDialog.confirm')}
              </>
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
