# Dark Mode Audit
Date: 2026-05-10
Scanner: Codex 5.3

## Summary
- Total files scanned: 584
- Files with dark mode: 15
- Files missing dark mode: 152

## Per-Component Breakdown

### 1. Layout components (MainLayout, Navbar, Sidebar, PageContainer)
- File path: `src/components/layout/Sidebar.tsx`
- Dark mode status: Partial
- What's missing: `bg-white` on line 145 needs `dark:bg-slate-900`; `bg-slate-50` on line 171 needs `dark:bg-slate-800/70`; `bg-white` on line 186 needs `dark:bg-slate-900`; `bg-white` on line 199 needs `dark:bg-slate-900`; +1 more
- Priority: High

- File path: `src/components/layout/MainLayout.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/components/layout/Navbar.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/components/layout/PageContainer.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

### 2. UI primitives (card, input, button, table, dialog, etc.)
- File path: `src/components/ui/cookie-error-boundary.tsx`
- Dark mode status: Missing
- What's missing: `text-gray-900` on line 99 needs `dark:text-slate-100`; `text-gray-700` on line 102 needs `dark:text-slate-200`
- Priority: Low

- File path: `src/components/ui/button.tsx`
- Dark mode status: Missing
- What's missing: `bg-gray-50` on line 21 needs `dark:bg-slate-800/70`
- Priority: Low

- File path: `src/components/ui/cookie-preferences.tsx`
- Dark mode status: Missing
- What's missing: `bg-gray-100` on line 108 needs `dark:bg-slate-800`
- Priority: Low

- File path: `src/components/ui/cookie-settings-link.tsx`
- Dark mode status: Missing
- What's missing: `text-gray-600` on line 21 needs `dark:text-slate-300`
- Priority: Low

- File path: `src/components/ui/skeleton.tsx`
- Dark mode status: Missing
- What's missing: `bg-gray-200` on line 9 needs `dark:bg-slate-700`
- Priority: Low

- File path: `src/components/ui/accordion.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/components/ui/alert-dialog.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/components/ui/alert.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/components/ui/animated-tabs.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/components/ui/aspect-ratio.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/components/ui/avatar.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/components/ui/badge.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/components/ui/breadcrumb.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/components/ui/calendar.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/components/ui/card.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/components/ui/carousel.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/components/ui/checkbox.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/components/ui/collapsible.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/components/ui/command.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/components/ui/cookie-notice.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/components/ui/dialog.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/components/ui/drawer.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/components/ui/dropdown-menu.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/components/ui/form.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/components/ui/input.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/components/ui/label.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/components/ui/pagination.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/components/ui/popover.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/components/ui/progress.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/components/ui/radio-group.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/components/ui/resizable.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/components/ui/scroll-area.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/components/ui/select.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/components/ui/separator.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/components/ui/sheet.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/components/ui/slider.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/components/ui/sonner.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/components/ui/switch.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/components/ui/table.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/components/ui/tabs.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/components/ui/textarea.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/components/ui/toggle-group.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/components/ui/toggle.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/components/ui/tooltip.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

### 3. Feature pages (dashboard, properties, leads, deals, etc.)
- File path: `src/features/reminders/components/CallListRow.tsx`
- Dark mode status: Missing
- What's missing: `bg-gray-50` on line 71 needs `dark:bg-slate-800/70`; `text-slate-900` on line 97 needs `dark:text-slate-100`; `text-gray-500` on line 100 needs `dark:text-slate-400`; `bg-gray-100` on line 109 needs `dark:bg-slate-800`; +18 more
- Priority: High

- File path: `src/features/screening/ScreeningPage.tsx`
- Dark mode status: Missing
- What's missing: `bg-slate-100` on line 32 needs `dark:bg-slate-800`; `text-slate-700` on line 32 needs `dark:text-slate-200`; `text-slate-900` on line 152 needs `dark:text-slate-100`; `text-slate-500` on line 153 needs `dark:text-slate-400`; +15 more
- Priority: High

- File path: `src/features/properties/components/PropertyCard.tsx`
- Dark mode status: Missing
- What's missing: `text-slate-900` on line 79 needs `dark:text-slate-100`; `text-slate-600` on line 96 needs `dark:text-slate-300`; `bg-gray-50` on line 107 needs `dark:bg-slate-800/70`; `text-slate-600` on line 110 needs `dark:text-slate-300`; +13 more
- Priority: High

- File path: `src/features/profile/components/SubscriptionStatusCard.tsx`
- Dark mode status: Missing
- What's missing: `bg-gray-50` on line 73 needs `dark:bg-slate-800/70`; `bg-gray-50` on line 74 needs `dark:bg-slate-800/70`; `bg-gray-50` on line 78 needs `dark:bg-slate-800/70`; `bg-gray-200` on line 110 needs `dark:bg-slate-700`; +11 more
- Priority: High

- File path: `src/features/deposit-tracker/DepositTrackerPage.tsx`
- Dark mode status: Missing
- What's missing: `bg-slate-50` on line 39 needs `dark:bg-slate-800/70`; `text-slate-900` on line 132 needs `dark:text-slate-100`; `text-slate-500` on line 133 needs `dark:text-slate-400`; `bg-slate-100` on line 151 needs `dark:bg-slate-800`; +10 more
- Priority: High

- File path: `src/features/billing/components/PricingSection.tsx`
- Dark mode status: Missing
- What's missing: `text-slate-900` on line 177 needs `dark:text-slate-100`; `text-slate-600` on line 182 needs `dark:text-slate-300`; `bg-white` on line 191 needs `dark:bg-slate-900`; `text-slate-600` on line 196 needs `dark:text-slate-300`; +9 more
- Priority: High

- File path: `src/features/compliance/components/RequestDetailSheet.tsx`
- Dark mode status: Missing
- What's missing: `bg-slate-100` on line 21 needs `dark:bg-slate-800`; `text-slate-700` on line 21 needs `dark:text-slate-200`; `text-slate-700` on line 71 needs `dark:text-slate-200`; `bg-slate-50` on line 72 needs `dark:bg-slate-800/70`; +9 more
- Priority: High

- File path: `src/features/contracts/import/components/SuccessStep.tsx`
- Dark mode status: Missing
- What's missing: `text-gray-500` on line 33 needs `dark:text-slate-400`; `text-gray-900` on line 55 needs `dark:text-slate-100`; `text-gray-600` on line 58 needs `dark:text-slate-300`; `text-gray-800` on line 65 needs `dark:text-slate-100`; +9 more
- Priority: High

- File path: `src/features/contractsSale/SaleContractsList.tsx`
- Dark mode status: Missing
- What's missing: `bg-slate-100` on line 83 needs `dark:bg-slate-800`; `text-slate-700` on line 83 needs `dark:text-slate-200`; `bg-gray-100` on line 99 needs `dark:bg-slate-800`; `text-gray-600` on line 99 needs `dark:text-slate-300`; +9 more
- Priority: High

- File path: `src/features/finance/components/AverageDaysToClose.tsx`
- Dark mode status: Missing
- What's missing: `bg-white` on line 20 needs `dark:bg-slate-900`; `bg-white` on line 36 needs `dark:bg-slate-900`; `text-gray-600` on line 39 needs `dark:text-slate-300`; `text-gray-500` on line 48 needs `dark:text-slate-400`; +9 more
- Priority: High

- File path: `src/features/finance/components/MarketingROI.tsx`
- Dark mode status: Missing
- What's missing: `bg-white` on line 38 needs `dark:bg-slate-900`; `bg-white` on line 54 needs `dark:bg-slate-900`; `text-gray-600` on line 57 needs `dark:text-slate-300`; `text-gray-500` on line 66 needs `dark:text-slate-400`; +9 more
- Priority: High

- File path: `src/features/finance/components/PerformanceSummary.tsx`
- Dark mode status: Missing
- What's missing: `bg-white` on line 49 needs `dark:bg-slate-900`; `bg-white` on line 75 needs `dark:bg-slate-900`; `text-gray-600` on line 78 needs `dark:text-slate-300`; `text-slate-900` on line 91 needs `dark:text-slate-100`; +9 more
- Priority: High

- File path: `src/features/finance/components/UpcomingBills.tsx`
- Dark mode status: Missing
- What's missing: `bg-white` on line 101 needs `dark:bg-slate-900`; `bg-white` on line 118 needs `dark:bg-slate-900`; `text-slate-900` on line 125 needs `dark:text-slate-100`; `text-gray-600` on line 128 needs `dark:text-slate-300`; +9 more
- Priority: High

- File path: `src/features/calendar/CalendarPage.tsx`
- Dark mode status: Missing
- What's missing: `text-gray-500` on line 38 needs `dark:text-slate-400`; `text-gray-500` on line 41 needs `dark:text-slate-400`; `text-gray-500` on line 44 needs `dark:text-slate-400`; `text-gray-800` on line 56 needs `dark:text-slate-100`; +8 more
- Priority: High

- File path: `src/features/finance/components/BudgetComparison.tsx`
- Dark mode status: Missing
- What's missing: `bg-white` on line 36 needs `dark:bg-slate-900`; `bg-white` on line 49 needs `dark:bg-slate-900`; `text-slate-900` on line 51 needs `dark:text-slate-100`; `text-gray-500` on line 58 needs `dark:text-slate-400`; +8 more
- Priority: High

- File path: `src/features/team/TeamPerformance.tsx`
- Dark mode status: Missing
- What's missing: `text-gray-900` on line 178 needs `dark:text-slate-100`; `text-gray-500` on line 232 needs `dark:text-slate-400`; `text-gray-500` on line 235 needs `dark:text-slate-400`; `text-gray-500` on line 238 needs `dark:text-slate-400`; +8 more
- Priority: High

- File path: `src/features/dashboard/components/WelcomeEmptyState.tsx`
- Dark mode status: Missing
- What's missing: `text-slate-900` on line 19 needs `dark:text-slate-100`; `text-slate-600` on line 22 needs `dark:text-slate-300`; `bg-white` on line 34 needs `dark:bg-slate-900`; `bg-white` on line 34 needs `dark:bg-slate-900`; +7 more
- Priority: High

- File path: `src/features/finance/components/FinancialCharts.tsx`
- Dark mode status: Missing
- What's missing: `bg-gray-200` on line 59 needs `dark:bg-slate-700`; `bg-gray-100` on line 62 needs `dark:bg-slate-800`; `bg-white` on line 69 needs `dark:bg-slate-900`; `text-gray-600` on line 72 needs `dark:text-slate-300`; +7 more
- Priority: High

- File path: `src/features/finance/components/RecurringExpensesList.tsx`
- Dark mode status: Missing
- What's missing: `bg-gray-100` on line 117 needs `dark:bg-slate-800`; `text-gray-700` on line 117 needs `dark:text-slate-200`; `bg-white` on line 192 needs `dark:bg-slate-900`; `bg-white` on line 253 needs `dark:bg-slate-900`; +7 more
- Priority: High

- File path: `src/features/profile/components/LegalDocumentsCard.tsx`
- Dark mode status: Missing
- What's missing: `text-slate-900` on line 20 needs `dark:text-slate-100`; `text-slate-600` on line 23 needs `dark:text-slate-300`; `bg-white` on line 36 needs `dark:bg-slate-900`; `text-slate-900` on line 43 needs `dark:text-slate-100`; +7 more
- Priority: High

- File path: `src/features/screening/components/ScreeningDetailSheet.tsx`
- Dark mode status: Missing
- What's missing: `bg-slate-100` on line 27 needs `dark:bg-slate-800`; `text-slate-700` on line 27 needs `dark:text-slate-200`; `text-slate-500` on line 105 needs `dark:text-slate-400`; `text-slate-700` on line 110 needs `dark:text-slate-200`; +7 more
- Priority: High

- File path: `src/features/compliance/ComplianceDashboard.tsx`
- Dark mode status: Missing
- What's missing: `bg-slate-100` on line 23 needs `dark:bg-slate-800`; `text-slate-700` on line 23 needs `dark:text-slate-200`; `text-slate-500` on line 72 needs `dark:text-slate-400`; `bg-slate-100` on line 96 needs `dark:bg-slate-800`; +6 more
- Priority: High

