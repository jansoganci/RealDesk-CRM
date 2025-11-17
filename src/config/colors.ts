export const COLORS = {
  // Modern Blue - Professional primary color
  primary: {
    DEFAULT: 'blue-600',
    hex: '#2563EB',
    light: 'blue-500',
    dark: 'blue-700',
    darker: 'blue-800',
    bg: 'bg-blue-600',
    bgLight: 'bg-blue-50',
    bgGradient: 'bg-gradient-to-r from-blue-600 to-blue-700',
    bgGradientHover: 'hover:from-blue-700 hover:to-blue-800',
    text: 'text-blue-600',
    textLight: 'text-blue-500',
    border: 'border-blue-300',
    borderHover: 'hover:border-blue-400',
    shadow: 'shadow-blue-600/30',
    hover: 'hover:bg-blue-700 hover:text-white',
  },

  // Emerald Green - Professional secondary color
  secondary: {
    DEFAULT: 'emerald-600',
    hex: '#059669',
    light: 'emerald-500',
    dark: 'emerald-700',
    bg: 'bg-emerald-600',
    bgLight: 'bg-emerald-50',
    text: 'text-emerald-600',
    textDark: 'text-emerald-700',
    border: 'border-emerald-300',
    borderHover: 'hover:border-emerald-400',
    shadow: 'shadow-emerald-600/30',
    hover: 'hover:bg-emerald-700 hover:text-white',
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
    text: 'text-emerald-600',
    textDark: 'text-emerald-700',
    border: 'border-emerald-400',
    shadow: 'shadow-emerald-600/30',
    hover: 'hover:bg-emerald-700 hover:text-white',
  },

  danger: {
    DEFAULT: 'red-600',
    hex: '#dc2626',
    light: 'red-500',
    dark: 'red-700',
    bg: 'bg-red-600',
    bgLight: 'bg-red-50',
    text: 'text-red-600',
    textDark: 'text-red-700',
    border: 'border-red-300',
    borderLight: 'border-red-200',
    borderHover: 'hover:border-red-400',
    hover: 'hover:bg-red-700 hover:text-white',
  },

  // Amber Warning
  warning: {
    DEFAULT: 'amber-600',
    hex: '#D97706',
    light: 'amber-500',
    dark: 'amber-700',
    bg: 'bg-amber-600',
    bgLight: 'bg-amber-50',
    text: 'text-amber-600',
    textDark: 'text-amber-700',
    textDarker: 'text-amber-900',
    border: 'border-amber-200',
    borderHover: 'border-amber-300',
    hoverBg: 'hover:bg-amber-100',
    hover: 'hover:bg-amber-50 hover:text-amber-700',
    shadow: 'shadow-amber-600/30',
  },

  info: {
    DEFAULT: 'sky-500',
    hex: '#0ea5e9',
    bg: 'bg-sky-500',
    bgLight: 'bg-sky-50',
    text: 'text-sky-600',
  },

  // Orange Accent - Energetic accent color
  accent: {
    DEFAULT: 'orange-500',
    hex: '#F97316',
    light: 'orange-400',
    dark: 'orange-600',
    bg: 'bg-orange-500',
    bgLight: 'bg-orange-50',
    text: 'text-orange-600',
    shadow: 'shadow-orange-500/30',
    hover: 'hover:bg-orange-600 hover:text-white',
  },

  // Clean light background
  background: {
    DEFAULT: 'gray-50',
    hex: '#f9fafb',
    bg: 'bg-gray-50',
    bgGray: 'bg-gray-50',
    bgGradient: 'bg-gradient-to-b from-gray-50 to-white',
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
    DEFAULT: 'gray-900',
    hex: '#111827',
    primary: 'text-gray-900',
    secondary: 'text-gray-600',
    muted: 'text-gray-500',
    disabled: 'text-gray-400',
    light: 'text-gray-300',
    white: 'text-white',
  },

  muted: {
    DEFAULT: 'gray-500',
    hex: '#6b7280',
    light: 'gray-400',
    bg: 'bg-gray-500',
    text: 'text-gray-500',
    textLight: 'text-gray-500',
  },

  disabled: {
    DEFAULT: 'gray-300',
    hex: '#d1d5db',
    bg: 'bg-gray-300',
    text: 'text-gray-300',
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

  // Status colors - Solid backgrounds
  status: {
    empty: {
      bg: 'bg-orange-500',
      text: 'text-white',
      border: 'border-orange-300',
      gradient: 'bg-gradient-to-r from-orange-500 to-orange-600',
    },
    occupied: {
      bg: 'bg-blue-500',
      text: 'text-white',
      border: 'border-blue-300',
      gradient: 'bg-gradient-to-r from-blue-500 to-blue-600',
    },
    active: {
      bg: 'bg-emerald-600',
      text: 'text-white',
      border: 'border-emerald-300',
      gradient: 'bg-gradient-to-r from-emerald-500 to-emerald-600',
    },
    inactive: {
      bg: 'bg-gray-600',
      text: 'text-white',
      border: 'border-gray-300',
      gradient: 'bg-gradient-to-r from-gray-600 to-gray-700',
    },
    archived: {
      bg: 'bg-gray-600',
      text: 'text-white',
      border: 'border-gray-300',
      gradient: 'bg-gradient-to-r from-gray-600 to-gray-700',
    },
    assigned: {
      bg: 'bg-emerald-600',
      text: 'text-white',
      border: 'border-emerald-300',
      gradient: 'bg-gradient-to-r from-emerald-500 to-emerald-600',
    },
    unassigned: {
      bg: 'bg-gray-600',
      text: 'text-white',
      border: 'border-gray-300',
      gradient: 'bg-gradient-to-r from-gray-600 to-gray-700',
    },
  },

  // Dashboard card colors - Solid backgrounds
  dashboard: {
    properties: {
      bg: 'bg-blue-600',
      shadow: 'shadow-lg shadow-blue-600/20',
      gradient: 'bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800',
    },
    occupied: {
      bg: 'bg-emerald-600',
      shadow: 'shadow-lg shadow-emerald-600/20',
      gradient: 'bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-800',
    },
    tenants: {
      bg: 'bg-blue-600',
      shadow: 'shadow-lg shadow-blue-600/20',
      gradient: 'bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800',
    },
    contracts: {
      bg: 'bg-orange-500',
      shadow: 'shadow-lg shadow-orange-500/20',
      gradient: 'bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700',
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
  `${COLORS.primary.bg} ${COLORS.text.white} ${COLORS.primary.hover} ${COLORS.primary.shadow}`;

export const getSuccessButtonClasses = () =>
  `${COLORS.success.bg} ${COLORS.text.white} ${COLORS.success.hover}`;

export const getStatusBadgeClasses = (status: 'empty' | 'occupied' | 'active' | 'inactive' | 'archived' | 'assigned' | 'unassigned') =>
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
