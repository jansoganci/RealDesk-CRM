import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Mail, Phone, Plus, Trash2, Pencil } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { dealPartiesService, type DealWithRelations } from '@/lib/serviceProxy';
import { COLORS } from '@/config/colors';
import type { DealParty } from '@/types';

type PartiesTabProps = {
  deal: DealWithRelations;
  readOnly?: boolean;
};

type PartyForm = {
  role: string;
  name: string;
  company: string;
  phone: string;
  email: string;
  notes: string;
};

const EMPTY_FORM: PartyForm = {
  role: 'buyer',
  name: '',
  company: '',
  phone: '',
  email: '',
  notes: '',
};

const PARTY_ROLES = [
  'buyer',
  'seller',
  'buyer_agent',
  'seller_agent',
  'lender',
  'title_co',
  'inspector',
  'appraiser',
  'attorney',
  'other',
] as const;

function unwrapRelation<T>(x: T | T[] | null | undefined): T | null {
  if (x == null) return null;
  return Array.isArray(x) ? (x[0] ?? null) : x;
}

function toForm(party: DealParty): PartyForm {
  return {
    role: party.role,
    name: party.name,
    company: party.company ?? '',
    phone: party.phone ?? '',
    email: party.email ?? '',
    notes: party.notes ?? '',
  };
}

