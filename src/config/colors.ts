/**
 * Thin convenience wrappers around Closewell CSS variables / Tailwind
 * semantic tokens. CSS vars in `src/index.css` are the single source of truth —
 * do not add independent hex or legacy palette class authorities here.
 */
export const COLORS = {
  primary: {
    DEFAULT: 'primary',
    bg: 'bg-primary',
    bgLight: 'bg-primary/10',
    bgGradient: 'bg-gradient-to-r from-primary to-primary/80',
    bgGradientHover: 'hover:from-primary/90 hover:to-primary',
    text: 'text-primary',
    textLight: 'text-primary/80',
    border: 'border-primary/40',
    borderHover: 'hover:border-primary',
    shadow: 'shadow-primary/30',
    hover: 'hover:bg-primary/90 hover:text-primary-foreground',
  },

  secondary: {
    DEFAULT: 'secondary',
    bg: 'bg-secondary',
    bgLight: 'bg-secondary/15',
    text: 'text-secondary-foreground',
    textDark: 'text-secondary-foreground',
    border: 'border-secondary/40',
    borderHover: 'hover:border-secondary',
    shadow: 'shadow-secondary/30',
    hover: 'hover:bg-secondary/90 hover:text-secondary-foreground',
  },

  success: {
    DEFAULT: 'success',
    bg: 'bg-success',
    bgLight: 'bg-success/15',
    text: 'text-success',
    textDark: 'text-success',
    border: 'border-success/40',
    shadow: 'shadow-success/30',
    hover: 'hover:bg-success/90 hover:text-success-foreground',
  },

  danger: {
    DEFAULT: 'destructive',
    light: 'destructive',
    dark: 'bg-destructive',
    bg: 'bg-destructive',
    bgLight: 'bg-destructive/15',
    text: 'text-destructive',
    textDark: 'text-destructive',
    border: 'border-destructive/40',
    borderLight: 'border-destructive/20',
    borderHover: 'hover:border-destructive',
    hover: 'hover:bg-destructive/90 hover:text-destructive-foreground',
  },

  warning: {
    DEFAULT: 'warning',
    light: 'warning',
    dark: 'bg-warning',
    bg: 'bg-warning',
    bgLight: 'bg-warning/15',
    text: 'text-warning',
    textDark: 'text-warning',
    textDarker: 'text-warning-foreground',
    border: 'border-warning/30',
    borderHover: 'border-warning/50',
    hoverBg: 'hover:bg-warning/20',
    hover: 'hover:bg-warning/15 hover:text-foreground',
    shadow: 'shadow-warning/30',
  },

  info: {
    DEFAULT: 'info',
    bg: 'bg-info',
    bgLight: 'bg-info/15',
    text: 'text-info',
  },

  accent: {
    DEFAULT: 'accent',
    bg: 'bg-accent',
    bgLight: 'bg-accent/15',
    text: 'text-accent-foreground',
    shadow: 'shadow-accent/30',
    hover: 'hover:bg-accent/90 hover:text-accent-foreground',
  },

  background: {
    DEFAULT: 'background',
    bg: 'bg-background',
    bgGray: 'bg-muted',
    bgGradient: 'bg-gradient-to-b from-background to-card',
  },

  card: {
    DEFAULT: 'card',
    bg: 'bg-card',
    bgBlur: 'bg-card/80 backdrop-blur-sm',
  },

  border: {
    DEFAULT: 'border',
    light: 'border-border/60',
    DEFAULT_class: 'border-border',
    dark: 'border-border',
    color: 'border-border',
  },

  text: {
    DEFAULT: 'foreground',
    primary: 'text-foreground',
    secondary: 'text-muted-foreground',
    muted: 'text-muted-foreground',
    disabled: 'text-muted-foreground/60',
    light: 'text-muted-foreground/40',
  },

  muted: {
    DEFAULT: 'muted',
    light: 'muted-foreground',
    bg: 'bg-muted',
    text: 'text-muted-foreground',
    textLight: 'text-muted-foreground',
  },

  disabled: {
    DEFAULT: 'muted',
    bg: 'bg-muted',
    text: 'text-muted-foreground/50',
  },

  gray: {
    bg50: 'bg-muted/50',
    bg100: 'bg-muted',
    bg200: 'bg-muted',
    border100: 'border-border/60',
    border200: 'border-border',
    text500: 'text-muted-foreground',
    text600: 'text-muted-foreground',
    text700: 'text-foreground/80',
    text900: 'text-foreground',
  },

  /**
   * Semantic status badge tokens — one meaning per color:
   * occupied → info (teal)
   * empty/vacant and underOffer/pending → warning (amber)
   * available/active/assigned → success (forest)
   * sold/inactive/archived/unassigned → muted
   * error/expired use COLORS.danger separately
   */
  status: {
    empty: {
      bg: 'bg-warning',
      text: 'text-warning-foreground',
      border: 'border-warning/40',
      gradient: 'bg-gradient-to-r from-warning to-warning/80',
    },
    occupied: {
      bg: 'bg-info',
      text: 'text-info-foreground',
      border: 'border-info/40',
      gradient: 'bg-gradient-to-r from-info to-info/80',
    },
    available: {
      bg: 'bg-success',
      text: 'text-success-foreground',
      border: 'border-success/40',
      gradient: 'bg-gradient-to-r from-success to-success/80',
    },
    underOffer: {
      bg: 'bg-warning',
      text: 'text-warning-foreground',
      border: 'border-warning/40',
      gradient: 'bg-gradient-to-r from-warning to-warning/80',
    },
    sold: {
      bg: 'bg-muted-foreground',
      text: 'text-primary-foreground',
      border: 'border-border',
      gradient: 'bg-gradient-to-r from-muted-foreground to-muted-foreground/80',
    },
    active: {
      bg: 'bg-success',
      text: 'text-success-foreground',
      border: 'border-success/40',
      gradient: 'bg-gradient-to-r from-success to-success/80',
    },
    inactive: {
      bg: 'bg-muted-foreground',
      text: 'text-primary-foreground',
      border: 'border-border',
      gradient: 'bg-gradient-to-r from-muted-foreground to-muted-foreground/80',
    },
    archived: {
      bg: 'bg-muted-foreground',
      text: 'text-primary-foreground',
      border: 'border-border',
      gradient: 'bg-gradient-to-r from-muted-foreground to-muted-foreground/80',
    },
    assigned: {
      bg: 'bg-success',
      text: 'text-success-foreground',
      border: 'border-success/40',
      gradient: 'bg-gradient-to-r from-success to-success/80',
    },
    unassigned: {
      bg: 'bg-muted-foreground',
      text: 'text-primary-foreground',
      border: 'border-border',
      gradient: 'bg-gradient-to-r from-muted-foreground to-muted-foreground/80',
    },
  },

  dashboard: {
    properties: {
      bg: 'bg-primary',
      shadow: 'shadow-lg shadow-primary/20',
      gradient: 'bg-gradient-to-br from-primary via-primary/90 to-primary/80',
    },
    occupied: {
      bg: 'bg-success',
      shadow: 'shadow-lg shadow-success/20',
      gradient: 'bg-gradient-to-br from-success via-success/90 to-success/80',
    },
    tenants: {
      bg: 'bg-primary',
      shadow: 'shadow-lg shadow-primary/20',
      gradient: 'bg-gradient-to-br from-primary via-primary/90 to-primary/80',
    },
    contracts: {
      bg: 'bg-secondary',
      shadow: 'shadow-lg shadow-secondary/20',
      gradient: 'bg-gradient-to-br from-secondary via-secondary/90 to-secondary/80',
    },
  },

  reminders: {
    overdue: 'bg-destructive',
    upcoming: 'bg-info',
    scheduled: 'bg-info',
    expired: 'bg-muted-foreground',
  },
} as const;

export const getPrimaryButtonClasses = () =>
  `${COLORS.primary.bg} text-primary-foreground ${COLORS.primary.hover} ${COLORS.primary.shadow}`;

export const getSuccessButtonClasses = () =>
  `${COLORS.success.bg} text-success-foreground ${COLORS.success.hover}`;

export type StatusBadgeKey = keyof typeof COLORS.status;

export const getStatusBadgeClasses = (status: StatusBadgeKey) =>
  `${COLORS.status[status].bg} ${COLORS.status[status].text}`;

export const getCardClasses = () =>
  `shadow-lg ${COLORS.border.color} ${COLORS.card.bgBlur} hover:shadow-xl transition-shadow`;

export const getHoverClasses = (type: 'primary' | 'danger' | 'warning' | 'success') => {
  const colors = {
    primary: COLORS.primary.hover,
    danger: `${COLORS.danger.bgLight} ${COLORS.danger.text} ${COLORS.danger.border}`,
    warning: COLORS.warning.hover,
    success: `${COLORS.success.bgLight} ${COLORS.success.text} ${COLORS.success.border}`,
  };
  return colors[type];
};
