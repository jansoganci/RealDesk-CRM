import { useState, useMemo } from 'react';
import type { PropertyInquiry } from '@/types';

export function useInquiryFilters(inquiries: PropertyInquiry[]) {
  const [searchQuery, setSearchQuery] = useState('');
  const [inquiryTypeFilter, setInquiryTypeFilter] = useState<'all' | 'rental' | 'sale'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredInquiries = useMemo(() => {
    if (!Array.isArray(inquiries)) {
      return [];
    }

    let filtered = inquiries;

    // Filter by inquiry type
    if (inquiryTypeFilter !== 'all') {
      filtered = filtered.filter((inquiry) => inquiry.inquiry_type === inquiryTypeFilter);
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

    return filtered;
  }, [inquiries, searchQuery, inquiryTypeFilter, statusFilter]);

  return {
    filteredInquiries,
    searchQuery,
    setSearchQuery,
    inquiryTypeFilter,
    setInquiryTypeFilter,
    statusFilter,
    setStatusFilter,
  };
}

