import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import * as z from 'zod';
import { Property } from '@/types';
import { getRentalPropertySchema, getSalePropertySchema } from '../propertySchemas';

interface UsePropertyTypeOptions {
  property: Property | null;
  defaultType?: 'rental' | 'sale';
}

interface UsePropertyTypeReturn {
  propertyType: 'rental' | 'sale';
  setPropertyType: (type: 'rental' | 'sale') => void;
  propertySchema: z.ZodSchema;
}

/**
 * Hook for managing property type (rental/sale)
 * Handles property type state, schema selection, and initialization from existing property
 */
export function usePropertyType({
  property,
  defaultType = 'rental',
}: UsePropertyTypeOptions): UsePropertyTypeReturn {
  const { t } = useTranslation(['properties', 'common']);

  // Initialize property type from existing property or use default
  const [propertyType, setPropertyType] = useState<'rental' | 'sale'>(() => {
    if (property) {
      return (property as any).property_type || 'rental';
    }
    return defaultType;
  });

  // Update property type when property changes (for edit mode)
  useEffect(() => {
    if (property) {
      const existingType = (property as any).property_type || 'rental';
      setPropertyType(existingType);
    } else {
      setPropertyType(defaultType);
    }
  }, [property, defaultType]);

  // Select schema based on property type
  const propertySchema = useMemo(() => {
    return propertyType === 'rental'
      ? getRentalPropertySchema(t)
      : getSalePropertySchema(t);
  }, [propertyType, t]);

  return {
    propertyType,
    setPropertyType,
    propertySchema,
  };
}