- File path: `src/features/contracts/import/components/ExtractingStep.tsx`
- Dark mode status: Missing
- What's missing: `text-gray-800` on line 24 needs `dark:text-slate-100`; `bg-gray-200` on line 29 needs `dark:bg-slate-700`; `text-gray-600` on line 37 needs `dark:text-slate-300`; `bg-gray-100` on line 53 needs `dark:bg-slate-800`; +6 more
- Priority: High

- File path: `src/features/dashboard/PDFExtractButton.tsx`
- Dark mode status: Missing
- What's missing: `text-gray-600` on line 166 needs `dark:text-slate-300`; `text-gray-600` on line 178 needs `dark:text-slate-300`; `text-gray-900` on line 184 needs `dark:text-slate-100`; `text-gray-600` on line 188 needs `dark:text-slate-300`; +6 more
- Priority: High

- File path: `src/features/finance/components/CommissionByClientType.tsx`
- Dark mode status: Missing
- What's missing: `bg-white` on line 38 needs `dark:bg-slate-900`; `bg-white` on line 54 needs `dark:bg-slate-900`; `text-gray-600` on line 57 needs `dark:text-slate-300`; `text-gray-500` on line 66 needs `dark:text-slate-400`; +6 more
- Priority: High

- File path: `src/features/finance/components/CommissionByPropertyType.tsx`
- Dark mode status: Missing
- What's missing: `bg-white` on line 36 needs `dark:bg-slate-900`; `bg-white` on line 52 needs `dark:bg-slate-900`; `text-gray-600` on line 55 needs `dark:text-slate-300`; `text-gray-500` on line 64 needs `dark:text-slate-400`; +6 more
- Priority: High

- File path: `src/features/finance/components/TransactionsTable.tsx`
- Dark mode status: Missing
- What's missing: `text-gray-500` on line 209 needs `dark:text-slate-400`; `bg-white` on line 251 needs `dark:bg-slate-900`; `bg-gray-50` on line 254 needs `dark:bg-slate-800/70`; `bg-gray-100` on line 256 needs `dark:bg-slate-800`; +6 more
- Priority: High

- File path: `src/features/landing/ContactPage.tsx`
- Dark mode status: Missing
- What's missing: `bg-white` on line 16 needs `dark:bg-slate-900`; `text-gray-900` on line 20 needs `dark:text-slate-100`; `text-gray-700` on line 24 needs `dark:text-slate-200`; `text-gray-900` on line 34 needs `dark:text-slate-100`; +6 more
- Priority: High

- File path: `src/features/deposit-tracker/components/DeductionsList.tsx`
- Dark mode status: Missing
- What's missing: `bg-slate-100` on line 37 needs `dark:bg-slate-800`; `text-slate-700` on line 37 needs `dark:text-slate-200`; `text-slate-700` on line 102 needs `dark:text-slate-200`; `bg-slate-50` on line 121 needs `dark:bg-slate-800/70`; +5 more
- Priority: High

- File path: `src/features/finance/components/ConversionFunnel.tsx`
- Dark mode status: Missing
- What's missing: `bg-white` on line 31 needs `dark:bg-slate-900`; `bg-white` on line 47 needs `dark:bg-slate-900`; `text-gray-600` on line 50 needs `dark:text-slate-300`; `text-gray-500` on line 59 needs `dark:text-slate-400`; +5 more
- Priority: High

- File path: `src/features/properties/MarkAsSoldDialog.tsx`
- Dark mode status: Missing
- What's missing: `text-slate-900` on line 82 needs `dark:text-slate-100`; `text-slate-600` on line 88 needs `dark:text-slate-300`; `text-slate-600` on line 98 needs `dark:text-slate-300`; `text-slate-900` on line 99 needs `dark:text-slate-100`; +5 more
- Priority: High

- File path: `src/features/dashboard/components/IncomeForecastCard.tsx`
- Dark mode status: Missing
- What's missing: `text-slate-600` on line 22 needs `dark:text-slate-300`; `text-slate-600` on line 28 needs `dark:text-slate-300`; `text-slate-900` on line 29 needs `dark:text-slate-100`; `text-slate-600` on line 32 needs `dark:text-slate-300`; +4 more
- Priority: High

- File path: `src/features/finance/components/TopCategories.tsx`
- Dark mode status: Missing
- What's missing: `bg-white` on line 38 needs `dark:bg-slate-900`; `bg-white` on line 93 needs `dark:bg-slate-900`; `text-slate-900` on line 106 needs `dark:text-slate-100`; `text-gray-600` on line 109 needs `dark:text-slate-300`; +4 more
- Priority: High

- File path: `src/features/profile/components/AccountSecurityCard.tsx`
- Dark mode status: Missing
- What's missing: `text-gray-600` on line 19 needs `dark:text-slate-300`; `text-gray-900` on line 23 needs `dark:text-slate-100`; `text-gray-500` on line 24 needs `dark:text-slate-400`; `bg-gray-50` on line 32 needs `dark:bg-slate-800/70`; +4 more
- Priority: High

- File path: `src/features/deals/components/AlertCenter.tsx`
- Dark mode status: Missing
- What's missing: `bg-gray-100` on line 58 needs `dark:bg-slate-800`; `text-gray-700` on line 58 needs `dark:text-slate-200`; `text-slate-600` on line 79 needs `dark:text-slate-300`; `text-slate-600` on line 81 needs `dark:text-slate-300`; +3 more
- Priority: High

- File path: `src/features/finance/components/CommissionTrends.tsx`
- Dark mode status: Missing
- What's missing: `bg-white` on line 40 needs `dark:bg-slate-900`; `bg-white` on line 59 needs `dark:bg-slate-900`; `text-gray-600` on line 62 needs `dark:text-slate-300`; `text-gray-500` on line 71 needs `dark:text-slate-400`; +3 more
- Priority: High

- File path: `src/features/inquiries/InquiryTypeSelector.tsx`
- Dark mode status: Missing
- What's missing: `bg-gray-100` on line 16 needs `dark:bg-slate-800`; `bg-white` on line 26 needs `dark:bg-slate-900`; `bg-gray-50` on line 26 needs `dark:bg-slate-800/70`; `text-gray-700` on line 26 needs `dark:text-slate-200`; +3 more
- Priority: High

- File path: `src/features/properties/PropertyTypeSelector.tsx`
- Dark mode status: Missing
- What's missing: `bg-gray-100` on line 19 needs `dark:bg-slate-800`; `bg-white` on line 29 needs `dark:bg-slate-900`; `bg-gray-50` on line 29 needs `dark:bg-slate-800/70`; `text-gray-700` on line 29 needs `dark:text-slate-200`; +3 more
- Priority: High

- File path: `src/features/reminders/components/ReminderLoadingSkeleton.tsx`
- Dark mode status: Missing
- What's missing: `bg-gray-200` on line 21 needs `dark:bg-slate-700`; `bg-gray-200` on line 32 needs `dark:bg-slate-700`; `bg-gray-200` on line 33 needs `dark:bg-slate-700`; `bg-gray-200` on line 35 needs `dark:bg-slate-700`; +3 more
- Priority: High

- File path: `src/features/compliance/CompliancePage.tsx`
- Dark mode status: Missing
- What's missing: `bg-white` on line 33 needs `dark:bg-slate-900`; `bg-white` on line 37 needs `dark:bg-slate-900`; `bg-white` on line 45 needs `dark:bg-slate-900`; `bg-white` on line 53 needs `dark:bg-slate-900`; +2 more
- Priority: High

- File path: `src/features/contractsSale/SaleContractBuilder.tsx`
- Dark mode status: Missing
- What's missing: `bg-gray-50` on line 474 needs `dark:bg-slate-800/70`; `text-gray-500` on line 477 needs `dark:text-slate-400`; `text-gray-500` on line 481 needs `dark:text-slate-400`; `text-gray-500` on line 485 needs `dark:text-slate-400`; +2 more
- Priority: High

- File path: `src/features/contractsSale/SaleContractEdit.tsx`
- Dark mode status: Missing
- What's missing: `bg-gray-50` on line 488 needs `dark:bg-slate-800/70`; `text-gray-500` on line 491 needs `dark:text-slate-400`; `text-gray-500` on line 495 needs `dark:text-slate-400`; `text-gray-500` on line 499 needs `dark:text-slate-400`; +2 more
- Priority: High

- File path: `src/features/deals/components/DocumentsTab.tsx`
- Dark mode status: Missing
- What's missing: `text-slate-600` on line 108 needs `dark:text-slate-300`; `text-slate-600` on line 118 needs `dark:text-slate-300`; `text-slate-600` on line 147 needs `dark:text-slate-300`; `text-slate-600` on line 175 needs `dark:text-slate-300`; +2 more
- Priority: High

- File path: `src/features/finance/components/FinancialSummaryCards.tsx`
- Dark mode status: Missing
- What's missing: `bg-white` on line 73 needs `dark:bg-slate-900`; `bg-white` on line 132 needs `dark:bg-slate-900`; `text-gray-600` on line 136 needs `dark:text-slate-300`; `text-slate-900` on line 147 needs `dark:text-slate-100`; +2 more
- Priority: High

- File path: `src/features/landing/AboutPage.tsx`
- Dark mode status: Missing
- What's missing: `bg-white` on line 15 needs `dark:bg-slate-900`; `text-gray-900` on line 19 needs `dark:text-slate-100`; `text-gray-700` on line 23 needs `dark:text-slate-200`; `text-gray-900` on line 28 needs `dark:text-slate-100`; +2 more
- Priority: High

- File path: `src/features/organization/AcceptInvite.tsx`
- Dark mode status: Partial
- What's missing: `text-slate-500` on line 77 needs `dark:text-slate-400`; `text-slate-500` on line 94 needs `dark:text-slate-400`; `bg-white` on line 121 needs `dark:bg-slate-900`; `bg-white` on line 122 needs `dark:bg-slate-900`; +2 more
- Priority: High

- File path: `src/features/compliance/components/DataSubjectRequestForm.tsx`
- Dark mode status: Missing
- What's missing: `text-slate-500` on line 82 needs `dark:text-slate-400`; `text-slate-500` on line 96 needs `dark:text-slate-400`; `text-slate-500` on line 124 needs `dark:text-slate-400`; `bg-slate-50` on line 192 needs `dark:bg-slate-800/70`; +1 more
- Priority: High

- File path: `src/features/dashboard/components/ThisWeek.tsx`
- Dark mode status: Missing
- What's missing: `text-slate-600` on line 39 needs `dark:text-slate-300`; `bg-white` on line 42 needs `dark:bg-slate-900`; `text-slate-900` on line 45 needs `dark:text-slate-100`; `text-slate-700` on line 46 needs `dark:text-slate-200`; +1 more
- Priority: High

- File path: `src/features/deals/components/AmendmentsTab.tsx`
- Dark mode status: Missing
- What's missing: `text-slate-600` on line 215 needs `dark:text-slate-300`; `text-slate-600` on line 219 needs `dark:text-slate-300`; `text-slate-500` on line 227 needs `dark:text-slate-400`; `text-slate-900` on line 229 needs `dark:text-slate-100`; +1 more
- Priority: High

- File path: `src/features/finance/components/FinancialRatios.tsx`
- Dark mode status: Missing
- What's missing: `bg-white` on line 42 needs `dark:bg-slate-900`; `bg-white` on line 103 needs `dark:bg-slate-900`; `text-gray-600` on line 107 needs `dark:text-slate-300`; `text-slate-900` on line 120 needs `dark:text-slate-100`; +1 more
- Priority: High

- File path: `src/features/finance/components/FinancialTrends.tsx`
- Dark mode status: Missing
- What's missing: `bg-white` on line 34 needs `dark:bg-slate-900`; `bg-white` on line 132 needs `dark:bg-slate-900`; `text-slate-900` on line 136 needs `dark:text-slate-100`; `text-gray-600` on line 139 needs `dark:text-slate-300`; +1 more
- Priority: High

- File path: `src/features/landing/PublicPricingPage.tsx`
- Dark mode status: Missing
- What's missing: `bg-white` on line 13 needs `dark:bg-slate-900`; `text-slate-500` on line 17 needs `dark:text-slate-400`; `bg-white` on line 32 needs `dark:bg-slate-900`; `text-slate-900` on line 38 needs `dark:text-slate-100`; +1 more
- Priority: High

