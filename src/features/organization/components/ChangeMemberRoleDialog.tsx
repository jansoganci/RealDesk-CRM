import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, Shield, UserCog } from 'lucide-react';
import { toast } from 'sonner';

import { useMediaQuery } from '@/hooks/useMediaQuery';
import { organizationService } from '@/services/organization.service';
import type { OrgMemberWithUser, OrgRole } from '@/types/org';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { MemberAvatar } from './MemberAvatar';
import { RoleBadge } from './RoleBadge';

interface ChangeMemberRoleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  member: OrgMemberWithUser;
  onSuccess?: () => void;
}

export function ChangeMemberRoleDialog({
  isOpen,
  onClose,
  member,
  onSuccess,
}: ChangeMemberRoleDialogProps) {
  const { t } = useTranslation(['team', 'common']);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const userName = member.user?.raw_user_meta_data?.full_name || member.user?.email || 'Unknown';
  const userEmail = member.user?.email || '';
  const avatarUrl = member.user?.raw_user_meta_data?.avatar_url || null;

  const currentRole = member.role;
  const newRole: OrgRole = currentRole === 'owner' ? 'member' : 'owner';
  const isPromoting = newRole === 'owner';

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await organizationService.updateMemberRole(member.id, newRole);
      toast.success(t('team:success.roleUpdated'));
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Failed to update role:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : t('team:errors.updateFailed');
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const content = (
    <div className="space-y-4">
      {/* Member info */}
      <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
        <MemberAvatar
          name={userName}
          email={userEmail}
          avatarUrl={avatarUrl}
          size="md"
        />
        <div>
          <p className="font-medium text-foreground">{userName}</p>
          <p className="text-sm text-muted-foreground">{userEmail}</p>
        </div>
      </div>

      {/* Role change visualization */}
      <div className="flex items-center justify-center gap-4 py-4">
        <div className="text-center">
          <p className="mb-1 text-xs text-muted-foreground">{t('team:changeRoleDialog.currentRole')}</p>
          <RoleBadge role={currentRole} />
        </div>
        <div className="text-2xl text-muted-foreground">→</div>
        <div className="text-center">
          <p className="mb-1 text-xs text-muted-foreground">{t('team:changeRoleDialog.newRole')}</p>
          <RoleBadge role={newRole} />
        </div>
      </div>

      {/* Warning for demotion */}
      {!isPromoting && (
        <div className="rounded-lg border border-warning/30 bg-warning/15 p-3 text-sm text-warning">
          {t('team:changeRoleDialog.demoteWarning')}
        </div>
      )}
    </div>
  );

  const title = isPromoting
    ? t('team:changeRoleDialog.promoteTitle')
    : t('team:changeRoleDialog.demoteTitle');

  const description = isPromoting
    ? t('team:changeRoleDialog.promoteDescription', { name: userName })
    : t('team:changeRoleDialog.demoteDescription', { name: userName });

  // Mobile: Drawer
  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={onClose}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle className="flex items-center gap-2">
              {isPromoting ? <Shield className="h-5 w-5" /> : <UserCog className="h-5 w-5" />}
              {title}
            </DrawerTitle>
            <DrawerDescription>{description}</DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-4">{content}</div>
          <DrawerFooter>
            <Button
              onClick={handleConfirm}
              disabled={isSubmitting}
              className="w-full"
              variant={isPromoting ? 'default' : 'secondary'}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('team:changeRoleDialog.submitting')}
                </>
              ) : (
                t('team:changeRoleDialog.submit')
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              {t('common:cancel')}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop: Dialog
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isPromoting ? <Shield className="h-5 w-5" /> : <UserCog className="h-5 w-5" />}
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {content}
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            {t('common:cancel')}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isSubmitting}
            variant={isPromoting ? 'default' : 'secondary'}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('team:changeRoleDialog.submitting')}
              </>
            ) : (
              t('team:changeRoleDialog.submit')
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