export function PartiesTab({ deal, readOnly = false }: PartiesTabProps) {
  const { t } = useTranslation('deals');
  const { toast } = useToast();
  const [parties, setParties] = useState<DealParty[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PartyForm>(EMPTY_FORM);

  const suggestedParties = useMemo(() => {
    const suggestions: Array<Omit<PartyForm, 'notes'>> = [];
    const lead = unwrapRelation(deal.property_inquiries);
    if (lead?.name) {
      suggestions.push({
        role: 'buyer',
        name: lead.name,
        company: '',
        phone: lead.phone ?? '',
        email: '',
      });
    }

    const snapshot = deal.property_snapshot as Record<string, unknown> | null;
    const sellerName = typeof snapshot?.owner_name === 'string' ? snapshot.owner_name : '';
    const sellerPhone = typeof snapshot?.owner_phone === 'string' ? snapshot.owner_phone : '';
    const sellerEmail = typeof snapshot?.owner_email === 'string' ? snapshot.owner_email : '';
    if (sellerName) {
      suggestions.push({
        role: 'seller',
        name: sellerName,
        company: '',
        phone: sellerPhone,
        email: sellerEmail,
      });
    }

    return suggestions;
  }, [deal.property_inquiries, deal.property_snapshot]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await dealPartiesService.getByDeal(deal.id);
      setParties(rows);
    } catch (error) {
      toast({
        title: error instanceof Error ? error.message : 'Failed to load parties',
        variant: 'destructive',
      });
      setParties([]);
    } finally {
      setLoading(false);
    }
  }, [deal.id, toast]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const autoPopulate = async () => {
    if (readOnly || suggestedParties.length === 0 || parties.length > 0) return;
    setSaving(true);
    try {
      await Promise.all(
        suggestedParties.map((item) =>
          dealPartiesService.addParty(deal.id, {
            role: item.role,
            name: item.name,
            company: item.company || null,
            phone: item.phone || null,
            email: item.email || null,
            notes: null,
          })
        )
      );
      await refresh();
      toast({
        title: t('detail.partiesAutoPopulated'),
      });
    } catch (error) {
      toast({
        title: error instanceof Error ? error.message : t('detail.partiesAutoPopulateError'),
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
  };

  const submit = async () => {
    if (readOnly || !form.name.trim()) return;
    setSaving(true);
    try {
      const payload = {
        role: form.role,
        name: form.name.trim(),
        company: form.company.trim() || null,
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        notes: form.notes.trim() || null,
      };

      if (editingId) {
        await dealPartiesService.updateParty(editingId, payload);
        toast({ title: t('detail.partyUpdated') });
      } else {
        await dealPartiesService.addParty(deal.id, payload);
        toast({ title: t('detail.partyAdded') });
      }

      resetForm();
      await refresh();
    } catch (error) {
      toast({
        title: error instanceof Error ? error.message : t('detail.partySaveError'),
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (readOnly) return;
    const confirmed = window.confirm(
      t('detail.removePartyConfirm')
    );
    if (!confirmed) return;

    setSaving(true);
    try {
      await dealPartiesService.removeParty(id);
      await refresh();
      toast({ title: t('detail.partyRemoved') });
    } catch (error) {
      toast({
        title: error instanceof Error ? error.message : t('detail.partyRemoveError'),
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-base">
              {t('detail.tabs.parties')}
            </CardTitle>
            <div className="flex gap-2">
              {parties.length === 0 && suggestedParties.length > 0 && (
                <Button size="sm" variant="outline" onClick={() => void autoPopulate()} disabled={saving || readOnly}>
                  {t('detail.autoPopulate')}
                </Button>
              )}
              {!readOnly && (
                <Button size="sm" onClick={resetForm}>
                  <Plus className="h-4 w-4 mr-1" />
                  {t('detail.addParty')}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        {!readOnly && (
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>{t('detail.partyRole')}</Label>
                <select
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={form.role}
                  onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value }))}
                  disabled={saving}
                >
                  {PARTY_ROLES.map((role) => (
                    <option key={role} value={role}>
                      {t(`timeline.responsibleParty.${role}`, { defaultValue: role })}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label>{t('list.tableName')}</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  disabled={saving}
                />
              </div>
              <div className="space-y-1">
                <Label>{t('detail.company')}</Label>
                <Input
                  value={form.company}
                  onChange={(e) => setForm((prev) => ({ ...prev, company: e.target.value }))}
                  disabled={saving}
                />
              </div>
              <div className="space-y-1">
                <Label>{t('detail.leadPhone')}</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                  disabled={saving}
                />
              </div>
              <div className="space-y-1 md:col-span-2">
                <Label>{t('detail.email')}</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                  disabled={saving}
                />
              </div>
              <div className="space-y-1 md:col-span-2">
                <Label>{t('fields.notes')}</Label>
                <Textarea
                  value={form.notes}
                  onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                  disabled={saving}
                />
              </div>
            </div>
            <div className="mt-3 flex gap-2 justify-end">
              {editingId && (
                <Button variant="outline" onClick={resetForm} disabled={saving}>
                  {t('creation.cancel')}
                </Button>
              )}
              <Button onClick={() => void submit()} disabled={saving || !form.name.trim()}>
                {editingId
                  ? t('detail.updateParty')
                  : t('detail.createParty')}
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {loading ? (
        <Card>
          <CardContent className="py-6">
            <p className={`text-sm ${COLORS.gray.text600} dark:text-muted-foreground`}>
              {t('detail.loading')}
            </p>
          </CardContent>
        </Card>
      ) : parties.length === 0 ? (
        <Card>
          <CardContent className="py-6">
            <p className={`text-sm ${COLORS.gray.text600} dark:text-muted-foreground`}>
              {t('detail.noParties')}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {parties.map((party) => (
            <Card key={party.id}>
              <CardContent className="py-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-foreground dark:text-foreground">{party.name}</p>
                    <p className={`text-xs ${COLORS.gray.text600} dark:text-muted-foreground`}>{party.company ?? '—'}</p>
                  </div>
                  <Badge variant="outline">
                    {t(`timeline.responsibleParty.${party.role}`, { defaultValue: party.role })}
                  </Badge>
                </div>

                <div className="flex flex-wrap gap-2">
                  {party.phone && (
                    <Button asChild size="sm" variant="outline">
                      <a href={`tel:${party.phone}`}>
                        <Phone className="h-4 w-4 mr-1" />
                        {t('detail.call')}
                      </a>
                    </Button>
                  )}
                  {party.email && (
                    <Button asChild size="sm" variant="outline">
                      <a href={`mailto:${party.email}`}>
                        <Mail className="h-4 w-4 mr-1" />
                        {t('detail.email')}
                      </a>
                    </Button>
                  )}
                </div>

                {!readOnly && (
                  <div className="flex gap-2 pt-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditingId(party.id);
                        setForm(toForm(party));
                      }}
                    >
                      <Pencil className="h-4 w-4 mr-1" />
                      {t('detail.editParty')}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => void remove(party.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      {t('detail.removeParty')}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
