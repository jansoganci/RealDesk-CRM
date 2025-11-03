import { AppError } from './errorCodes';

/**
 * Maps error codes to i18n translation keys
 * @param error - The error object (can be AppError, Error, or string)
 * @returns The i18n key for the error message
 */
export const mapErrorToKey = (error: unknown): string => {
  // If it's an AppError with a code, map it
  if (error instanceof AppError) {
    return mapCodeToKey(error.code);
  }

  // If it's a regular Error, check if the message is an error code
  if (error instanceof Error) {
    const message = error.message;

    // Check if the message starts with ERROR_ (it's an error code)
    if (message.startsWith('ERROR_')) {
      return mapCodeToKey(message);
    }

    // Otherwise, return a generic error key (the message itself might already be localized)
    return 'errors.general.unknown';
  }

  // If it's a string, check if it's an error code
  if (typeof error === 'string' && error.startsWith('ERROR_')) {
    return mapCodeToKey(error);
  }

  // Default to unknown error
  return 'errors.general.unknown';
};

/**
 * Maps an error code to its i18n translation key
 * @param code - The error code (e.g., ERROR_PHOTO_INVALID_FILE_TYPE)
 * @returns The i18n key (e.g., errors.photo.invalidFileType)
 */
const mapCodeToKey = (code: string): string => {
  // Remove ERROR_ prefix
  const withoutPrefix = code.replace(/^ERROR_/, '');

  // Split by underscore
  const parts = withoutPrefix.split('_');

  // Map category prefixes to error namespaces
  const categoryMap: Record<string, string> = {
    'PHOTO': 'photo',
    'TENANT': 'tenant',
    'PROPERTY': 'property',
    'OWNER': 'owner',
    'CONTRACT': 'contract',
    'AUTH': 'auth',
    'VALIDATION': 'validation',
  };

  // Get the category (first part)
  const category = parts[0];
  const namespace = categoryMap[category] || 'general';

  // Convert the rest to camelCase
  const rest = parts.slice(1);
  const camelCaseName = rest
    .map((part, index) => {
      if (index === 0) {
        return part.toLowerCase();
      }
      return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
    })
    .join('');

  return `errors.${namespace}.${camelCaseName}`;
};

/**
 * Hook to get a localized error message from an error object
 * @param error - The error object
 * @param t - The i18n translation function
 * @returns The localized error message
 */
export const getErrorMessage = (
  error: unknown,
  t: (key: string, options?: any) => string
): string => {
  const key = mapErrorToKey(error);
  return t(key);
};
