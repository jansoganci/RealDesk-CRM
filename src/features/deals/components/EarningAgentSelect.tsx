import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { organizationService } from '@/lib/serviceProxy';
import { useOrg } from '@/contexts/OrgContext';
import type { OrgMemberWithUser } from '@/types/org';

export interface EarningAgentOption {
  userId: string;
  label: string;
}

interface EarningAgentSelectProps {
  value: string | null | undefined;
  onChange: (userId: string) => void;
  disabled?: boolean;
  id?: string;
}

function memberLabel(member: OrgMemberWithUser): string {
  const name = member.user?.raw_user_meta_data?.full_name;
  const email = member.user?.email ?? member.user_id;
  return name ? `${name} (${email})` : email;
}

export function EarningAgentSelect({
  value,
  onChange,
  disabled = false,
  id,
}: EarningAgentSelectProps) {
  const { t } = useTranslation('deals');
  const { currentOrg } = useOrg();
  const [members, setMembers] = useState<OrgMemberWithUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentOrg) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const rows = await organizationService.getMembers(currentOrg.id);
        if (!cancelled) {
          setMembers(rows.filter((m) => m.status === 'active'));
        }
      } catch {
        if (!cancelled) setMembers([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [currentOrg]);

  const options = useMemo(
    () =>
      members.map((m) => ({
        userId: m.user_id,
        label: memberLabel(m),
      })),
    [members]
  );

  return (
    <Select
      value={value ?? undefined}
      onValueChange={onChange}
      disabled={disabled || loading || options.length === 0}
    >
      <SelectTrigger id={id}>
        <SelectValue
          placeholder={
            loading ? t('fields.earningAgentLoading') : t('fields.earningAgentPlaceholder')
          }
        />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt.userId} value={opt.userId}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
