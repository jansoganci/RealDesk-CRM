import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Save, Loader2 } from 'lucide-react';
import { PersonalInfoSection } from './PersonalInfoSection';
import type { UseFormReturn } from 'react-hook-form';
import type { getProfileSchema } from '../profileSchema';
import type * as z from 'zod';

type ProfileFormData = z.infer<ReturnType<typeof getProfileSchema>>;

interface PersonalInfoCardProps {
    form: UseFormReturn<ProfileFormData>;
    loading: boolean;
    onSave: () => void;
}

export function PersonalInfoCard({ form, loading, onSave }: PersonalInfoCardProps) {
    const { t } = useTranslation('profile');

    return (
        <Card className="shadow-luxury hover:shadow-luxury-lg transition-all duration-300 border-blue-200/50 bg-gradient-to-br from-blue-50 to-slate-50 backdrop-blur-sm animate-fade-in">
            <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-gradient-to-br from-blue-800 via-blue-900 to-slate-900 rounded-xl shadow-lg shadow-blue-900/20">
                            <User className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <CardTitle className="text-lg font-bold text-slate-900">
                                {t('sections.account')}
                            </CardTitle>
                            <CardDescription className="text-sm text-slate-600 font-medium">
                                {t('pageDescription')}
                            </CardDescription>
                        </div>
                    </div>
                    <Button
                        onClick={onSave}
                        disabled={loading}
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {t('actions.saving')}
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                {t('actions.save')}
                            </>
                        )}
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <PersonalInfoSection form={form} loading={loading} />
                </div>
            </CardContent>
        </Card>
    );
}
