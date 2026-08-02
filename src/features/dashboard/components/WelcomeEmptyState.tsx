import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, User, Info } from 'lucide-react';
import { ROUTES } from '@/config/constants';

export function WelcomeEmptyState() {
    const { t } = useTranslation('dashboard');
    const navigate = useNavigate();

    return (
        <Card className="animate-fade-in border-primary/30 bg-gradient-to-br from-primary/10 to-card shadow-luxury backdrop-blur-sm transition-all duration-300 hover:shadow-luxury-lg">
            <CardHeader className="text-center pb-6">
                <div className="flex justify-center mb-6">
                    <div className="rounded-2xl bg-gradient-to-br from-primary via-primary to-primary/80 p-4 shadow-lg shadow-primary/20">
                        <Building2 className="h-14 w-14 text-primary-foreground" />
                    </div>
                </div>
                <CardTitle className="text-3xl md:text-4xl font-bold text-foreground mb-3">
                    {t('welcome.title')}
                </CardTitle>
                <CardDescription className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                    {t('welcome.description')}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
                    {/* Add Property Button */}
                    <button
                        onClick={() => navigate(ROUTES.PROPERTIES)}
                        className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-primary via-primary to-primary/90 p-6 text-primary-foreground shadow-lg transition-all duration-300 hover:scale-[1.02] hover:from-primary/90 hover:to-primary hover:shadow-2xl active:scale-[0.98]"
                    >
                        <div className="flex flex-col items-center gap-4 relative z-10">
                            <div className="rounded-xl bg-primary-foreground/10 p-3 backdrop-blur-sm transition-colors group-hover:bg-primary-foreground/20">
                                <Building2 className="h-8 w-8" />
                            </div>
                            <div className="text-center">
                                <div className="font-bold text-lg mb-1">
                                    {t('welcome.addProperty')}
                                </div>
                                <div className="text-sm text-primary-foreground/90 font-normal">
                                    {t('welcome.addPropertyDesc')}
                                </div>
                            </div>
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-primary-foreground/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                    </button>

                    {/* Complete Profile Button */}
                    <button
                        onClick={() => navigate(ROUTES.PROFILE)}
                        className="group relative overflow-hidden rounded-xl border-2 border-border bg-card p-6 shadow-md transition-all duration-300 hover:scale-[1.02] hover:border-primary/40 hover:bg-primary/5 hover:shadow-xl active:scale-[0.98]"
                    >
                        <div className="flex flex-col items-center gap-4 relative z-10">
                            <div className="p-3 bg-muted rounded-xl group-hover:bg-primary/15 dark:group-hover:bg-primary/50 transition-colors">
                                <User className="h-8 w-8 text-foreground/80 group-hover:text-primary dark:group-hover:text-primary transition-colors" />
                            </div>
                            <div className="text-center">
                                <div className="font-bold text-lg text-foreground mb-1">
                                    {t('welcome.completeProfile')}
                                </div>
                                <div className="text-sm text-muted-foreground font-normal">
                                    {t('welcome.completeProfileDesc')}
                                </div>
                            </div>
                        </div>
                    </button>
                </div>

                {/* Quick Tip */}
                <div className="mx-auto mt-6 max-w-3xl rounded-xl border border-primary/30 bg-gradient-to-br from-primary/10 to-card p-5 shadow-sm">
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-primary rounded-lg shadow-md flex-shrink-0">
                            <Info className="h-4 w-4 text-primary-foreground" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-foreground mb-1">
                                {t('welcome.quickTip')}
                            </p>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                {t('welcome.quickTipDesc')}
                            </p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
