import { memo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface MemberAvatarProps {
  name?: string | null;
  email: string;
  avatarUrl?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Get initials from name or email
 */
function getInitials(name?: string | null, email?: string): string {
  if (name) {
    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }

  if (email) {
    const localPart = email.split('@')[0];
    return localPart.slice(0, 2).toUpperCase();
  }

  return '??';
}

/**
 * Generate consistent background color from string
 */
function getAvatarColor(str: string): string {
  const colors = [
    'bg-primary text-primary-foreground',
    'bg-success text-success-foreground',
    'bg-secondary text-secondary-foreground',
    'bg-info text-info-foreground',
    'bg-warning text-warning-foreground',
    'bg-accent text-accent-foreground',
    'bg-destructive text-destructive-foreground',
    'bg-muted text-muted-foreground',
  ];

  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
}

export const MemberAvatar = memo(({
  name,
  email,
  avatarUrl,
  size = 'md',
  className
}: MemberAvatarProps) => {
  const initials = getInitials(name, email);
  const bgColor = getAvatarColor(email);

  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
  };

  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      {avatarUrl && (
        <AvatarImage
          src={avatarUrl}
          alt={name || email}
        />
      )}
      <AvatarFallback
        className={cn(
          bgColor,
          'font-semibold'
        )}
      >
        {initials}
      </AvatarFallback>
    </Avatar>
  );
});

MemberAvatar.displayName = 'MemberAvatar';
