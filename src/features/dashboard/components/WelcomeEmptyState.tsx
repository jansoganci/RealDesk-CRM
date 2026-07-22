import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, User, Info } from 'lucide-react';
import { ROUTES } from '@/config/constants';

export function WelcomeEmptyState() {
    const { t } = useTranslation('dashboard');
    const navigate = useNavigate();

    return (
        <Card className="shadow-luxury hover:shadow-luxury-lg transition-all duration-300 border-blue-200/50 bg-gradient-to-br from-blue-50 to-slate-50 dark:from-slate-900 dark:to-slate-950 backdrop-blur-sm animate-fade-in">
            <CardHeader className="text-center pb-6">
                <div className="flex justify-center mb-6">
                    <div className="p-4 bg-gradient-to-br from-blue-800 via-blue-900 to-slate-900 rounded-2xl shadow-lg shadow-blue-900/30">
                        <Building2 className="h-14 w-14 text-white" />
                    </div>
                </div>
                <CardTitle className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-100 mb-3">
                    {t('welcome.title')}
                </CardTitle>
                <CardDescription className="text-base md:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
                    {t('welcome.description')}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
                    {/* Add Property Button */}
                    <button
                        onClick={() => navigate(ROUTES.PROPERTIES)}
                        className="group relative overflow-hidden rounded-xl p-6 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                    >
                        <div className="flex flex-col items-center gap-4 relative z-10">
                            <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm group-hover:bg-white/20 transition-colors">
                                <Building2 className="h-8 w-8" />
                            </div>
                            <div className="text-center">
                                <div className="font-bold text-lg mb-1">
                                    {t('welcome.addProperty')}
                                </div>
                                <div className="text-sm text-blue-100 font-normal">
                                    {t('welcome.addPropertyDesc')}
                                </div>
                            </div>
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>

                    {/* Complete Profile Button */}
                    <button
                        onClick={() => navigate(ROUTES.PROFILE)}
                        className="group relative overflow-hidden rounded-xl p-6 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 hover:border-blue-600 hover:bg-blue-50/50 dark:hover:bg-slate-800/50 shadow-md hover:shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                    >
                        <div className="flex flex-col items-center gap-4 relative z-10">
                            <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl group-hover:bg-blue-100 dark:group-hover:bg-blue-950/50 transition-colors">
                                <User className="h-8 w-8 text-slate-700 dark:text-slate-200 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors" />
                            </div>
                            <div className="text-center">
                                <div className="font-bold text-lg text-slate-900 dark:text-slate-100 mb-1">
                                    {t('welcome.completeProfile')}
                                </div>
                                <div className="text-sm text-slate-600 dark:text-slate-300 font-normal">
                                    {t('welcome.completeProfileDesc')}
                                </div>
                            </div>
                        </div>
                    </button>
                </div>

                {/* Quick Tip */}
                <div className="mt-6 p-5 bg-gradient-to-br from-blue-50 to-slate-50 dark:from-slate-900 dark:to-slate-950 border border-blue-200/50 dark:border-slate-700 rounded-xl max-w-3xl mx-auto shadow-sm">
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-blue-600 rounded-lg shadow-md flex-shrink-0">
                            <Info className="h-4 w-4 text-white" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
                                {t('welcome.quickTip')}
                            </p>
                            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                                {t('welcome.quickTipDesc')}
                            </p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
