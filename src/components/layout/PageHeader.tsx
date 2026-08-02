import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PageHeaderProps {
  title?: string;
  subtitle?: string;
  backTo?: { href: string; label: string };
  actions?: ReactNode;
}

export function PageHeader({ title, subtitle, backTo, actions }: PageHeaderProps) {
  const navigate = useNavigate();
  const hasTitle = Boolean(title || subtitle);

  if (!backTo && !hasTitle && !actions) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        {backTo && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(backTo.href)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {backTo.label}
          </Button>
        )}
        {hasTitle && (
          <div className="min-w-0">
            {title && (
              <h1 className="text-2xl font-bold text-foreground truncate">
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="text-muted-foreground text-sm line-clamp-2">
                {subtitle}
              </p>
            )}
          </div>
        )}
      </div>
      {actions && (
        <div className="w-full sm:w-auto flex flex-wrap gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}
