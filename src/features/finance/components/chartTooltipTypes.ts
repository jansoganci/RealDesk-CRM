export interface FinanceChartTooltipEntry {
  name?: string;
  value?: number;
  payload?: {
    percentage?: number;
    name?: string;
    value?: number;
    roi?: number;
  };
}

export interface FinanceChartTooltipProps {
  active?: boolean;
  payload?: FinanceChartTooltipEntry[];
}
