import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { TableCell, TableHead, TableRow } from '../../components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { InquiryDialog } from './InquiryDialog';
import { InquiryMatchesDialog } from './InquiryMatchesDialog';
import { inquiriesService } from '../../lib/serviceProxy';
import { PropertyInquiry, InquiryWithMatches } from '../../types';
import { toast } from 'sonner';
import { Phone, Mail, MapPin, DollarSign, Eye, Inbox, Home, TrendingUp } from 'lucide-react';
import { COLORS } from '@/config/colors';
import { TableActionButtons } from '../../components/common/TableActionButtons';
import { ListPageTemplate } from '../../components/templates/ListPageTemplate';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import * as z from 'zod';
import { getInquirySchema } from './inquirySchema';

export const Inquiries = () => {
  const { t } = useTranslation(['inquiries', 'common']);
  const inquirySchema = getInquirySchema(t);
  type InquiryFormData = z.infer<typeof inquirySchema>;

  const [inquiries, setInquiries] = useState<PropertyInquiry[]>([]);
  const [filteredInquiries, setFilteredInquiries] = useState<PropertyInquiry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [inquiryTypeFilter, setInquiryTypeFilter] = useState<'all' | 'rental' | 'sale'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [matchesDialogOpen, setMatchesDialogOpen] = useState(false);
  const [selectedInquiry, setSelectedInquiry] = useState<PropertyInquiry | null>(null);
  const [selectedInquiryForMatches, setSelectedInquiryForMatches] = useState<InquiryWithMatches | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [inquiryToDelete, setInquiryToDelete] = useState<PropertyInquiry | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadInquiries();
  }, []);

  useEffect(() => {
    if (!Array.isArray(inquiries)) {
      setFilteredInquiries([]);
      return;
    }

    let filtered = inquiries;

    // Filter by inquiry type
    if (inquiryTypeFilter !== 'all') {
      filtered = filtered.filter((inquiry: any) => inquiry.inquiry_type === inquiryTypeFilter);
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter((inquiry) => inquiry.status === statusFilter);
    }

    // Filter by search query
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (inquiry) =>
          inquiry.name.toLowerCase().includes(query) ||
          (inquiry.phone && inquiry.phone.toLowerCase().includes(query)) ||
          (inquiry.email && inquiry.email.toLowerCase().includes(query)) ||
          (inquiry.preferred_city && inquiry.preferred_city.toLowerCase().includes(query))
      );
    }

    setFilteredInquiries(filtered);
  }, [searchQuery, inquiryTypeFilter, statusFilter, inquiries]);

  const loadInquiries = async () => {
    try {
      setLoading(true);
      const data = await inquiriesService.getAll();
      const inquiriesArray = Array.isArray(data) ? data : [];
      setInquiries(inquiriesArray);
      setFilteredInquiries(inquiriesArray);
    } catch (error) {
      toast.error(t('toasts.loadError'));
      console.error(error);
      setInquiries([]);
      setFilteredInquiries([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddInquiry = () => {
    setSelectedInquiry(null);
    setDialogOpen(true);
  };

  const handleEditInquiry = (inquiry: PropertyInquiry) => {
    setSelectedInquiry(inquiry);
    setDialogOpen(true);
  };

  const handleViewMatches = async (inquiry: PropertyInquiry) => {
    try {
      const inquiryWithMatches = await inquiriesService.getById(inquiry.id);
      setSelectedInquiryForMatches(inquiryWithMatches);
      setMatchesDialogOpen(true);
    } catch (error) {
      toast.error(t('toasts.loadError'));
      console.error(error);
    }
  };

  const handleDeleteClick = (inquiry: PropertyInquiry) => {
    setInquiryToDelete(inquiry);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!inquiryToDelete) return;

    try {
      setActionLoading(true);
      await inquiriesService.delete(inquiryToDelete.id);
      toast.success(t('toasts.deleteSuccess'));
      await loadInquiries();
      setDeleteDialogOpen(false);
      setInquiryToDelete(null);
    } catch (error) {
      toast.error(t('toasts.deleteError'));
      console.error(error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmit = async (data: InquiryFormData) => {
    try {
      setActionLoading(true);
      if (selectedInquiry) {
        await inquiriesService.update(selectedInquiry.id, data);
        toast.success(t('toasts.updateSuccess'));
      } else {
        await inquiriesService.create(data);
        toast.success(t('toasts.addSuccess'));
      }
      setDialogOpen(false);
      await loadInquiries();
    } catch (error) {
      toast.error(selectedInquiry ? t('toasts.updateError') : t('toasts.addError'));
      console.error(error);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      active: `${COLORS.success.bgGradient} ${COLORS.text.white}`,
      matched: `${COLORS.primary.bgGradient} ${COLORS.text.white}`,
      contacted: `${COLORS.warning.bgGradient} ${COLORS.text.white}`,
      closed: `${COLORS.status.inactive.gradient} ${COLORS.text.white}`,
    };
    return statusColors[status as keyof typeof statusColors] || `${COLORS.status.inactive.gradient} ${COLORS.text.white}`;
  };

  const renderDesktopRow = (inquiry: PropertyInquiry, index: number) => (
    <TableRow key={inquiry.id}>
      <TableCell>
        <div className="space-y-1">
          <div className={`font-medium ${COLORS.gray.text900}`}>{inquiry.name}</div>
          <div className={`text-sm ${COLORS.gray.text500} flex items-center gap-1`}>
            <Phone className="h-3 w-3" />
            {inquiry.phone}
          </div>
          {inquiry.email && (
            <div className={`text-sm ${COLORS.gray.text500} flex items-center gap-1`}>
              <Mail className="h-3 w-3" />
              {inquiry.email}
            </div>
          )}
        </div>
      </TableCell>
      <TableCell>
        {inquiry.preferred_city || inquiry.preferred_district ? (
          <div className="flex items-center gap-1">
            <MapPin className={`h-4 w-4 ${COLORS.gray.text500}`} />
            <span>
              {inquiry.preferred_city}
              {inquiry.preferred_city && inquiry.preferred_district && ', '}
              {inquiry.preferred_district}
            </span>
          </div>
        ) : (
          <span className={COLORS.gray.text500}>-</span>
        )}
      </TableCell>
      <TableCell>
        {(() => {
          const inquiryTyped = inquiry as any;
          const isRental = inquiryTyped.inquiry_type === 'rental';
          const minBudget = isRental ? inquiryTyped.min_rent_budget : inquiryTyped.min_sale_budget;
          const maxBudget = isRental ? inquiryTyped.max_rent_budget : inquiryTyped.max_sale_budget;

          if (minBudget || maxBudget) {
            return (
              <div className="flex items-center gap-1">
                <DollarSign className={`h-4 w-4 ${COLORS.gray.text500}`} />
                <span>
                  {minBudget && `${minBudget}`}
                  {minBudget && maxBudget && ' - '}
                  {maxBudget && `${maxBudget}`}
                </span>
              </div>
            );
          }
          return <span className={COLORS.gray.text500}>-</span>;
        })()}
      </TableCell>
      <TableCell>
        <Badge className={getStatusBadge(inquiry.status)}>
          {t(`status.${inquiry.status}`)}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          {(inquiry.status === 'matched' || inquiry.status === 'contacted') && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleViewMatches(inquiry)}
              className="flex items-center gap-1"
            >
              <Eye className="h-4 w-4" />
              {t('table.viewMatches')}
            </Button>
          )}
          <TableActionButtons
            onEdit={() => handleEditInquiry(inquiry)}
            onDelete={() => handleDeleteClick(inquiry)}
          />
        </div>
      </TableCell>
    </TableRow>
  );

  const renderMobileCard = (inquiry: PropertyInquiry, index: number) => (
    <div key={inquiry.id} className={`p-4 rounded-lg border ${COLORS.gray.border200} space-y-3`}>
      <div className="flex items-start justify-between">
        <div className="space-y-1 flex-1">
          <div className={`font-medium ${COLORS.gray.text900}`}>{inquiry.name}</div>
          <div className={`text-sm ${COLORS.gray.text500} flex items-center gap-1`}>
            <Phone className="h-3 w-3" />
            {inquiry.phone}
          </div>
          {inquiry.email && (
            <div className={`text-sm ${COLORS.gray.text500} flex items-center gap-1`}>
              <Mail className="h-3 w-3" />
              {inquiry.email}
            </div>
          )}
        </div>
        <Badge className={getStatusBadge(inquiry.status)}>
          {t(`status.${inquiry.status}`)}
        </Badge>
      </div>

      {(inquiry.preferred_city || inquiry.preferred_district) && (
        <div className={`text-sm ${COLORS.gray.text600} flex items-center gap-1`}>
          <MapPin className={`h-4 w-4 ${COLORS.gray.text500}`} />
          {inquiry.preferred_city}
          {inquiry.preferred_city && inquiry.preferred_district && ', '}
          {inquiry.preferred_district}
        </div>
      )}

      {(() => {
        const inquiryTyped = inquiry as any;
        const isRental = inquiryTyped.inquiry_type === 'rental';
        const minBudget = isRental ? inquiryTyped.min_rent_budget : inquiryTyped.min_sale_budget;
        const maxBudget = isRental ? inquiryTyped.max_rent_budget : inquiryTyped.max_sale_budget;

        if (minBudget || maxBudget) {
          return (
            <div className={`text-sm ${COLORS.gray.text600} flex items-center gap-1`}>
              <DollarSign className={`h-4 w-4 ${COLORS.gray.text500}`} />
              {minBudget && `${minBudget}`}
              {minBudget && maxBudget && ' - '}
              {maxBudget && `${maxBudget}`}
            </div>
          );
        }
        return null;
      })()}

      <div className="flex items-center gap-2 pt-2">
        {(inquiry.status === 'matched' || inquiry.status === 'contacted') && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleViewMatches(inquiry)}
            className="flex items-center gap-1 flex-1"
          >
            <Eye className="h-4 w-4" />
            {t('table.viewMatches')}
          </Button>
        )}
        <TableActionButtons
          onEdit={() => handleEditInquiry(inquiry)}
          onDelete={() => handleDeleteClick(inquiry)}
        />
      </div>
    </div>
  );

  return (
    <>
      {/* Inquiry Type Filter */}
      <div className="mb-6">
        <Tabs value={inquiryTypeFilter} onValueChange={(value) => setInquiryTypeFilter(value as 'all' | 'rental' | 'sale')}>
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="all" className="flex items-center gap-2">
              <Inbox className="h-4 w-4" />
              {t('typeFilter.all')}
            </TabsTrigger>
            <TabsTrigger value="rental" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              {t('typeFilter.rental')}
            </TabsTrigger>
            <TabsTrigger value="sale" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              {t('typeFilter.sale')}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="all">{t('tabs.all')}</TabsTrigger>
          <TabsTrigger value="active">{t('tabs.active')}</TabsTrigger>
          <TabsTrigger value="matched">{t('tabs.matched')}</TabsTrigger>
          <TabsTrigger value="contacted">{t('tabs.contacted')}</TabsTrigger>
          <TabsTrigger value="closed">{t('tabs.closed')}</TabsTrigger>
        </TabsList>

        <TabsContent value={statusFilter} className="mt-0">
          <ListPageTemplate
            title={t('title')}
            items={filteredInquiries}
            loading={loading}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder={t('searchPlaceholder')}
            onAdd={handleAddInquiry}
            addButtonLabel={t('addNew')}
            renderTableHeaders={() => (
              <>
                <TableHead>{t('table.name')}</TableHead>
                <TableHead>{t('table.preferences')}</TableHead>
                <TableHead>{t('table.budget')}</TableHead>
                <TableHead>{t('table.status')}</TableHead>
                <TableHead>{t('table.actions')}</TableHead>
              </>
            )}
            renderTableRow={renderDesktopRow}
            renderCardContent={renderMobileCard}
            emptyState={{
              icon: <Inbox className="h-4 w-4" />,
              title: t('emptyState.noInquiriesYet'),
              description: t('emptyState.noInquiriesYetDescription'),
              actionLabel: t('emptyState.addActionLabel'),
              showAction: true,
            }}
            deleteDialog={{
              open: deleteDialogOpen,
              title: t('deleteDialog.title'),
              description: t('deleteDialog.description', {
                inquiryName: inquiryToDelete?.name || '',
              }),
              onConfirm: handleDeleteConfirm,
              onCancel: () => setDeleteDialogOpen(false),
              loading: actionLoading,
            }}
          />
        </TabsContent>
      </Tabs>

      <InquiryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        inquiry={selectedInquiry}
        onSubmit={handleSubmit}
        loading={actionLoading}
      />

      <InquiryMatchesDialog
        open={matchesDialogOpen}
        onOpenChange={setMatchesDialogOpen}
        inquiry={selectedInquiryForMatches}
        onInquiryUpdate={loadInquiries}
      />
    </>
  );
};