- File path: `src/features/leads/components/LeadPipelineBoard.tsx`
- Dark mode status: Missing
- What's missing: `bg-white` on line 128 needs `dark:bg-slate-900`; `bg-slate-50` on line 146 needs `dark:bg-slate-800/70`; `bg-white` on line 151 needs `dark:bg-slate-900`; `text-slate-600` on line 155 needs `dark:text-slate-300`; +1 more
- Priority: High

- File path: `src/features/organization/TeamMembersList.tsx`
- Dark mode status: Missing
- What's missing: `bg-gray-200` on line 264 needs `dark:bg-slate-700`; `bg-gray-200` on line 266 needs `dark:bg-slate-700`; `bg-gray-200` on line 267 needs `dark:bg-slate-700`; `bg-gray-200` on line 268 needs `dark:bg-slate-700`; +1 more
- Priority: High

- File path: `src/features/organization/components/ChangeMemberRoleDialog.tsx`
- Dark mode status: Missing
- What's missing: `bg-gray-50` on line 77 needs `dark:bg-slate-800/70`; `text-gray-900` on line 85 needs `dark:text-slate-100`; `text-gray-500` on line 86 needs `dark:text-slate-400`; `text-gray-500` on line 93 needs `dark:text-slate-400`; +1 more
- Priority: High

- File path: `src/features/profile/components/EditProfileDialog.tsx`
- Dark mode status: Missing
- What's missing: `text-slate-900` on line 126 needs `dark:text-slate-100`; `text-slate-600` on line 129 needs `dark:text-slate-300`; `bg-white` on line 137 needs `dark:bg-slate-900`; `bg-white` on line 155 needs `dark:bg-slate-900`; +1 more
- Priority: High

- File path: `src/features/profile/components/TeamMembersCard.tsx`
- Dark mode status: Missing
- What's missing: `text-slate-900` on line 92 needs `dark:text-slate-100`; `text-gray-500` on line 95 needs `dark:text-slate-400`; `text-gray-900` on line 129 needs `dark:text-slate-100`; `text-gray-500` on line 139 needs `dark:text-slate-400`; +1 more
- Priority: High

- File path: `src/features/team/components/TeamSummaryCard.tsx`
- Dark mode status: Missing
- What's missing: `bg-white` on line 26 needs `dark:bg-slate-900`; `bg-gray-100` on line 32 needs `dark:bg-slate-800`; `text-gray-600` on line 32 needs `dark:text-slate-300`; `text-gray-500` on line 42 needs `dark:text-slate-400`; +1 more
- Priority: High

- File path: `src/features/dashboard/components/HorizonZone.tsx`
- Dark mode status: Missing
- What's missing: `bg-white` on line 30 needs `dark:bg-slate-900`; `text-slate-900` on line 33 needs `dark:text-slate-100`; `text-slate-700` on line 34 needs `dark:text-slate-200`; `text-slate-500` on line 35 needs `dark:text-slate-400`
- Priority: High

- File path: `src/features/dashboard/components/OverdueZone.tsx`
- Dark mode status: Missing
- What's missing: `bg-white` on line 40 needs `dark:bg-slate-900`; `text-slate-900` on line 43 needs `dark:text-slate-100`; `text-slate-700` on line 44 needs `dark:text-slate-200`; `text-slate-500` on line 45 needs `dark:text-slate-400`
- Priority: High

- File path: `src/features/dashboard/components/WaitingOnOthers.tsx`
- Dark mode status: Missing
- What's missing: `bg-white` on line 30 needs `dark:bg-slate-900`; `text-slate-900` on line 33 needs `dark:text-slate-100`; `text-slate-700` on line 34 needs `dark:text-slate-200`; `text-slate-500` on line 35 needs `dark:text-slate-400`
- Priority: High

- File path: `src/features/finance/components/FinanceHeader.tsx`
- Dark mode status: Missing
- What's missing: `bg-white` on line 78 needs `dark:bg-slate-900`; `bg-gray-100` on line 85 needs `dark:bg-slate-800`; `bg-gray-100` on line 96 needs `dark:bg-slate-800`; `bg-gray-100` on line 107 needs `dark:bg-slate-800`
- Priority: High

- File path: `src/features/leads/components/KanbanColumn.tsx`
- Dark mode status: Missing
- What's missing: `bg-slate-50` on line 20 needs `dark:bg-slate-800/70`; `bg-white` on line 23 needs `dark:bg-slate-900`; `text-slate-600` on line 25 needs `dark:text-slate-300`; `text-slate-500` on line 26 needs `dark:text-slate-400`
- Priority: High

- File path: `src/features/organization/components/MemberRow.tsx`
- Dark mode status: Missing
- What's missing: `text-gray-900` on line 64 needs `dark:text-slate-100`; `text-gray-500` on line 73 needs `dark:text-slate-400`; `text-gray-600` on line 81 needs `dark:text-slate-300`; `text-gray-600` on line 91 needs `dark:text-slate-300`
- Priority: High

- File path: `src/features/organization/components/TeamMemberRow.tsx`
- Dark mode status: Missing
- What's missing: `text-gray-900` on line 74 needs `dark:text-slate-100`; `text-gray-500` on line 83 needs `dark:text-slate-400`; `text-gray-600` on line 91 needs `dark:text-slate-300`; `text-gray-600` on line 106 needs `dark:text-slate-300`
- Priority: High

- File path: `src/features/profile/components/PreferencesSection.tsx`
- Dark mode status: Missing
- What's missing: `bg-slate-50` on line 103 needs `dark:bg-slate-800/70`; `text-slate-500` on line 103 needs `dark:text-slate-400`; `text-slate-500` on line 107 needs `dark:text-slate-400`; `text-gray-500` on line 208 needs `dark:text-slate-400`
- Priority: High

- File path: `src/features/tenants/steps/ContractSettingsStep.tsx`
- Dark mode status: Missing
- What's missing: `text-gray-600` on line 64 needs `dark:text-slate-300`; `text-gray-600` on line 160 needs `dark:text-slate-300`; `bg-gray-50` on line 187 needs `dark:bg-slate-800/70`; `text-gray-500` on line 192 needs `dark:text-slate-400`
- Priority: High

- File path: `src/features/auth/ForgotPassword.tsx`
- Dark mode status: Missing
- What's missing: `bg-gray-50` on line 72 needs `dark:bg-slate-800/70`; `text-gray-500` on line 73 needs `dark:text-slate-400`; `text-gray-700` on line 74 needs `dark:text-slate-200`
- Priority: High

- File path: `src/features/compliance/components/RequestStatusCheck.tsx`
- Dark mode status: Missing
- What's missing: `bg-slate-100` on line 12 needs `dark:bg-slate-800`; `text-slate-700` on line 12 needs `dark:text-slate-200`; `text-slate-500` on line 76 needs `dark:text-slate-400`
- Priority: High

- File path: `src/features/contracts/import/components/UploadStep.tsx`
- Dark mode status: Missing
- What's missing: `text-gray-800` on line 119 needs `dark:text-slate-100`; `text-gray-500` on line 126 needs `dark:text-slate-400`; `text-gray-500` on line 155 needs `dark:text-slate-400`
- Priority: High

- File path: `src/features/contractsHub/components/ContractTypeCard.tsx`
- Dark mode status: Missing
- What's missing: `bg-gray-100` on line 49 needs `dark:bg-slate-800`; `bg-gray-100` on line 64 needs `dark:bg-slate-800`; `text-gray-500` on line 64 needs `dark:text-slate-400`
- Priority: High

- File path: `src/features/dashboard/components/RemindersSection.tsx`
- Dark mode status: Missing
- What's missing: `bg-white` on line 56 needs `dark:bg-slate-900`; `text-slate-900` on line 61 needs `dark:text-slate-100`; `text-slate-600` on line 63 needs `dark:text-slate-300`
- Priority: High

- File path: `src/features/deposit-tracker/components/DepositDetailSheet.tsx`
- Dark mode status: Missing
- What's missing: `text-slate-700` on line 146 needs `dark:text-slate-200`; `text-slate-500` on line 230 needs `dark:text-slate-400`; `text-slate-800` on line 231 needs `dark:text-slate-100`
- Priority: High

- File path: `src/features/finance/components/FinanceTransactions.tsx`
- Dark mode status: Missing
- What's missing: `bg-white` on line 47 needs `dark:bg-slate-900`; `text-slate-900` on line 49 needs `dark:text-slate-100`; `text-gray-600` on line 52 needs `dark:text-slate-300`
- Priority: High

- File path: `src/features/onboarding/components/Step1GoalSelection.tsx`
- Dark mode status: Missing
- What's missing: `bg-slate-50` on line 142 needs `dark:bg-slate-800/70`; `bg-white` on line 145 needs `dark:bg-slate-900`; `text-slate-700` on line 166 needs `dark:text-slate-200`
- Priority: High

- File path: `src/features/onboarding/components/Step2OrganizationSetup.tsx`
- Dark mode status: Missing
- What's missing: `bg-slate-50` on line 146 needs `dark:bg-slate-800/70`; `bg-white` on line 149 needs `dark:bg-slate-900`; `text-slate-700` on line 164 needs `dark:text-slate-200`
- Priority: High

- File path: `src/features/organization/components/RemoveMemberDialog.tsx`
- Dark mode status: Missing
- What's missing: `bg-gray-50` on line 73 needs `dark:bg-slate-800/70`; `text-gray-900` on line 81 needs `dark:text-slate-100`; `text-gray-500` on line 82 needs `dark:text-slate-400`
- Priority: High

- File path: `src/features/profile/components/OrganizationSettingsCard.tsx`
- Dark mode status: Missing
- What's missing: `text-slate-900` on line 88 needs `dark:text-slate-100`; `bg-gray-100` on line 133 needs `dark:bg-slate-800`; `text-gray-600` on line 133 needs `dark:text-slate-300`
- Priority: High

- File path: `src/features/profile/components/UserInfoHeader.tsx`
- Dark mode status: Missing
- What's missing: `text-slate-900` on line 31 needs `dark:text-slate-100`; `text-slate-600` on line 34 needs `dark:text-slate-300`; `text-slate-500` on line 38 needs `dark:text-slate-400`
- Priority: High

- File path: `src/features/quick-add/QuickAddDialog.tsx`
- Dark mode status: Missing
- What's missing: `text-slate-900` on line 45 needs `dark:text-slate-100`; `text-slate-600` on line 51 needs `dark:text-slate-300`; `bg-slate-50` on line 78 needs `dark:bg-slate-800/70`
- Priority: High

- File path: `src/features/quick-add/sections/PropertySection.tsx`
- Dark mode status: Missing
- What's missing: `bg-slate-50` on line 37 needs `dark:bg-slate-800/70`; `text-slate-900` on line 38 needs `dark:text-slate-100`; `text-slate-800` on line 233 needs `dark:text-slate-100`
- Priority: High

- File path: `src/features/reminders/components/ReminderSummaryCards.tsx`
- Dark mode status: Missing
- What's missing: `bg-white` on line 82 needs `dark:bg-slate-900`; `bg-white` on line 125 needs `dark:bg-slate-900`; `text-slate-700` on line 139 needs `dark:text-slate-200`
- Priority: High

- File path: `src/features/screening/components/ScreeningChecklist.tsx`
- Dark mode status: Missing
- What's missing: `text-slate-700` on line 34 needs `dark:text-slate-200`; `text-slate-500` on line 35 needs `dark:text-slate-400`; `text-slate-700` on line 53 needs `dark:text-slate-200`
- Priority: High

- File path: `src/features/tenants/EnhancedTenantDialog.tsx`
- Dark mode status: Missing
- What's missing: `text-gray-500` on line 302 needs `dark:text-slate-400`; `bg-gray-50` on line 320 needs `dark:bg-slate-800/70`; `text-gray-500` on line 336 needs `dark:text-slate-400`
- Priority: High

- File path: `src/features/tenants/steps/ContractDetailsStep.tsx`
- Dark mode status: Missing
- What's missing: `text-gray-600` on line 64 needs `dark:text-slate-300`; `text-gray-500` on line 89 needs `dark:text-slate-400`; `text-gray-500` on line 140 needs `dark:text-slate-400`
- Priority: High

- File path: `src/features/auth/EmailConfirmation.tsx`
- Dark mode status: Missing
- What's missing: `text-gray-600` on line 128 needs `dark:text-slate-300`; `text-gray-600` on line 154 needs `dark:text-slate-300`
- Priority: Low

