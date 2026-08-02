import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, ScrollText, Cookie, ExternalLink, Scale } from 'lucide-react';

interface LegalDocumentsCardProps {
    language: string;
}

export function LegalDocumentsCard({ language }: LegalDocumentsCardProps) {
    const { t } = useTranslation('profile');

    return (
        <Card className="shadow-luxury hover:shadow-luxury-lg dark:hover:shadow-black/30 transition-all duration-300 border-primary/30/50 dark:border-border bg-gradient-to-br from-primary to-background dark:from-foreground dark:to-foreground backdrop-blur-sm animate-fade-in lg:col-span-2 dark:shadow-black/25">
            <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-gradient-to-br from-primary via-primary to-foreground dark:from-primary dark:via-foreground dark:to-foreground rounded-xl shadow-lg shadow-primary/30 dark:shadow-black/40">
                        <Scale className="h-5 w-5 text-white dark:text-muted-foreground" />
                    </div>
                    <div>
                        <CardTitle className="text-lg font-bold text-foreground dark:text-muted-foreground">
                            {t('legal.title')}
                        </CardTitle>
                        <CardDescription className="text-sm text-muted-foreground dark:text-muted-foreground font-medium">
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
                        className="group flex items-center justify-between p-4 border border-border dark:border-border rounded-lg bg-card/60 dark:bg-muted hover:bg-card dark:hover:bg-muted hover:shadow-md hover:border-primary/40 dark:hover:border-primary transition-all duration-200"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 dark:bg-primary/60 rounded-lg group-hover:bg-primary/15 dark:group-hover:bg-primary/40 transition-colors">
                                <FileText className="h-5 w-5 text-primary dark:text-primary" />
                            </div>
                            <div>
                                <div className="font-medium text-foreground dark:text-muted-foreground text-sm">{t('legal.privacy.title')}</div>
                                <div className="text-xs text-muted-foreground dark:text-muted-foreground">{t('legal.privacy.description')}</div>
                            </div>
                        </div>
                        <ExternalLink className="h-4 w-4 text-muted-foreground/70 dark:text-muted-foreground group-hover:text-primary dark:group-hover:text-primary transition-colors shrink-0" />
                    </a>

                    {/* Terms of Service */}
                    <a
                        href={`/legal/terms-of-service-${language}.html`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center justify-between p-4 border border-border dark:border-border rounded-lg bg-card/60 dark:bg-muted hover:bg-card dark:hover:bg-muted hover:shadow-md hover:border-primary/40 dark:hover:border-primary transition-all duration-200"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 dark:bg-primary/60 rounded-lg group-hover:bg-primary/15 dark:group-hover:bg-primary/40 transition-colors">
                                <ScrollText className="h-5 w-5 text-primary dark:text-primary" />
                            </div>
                            <div>
                                <div className="font-medium text-foreground dark:text-muted-foreground text-sm">{t('legal.terms.title')}</div>
                                <div className="text-xs text-muted-foreground dark:text-muted-foreground">{t('legal.terms.description')}</div>
                            </div>
                        </div>
                        <ExternalLink className="h-4 w-4 text-muted-foreground/70 dark:text-muted-foreground group-hover:text-primary dark:group-hover:text-primary transition-colors shrink-0" />
                    </a>

                    {/* Cookie Policy */}
                    <a
                        href={`/legal/cookie-policy-${language}.html`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center justify-between p-4 border border-border dark:border-border rounded-lg bg-card/60 dark:bg-muted hover:bg-card dark:hover:bg-muted hover:shadow-md hover:border-primary/40 dark:hover:border-primary transition-all duration-200"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 dark:bg-primary/60 rounded-lg group-hover:bg-primary/15 dark:group-hover:bg-primary/40 transition-colors">
                                <Cookie className="h-5 w-5 text-primary dark:text-primary" />
                            </div>
                            <div>
                                <div className="font-medium text-foreground dark:text-muted-foreground text-sm">{t('legal.cookies.title')}</div>
                                <div className="text-xs text-muted-foreground dark:text-muted-foreground">{t('legal.cookies.description')}</div>
                            </div>
                        </div>
                        <ExternalLink className="h-4 w-4 text-muted-foreground/70 dark:text-muted-foreground group-hover:text-primary dark:group-hover:text-primary transition-colors shrink-0" />
                    </a>
                </div>
            </CardContent>
        </Card>
    );
}
