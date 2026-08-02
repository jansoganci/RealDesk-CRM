/**
 * Fixtures Selector Component
 * 
 * Dynamic fixtures management with:
 * - Checkboxes for common fixtures
 * - Tag-style input for custom fixtures
 * - Empty state handling
 * - Multilanguage support
 */

import { useState, useEffect, useRef, KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { X } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { parseFixturesString, formatFixturesArray } from '../utils/fixturesUtils';

interface FixturesSelectorProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  isPainted: boolean | undefined;
  onPaintedChange: (value: boolean) => void;
  paintedError?: string;
}

// Common fixtures list (keys for translation)
const COMMON_FIXTURES = [
  'kombi',
  'klima',
  'ankastreSet',
  'dusakabin',
  'armaturBatarya',
  'parkePvcDograma',
] as const;

export function FixturesSelector({ value, onChange, error, isPainted, onPaintedChange, paintedError }: FixturesSelectorProps) {
  const { t } = useTranslation('contracts');
  const [selectedItems, setSelectedItems] = useState<string[]>(() => parseFixturesString(value));
  const [customInput, setCustomInput] = useState('');
  const isInternalChange = useRef(false);
  const previousValueRef = useRef<string>(value);

  // Parse value prop to array when value changes externally (e.g., form reset, initial load)
  useEffect(() => {
    // Only update if value actually changed and it's not from our internal change
    if (!isInternalChange.current && previousValueRef.current !== value) {
      const items = parseFixturesString(value);
      setSelectedItems(items);
      previousValueRef.current = value;
    }
    isInternalChange.current = false;
  }, [value]);

  // Update parent when selectedItems changes internally
  const updateParent = (items: string[]) => {
    const formatted = formatFixturesArray(items);
    if (formatted !== value) {
      isInternalChange.current = true;
      onChange(formatted);
    }
  };

  /**
   * Validate fixtures before adding
   * Returns error message if validation fails, null if valid
   */
  const validateFixtures = (items: string[]): string | null => {
    // Check max number of items (20)
    if (items.length > 20) {
      return t('validation.fixtures.maxItemsOrLength');
    }
    // Check max length per item (50 characters)
    const tooLongItem = items.find(item => item.length > 50);
    if (tooLongItem) {
      return t('validation.fixtures.maxItemsOrLength');
    }
    return null;
  };

  /**
   * Handle checkbox toggle for common fixtures
   */
  const handleCommonToggle = (fixtureKey: string, checked: boolean) => {
    const fixtureName = t(`create.commonFixtures.${fixtureKey}`);
    
    if (checked) {
      // Add if not already in list
      if (!selectedItems.includes(fixtureName)) {
        const newItems = [...selectedItems, fixtureName];
        // Validate before adding
        const validationError = validateFixtures(newItems);
        if (validationError) {
          toast.error(validationError);
          return;
        }
        setSelectedItems(newItems);
        updateParent(newItems);
      }
    } else {
      // Remove from list
      const newItems = selectedItems.filter(item => item !== fixtureName);
      setSelectedItems(newItems);
      updateParent(newItems);
    }
  };

  /**
   * Handle custom input - add on Enter key
   */
  const handleCustomInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const trimmed = customInput.trim();
      
      if (trimmed.length === 0) {
        return; // Don't add empty items
      }
      
      if (selectedItems.includes(trimmed)) {
        // Duplicate item - silently ignore or show subtle feedback
        setCustomInput('');
        return;
      }
      
      // Check item length (50 characters max)
      if (trimmed.length > 50) {
        toast.error(t('validation.fixtures.maxItemsOrLength'));
        return;
      }
      
      // Check max items (20)
      if (selectedItems.length >= 20) {
        toast.error(t('validation.fixtures.maxItemsOrLength'));
        return;
      }
      
      const newItems = [...selectedItems, trimmed];
      // Final validation
      const validationError = validateFixtures(newItems);
      if (validationError) {
        toast.error(validationError);
        return;
      }
      
      setSelectedItems(newItems);
      updateParent(newItems);
      setCustomInput('');
    }
  };

  /**
   * Remove a fixture from the list
   */
  const handleRemoveItem = (itemToRemove: string) => {
    const newItems = selectedItems.filter(item => item !== itemToRemove);
    setSelectedItems(newItems);
    updateParent(newItems);
  };

  // Check if a common fixture is selected
  const isCommonSelected = (fixtureKey: string): boolean => {
    const fixtureName = t(`create.commonFixtures.${fixtureKey}`);
    return selectedItems.includes(fixtureName);
  };

  return (
    <div className="space-y-4">
      {/* Common Fixtures Checkboxes */}
      <div>
        <Label className="text-sm font-medium mb-3 block">
          {t('create.fields.fixturesCommonItems')}
        </Label>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {COMMON_FIXTURES.map((fixtureKey) => {
            const fixtureName = t(`create.commonFixtures.${fixtureKey}`);
            const isSelected = isCommonSelected(fixtureKey);
            
            return (
              <div key={fixtureKey} className="flex items-center space-x-2">
                <Checkbox
                  id={`fixture-${fixtureKey}`}
                  checked={isSelected}
                  onCheckedChange={(checked) => 
                    handleCommonToggle(fixtureKey, checked === true)
                  }
                />
                <Label
                  htmlFor={`fixture-${fixtureKey}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  {fixtureName}
                </Label>
              </div>
            );
          })}
        </div>
      </div>

      {/* Custom Fixtures Input */}
      <div>
        <Label htmlFor="custom-fixture-input" className="text-sm font-medium mb-2 block">
          {t('create.fields.fixturesCustomItems')}
        </Label>
        <Input
          id="custom-fixture-input"
          type="text"
          value={customInput}
          onChange={(e) => {
            // Prevent input if already at max length (50 chars)
            if (e.target.value.length <= 50) {
              setCustomInput(e.target.value);
            }
          }}
          onKeyDown={handleCustomInputKeyDown}
          placeholder={t('create.placeholders.fixturesCustomInput')}
          className={cn(error && 'border-destructive')}
          maxLength={50}
        />
        <div className="flex items-center justify-between mt-1">
          <p className="text-xs text-muted-foreground">
            {t('create.placeholders.fixturesCustomInput')}
          </p>
          <p className={cn(
            "text-xs",
            customInput.length > 45 ? "text-warning-foreground dark:text-warning" : "text-muted-foreground"
          )}>
            {customInput.length}/50
          </p>
        </div>
      </div>

      {/* Selected Fixtures Tags */}
      {selectedItems.length > 0 ? (
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label className="text-sm font-medium">
              {t('create.fields.fixtures')}
            </Label>
            <span className={cn(
              "text-xs",
              selectedItems.length >= 18 ? "text-warning-foreground dark:text-warning font-medium" : "text-muted-foreground"
            )}>
              {selectedItems.length}/20
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedItems.map((item, index) => (
              <Badge
                key={`${item}-${index}`}
                variant="secondary"
                className="px-3 py-1 text-sm flex items-center gap-2"
              >
                <span>{item}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveItem(item)}
                  className="ml-1 rounded-full hover:bg-secondary-foreground/20 p-0.5 transition-colors"
                  aria-label={t('create.labels.fixturesRemove')}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-sm text-muted-foreground italic">
          {t('create.placeholders.fixturesEmpty')}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <p className="text-sm text-destructive mt-1">{error}</p>
      )}

      {/* Boyalı/Boyasız Seçimi (Zorunlu) */}
      <Separator className="my-4" />
      <div className="space-y-3">
        <Label className="text-sm font-medium">
          {t('create.fields.paintCondition')} *
        </Label>
        <RadioGroup
          value={isPainted === true ? 'painted' : isPainted === false ? 'unpainted' : ''}
          onValueChange={(val) => onPaintedChange(val === 'painted')}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="painted" id="painted" />
            <Label htmlFor="painted" className="font-normal cursor-pointer">
              {t('create.paintOptions.painted')}
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="unpainted" id="unpainted" />
            <Label htmlFor="unpainted" className="font-normal cursor-pointer">
              {t('create.paintOptions.unpainted')}
            </Label>
          </div>
        </RadioGroup>
        {paintedError && (
          <p className="text-sm text-destructive">{paintedError}</p>
        )}
      </div>
    </div>
  );
}