- File path: `src/features/auth/Login.tsx`
- Dark mode status: Partial
- What's missing: `bg-white` on line 100 needs `dark:bg-slate-900`; `bg-white` on line 100 needs `dark:bg-slate-900`
- Priority: Low

- File path: `src/features/contracts/components/ContractImportBanner.tsx`
- Dark mode status: Missing
- What's missing: `text-gray-900` on line 22 needs `dark:text-slate-100`; `text-gray-600` on line 26 needs `dark:text-slate-300`
- Priority: Low

- File path: `src/features/contracts/components/EditableClausesSection.tsx`
- Dark mode status: Missing
- What's missing: `text-gray-700` on line 419 needs `dark:text-slate-200`; `text-gray-600` on line 444 needs `dark:text-slate-300`
- Priority: Low

- File path: `src/features/contracts/components/form-sections/ContractDetailsSection.tsx`
- Dark mode status: Missing
- What's missing: `text-gray-600` on line 114 needs `dark:text-slate-300`; `text-slate-700` on line 208 needs `dark:text-slate-200`
- Priority: Low

- File path: `src/features/contracts/import/ContractImportPage.tsx`
- Dark mode status: Missing
- What's missing: `text-gray-600` on line 35 needs `dark:text-slate-300`; `bg-white` on line 51 needs `dark:bg-slate-900`
- Priority: Low

- File path: `src/features/dashboard/components/ActionItemsCard.tsx`
- Dark mode status: Missing
- What's missing: `text-slate-900` on line 53 needs `dark:text-slate-100`; `text-slate-700` on line 56 needs `dark:text-slate-200`
- Priority: Low

- File path: `src/features/finance/components/FinanceFiltersBar.tsx`
- Dark mode status: Missing
- What's missing: `bg-white` on line 92 needs `dark:bg-slate-900`; `text-gray-500` on line 97 needs `dark:text-slate-400`
- Priority: Low

- File path: `src/features/finance/components/RecurringExpensesFiltersBar.tsx`
- Dark mode status: Missing
- What's missing: `bg-white` on line 75 needs `dark:bg-slate-900`; `text-gray-500` on line 95 needs `dark:text-slate-400`
- Priority: Low

- File path: `src/features/leads/components/BuyerAgentAgreementDialog.tsx`
- Dark mode status: Missing
- What's missing: `bg-gray-100` on line 311 needs `dark:bg-slate-800`; `text-gray-700` on line 311 needs `dark:text-slate-200`
- Priority: Low

- File path: `src/features/leads/components/ExpiringAgreementsCard.tsx`
- Dark mode status: Missing
- What's missing: `bg-white` on line 26 needs `dark:bg-slate-900`; `bg-gray-50` on line 61 needs `dark:bg-slate-800/70`
- Priority: Low

- File path: `src/features/organization/components/MemberCard.tsx`
- Dark mode status: Missing
- What's missing: `text-gray-900` on line 63 needs `dark:text-slate-100`; `text-gray-500` on line 73 needs `dark:text-slate-400`
- Priority: Low

- File path: `src/features/organization/components/RoleBadge.tsx`
- Dark mode status: Missing
- What's missing: `bg-gray-50` on line 39 needs `dark:bg-slate-800/70`; `text-gray-600` on line 39 needs `dark:text-slate-300`
- Priority: Low

- File path: `src/features/organization/components/TeamMemberCard.tsx`
- Dark mode status: Missing
- What's missing: `text-gray-900` on line 72 needs `dark:text-slate-100`; `text-gray-500` on line 82 needs `dark:text-slate-400`
- Priority: Low

- File path: `src/features/profile/components/BillingHistoryCard.tsx`
- Dark mode status: Missing
- What's missing: `text-gray-500` on line 102 needs `dark:text-slate-400`; `text-gray-500` on line 182 needs `dark:text-slate-400`
- Priority: Low

- File path: `src/features/properties/components/PropertyPhotoSection.tsx`
- Dark mode status: Missing
- What's missing: `text-gray-500` on line 45 needs `dark:text-slate-400`; `text-gray-700` on line 46 needs `dark:text-slate-200`
- Priority: Low

- File path: `src/features/quick-add/sections/OwnerSection.tsx`
- Dark mode status: Missing
- What's missing: `bg-slate-50` on line 35 needs `dark:bg-slate-800/70`; `text-slate-900` on line 36 needs `dark:text-slate-100`
- Priority: Low

- File path: `src/features/quick-add/sections/TenantSection.tsx`
- Dark mode status: Missing
- What's missing: `bg-slate-50` on line 36 needs `dark:bg-slate-800/70`; `text-slate-900` on line 38 needs `dark:text-slate-100`
- Priority: Low

- File path: `src/features/reminders/components/ReminderTableRow.tsx`
- Dark mode status: Missing
- What's missing: `bg-gray-50` on line 94 needs `dark:bg-slate-800/70`; `bg-gray-50` on line 219 needs `dark:bg-slate-800/70`
- Priority: Low

- File path: `src/features/tenants/components/StepIndicators.tsx`
- Dark mode status: Missing
- What's missing: `bg-gray-50` on line 28 needs `dark:bg-slate-800/70`; `text-gray-500` on line 44 needs `dark:text-slate-400`
- Priority: Low

- File path: `src/features/auth/EmailChanged.tsx`
- Dark mode status: Missing
- What's missing: `text-gray-500` on line 27 needs `dark:text-slate-400`
- Priority: Low

- File path: `src/features/auth/ResetPassword.tsx`
- Dark mode status: Missing
- What's missing: `text-gray-500` on line 105 needs `dark:text-slate-400`
- Priority: Low

- File path: `src/features/contracts/import/components/DocumentPreviewSection.tsx`
- Dark mode status: Missing
- What's missing: `text-gray-500` on line 30 needs `dark:text-slate-400`
- Priority: Low

- File path: `src/features/contracts/import/components/ReviewStep.tsx`
- Dark mode status: Missing
- What's missing: `text-gray-500` on line 78 needs `dark:text-slate-400`
- Priority: Low

- File path: `src/features/dashboard/components/DealHealthCard.tsx`
- Dark mode status: Missing
- What's missing: `text-slate-900` on line 21 needs `dark:text-slate-100`
- Priority: Low

- File path: `src/features/deals/components/PartiesTab.tsx`
- Dark mode status: Missing
- What's missing: `text-slate-900` on line 338 needs `dark:text-slate-100`
- Priority: Low

- File path: `src/features/deals/components/PhaseHeader.tsx`
- Dark mode status: Missing
- What's missing: `bg-white` on line 51 needs `dark:bg-slate-900`
- Priority: Low

- File path: `src/features/finance/components/CurrencySelector.tsx`
- Dark mode status: Missing
- What's missing: `text-gray-600` on line 35 needs `dark:text-slate-300`
- Priority: Low

- File path: `src/features/finance/components/RecurringExpenseDialog.tsx`
- Dark mode status: Missing
- What's missing: `text-gray-500` on line 282 needs `dark:text-slate-400`
- Priority: Low

- File path: `src/features/finance/components/TransactionDialog.tsx`
- Dark mode status: Missing
- What's missing: `text-gray-500` on line 230 needs `dark:text-slate-400`
- Priority: Low

- File path: `src/features/finance/components/YearOverYearIndicator.tsx`
- Dark mode status: Missing
- What's missing: `text-gray-500` on line 50 needs `dark:text-slate-400`
- Priority: Low

- File path: `src/features/landing/LandingPage.tsx`
- Dark mode status: Missing
- What's missing: `bg-white` on line 24 needs `dark:bg-slate-900`
- Priority: High

- File path: `src/features/leads/components/LeadSourceBreakdownCard.tsx`
- Dark mode status: Missing
- What's missing: `bg-white` on line 42 needs `dark:bg-slate-900`
- Priority: Low

- File path: `src/features/profile/components/ProfileInfoCard.tsx`
- Dark mode status: Missing
- What's missing: `text-slate-900` on line 116 needs `dark:text-slate-100`
- Priority: Low

- File path: `src/features/properties/components/OwnerSelectField.tsx`
- Dark mode status: Missing
- What's missing: `text-gray-500` on line 55 needs `dark:text-slate-400`
- Priority: Low

- File path: `src/features/reminders/components/AlarmStatusIcon.tsx`
- Dark mode status: Missing
- What's missing: `text-gray-500` on line 77 needs `dark:text-slate-400`
- Priority: Low

- File path: `src/features/tenants/EnhancedTenantEditDialog.tsx`
- Dark mode status: Missing
- What's missing: `text-gray-500` on line 173 needs `dark:text-slate-400`
- Priority: Low

- File path: `src/features/tenants/steps/TenantInfoStep.tsx`
- Dark mode status: Missing
- What's missing: `text-gray-600` on line 29 needs `dark:text-slate-300`
- Priority: Low

