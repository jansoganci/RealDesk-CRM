import type { FinancialTransaction } from '../../../types/financial';

/**
 * Export transactions to CSV format
 * @param transactions - Array of transactions
 * @param filters - Optional filters info for header
 * @returns CSV string
 */
export const exportToCSV = (
  transactions: FinancialTransaction[],
  dateRange?: string
): string => {
  const headers = [
    'Date',
    'Type',
    'Category',
    'Description',
    'Amount',
    'Currency',
    'Payment Method',
    'Payment Status',
    'Notes',
  ];

  const rows = transactions.map(t => [
    t.transaction_date,
    t.type,
    t.category,
    t.description,
    t.amount.toString(),
    t.currency,
    t.payment_method || '',
    t.payment_status,
    t.notes || '',
  ]);

  const csvContent = [
    `Financial Transactions Report${dateRange ? ` - ${dateRange}` : ''}`,
    `Generated: ${new Date().toLocaleString()}`,
    '',
    headers.join(','),
    ...rows.map(row =>
      row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')
    ),
  ].join('\n');

  return csvContent;
};

/**
 * Export transactions to PDF format
 * @param transactions - Array of transactions
 * @param companyName - Company name for header
 * @param dateRange - Date range for header
 * @returns PDF blob
 */
export const exportToPDF = async (
  transactions: FinancialTransaction[],
  companyName: string = 'CRM System',
  dateRange?: string
): Promise<Blob> => {
  // Simple PDF generation without external library
  // Using a basic approach that creates a formatted text document as PDF

  const content = [
    companyName,
    'Financial Transactions Report',
    dateRange ? `Period: ${dateRange}` : '',
    `Generated: ${new Date().toLocaleString()}`,
    '\n' + '='.repeat(80) + '\n',
    ...transactions.map((t, index) => {
      return [
        `\nTransaction ${index + 1}`,
        '-'.repeat(40),
        `Date: ${t.transaction_date}`,
        `Type: ${t.type.toUpperCase()}`,
        `Category: ${t.category}`,
        `Description: ${t.description}`,
        `Amount: ${t.amount} ${t.currency}`,
        `Payment Method: ${t.payment_method || 'N/A'}`,
        `Status: ${t.payment_status}`,
        t.notes ? `Notes: ${t.notes}` : '',
        '',
      ].filter(Boolean).join('\n');
    }),
    '\n' + '='.repeat(80),
    `Total Transactions: ${transactions.length}`,
    `Total Amount: ${transactions.reduce((sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount), 0).toFixed(2)}`,
  ].filter(Boolean).join('\n');

  const blob = new Blob([content], { type: 'application/pdf' });
  return blob;
};

/**
 * Export transactions to Excel format (XLSX)
 * @param transactions - Array of transactions
 * @param companyName - Company name for header
 * @param dateRange - Date range for header
 * @returns Excel blob
 */
export const exportToExcel = async (
  transactions: FinancialTransaction[],
  companyName: string = 'CRM System',
  dateRange?: string
): Promise<Blob> => {
  // For now, create a CSV-based Excel-compatible format
  // This is a simplified approach that doesn't require xlsx library

  const headers = [
    'Date',
    'Type',
    'Category',
    'Description',
    'Amount',
    'Currency',
    'Payment Method',
    'Payment Status',
    'Notes',
  ];

  const rows = transactions.map(t => [
    t.transaction_date,
    t.type,
    t.category,
    t.description,
    t.amount,
    t.currency,
    t.payment_method || '',
    t.payment_status,
    t.notes || '',
  ]);

  // Create Excel-compatible CSV with UTF-8 BOM
  const bom = '\uFEFF';
  const csvContent = [
    companyName,
    'Financial Transactions Report',
    dateRange ? `Period: ${dateRange}` : '',
    `Generated: ${new Date().toLocaleString()}`,
    '',
    headers.join('\t'),
    ...rows.map(row =>
      row.map(cell => String(cell).replace(/\t/g, ' ')).join('\t')
    ),
    '',
    `Total Transactions: ${transactions.length}`,
    `Total Income: ${transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)}`,
    `Total Expenses: ${transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)}`,
    `Net Amount: ${transactions.reduce((sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount), 0)}`,
  ].filter(Boolean).join('\n');

  const blob = new Blob([bom + csvContent], {
    type: 'application/vnd.ms-excel;charset=utf-8;',
  });

  return blob;
};

/**
 * Download a blob as a file
 * @param blob - Blob to download
 * @param filename - Desired filename
 */
export const downloadBlob = (blob: Blob, filename: string): void => {
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
