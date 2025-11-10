export const COLORS = {
  // Luxury Navy - Deep, professional primary color
  primary: {
    DEFAULT: 'slate-900',
    hex: '#0f172a',
    light: 'slate-800',
    dark: 'slate-950',
    darker: 'slate-950',
    bg: 'bg-slate-900',
    bgLight: 'bg-slate-50',
    bgGradient: 'bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900',
    bgGradientHover: 'hover:from-slate-800 hover:via-slate-700 hover:to-slate-800',
    text: 'text-slate-900',
    textLight: 'text-slate-800',
    border: 'border-slate-300',
    borderHover: 'hover:border-slate-400',
    shadow: 'shadow-slate-900/30',
    hover: 'hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300',
  },

  // Luxury Gold - Premium accent color
  secondary: {
    DEFAULT: 'amber-600',
    hex: '#d97706',
    light: 'amber-500',
    dark: 'amber-700',
    bg: 'bg-amber-600',
    bgLight: 'bg-amber-50',
    bgGradient: 'bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700',
    bgGradientHover: 'hover:from-amber-600 hover:via-amber-700 hover:to-amber-800',
    text: 'text-amber-600',
    textDark: 'text-amber-700',
    border: 'border-amber-300',
    borderHover: 'hover:border-amber-400',
    shadow: 'shadow-amber-500/30',
    hover: 'hover:bg-amber-50 hover:text-amber-700',
  },

  // Emerald Green - Professional success color
  success: {
    DEFAULT: 'emerald-600',
    hex: '#059669',
    light: 'emerald-500',
    dark: 'emerald-700',
    darker: 'emerald-800',
    bg: 'bg-emerald-600',
    bgLight: 'bg-emerald-50',
    bgGradient: 'bg-gradient-to-r from-emerald-500 via-emerald-600 to-emerald-700',
    bgGradientHover: 'hover:from-emerald-700 hover:to-emerald-800',
    text: 'text-emerald-600',
    textDark: 'text-emerald-700',
    border: 'border-emerald-400',
    shadow: 'shadow-emerald-500/30',
  },

  danger: {
    DEFAULT: 'red-600',
    hex: '#dc2626',
    light: 'red-500',
    dark: 'red-700',
    bg: 'bg-red-600',
    bgLight: 'bg-red-50',
    bgGradient: 'bg-gradient-to-r from-red-500 to-red-600',
    text: 'text-red-600',
    textDark: 'text-red-700',
    border: 'border-red-300',
    borderLight: 'border-red-200',
    borderHover: 'hover:border-red-400',
    hover: 'hover:bg-red-700',
  },

  // Gold Warning - Using luxury gold for warnings
  warning: {
    DEFAULT: 'amber-500',
    hex: '#f59e0b',
    light: 'amber-400',
    dark: 'amber-600',
    bg: 'bg-amber-500',
    bgLight: 'bg-amber-50',
    bgGradient: 'bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600',
    bgGradientBr: 'bg-gradient-to-br from-amber-50 to-yellow-50',
    text: 'text-amber-600',
    textDark: 'text-amber-700',
    textDarker: 'text-amber-900',
    border: 'border-amber-200',
    borderHover: 'border-amber-300',
    hoverBg: 'hover:bg-amber-100',
    hover: 'hover:bg-amber-50 hover:text-amber-700',
    shadow: 'shadow-amber-500/30',
  },

  info: {
    DEFAULT: 'sky-500',
    hex: '#0ea5e9',
    bg: 'bg-sky-500',
    bgLight: 'bg-sky-50',
    text: 'text-sky-600',
  },

  // Navy Blue accent
  accent: {
    DEFAULT: 'blue-900',
    hex: '#1e3a8a',
    light: 'blue-800',
    dark: 'blue-950',
    bgGradient: 'bg-gradient-to-br from-blue-900 via-slate-900 to-slate-800',
    bgGradientR: 'bg-gradient-to-r from-blue-900 to-slate-900',
    text: 'text-blue-900',
    shadow: 'shadow-blue-900/30',
  },

  // Elegant light background with subtle navy tint
  background: {
    DEFAULT: 'slate-50',
    hex: '#f8fafc',
    bg: 'bg-slate-50',
    bgGray: 'bg-gray-50',
    bgGradient: 'bg-gradient-to-br from-slate-50 via-blue-50/20 to-amber-50/10',
  },

  card: {
    DEFAULT: 'white',
    hex: '#ffffff',
    bg: 'bg-white',
    bgBlur: 'bg-white/80 backdrop-blur-sm',
  },

  border: {
    DEFAULT: 'gray-200',
    hex: '#e5e7eb',
    light: 'border-gray-100',
    DEFAULT_class: 'border-gray-200',
    dark: 'border-gray-300',
    color: 'border-gray-200',
  },

  text: {
    DEFAULT: 'slate-700',
    hex: '#334155',
    primary: 'text-gray-900',
    secondary: 'text-gray-600',
    muted: 'text-gray-500',
    disabled: 'text-gray-400',
    light: 'text-gray-300',
    white: 'text-white',
  },

  muted: {
    DEFAULT: 'slate-500',
    hex: '#64748b',
    light: 'slate-400',
    bg: 'bg-slate-500',
    text: 'text-slate-500',
    textLight: 'text-gray-500',
  },

  disabled: {
    DEFAULT: 'slate-300',
    hex: '#cbd5e1',
    bg: 'bg-slate-300',
    text: 'text-slate-300',
  },

  gray: {
    bg50: 'bg-gray-50',
    bg100: 'bg-gray-100',
    bg200: 'bg-gray-200',
    border100: 'border-gray-100',
    border200: 'border-gray-200',
    text500: 'text-gray-500',
    text600: 'text-gray-600',
    text700: 'text-gray-700',
    text900: 'text-gray-900',
  },

  // Luxury status colors
  status: {
    empty: {
      gradient: 'bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700',
      bg: 'bg-amber-600',
      text: 'text-amber-700',
      border: 'border-amber-300',
    },
    occupied: {
      gradient: 'bg-gradient-to-r from-emerald-500 via-emerald-600 to-emerald-700',
      bg: 'bg-emerald-600',
      text: 'text-emerald-700',
      border: 'border-emerald-300',
    },
    active: {
      gradient: 'bg-gradient-to-r from-emerald-500 via-emerald-600 to-emerald-700',
      bg: 'bg-emerald-600',
      text: 'text-emerald-700',
      border: 'border-emerald-300',
    },
    inactive: {
      gradient: 'bg-gradient-to-r from-slate-500 via-slate-600 to-slate-700',
      bg: 'bg-slate-600',
      text: 'text-slate-700',
      border: 'border-slate-300',
    },
    archived: {
      gradient: 'bg-gradient-to-r from-slate-500 via-slate-600 to-slate-700',
      bg: 'bg-slate-600',
      text: 'text-slate-700',
      border: 'border-slate-300',
    },
    assigned: {
      gradient: 'bg-gradient-to-r from-emerald-500 via-emerald-600 to-emerald-700',
      bg: 'bg-emerald-600',
      text: 'text-emerald-700',
      border: 'border-emerald-300',
    },
    unassigned: {
      gradient: 'bg-gradient-to-r from-slate-500 via-slate-600 to-slate-700',
      bg: 'bg-slate-600',
      text: 'text-slate-700',
      border: 'border-slate-300',
    },
  },

  // Luxury dashboard card gradients
  dashboard: {
    properties: {
      gradient: 'bg-gradient-to-br from-slate-800 via-slate-900 to-blue-900',
      shadow: 'shadow-lg shadow-slate-900/20',
    },
    occupied: {
      gradient: 'bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800',
      shadow: 'shadow-lg shadow-emerald-700/20',
    },
    tenants: {
      gradient: 'bg-gradient-to-br from-blue-800 via-blue-900 to-slate-900',
      shadow: 'shadow-lg shadow-blue-900/20',
    },
    contracts: {
      gradient: 'bg-gradient-to-br from-amber-600 via-amber-700 to-orange-700',
      shadow: 'shadow-lg shadow-amber-700/20',
    },
  },

  reminders: {
    overdue: 'bg-red-600',
    upcoming: 'bg-blue-600',
    scheduled: 'bg-blue-600',
    expired: 'bg-gray-600',
  },
} as const;

export const getPrimaryButtonClasses = () =>
  `${COLORS.primary.bgGradient} ${COLORS.primary.bgGradientHover} ${COLORS.primary.shadow}`;

export const getSuccessButtonClasses = () =>
  `${COLORS.success.bgGradient} ${COLORS.success.bgGradientHover}`;

export const getStatusBadgeClasses = (status: 'empty' | 'occupied' | 'active' | 'inactive' | 'archived' | 'assigned' | 'unassigned') =>
  `${COLORS.status[status].gradient} ${COLORS.text.white}`;

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