- File path: `src/features/auth/AuthCallback.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/auth/Register.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/auth/authSchemas.ts`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/billing/BillingSubscribe.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/billing/PricingPage.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/compliance/hooks/useCcpaRequests.ts`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/compliance/index.ts`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/compliance/schemas/ccpa.schema.ts`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/contracts/ContractCreate.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/contracts/ContractEdit.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/contracts/Contracts.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/contracts/LeaseDetail.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/contracts/components/AddressInput.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/contracts/components/ConfirmationDialog.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/contracts/components/ContractCreateForm.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/contracts/components/ContractEditForm.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/contracts/components/ContractPdfActionButtons.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/contracts/components/ContractStatusBadge.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/contracts/components/CounterOfferModal.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/contracts/components/FixturesSelector.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/contracts/components/KeyDatesCard.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/contracts/components/LeaseAmendmentTimeline.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/contracts/components/LeaseDetailView.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/contracts/components/OfferHistoryTimeline.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/contracts/components/PurchaseDetailView.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/contracts/components/form-sections/OwnerFormSection.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/contracts/components/form-sections/TenantFormSection.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/contracts/components/form-sections/index.ts`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/contracts/data/testContracts.ts`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/contracts/hooks/useConfirmationDialog.ts`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/contracts/hooks/useContractEditData.ts`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/contracts/hooks/useContractPdfHandler.ts`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/contracts/hooks/useContractPreValidation.ts`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/contracts/hooks/useContractsActions.ts`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/contracts/hooks/useContractsData.ts`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/contracts/hooks/useContractsFilters.ts`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/contracts/hooks/useContractsPdfActions.ts`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/contracts/hooks/usePropertyActiveContract.ts`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/contracts/import/components/ContractSection.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/contracts/import/components/OwnerSection.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/contracts/import/components/PropertySection.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/contracts/import/components/ReviewAlerts.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/contracts/import/components/TenantSection.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/contracts/import/hooks/useContractImport.ts`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/contracts/import/hooks/useReviewFormState.ts`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/contracts/import/hooks/useReviewFormSubmission.ts`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/contracts/import/hooks/useReviewFormValidation.ts`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/contracts/import/types/reviewFormTypes.ts`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/contracts/import/utils/dateUtils.ts`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/contracts/import/utils/mapReviewToContractForm.ts`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/contracts/leaseWizard/LeaseWizard.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/contracts/leaseWizard/LeaseWizardPage.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/contracts/leaseWizard/LeaseWizardStepContent.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/contracts/leaseWizard/index.ts`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/contracts/leaseWizard/leaseAgreementFormDefaults.ts`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/contracts/leaseWizard/leaseWizardStepSchemas.ts`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/contracts/leaseWizard/steps/Step1Property.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/contracts/leaseWizard/steps/Step2Parties.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/contracts/leaseWizard/steps/Step3LeaseTerm.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/contracts/leaseWizard/steps/Step4Financials.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/contracts/leaseWizard/steps/Step5PaymentUtilities.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/contracts/leaseWizard/steps/Step6PropertyDetails.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/contracts/leaseWizard/steps/Step7Policies.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/contracts/leaseWizard/steps/Step8NoticesDisclosures.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/contracts/leaseWizard/useLeaseWizard.ts`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/contracts/purchaseWizard/PurchaseContractDetailPage.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/contracts/purchaseWizard/PurchaseContractDetailView.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/contracts/purchaseWizard/PurchaseWizard.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/contracts/purchaseWizard/PurchaseWizardPage.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/contracts/purchaseWizard/PurchaseWizardStepContent.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/contracts/purchaseWizard/index.ts`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/contracts/purchaseWizard/purchaseAgreementFormDefaults.ts`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/contracts/purchaseWizard/purchaseWizardStepSchemas.ts`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/contracts/purchaseWizard/steps/PurchaseStep8Legal.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/contracts/purchaseWizard/steps/PurchaseStep9Disclosures.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/contracts/purchaseWizard/steps/Step1Property.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/contracts/purchaseWizard/steps/Step2Parties.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/contracts/purchaseWizard/steps/Step3PersonalProperty.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/contracts/purchaseWizard/steps/Step4EarnestMoney.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/contracts/purchaseWizard/steps/Step5Financing.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/contracts/purchaseWizard/steps/Step6Closing.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/contracts/purchaseWizard/steps/Step7Conditions.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/contracts/purchaseWizard/usePurchaseWizard.ts`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/contracts/schemas/contractForm.schema.ts`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/contracts/schemas/leaseAgreementForm.schema.ts`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/contracts/schemas/purchaseAgreementForm.schema.ts`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/contracts/utils/contractUtils.ts`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/contracts/utils/fixturesUtils.ts`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/contractsHub/ContractsHub.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/contractsSale/hooks/useSaleContractPdf.ts`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/contractsSale/schemas/saleContractForm.schema.ts`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/dashboard/Dashboard.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/dashboard/components/DailyBriefHeader.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/dashboard/hooks/useCommissionForecast.ts`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/dashboard/hooks/useDailyBrief.ts`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/dashboard/hooks/useDashboardData.ts`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/dashboard/utils/transformDashboardData.ts`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/deals/DealDetail.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/deals/Deals.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/deals/components/ClosingCountdown.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/deals/components/CommissionSheet.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/deals/components/CommissionWaterfall.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/deals/components/ContingencySummaryCard.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/deals/components/CounterOfferModal.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/deals/components/DealContingenciesPanel.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/deals/components/DealCreationSheet.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/deals/components/DealMilestonesPanel.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/deals/components/DealOffersPanel.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/deals/components/DealOutcomeActions.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/deals/components/KeyDatesCard.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/deals/components/MilestoneCard.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/deals/components/OfferHistoryTimeline.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/deals/components/OfferRoundSheet.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/deals/components/PurchaseDetailView.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/deals/components/TimelineTab.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/deals/hooks/index.ts`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/deals/hooks/useAlertCenter.ts`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/deals/hooks/useAmendmentsTab.ts`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/deals/hooks/useDealDetail.ts`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/deals/hooks/useDeals.ts`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/deals/hooks/useOfferRounds.ts`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/deals/hooks/useTimelineTab.ts`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/deals/schemas/commissionSheetSchema.ts`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/deals/schemas/contingencySchema.ts`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/deals/schemas/dealFormSchema.ts`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/deals/schemas/firstOfferFormSchema.ts`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/deals/schemas/index.ts`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/deals/schemas/offerRoundSchema.ts`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/deals/utils/keyDatesFromPurchase.ts`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/deals/utils/purchaseDealHelpers.ts`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/deposit-tracker/components/DepositDialog.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/deposit-tracker/components/StatusBadge.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/deposit-tracker/hooks/useDepositTracker.ts`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/deposit-tracker/index.ts`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/deposit-tracker/schemas/deposit.schema.ts`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/finance/Finance.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/finance/FinanceDashboard.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/finance/components/CommissionDashboard.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/finance/components/CommissionHistoryTable.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/finance/components/FinanceAnalytics.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/finance/components/FinanceOverview.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/finance/components/MonthlyGCIChart.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/finance/components/SalesVsRentalCard.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/finance/components/YTDStatsRow.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/finance/hooks/useFinanceActions.ts`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/finance/hooks/useFinanceData.ts`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/finance/hooks/useYTDDashboard.ts`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/finance/utils/exportUtils.ts`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/inquiries/InquiryDialog.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/inquiries/InquiryMatchesDialog.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/inquiries/components/InquiryCard.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/inquiries/components/InquiryTableRow.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/inquiries/hooks/useInquiriesData.ts`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/inquiries/hooks/useInquiryActions.ts`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/inquiries/hooks/useInquiryDialogs.ts`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/inquiries/hooks/useInquiryFilters.ts`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/inquiries/inquirySchema.ts`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/inquiries/utils/statusUtils.ts`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/leads/LeadDetailPage.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/leads/Leads.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/leads/components/BuyerAgentAgreementList.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/leads/components/KanbanDragCard.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/leads/components/LeadDetailSheet.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/leads/components/LeadKanbanCard.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/leads/components/ShowingLogDialog.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/leads/components/ShowingLogList.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/leads/hooks/useExpiringAgreements.ts`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/leads/hooks/useLeadDetail.ts`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/leads/hooks/useLeadSourceBreakdown.ts`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/leads/hooks/useLeadsPipeline.ts`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/leads/schemas/__tests__/lead-form.test.ts`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/leads/schemas/buyer-agent-agreement-form.ts`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/leads/schemas/index.ts`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/leads/schemas/lead-form.ts`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/leads/schemas/showing-log-form.ts`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/onboarding/Onboarding.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/onboarding/components/OnboardingProgress.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/onboarding/components/Step3QuickStart.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/onboarding/hooks/useOnboarding.ts`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/onboarding/services/onboarding.service.ts`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/organization/components/AddMemberDialog.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/organization/components/MemberAvatar.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/organization/components/StatusBadge.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/organization/components/index.ts`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/organization/index.ts`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/organization/schemas/addMemberSchema.ts`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/owners/OwnerDialog.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/owners/Owners.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/owners/ownerSchema.ts`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/profile/Profile.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/profile/components/AccountSettingsCard.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/profile/components/BrokerSettingsForm.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/profile/components/CapProgressCard.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/profile/components/EditOrganizationDialog.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/profile/components/EditProfileInfoDialog.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/profile/hooks/useProfileData.ts`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/profile/hooks/useProfileForm.ts`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/profile/profileSchema.ts`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/profile/schemas/brokerSettingsSchema.ts`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/profile/schemas/editProfileInfoSchema.ts`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/profile/schemas/editProfileSchema.ts`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/properties/Properties.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/properties/PropertyDialog.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/properties/components/PropertyFilters.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/properties/components/PropertyFormFields.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/properties/components/PropertyTableHeaders.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/properties/components/PropertyTableRow.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/properties/components/PropertyTypeSelectorSection.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/properties/hooks/usePropertyActions.ts`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/properties/hooks/usePropertyCommission.ts`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/properties/hooks/usePropertyDialogs.ts`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/properties/hooks/usePropertyFilters.ts`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/properties/hooks/usePropertyFormInitialization.ts`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/properties/hooks/usePropertyFormSubmission.ts`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/properties/hooks/usePropertyOwnerSelection.ts`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/properties/hooks/usePropertyPhotoManagement.ts`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/properties/hooks/usePropertyType.ts`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/properties/propertySchemas.ts`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/properties/utils/statusUtils.ts`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/quick-add/QuickAddButton.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/quick-add/index.ts`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/quick-add/quickAddSchema.ts`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/quick-add/useQuickAdd.ts`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/reminders/Reminders.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/reminders/components/CompactReminderCard.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/reminders/components/ContractProgressBar.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/reminders/components/ReminderBadge.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/reminders/components/ReminderCard.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/reminders/components/ReminderSections.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/reminders/hooks/useReminderActions.ts`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/reminders/hooks/useReminderCategories.ts`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/reminders/hooks/useReminderDialog.ts`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/reminders/hooks/useReminderMetrics.ts`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/reminders/hooks/useRemindersData.ts`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/screening/components/ScreeningDialog.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/screening/hooks/useScreeningData.ts`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/screening/index.ts`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/screening/schemas/screening.schema.ts`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/team/hooks/useTeamPerformance.ts`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/team/types/team.types.ts`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/tenants/Tenants.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/tenants/components/ContractStatusInfo.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/tenants/components/MultiStepNavigationButtons.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/tenants/components/TenantCard.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/tenants/components/TenantEditLoadingState.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/tenants/components/TenantTableRow.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/tenants/constants/tenantSteps.ts`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/tenants/hooks/useMultiStepForm.ts`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/tenants/hooks/usePdfFileManagement.ts`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/tenants/hooks/useTenantActions.ts`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/tenants/hooks/useTenantDialogs.ts`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/tenants/hooks/useTenantEditData.ts`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/tenants/hooks/useTenantEditSubmission.ts`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/tenants/hooks/useTenantFilters.ts`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/tenants/hooks/useTenantsData.ts`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/tenants/schemas/tenantEditSchema.ts`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/tenants/utils/badgeUtils.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/timeline/TimelinePage.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/features/timeline/index.ts`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

