import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, ScrollText, Cookie, ExternalLink, Scale } from 'lucide-react';

interface LegalDocumentsCardProps {
    language: string;
}

export function LegalDocumentsCard({ language }: LegalDocumentsCardProps) {
    const { t } = useTranslation('profile');

    return (
        <Card className="shadow-luxury hover:shadow-luxury-lg dark:hover:shadow-black/30 transition-all duration-300 border-blue-200/50 dark:border-slate-700 bg-gradient-to-br from-blue-50 to-slate-50 dark:from-slate-900 dark:to-slate-950 backdrop-blur-sm animate-fade-in lg:col-span-2 dark:shadow-black/25">
            <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-gradient-to-br from-blue-800 via-blue-900 to-slate-900 dark:from-blue-950 dark:via-slate-900 dark:to-slate-950 rounded-xl shadow-lg shadow-blue-900/20 dark:shadow-black/40">
                        <Scale className="h-5 w-5 text-white dark:text-slate-100" />
                    </div>
                    <div>
                        <CardTitle className="text-lg font-bold text-slate-900 dark:text-slate-100">
                            {t('legal.title')}
                        </CardTitle>
                        <CardDescription className="text-sm text-slate-600 dark:text-slate-300 font-medium">
                            {t('pageDescription')}
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Privacy Policy */}
                    <a
                        href={`/legal/privacy-policy-${language}.html`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center justify-between p-4 border border-slate-200 dark:border-slate-600 rounded-lg bg-white/60 dark:bg-slate-900/60 hover:bg-white dark:hover:bg-slate-800 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-500 transition-all duration-200"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-50 dark:bg-blue-950/60 rounded-lg group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40 transition-colors">
                                <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <div className="font-medium text-slate-900 dark:text-slate-100 text-sm">{t('legal.privacy.title')}</div>
                                <div className="text-xs text-slate-600 dark:text-slate-300">{t('legal.privacy.description')}</div>
                            </div>
                        </div>
                        <ExternalLink className="h-4 w-4 text-slate-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors shrink-0" />
                    </a>

                    {/* Terms of Service */}
                    <a
                        href={`/legal/terms-of-service-${language}.html`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center justify-between p-4 border border-slate-200 dark:border-slate-600 rounded-lg bg-white/60 dark:bg-slate-900/60 hover:bg-white dark:hover:bg-slate-800 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-500 transition-all duration-200"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-50 dark:bg-blue-950/60 rounded-lg group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40 transition-colors">
                                <ScrollText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <div className="font-medium text-slate-900 dark:text-slate-100 text-sm">{t('legal.terms.title')}</div>
                                <div className="text-xs text-slate-600 dark:text-slate-300">{t('legal.terms.description')}</div>
                            </div>
                        </div>
                        <ExternalLink className="h-4 w-4 text-slate-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors shrink-0" />
                    </a>

                    {/* Cookie Policy */}
                    <a
                        href={`/legal/cookie-policy-${language}.html`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center justify-between p-4 border border-slate-200 dark:border-slate-600 rounded-lg bg-white/60 dark:bg-slate-900/60 hover:bg-white dark:hover:bg-slate-800 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-500 transition-all duration-200"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-50 dark:bg-blue-950/60 rounded-lg group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40 transition-colors">
                                <Cookie className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <div className="font-medium text-slate-900 dark:text-slate-100 text-sm">{t('legal.cookies.title')}</div>
                                <div className="text-xs text-slate-600 dark:text-slate-300">{t('legal.cookies.description')}</div>
                            </div>
                        </div>
                        <ExternalLink className="h-4 w-4 text-slate-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors shrink-0" />
                    </a>
                </div>
            </CardContent>
        </Card>
    );
}
