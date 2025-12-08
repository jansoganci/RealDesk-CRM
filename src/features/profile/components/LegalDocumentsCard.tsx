import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, ScrollText, Cookie, ExternalLink, Scale } from 'lucide-react';

interface LegalDocumentsCardProps {
    language: string;
}

export function LegalDocumentsCard({ language }: LegalDocumentsCardProps) {
    const { t } = useTranslation('profile');

    return (
        <Card className="shadow-luxury hover:shadow-luxury-lg transition-all duration-300 border-blue-200/50 bg-gradient-to-br from-blue-50 to-slate-50 backdrop-blur-sm animate-fade-in lg:col-span-2">
            <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-gradient-to-br from-blue-800 via-blue-900 to-slate-900 rounded-xl shadow-lg shadow-blue-900/20">
                        <Scale className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <CardTitle className="text-lg font-bold text-slate-900">
                            {t('legal.title')}
                        </CardTitle>
                        <CardDescription className="text-sm text-slate-600 font-medium">
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
                        className="group flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-white hover:shadow-md hover:border-blue-300 transition-all duration-200"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                                <FileText className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <div className="font-medium text-slate-900 text-sm">{t('legal.privacy.title')}</div>
                                <div className="text-xs text-slate-600">{t('legal.privacy.description')}</div>
                            </div>
                        </div>
                        <ExternalLink className="h-4 w-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                    </a>

                    {/* Terms of Service */}
                    <a
                        href={`/legal/terms-of-service-${language}.html`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-white hover:shadow-md hover:border-blue-300 transition-all duration-200"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                                <ScrollText className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <div className="font-medium text-slate-900 text-sm">{t('legal.terms.title')}</div>
                                <div className="text-xs text-slate-600">{t('legal.terms.description')}</div>
                            </div>
                        </div>
                        <ExternalLink className="h-4 w-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                    </a>

                    {/* Cookie Policy */}
                    <a
                        href={`/legal/cookie-policy-${language}.html`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-white hover:shadow-md hover:border-blue-300 transition-all duration-200"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                                <Cookie className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <div className="font-medium text-slate-900 text-sm">{t('legal.cookies.title')}</div>
                                <div className="text-xs text-slate-600">{t('legal.cookies.description')}</div>
                            </div>
                        </div>
                        <ExternalLink className="h-4 w-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                    </a>
                </div>
            </CardContent>
        </Card>
    );
}