### 4. Templates (ListPageTemplate, etc.)
- File path: `src/components/templates/ListPageTemplate.tsx`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/templates/contractContent.ts`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/templates/saleContractContent.ts`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/templates/salePdf.template.ts`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/templates/salesContractContent.ts`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/templates/usLeasePdfStatutory.ts`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low

- File path: `src/templates/usPurchasePdfStatutory.ts`
- Dark mode status: Full
- What's missing: No missing dark variants detected for scanned tokens.
- Priority: Low


## COLORS.* Usage
List of non-exempt `COLORS.*` usages (light-only risk):

- `src/components/common/EmptyState.tsx`
  - line 45: `<Card className={`p-8 shadow-lg ${COLORS.border.light} ${COLORS.card.bgBlur}`}>`
  - line 48: `<h3 className={`text-lg font-medium ${COLORS.gray.text900} mb-2`}>{title}</h3>`
  - line 49: `<p className={`${COLORS.muted.textLight} mb-4`}>{description}</p>`
- `src/components/common/MobileCardView.tsx`
  - line 21: `<Card key={index} className={`p-4 shadow-sm ${COLORS.border.light} ${COLORS.card.bg}`}>`
- `src/components/common/skeletons/CardSkeleton.tsx`
  - line 23: `className={`p-4 shadow-sm ${COLORS.border.light} ${COLORS.card.bg}`}`
- `src/components/dashboard/StatCard.tsx`
  - line 21: `gradient: COLORS.dashboard.properties.gradient,`
  - line 22: `shadow: COLORS.dashboard.properties.shadow,`
  - line 25: `gradient: COLORS.dashboard.occupied.gradient,`
  - line 26: `shadow: COLORS.dashboard.occupied.shadow,`
  - line 29: `gradient: COLORS.dashboard.tenants.gradient,`
  - line 30: `shadow: COLORS.dashboard.tenants.shadow,`
  - line 33: `gradient: COLORS.dashboard.contracts.gradient,`
  - line 34: `shadow: COLORS.dashboard.contracts.shadow,`
  - +1 more
- `src/components/layout/Navbar.tsx`
  - line 13: `<header className={`sticky top-0 z-30 ${COLORS.card.bg} dark:bg-slate-950 border-b ${COLORS.border.DEFAULT_class} dark:border-slate-800 shad...`
  - line 24: `<h1 className={`text-xl font-semibold ${COLORS.gray.text900} dark:text-slate-100`}>{title}</h1>`
- `src/components/properties/PhotoGallery.tsx`
  - line 128: `<div className={`text-center ${COLORS.muted.textLight}`}>{t('gallery.loading')}</div>`
  - line 181: `<div className={`aspect-square ${COLORS.gray.bg100}`}>`
- `src/components/properties/PhotoUpload.tsx`
  - line 140: `: `${COLORS.border.DEFAULT_class} hover:${COLORS.border.dark} ${COLORS.gray.bg50}`,`
  - line 159: `<p className={`text-sm font-medium ${COLORS.gray.text900}`}>`
  - line 162: `<p className={`text-xs ${COLORS.muted.textLight} mt-1`}>`
  - line 166: `<div className={`text-xs ${COLORS.muted.textLight} space-y-1`}>`
  - line 187: `<p className={`text-sm font-medium ${COLORS.gray.text900}`}>`
  - line 203: `<div className={`aspect-square rounded-lg overflow-hidden ${COLORS.gray.bg100} border ${COLORS.gray.border200}`}>`
  - line 218: `<p className={`text-xs ${COLORS.gray.text600} mt-1 truncate`}>{file.name}</p>`
- `src/components/templates/ListPageTemplate.tsx`
  - line 148: `<Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${COLORS.muted.textLight} dark:text-slate-400`} />`
- `src/components/ui/button.tsx`
  - line 19: `COLORS.border.DEFAULT_class,`
  - line 20: `COLORS.card.bg,`
- `src/config/colors.ts`
  - line 256: ``${COLORS.status[status].bg} ${COLORS.status[status].text}`;`
  - line 259: ``shadow-lg ${COLORS.border.color} ${COLORS.card.bgBlur} hover:shadow-xl transition-shadow`;`
- `src/features/auth/EmailChanged.tsx`
  - line 13: `<div className={`flex items-center justify-center min-h-screen ${COLORS.gray.bg50}`}>`
- `src/features/auth/EmailConfirmation.tsx`
  - line 123: `<div className={`flex items-center justify-center min-h-screen ${COLORS.gray.bg50}`}>`
  - line 138: `<div className={`flex items-center justify-center min-h-screen ${COLORS.gray.bg50}`}>`
  - line 172: `<div className={`flex items-center justify-center min-h-screen ${COLORS.gray.bg50}`}>`
  - line 214: `<div className={`flex items-center justify-center min-h-screen ${COLORS.gray.bg50}`}>`
- `src/features/auth/ForgotPassword.tsx`
  - line 55: `<div className={`flex items-center justify-center min-h-screen ${COLORS.gray.bg50}`}>`
  - line 96: `<div className={`flex items-center justify-center min-h-screen ${COLORS.gray.bg50}`}>`
- `src/features/auth/Register.tsx`
  - line 125: `<div className={`flex items-center justify-center min-h-screen ${COLORS.gray.bg50}`}>`
  - line 182: `<div className={`flex items-center justify-center min-h-screen ${COLORS.gray.bg50}`}>`
  - line 385: `<span className={COLORS.text.secondary}>`
- `src/features/auth/ResetPassword.tsx`
  - line 100: `<div className={`flex items-center justify-center min-h-screen ${COLORS.gray.bg50}`}>`
  - line 116: `<div className={`flex items-center justify-center min-h-screen ${COLORS.gray.bg50}`}>`
  - line 153: `<div className={`flex items-center justify-center min-h-screen ${COLORS.gray.bg50}`}>`
  - line 182: `<div className={`flex items-center justify-center min-h-screen ${COLORS.gray.bg50}`}>`
- `src/features/contracts/Contracts.tsx`
  - line 76: `icon: <FileText className={`h-16 w-16 ${COLORS.muted.text}`} />,`
  - line 100: `<div className={`text-xs ${COLORS.muted.textLight} truncate max-w-[180px] md:max-w-none`}>{contract.tenant.email}</div>`
  - line 104: `<div className={`text-sm ${COLORS.gray.text700} truncate max-w-[150px] md:max-w-[250px]`}>`
  - line 111: `<div className={`${COLORS.muted.textLight}`}>{t('table.datesTo')}</div>`
  - line 131: `<span className={`${COLORS.muted.textLight}`}>-</span>`
  - line 156: `<span className={`${COLORS.muted.textLight} text-xs`}>`
  - line 180: `<div className={`font-semibold text-base ${COLORS.gray.text900}`}>`
  - line 184: `<div className={`text-xs ${COLORS.gray.text500} mt-0.5`}>`
  - +5 more
- `src/features/contracts/components/KeyDatesCard.tsx`
  - line 72: `<p className={`text-xs font-medium ${COLORS.muted.text}`}>{node.label}</p>`
  - line 74: `<p className={`text-sm ${hasValue ? COLORS.gray.text900 : COLORS.muted.text}`}>{fmt(node.value)}</p>`
  - line 76: `<span className={`absolute right-[-10px] top-1/2 hidden h-px w-4 ${COLORS.gray.bg200} lg:block`} />`
- `src/features/contracts/components/OfferHistoryTimeline.tsx`
  - line 19: `if (status === 'superseded') return `${COLORS.gray.bg100} ${COLORS.gray.text700} ${COLORS.gray.border200}`;`
  - line 58: `return <p className={`text-sm ${COLORS.muted.text}`}>{t('purchaseWizard.step9.offerHistory.loading')}</p>;`
  - line 62: `return <p className={`text-sm ${COLORS.muted.text}`}>{t('purchaseWizard.step9.offerHistory.empty')}</p>;`
  - line 80: `{row.notes && <p className={`text-sm ${COLORS.muted.text}`}>{row.notes}</p>}`
- `src/features/contracts/purchaseWizard/PurchaseContractDetailView.tsx`
  - line 108: `<p className={`text-sm ${COLORS.muted.text}`}>{t('purchaseContractDetail.loading')}</p>`
  - line 130: `<p className={COLORS.gray.text900}>{addressLine}</p>`
  - line 132: `<p className={COLORS.muted.text}>{t('purchaseContractDetail.property')}</p>`
  - line 135: `<dt className={`font-medium ${COLORS.muted.text}`}>{t('purchaseContractDetail.price')}</dt>`
  - line 141: `<dt className={`font-medium ${COLORS.muted.text}`}>{t('purchaseContractDetail.closing')}</dt>`
  - line 145: `<dt className={`font-medium ${COLORS.muted.text}`}>{t('purchaseContractDetail.financing')}</dt>`
  - line 162: `<p className={`text-sm ${COLORS.muted.text}`}>{t('purchaseContractDetail.dealMissing')}</p>`
- `src/features/contracts/purchaseWizard/steps/Step5Financing.tsx`
  - line 250: `<Alert className={`${COLORS.info.bgLight} ${COLORS.border.color}`}>`
  - line 251: `<Info className={`h-4 w-4 ${COLORS.info.text}`} />`
  - line 462: `<p className={`text-xs ${COLORS.muted.text}`}>{t('purchaseWizard.step5.seller.rateTooltip')}</p>`
  - line 517: `{sellerTermUnit && <p className={`text-xs ${COLORS.muted.text}`}>{sellerTermUnit.toUpperCase()}</p>}`
- `src/features/contracts/purchaseWizard/steps/Step6Closing.tsx`
  - line 118: `<p className={`text-xs ${COLORS.muted.text}`}>{t('purchaseWizard.step6.closingDateNote')}</p>`
  - line 191: `<Alert className={`${COLORS.info.bgLight} ${COLORS.border.color}`}>`
  - line 192: `<Info className={`h-4 w-4 ${COLORS.info.text}`} />`
- `src/features/contracts/purchaseWizard/steps/Step7Conditions.tsx`
  - line 138: `<Alert className={`${COLORS.info.bgLight} ${COLORS.border.color}`}>`
  - line 139: `<Info className={`h-4 w-4 ${COLORS.info.text}`} />`
  - line 210: `<p className={`text-xs ${COLORS.muted.text}`}>{t('purchaseWizard.step7.inspectionContractorDateHelp')}</p>`
  - line 376: `<p className={COLORS.muted.text}>{t('purchaseWizard.step7.activeContingenciesNone')}</p>`
  - line 378: `<p className={`pt-2 text-xs ${COLORS.muted.text}`}>{t('purchaseWizard.step7.activeContingenciesNote')}</p>`
- `src/features/dashboard/Dashboard.tsx`
  - line 70: `<p className={`text-sm ${COLORS.gray.text600} dark:text-slate-300`}>{t('dailyBrief.loading')}</p>`
  - line 83: `<p className={`text-sm ${COLORS.gray.text700} dark:text-slate-200`}>{t('dailyBrief.empty.noDeals')}</p>`
  - line 102: `<p className={`text-sm font-semibold ${COLORS.gray.text900} dark:text-slate-100`}>`
- `src/features/dashboard/components/ActionItemsCard.tsx`
  - line 66: `<ul className={`space-y-1 text-sm ${COLORS.gray.text600}`}>`
  - line 86: `<p className={`font-medium ${COLORS.gray.text900} mb-2`}>{t('actionItems.properties.title')}</p>`
  - line 87: `<ul className={`space-y-1 text-sm ${COLORS.gray.text600}`}>`
  - line 105: `<p className={`font-medium ${COLORS.gray.text900} mb-2`}>{t('actionItems.tenants.title')}</p>`
  - line 106: `<ul className={`space-y-1 text-sm ${COLORS.gray.text600}`}>`
  - line 118: `<p className={`font-medium ${COLORS.gray.text900} mb-2`}>{t('actionItems.owners.title')}</p>`
  - line 119: `<ul className={`space-y-1 text-sm ${COLORS.gray.text600}`}>`
- `src/features/dashboard/components/DailyBriefHeader.tsx`
  - line 29: `<p className={`text-sm ${COLORS.gray.text600}`}>`
- `src/features/dashboard/components/DealHealthCard.tsx`
  - line 24: `<p className={`text-xs ${COLORS.gray.text600}`}>{card.propertyAddress}</p>`
  - line 25: `<p className={`text-xs ${COLORS.gray.text700}`}>`
  - line 30: `<p className={`text-xs ${COLORS.gray.text700}`}>`
- `src/features/dashboard/components/RemindersSection.tsx`
  - line 29: `<Bell className={`h-4 w-4 md:h-5 md:w-5 ${COLORS.text.white}`} />`
- `src/features/deals/DealDetail.tsx`
  - line 63: `<dt className={`text-sm font-medium ${COLORS.muted.text}`}>{label}</dt>`
  - line 64: `<dd className={`text-sm sm:col-span-2 ${COLORS.gray.text900}`}>`
  - line 197: `<p className={`text-sm ${COLORS.muted.text}`}>{t('detail.noLead')}</p>`
  - line 209: `<p className={`text-sm ${COLORS.gray.text900}`}>`
  - line 224: `<p className={`text-sm ${COLORS.muted.text}`}>{t('detail.noProperty')}</p>`
  - line 255: `<span className={`font-medium ${COLORS.gray.text900}`}>`
  - line 258: `<span className={`${COLORS.muted.text} ml-2`}>`
  - line 339: `<p className={`mt-4 text-sm ${COLORS.muted.text}`}>`
  - +1 more
- `src/features/deals/Deals.tsx`
  - line 104: `icon: <Handshake className={`h-16 w-16 ${COLORS.muted.textLight}`} />,`
  - line 145: `<TableCell className={`text-right text-sm ${COLORS.muted.text}`}>`
  - line 163: `<span className={`font-semibold ${COLORS.gray.text900}`}>`
  - line 172: `<div className={`text-sm ${COLORS.muted.text}`}>`
  - line 197: `className={`text-sm font-medium ${COLORS.muted.text}`}`
  - line 203: `<p className={`text-2xl font-bold ${COLORS.gray.text900}`}>`
  - line 211: `className={`text-sm font-medium ${COLORS.muted.text}`}`
  - line 217: `<p className={`text-2xl font-bold ${COLORS.gray.text900}`}>`
  - +1 more
- `src/features/deals/components/ContingencySummaryCard.tsx`
  - line 74: `<p className={`text-sm ${COLORS.muted.text}`}>{t('purchaseDetail.loading')}</p>`
  - line 76: `<p className={`text-sm ${COLORS.muted.text}`}>{t('purchaseDetail.contingencySummary.empty')}</p>`
  - line 81: `<span className={COLORS.gray.text900}>`
  - line 89: `<span className={COLORS.muted.text}>{formatDeadline(r.deadline_date)}</span>`
  - line 94: `<li className={`text-xs ${COLORS.muted.text}`}>`
- `src/features/deals/components/DealContingenciesPanel.tsx`
  - line 151: `<p className={`text-sm ${COLORS.muted.text}`}>{t('contingencies.loading')}</p>`
  - line 153: `<p className={`text-sm ${COLORS.muted.text}`}>`
  - line 239: `<div className={COLORS.muted.text}>`
- `src/features/deals/components/DealMilestonesPanel.tsx`
  - line 122: `<p className={`text-sm ${COLORS.muted.text}`}>`
  - line 164: `<div className={`${COLORS.muted.text} mt-1`}>`
- `src/features/deals/components/DealOffersPanel.tsx`
  - line 323: `<p className={`text-sm ${COLORS.muted.text}`}>`
  - line 373: `<div className={COLORS.muted.text}>`
- `src/features/deals/components/KeyDatesCard.tsx`
  - line 50: `<dt className={`text-sm font-medium ${COLORS.muted.text}`}>{label}</dt>`
  - line 51: `<dd className={`text-sm ${COLORS.gray.text900}`}>{formatDate(data[key])}</dd>`
- `src/features/deals/components/MilestoneCard.tsx`
  - line 41: `return `${COLORS.gray.bg100} ${COLORS.gray.text700} ${COLORS.gray.border200}`;`
  - line 43: `return `${COLORS.info.bgLight} ${COLORS.info.text} border-sky-200`;`
  - line 152: `<p className={cn('text-sm font-medium', COLORS.gray.text900)}>`
  - line 218: `<div className={cn('rounded-md border p-2 text-sm', COLORS.gray.border200, COLORS.gray.bg50)}>`
  - line 219: `<p className={cn('font-medium', COLORS.gray.text700)}>{t('timeline.note.last')}</p>`
  - line 220: `<p className={cn('mt-1', COLORS.gray.text600)}>{lastNote}</p>`
  - line 254: `<div className={cn('rounded-md border p-2 text-sm', COLORS.border.color, COLORS.card.bg)}>`
  - line 255: `<p className={cn('font-medium', COLORS.gray.text700)}>{t('timeline.contingency.title')}</p>`
  - +1 more
- `src/features/deals/components/OfferHistoryTimeline.tsx`
  - line 54: `<p className={`text-xs ${COLORS.muted.text}`}>`
  - line 59: `<p className={`text-xs ${COLORS.muted.text}`}>{t('offers.historyPurchaseLink')}</p>`
- `src/features/deals/components/PartiesTab.tsx`
  - line 318: `<p className={`text-sm ${COLORS.gray.text600}`}>`
  - line 326: `<p className={`text-sm ${COLORS.gray.text600}`}>`
  - line 339: `<p className={`text-xs ${COLORS.gray.text600}`}>{party.company ?? '—'}</p>`
- `src/features/deals/components/PhaseHeader.tsx`
  - line 56: `<h3 className={cn('text-base font-semibold', COLORS.gray.text900)}>{phaseName}</h3>`
  - line 63: `<p className={cn('text-sm', COLORS.gray.text600)}>`
- `src/features/deals/components/PurchaseDetailView.tsx`
  - line 241: `<span className={COLORS.muted.text}>{t('purchaseDetail.overview.price')}</span>`
  - line 247: `<span className={COLORS.muted.text}>{t('purchaseDetail.overview.financing')}</span>`
  - line 251: `<span className={COLORS.muted.text}>{t('purchaseDetail.overview.property')}</span>`
  - line 341: `<p className={`text-xs ${COLORS.muted.text}`}>{t('purchaseDetail.addenda.fhaHelp')}</p>`
  - line 361: `<p className={`text-xs ${COLORS.muted.text}`}>{t('purchaseDetail.addenda.vaHelp')}</p>`
- `src/features/deals/components/TimelineTab.tsx`
  - line 241: `{loading && <p className={cn('text-sm', COLORS.gray.text600)}>{t('timeline.loading')}</p>}`
  - line 263: `<p className={cn('text-sm', COLORS.gray.text600)}>{t('timeline.emptyPhase')}</p>`
  - line 294: `<p className={cn('text-sm font-semibold', COLORS.gray.text900)}>{t('timeline.customSectionTitle')}</p>`
- `src/features/finance/components/BudgetComparison.tsx`
  - line 80: `backgroundColor: COLORS.disabled.hex,`
  - line 95: `return COLORS.muted.hex;`
  - line 125: `color: COLORS.muted.hex,`
  - line 135: `color: COLORS.border.hex,`
  - line 139: `color: COLORS.muted.hex,`
- `src/features/finance/components/CommissionByClientType.tsx`
  - line 178: `<CartesianGrid strokeDasharray="3 3" stroke={COLORS.border.hex} />`
  - line 181: `tick={{ fontSize: 12, fill: COLORS.muted.hex }}`
  - line 183: `axisLine={{ stroke: COLORS.border.hex }}`
  - line 186: `tick={{ fontSize: 12, fill: COLORS.muted.hex }}`
  - line 188: `axisLine={{ stroke: COLORS.border.hex }}`
- `src/features/finance/components/CommissionTrends.tsx`
  - line 98: `<CartesianGrid strokeDasharray="3 3" stroke={COLORS.border.hex} />`
  - line 101: `tick={{ fontSize: 12, fill: COLORS.muted.hex }}`
  - line 103: `axisLine={{ stroke: COLORS.border.hex }}`
  - line 106: `tick={{ fontSize: 12, fill: COLORS.muted.hex }}`
  - line 108: `axisLine={{ stroke: COLORS.border.hex }}`
  - line 113: `labelStyle={{ color: COLORS.text.hex, fontWeight: 600 }}`
  - line 116: `border: `1px solid ${COLORS.border.hex}`,`
- `src/features/finance/components/ConversionFunnel.tsx`
  - line 146: `<CartesianGrid strokeDasharray="3 3" stroke={COLORS.border.hex} />`
  - line 147: `<XAxis type="number" tick={{ fontSize: 12, fill: COLORS.muted.hex }} />`
  - line 151: `tick={{ fontSize: 12, fill: COLORS.muted.hex }}`
- `src/features/finance/components/FinancialTrends.tsx`
  - line 109: `color: COLORS.muted.hex,`
  - line 117: `color: COLORS.border.hex,`
  - line 121: `color: COLORS.muted.hex,`
- `src/features/finance/components/MarketingROI.tsx`
  - line 155: `<CartesianGrid strokeDasharray="3 3" stroke={COLORS.border.hex} />`
  - line 158: `tick={{ fontSize: 11, fill: COLORS.muted.hex }}`
  - line 160: `axisLine={{ stroke: COLORS.border.hex }}`
  - line 166: `tick={{ fontSize: 12, fill: COLORS.muted.hex }}`
  - line 168: `axisLine={{ stroke: COLORS.border.hex }}`
- `src/features/finance/components/MonthlyGCIChart.tsx`
  - line 13: `const gciBarColor = COLORS.info.hex;`
- `src/features/finance/components/TopCategories.tsx`
  - line 66: `backgroundColor: COLORS.slice(0, categories.length),`
  - line 130: `style={{ backgroundColor: COLORS[index % COLORS.length] }}`
- `src/features/inquiries/InquiryMatchesDialog.tsx`
  - line 109: `<div className={`p-4 rounded-lg ${COLORS.gray.bg50} space-y-2`}>`
  - line 111: `<h3 className={`font-semibold ${COLORS.gray.text900}`}>`
  - line 122: `: `${COLORS.status.inactive.bg} ${COLORS.text.white}``
  - line 130: `<Phone className={`h-4 w-4 ${COLORS.gray.text500}`} />`
  - line 131: `<span className={COLORS.gray.text700}>{inquiry.phone}</span>`
  - line 135: `<MapPin className={`h-4 w-4 ${COLORS.gray.text500}`} />`
  - line 136: `<span className={COLORS.gray.text700}>`
  - line 150: `<span className={COLORS.gray.text700}>`
  - +9 more
- `src/features/inquiries/InquiryTypeSelector.tsx`
  - line 42: `? `${COLORS.accent.bg} text-white shadow-md``
- `src/features/inquiries/components/InquiryCard.tsx`
  - line 53: `<div key={inquiry.id} className={`p-4 rounded-lg border ${COLORS.gray.border200} space-y-3`}>`
  - line 59: `className={`text-left font-medium ${COLORS.gray.text900} hover:underline`}`
  - line 65: `<div className={`font-medium ${COLORS.gray.text900}`}>{inquiry.name}</div>`
  - line 67: `<div className={`text-sm ${COLORS.gray.text500} flex items-center gap-1`}>`
  - line 72: `<div className={`text-sm ${COLORS.gray.text500} flex items-center gap-1`}>`
  - line 84: `<div className={`text-sm ${COLORS.gray.text600} flex items-center gap-1`}>`
  - line 85: `<MapPin className={`h-4 w-4 ${COLORS.gray.text500}`} />`
  - line 98: `<div className={`text-sm ${COLORS.gray.text600}`}>`
- `src/features/inquiries/components/InquiryTableRow.tsx`
  - line 64: `COLORS.gray.text900,`
  - line 72: `<div className={`font-medium ${COLORS.gray.text900}`}>{inquiry.name}</div>`
  - line 74: `<div className={`text-sm ${COLORS.gray.text500} flex items-center gap-1`}>`
  - line 79: `<div className={`text-sm ${COLORS.gray.text500} flex items-center gap-1`}>`
  - line 89: `<MapPin className={`h-4 w-4 ${COLORS.gray.text500}`} />`
  - line 95: `<span className={COLORS.gray.text500}>-</span>`
  - line 112: `return <span className={COLORS.gray.text500}>-</span>;`
- `src/features/inquiries/utils/statusUtils.ts`
  - line 17: `closed: `${COLORS.status.inactive.bg} ${COLORS.text.white}`,`
  - line 19: `return statusColors[status] || `${COLORS.status.inactive.bg} ${COLORS.text.white}`;`
- `src/features/leads/components/BuyerAgentAgreementList.tsx`
  - line 101: `<h3 className={`text-base font-semibold ${COLORS.gray.text900}`}>`
  - line 117: `<span className={`text-sm font-medium ${COLORS.muted.text}`}>`
  - line 126: `<span className={COLORS.muted.text}>`
  - line 129: `<p className={`font-medium ${COLORS.gray.text900}`}>`
  - line 134: `<span className={COLORS.muted.text}>`
  - line 137: `<p className={`font-medium ${COLORS.gray.text900}`}>`
  - line 145: `<span className={COLORS.muted.text}>`
  - line 148: `<p className={`font-medium ${COLORS.gray.text900}`}>`
  - +3 more
- `src/features/leads/components/ExpiringAgreementsCard.tsx`
  - line 51: `<p className={`text-sm ${COLORS.gray.text500}`}>{t('dashboard.noExpiringAgreements')}</p>`
- `src/features/leads/components/LeadDetailSheet.tsx`
  - line 135: `<p className={`text-sm py-6 ${COLORS.muted.text}`}>{t('pipeline.loading')}</p>`
  - line 149: `<h3 className={`text-lg font-semibold ${COLORS.gray.text900}`}>{lead.name}</h3>`
  - line 214: `<span className={`font-medium ${COLORS.muted.text}`}>{t('detail.fields.phone')}: </span>`
  - line 219: `<span className={`font-medium ${COLORS.muted.text}`}>{t('detail.fields.email')}: </span>`
  - line 224: `<span className={`font-medium ${COLORS.muted.text}`}>{t('detail.fields.type')}: </span>`
  - line 229: `<span className={`font-medium ${COLORS.muted.text}`}>{t('detail.fields.source')}: </span>`
  - line 235: `<span className={`font-medium ${COLORS.muted.text}`}>{t('detail.fields.notes')}: </span>`
  - line 244: `<label className={`text-sm font-medium ${COLORS.gray.text900}`}>{t('detail.fields.status')}</label>`
- `src/features/leads/components/LeadKanbanCard.tsx`
  - line 37: `<div className={`font-semibold text-sm ${COLORS.gray.text900} line-clamp-2`}>{lead.name}</div>`
  - line 38: `<div className={`flex items-center gap-1 text-xs ${COLORS.gray.text500}`}>`
- `src/features/leads/components/LeadPipelineBoard.tsx`
  - line 128: `<div className={`rounded-xl border border-slate-200 bg-white p-12 text-center text-sm ${COLORS.muted.text}`}>`
  - line 163: `<p className={`px-1 py-6 text-center text-xs ${COLORS.muted.text}`}>`
  - line 203: `<p className={`px-1 py-6 text-center text-xs ${COLORS.muted.text}`}>`
- `src/features/leads/components/LeadSourceBreakdownCard.tsx`
  - line 62: `<p className={`text-sm ${COLORS.gray.text500}`}>{t('dashboard.noLeadData')}</p>`
- `src/features/leads/components/ShowingLogList.tsx`
  - line 69: `<h3 className={`text-base font-semibold ${COLORS.gray.text900}`}>`
  - line 90: `<Clock className={`h-4 w-4 ${COLORS.muted.text}`} />`
  - line 96: `<div className={`flex items-center gap-2 text-sm ${COLORS.muted.text}`}>`
  - line 104: `<div className={`flex items-center gap-2 text-sm ${COLORS.muted.text}`}>`
  - line 115: `<MessageSquare className={`h-4 w-4 ${COLORS.muted.text} mt-0.5`} />`
  - line 116: `<p className={`${COLORS.muted.text} line-clamp-2`}>{showing.feedback}</p>`
  - line 124: `<Home className={`mx-auto h-12 w-12 ${COLORS.muted.text} mb-3`} />`
  - line 125: `<p className={`${COLORS.muted.text} mb-4`}>`
- `src/features/organization/TeamMembersList.tsx`
  - line 220: `<Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${COLORS.muted.textLight}`} />`
