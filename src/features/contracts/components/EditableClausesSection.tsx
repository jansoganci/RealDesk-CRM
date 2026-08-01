/**
 * Editable Clauses Section
 * Allows users to customize contract clauses before contract creation
 *
 * Features:
 * - Displays 33 default clauses in accordion (13 + 19 + 1)
 * - Per-clause editing with save/cancel
 * - "Özelleştirilmiş" badge for customized clauses
 * - Reset to default functionality
 * - Syncs with React Hook Form state
 */

import { useState, useEffect, useCallback } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { toast } from 'sonner';
import { Pencil, RotateCcw, Check, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { clausesService } from '@/services/clauses.service';
import type { ContractFormData } from '../schemas/contractForm.schema';

// ============================================================================
// Internal State Type
// ============================================================================

interface EditableClauseState {
  type: 'GENEL_SARTLAR' | 'OZEL_SARTLAR' | 'TAHLIYE_TAAHHUTNAMESI';
  index: number;
  content: string;
  isCustomized: boolean;
  isEditing: boolean;
  draftContent: string; // For editing state (unsaved changes)
}

// ============================================================================
// Props
// ============================================================================

interface EditableClausesSectionProps {
  form: UseFormReturn<ContractFormData>;
}

// ============================================================================
// Main Component
// ============================================================================

export function EditableClausesSection({ form }: EditableClausesSectionProps) {
  const [clauses, setClauses] = useState<EditableClauseState[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation('contracts');

  /**
   * Load merged clauses from service
   * Auto-seeds templates if user doesn't have them yet
   */
  const loadClauses = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch merged clauses (no contractId = only templates, no overrides)
      const merged = await clausesService.getMergedClauses();

      // Convert to editable state
      const editableState: EditableClauseState[] = merged.map((clause) => ({
        type: clause.clause_type,
        index: clause.clause_index,
        content: clause.content,
        isCustomized: clause.is_customized,
        isEditing: false,
        draftContent: clause.content,
      }));

      setClauses(editableState);
    } catch (error) {
      console.error('[EditableClausesSection] Load error:', error);
      toast.error(t('clauses.errors.loadFailed'), {
        description: error instanceof Error ? error.message : t('clauses.errors.unknown'),
      });
    } finally {
      setLoading(false);
    }
  }, [t]);

  // Load clauses on mount / when loader identity changes
  useEffect(() => {
    void loadClauses();
  }, [loadClauses]);

  /**
   * Start editing a clause
   */
  function startEditing(type: string, index: number) {
    setClauses((prev) =>
      prev.map((clause) => {
        if (clause.type === type && clause.index === index) {
          return { ...clause, isEditing: true, draftContent: clause.content };
        }
        return clause;
      })
    );
  }

  /**
   * Cancel editing (discard draft changes)
   */
  function cancelEditing(type: string, index: number) {
    setClauses((prev) =>
      prev.map((clause) => {
        if (clause.type === type && clause.index === index) {
          return { ...clause, isEditing: false, draftContent: clause.content };
        }
        return clause;
      })
    );
  }

  /**
   * Save clause edit
   * Updates local state and syncs with form
   */
  function saveEdit(type: string, index: number) {
    setClauses((prev) =>
      prev.map((clause) => {
        if (clause.type === type && clause.index === index) {
          const newContent = clause.draftContent.trim();

          // Validation: content cannot be empty
          if (!newContent) {
            toast.error(t('clauses.errors.emptyContent'));
            return clause;
          }

          // Update form data with override
          const currentOverrides = form.getValues('clauseOverrides') || [];
          const existingIndex = currentOverrides.findIndex(
            (o) => o.clause_type === type && o.clause_index === index
          );

          if (existingIndex >= 0) {
            // Update existing override
            currentOverrides[existingIndex] = {
              clause_type: type as any,
              clause_index: index,
              custom_content: newContent,
            };
          } else {
            // Add new override
            currentOverrides.push({
              clause_type: type as any,
              clause_index: index,
              custom_content: newContent,
            });
          }

          form.setValue('clauseOverrides', currentOverrides);

          toast.success(t('clauses.toasts.customized'));

          return {
            ...clause,
            content: newContent,
            isCustomized: true,
            isEditing: false,
          };
        }
        return clause;
      })
    );
  }

  /**
   * Reset clause to default template
   * Removes override from form state and reloads template
   */
  function resetToDefault(type: string, index: number) {
    // Remove from form overrides
    const currentOverrides = form.getValues('clauseOverrides') || [];
    const filtered = currentOverrides.filter(
      (o) => !(o.clause_type === type && o.clause_index === index)
    );
    form.setValue('clauseOverrides', filtered);

    // Reload clauses to get original template content
    loadClauses();

    toast.success(t('clauses.toasts.reset'));
  }

  /**
   * Update draft content while editing
   */
  function updateDraftContent(type: string, index: number, value: string) {
    setClauses((prev) =>
      prev.map((clause) => {
        if (clause.type === type && clause.index === index) {
          return { ...clause, draftContent: value };
        }
        return clause;
      })
    );
  }

  // Group clauses by type
  const genelSartlar = clauses.filter((c) => c.type === 'GENEL_SARTLAR');
  const ozelSartlar = clauses.filter((c) => c.type === 'OZEL_SARTLAR');
  const tahliye = clauses.filter((c) => c.type === 'TAHLIYE_TAAHHUTNAMESI');

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('clauses.title')}</CardTitle>
          <CardDescription>{t('clauses.loading')}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('clauses.title')}</CardTitle>
        <CardDescription>
          {t('clauses.description')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" className="w-full">
          {/* Genel Şartlar Section */}
          <AccordionItem value="genel">
            <AccordionTrigger>
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  {t('clauses.sections.general', { count: genelSartlar.length })}
                </span>
                {genelSartlar.some((c) => c.isCustomized) && (
                  <Badge variant="secondary" className="text-xs">
                    {t('clauses.badges.customized')}
                  </Badge>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 pt-2">
                {genelSartlar.map((clause, idx) => (
                  <ClauseEditor
                    key={`genel-${idx}`}
                    clause={clause}
                    clauseNumber={idx + 1}
                    onStartEdit={() => startEditing(clause.type, clause.index)}
                    onCancelEdit={() => cancelEditing(clause.type, clause.index)}
                    onSaveEdit={() => saveEdit(clause.type, clause.index)}
                    onReset={() => resetToDefault(clause.type, clause.index)}
                    onContentChange={(value) =>
                      updateDraftContent(clause.type, clause.index, value)
                    }
                  />
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Özel Şartlar Section */}
          <AccordionItem value="ozel">
            <AccordionTrigger>
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  {t('clauses.sections.special', { count: ozelSartlar.length })}
                </span>
                {ozelSartlar.some((c) => c.isCustomized) && (
                  <Badge variant="secondary" className="text-xs">
                    {t('clauses.badges.customized')}
                  </Badge>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 pt-2">
                {ozelSartlar.map((clause, idx) => (
                  <ClauseEditor
                    key={`ozel-${idx}`}
                    clause={clause}
                    clauseNumber={idx + 1}
                    onStartEdit={() => startEditing(clause.type, clause.index)}
                    onCancelEdit={() => cancelEditing(clause.type, clause.index)}
                    onSaveEdit={() => saveEdit(clause.type, clause.index)}
                    onReset={() => resetToDefault(clause.type, clause.index)}
                    onContentChange={(value) =>
                      updateDraftContent(clause.type, clause.index, value)
                    }
                  />
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Tahliye Taahhütnamesi Section */}
          <AccordionItem value="tahliye">
            <AccordionTrigger>
              <div className="flex items-center gap-2">
                <span className="font-medium">{t('clauses.sections.eviction')}</span>
                {tahliye.some((c) => c.isCustomized) && (
                  <Badge variant="secondary" className="text-xs">
                    {t('clauses.badges.customized')}
                  </Badge>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 pt-2">
                {tahliye.map((clause, idx) => (
                  <ClauseEditor
                    key={`tahliye-${idx}`}
                    clause={clause}
                    onStartEdit={() => startEditing(clause.type, clause.index)}
                    onCancelEdit={() => cancelEditing(clause.type, clause.index)}
                    onSaveEdit={() => saveEdit(clause.type, clause.index)}
                    onReset={() => resetToDefault(clause.type, clause.index)}
                    onContentChange={(value) =>
                      updateDraftContent(clause.type, clause.index, value)
                    }
                  />
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Individual Clause Editor Component
// ============================================================================

interface ClauseEditorProps {
  clause: EditableClauseState;
  clauseNumber?: number;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onReset: () => void;
  onContentChange: (value: string) => void;
}

function ClauseEditor({
  clause,
  clauseNumber,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onReset,
  onContentChange,
}: ClauseEditorProps) {
  const { t } = useTranslation('contracts');
  const clauseLabel = clauseNumber ? t('clauses.clauseLabel', { number: clauseNumber }) : null;

  // Editing mode
  if (clause.isEditing) {
    return (
      <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {clauseLabel && (
              <span className="text-sm font-semibold text-blue-900">
                {clauseLabel}
              </span>
            )}
            <Badge variant="outline" className="text-xs">
              {t('clauses.badges.editing')}
            </Badge>
          </div>
        </div>

        <Textarea
          value={clause.draftContent}
          onChange={(e) => onContentChange(e.target.value)}
          rows={6}
          className="mb-3 font-mono text-sm resize-none"
          placeholder={t('clauses.placeholder')}
        />

        <div className="flex gap-2 justify-end">
          <Button size="sm" variant="outline" onClick={onCancelEdit}>
            <X className="h-4 w-4 mr-1" />
            {t('clauses.actions.cancel')}
          </Button>
          <Button size="sm" onClick={onSaveEdit}>
            <Check className="h-4 w-4 mr-1" />
            {t('clauses.actions.save')}
          </Button>
        </div>
      </div>
    );
  }

  // View mode
  return (
    <div className="rounded-lg border p-4 hover:border-gray-300 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {clauseLabel && (
            <span className="text-sm font-semibold text-gray-700">
              {clauseLabel}
            </span>
          )}
          {clause.isCustomized && (
            <Badge variant="secondary" className="text-xs">
              {t('clauses.badges.customized')}
            </Badge>
          )}
        </div>

        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={onStartEdit}>
            <Pencil className="h-4 w-4 mr-1" />
            {t('clauses.actions.edit')}
          </Button>
          {clause.isCustomized && (
            <Button size="sm" variant="ghost" onClick={onReset}>
              <RotateCcw className="h-4 w-4 mr-1" />
              {t('clauses.actions.reset')}
            </Button>
          )}
        </div>
      </div>

      <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
        {clause.content}
      </p>
    </div>
  );
}
