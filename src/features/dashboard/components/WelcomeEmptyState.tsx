import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, User, Info } from 'lucide-react';
import { ROUTES } from '@/config/constants';

export function WelcomeEmptyState() {
    const { t } = useTranslation('dashboard');
    const navigate = useNavigate();

    return (
        <Card className="shadow-luxury hover:shadow-luxury-lg transition-all duration-300 border-primary/30/50 bg-gradient-to-br from-primary to-foreground/70 dark:from-background dark:to-card backdrop-blur-sm animate-fade-in">
            <CardHeader className="text-center pb-6">
                <div className="flex justify-center mb-6">
                    <div className="p-4 bg-gradient-to-br from-primary via-primary to-foreground/70 rounded-2xl shadow-lg shadow-primary/20">
                        <Building2 className="h-14 w-14 text-white" />
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
                        className="group relative overflow-hidden rounded-xl p-6 bg-gradient-to-br from-primary via-primary to-primary hover:from-primary hover:to-primary text-white shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                    >
                        <div className="flex flex-col items-center gap-4 relative z-10">
                            <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm group-hover:bg-white/20 transition-colors">
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
                        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>

                    {/* Complete Profile Button */}
                    <button
                        onClick={() => navigate(ROUTES.PROFILE)}
                        className="group relative overflow-hidden rounded-xl p-6 bg-card border-2 border-border hover:border-primary/40 hover:bg-primary/10/50 dark:hover:bg-muted shadow-md hover:shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
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
                <div className="mt-6 p-5 bg-gradient-to-br from-primary to-foreground/70 dark:from-background dark:to-card border border-primary/30/50 dark:border-border rounded-xl max-w-3xl mx-auto shadow-sm">
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-primary rounded-lg shadow-md flex-shrink-0">
                            <Info className="h-4 w-4 text-white" />
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