- `src/features/owners/Owners.tsx`
  - line 138: `<Mail className={`h-3 w-3 ${COLORS.muted.textLight} flex-shrink-0`} />`
  - line 142: `<Phone className={`h-3 w-3 ${COLORS.muted.textLight} flex-shrink-0`} />`
  - line 150: `<MapPin className={`h-3 w-3 ${COLORS.muted.textLight} flex-shrink-0`} />`
  - line 151: `<span className={`${COLORS.gray.text600} truncate max-w-[180px] md:max-w-[300px]`}>{owner.address}</span>`
  - line 154: `<span className={`${COLORS.muted.textLight} text-sm`}>-</span>`
  - line 180: `<span className={`font-semibold text-base ${COLORS.gray.text900}`}>`
  - line 192: `<Mail className={`h-4 w-4 ${COLORS.muted.textLight}`} />`
  - line 193: `<span className={`${COLORS.gray.text600} truncate`}>{owner.email}</span>`
  - +5 more
- `src/features/properties/Properties.tsx`
  - line 212: `icon: <Building2 className={`h-16 w-16 ${COLORS.muted.text}`} />,`
- `src/features/properties/components/PropertyTableHeaders.tsx`
  - line 21: `<MapPin className={`h-4 w-4 ${COLORS.muted.textLight}`} />`
  - line 28: `<User className={`h-4 w-4 ${COLORS.muted.textLight}`} />`
  - line 35: `<User className={`h-4 w-4 ${COLORS.muted.textLight}`} />`
  - line 42: `<DollarSign className={`h-4 w-4 ${COLORS.muted.textLight}`} />`
  - line 49: `<Calendar className={`h-4 w-4 ${COLORS.muted.textLight}`} />`
- `src/features/properties/components/PropertyTableRow.tsx`
  - line 65: `<span className={`inline-flex items-center gap-1 text-xs ${COLORS.gray.text500} flex-shrink-0`}>`
  - line 85: `<div className={`text-xs ${COLORS.gray.text500} mt-1 line-clamp-1`}>`
  - line 97: `<span className={`${COLORS.gray.text600} text-sm truncate max-w-[150px] md:max-w-none block`}>`
  - line 108: `<span className={`${COLORS.muted.textLight} text-sm`}>{t('notAvailable')}</span>`
  - line 114: `<span className={`${COLORS.gray.text700} text-sm`}>{property.owner.name}</span>`
  - line 116: `<span className={`${COLORS.muted.textLight} text-sm`}>{t('notAvailable')}</span>`
  - line 122: `<span className={`${COLORS.muted.textLight} text-sm`}>{t('properties:table.inactive')}</span>`
  - line 124: `<span className={`${COLORS.gray.text700} text-sm`}>{property.activeTenant.name}</span>`
  - +9 more
- `src/features/reminders/Reminders.tsx`
  - line 112: `<p className={`text-sm ${COLORS.muted.textLight} mb-4`}>`
  - line 133: `icon={<Bell className={`h-16 w-16 ${COLORS.muted.text}`} />}`
- `src/features/reminders/components/CompactReminderCard.tsx`
  - line 56: `<span className={cn('text-sm md:text-xs font-medium', COLORS.gray.text600)}>`
  - line 84: `? `shadow-md ${COLORS.border.light} ${COLORS.card.bgBlur} hover:shadow-lg transition-shadow border-l-4 border-red-500``
  - line 85: `: `shadow-md ${COLORS.border.light} ${COLORS.card.bgBlur} hover:shadow-lg transition-shadow border-l-4 border-green-500`;`
  - line 104: `<User className={cn('h-4 w-4 md:h-3.5 md:w-3.5', COLORS.muted.textLight)} />`
  - line 122: `<Calendar className={cn('h-4 w-4 md:h-3.5 md:w-3.5', COLORS.muted.textLight)} />`
- `src/features/reminders/components/ReminderBadge.tsx`
  - line 32: `<Badge className={`${COLORS.reminders.overdue} ${className || ''}`}>`
  - line 44: `<Badge className={`${COLORS.reminders.upcoming} ${className || ''}`}>`
- `src/features/reminders/components/ReminderCard.tsx`
  - line 74: `<span className={`text-sm ${COLORS.gray.text600}`}>`
  - line 114: `return `shadow-lg ${COLORS.border.light} ${COLORS.card.bgBlur} hover:shadow-xl transition-shadow border-l-4 border-red-500`;`
  - line 117: `return `shadow-lg ${COLORS.border.light} ${COLORS.card.bgBlur} hover:shadow-xl transition-shadow border-l-4 border-green-500`;`
  - line 120: `return `shadow-lg ${COLORS.border.light} ${COLORS.card.bgBlur} hover:shadow-xl transition-shadow border-l-4 border-gray-400 opacity-90`;`
  - line 122: `return `shadow-lg ${COLORS.border.light} ${COLORS.card.bgBlur} hover:shadow-xl transition-shadow`;`
  - line 159: `<p className={`${COLORS.muted.textLight} flex items-center gap-1`}>`
  - line 166: `<p className={`${COLORS.muted.textLight} flex items-center gap-1`}>`
  - line 177: `<p className={`${COLORS.muted.textLight} flex items-center gap-1`}>`
  - +5 more
- `src/features/reminders/components/ReminderSections.tsx`
  - line 115: `icon={<CheckCircle2 className={`h-12 w-12 ${COLORS.muted.text}`} />}`
  - line 186: `icon={<Calendar className={`h-12 w-12 ${COLORS.muted.text}`} />}`
  - line 213: `icon={<Bell className={`h-12 w-12 ${COLORS.muted.text}`} />}`
  - line 240: `icon={<FileText className={`h-12 w-12 ${COLORS.muted.text}`} />}`
  - line 245: `<div className={`${COLORS.gray.bg50} border ${COLORS.gray.border200} rounded-lg p-4 shadow-md`}>`
  - line 247: `<AlertCircle className={`h-5 w-5 ${COLORS.gray.text600} mt-0.5`} />`
  - line 249: `<h3 className={`font-semibold ${COLORS.gray.text900}`}>`
  - line 252: `<p className={`text-sm ${COLORS.gray.text700} mt-1`}>`
- `src/features/reminders/components/ReminderSummaryCards.tsx`
  - line 147: `<p className={cn('text-xs mt-1.5 leading-relaxed', COLORS.gray.text600)}>`
- `src/features/reminders/components/ReminderTableRow.tsx`
  - line 64: `<span className={cn('text-sm font-medium', COLORS.gray.text600)}>`
  - line 223: `<p className={cn('font-semibold mb-2', COLORS.gray.text900)}>`
  - line 228: `<User className={cn('h-4 w-4', COLORS.muted.textLight)} />`
  - line 229: `<span className={COLORS.gray.text700}>{owner.name}</span>`
  - line 233: `<Mail className={cn('h-4 w-4', COLORS.muted.textLight)} />`
  - line 245: `<Phone className={cn('h-4 w-4', COLORS.muted.textLight)} />`
  - line 259: `<p className={cn('font-semibold mb-2', COLORS.gray.text900)}>`
  - line 262: `<p className={cn('text-sm', COLORS.gray.text600)}>`
- `src/features/team/TeamPerformance.tsx`
  - line 64: `<p className={`text-sm ${COLORS.muted.textLight}`}>`
  - line 133: `<p className={`text-sm ${COLORS.muted.textLight} mb-4`}>{error}</p>`
  - line 151: `<Users className={`h-16 w-16 ${COLORS.muted.text}`} />`
  - line 154: `<p className={`text-sm ${COLORS.muted.textLight}`}>{t('empty.description')}</p>`
  - line 179: `<p className={`text-sm ${COLORS.muted.textLight}`}>{data.period.label}</p>`
- `src/features/tenants/Tenants.tsx`
  - line 97: `icon: <Users className={`h-16 w-16 ${COLORS.muted.text}`} />,`
- `src/features/tenants/components/TenantCard.tsx`
  - line 30: `<span className={`font-semibold text-base ${COLORS.gray.text900}`}>`
  - line 34: `<p className={`text-xs ${COLORS.gray.text500} mt-1 line-clamp-2`}>`
  - line 50: `<span className={`${COLORS.gray.text700} truncate`}>{tenant.property.address}</span>`
  - line 53: `<div className={`flex items-center gap-2 text-sm ${COLORS.muted.textLight}`}>`
- `src/features/tenants/components/TenantTableRow.tsx`
  - line 32: `<div className={`text-xs ${COLORS.muted.textLight} mt-1 line-clamp-1`}>`
  - line 42: `<Phone className={`h-3 w-3 ${COLORS.muted.textLight}`} />`
  - line 43: `<span className={`${COLORS.gray.text600}`}>{tenant.phone}</span>`
  - line 48: `<Mail className={`h-3 w-3 ${COLORS.muted.textLight} flex-shrink-0`} />`
  - line 49: `<span className={`${COLORS.gray.text600} truncate max-w-[150px] md:max-w-[250px]`}>{tenant.email}</span>`
  - line 53: `<span className={`${COLORS.muted.textLight} text-sm`}>-</span>`
  - line 61: `<span className={`${COLORS.gray.text700} truncate max-w-[150px] md:max-w-[250px]`}>{tenant.property.address}</span>`
  - line 64: `<div className={`flex items-center gap-2 text-sm ${COLORS.muted.textLight}`}>`
- `src/features/timeline/TimelinePage.tsx`
  - line 132: `<p className={`text-sm ${COLORS.gray.text500}`}>`

## Feature Gap Ranking
Features with the most detected dark mode gaps:

- `finance`: 171
- `profile`: 57
- `dashboard`: 52
- `compliance`: 37
- `contracts`: 36
- `properties`: 36
- `reminders`: 35
- `organization`: 33
- `screening`: 33
- `deposit-tracker`: 26
- `contractsSale`: 25
- `landing`: 22
- `deals`: 20
- `team`: 17
- `leads`: 14
- `tenants`: 14
- `billing`: 13
- `calendar`: 12
- `quick-add`: 10
- `auth`: 9

## UI Primitives Quick Check

- `src/components/ui/button.tsx`: light=1 dark=0 GAP=1
- `src/components/ui/cookie-error-boundary.tsx`: light=2 dark=0 GAP=2
- `src/components/ui/cookie-preferences.tsx`: light=1 dark=0 GAP=1
- `src/components/ui/cookie-settings-link.tsx`: light=1 dark=0 GAP=1
- `src/components/ui/skeleton.tsx`: light=1 dark=0 GAP=1

## Priority Fixes
Top 10 files to fix first for maximum visual impact:

- `src/components/landing/LandingHeader.tsx` — gaps: 23, status: Missing, suggested priority: High
- `src/features/reminders/components/CallListRow.tsx` — gaps: 22, status: Missing, suggested priority: High
- `src/features/screening/ScreeningPage.tsx` — gaps: 19, status: Missing, suggested priority: High
- `src/config/colors.ts` — gaps: 17, status: Partial, suggested priority: High
- `src/features/properties/components/PropertyCard.tsx` — gaps: 17, status: Missing, suggested priority: High
- `src/components/landing/NotificationReminderMockup.tsx` — gaps: 16, status: Missing, suggested priority: High
- `src/features/profile/components/SubscriptionStatusCard.tsx` — gaps: 15, status: Missing, suggested priority: High
- `src/features/deposit-tracker/DepositTrackerPage.tsx` — gaps: 14, status: Missing, suggested priority: High
- `src/features/billing/components/PricingSection.tsx` — gaps: 13, status: Missing, suggested priority: High
- `src/features/compliance/components/RequestDetailSheet.tsx` — gaps: 13, status: Missing, suggested priority: High
