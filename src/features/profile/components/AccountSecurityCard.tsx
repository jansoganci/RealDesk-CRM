import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { User, Mail, Loader2, KeyRound, Save } from 'lucide-react';
import { ReauthModal } from '@/components/common/ReauthModal';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import type { UseFormReturn } from 'react-hook-form';
import type { getProfileSchema } from '../profileSchema';
import type * as z from 'zod';

type ProfileFormData = z.infer<ReturnType<typeof getProfileSchema>>;

interface AccountSecurityCardProps {
    user: SupabaseUser | null;
    form: UseFormReturn<ProfileFormData>;
    loading: boolean;
    onSave: () => void;
}

export function AccountSecurityCard({ user, form, loading, onSave }: AccountSecurityCardProps) {
    const { t } = useTranslation('profile');
    const { changeEmail, updatePassword, reauthenticate } = useAuth();

    // Email change state
    const [newEmail, setNewEmail] = useState('');
    const [emailLoading, setEmailLoading] = useState(false);
    const [emailSuccessMessage, setEmailSuccessMessage] = useState<string | null>(null);
    const [emailErrorMessage, setEmailErrorMessage] = useState<string | null>(null);
    const [showReauthForEmail, setShowReauthForEmail] = useState(false);

    // Password change state
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [passwordSuccessMessage, setPasswordSuccessMessage] = useState<string | null>(null);
    const [passwordErrorMessage, setPasswordErrorMessage] = useState<string | null>(null);

    // Handle email change (called after successful reauthentication)
    const handleChangeEmail = async () => {
        setEmailSuccessMessage(null);
        setEmailErrorMessage(null);

        if (!newEmail.trim()) {
            setEmailErrorMessage(t('security.changeEmail.errorEmpty'));
            return;
        }

        setEmailLoading(true);

        const result = await changeEmail(newEmail.trim());

        if (!result.success) {
            setEmailErrorMessage(`${t('security.changeEmail.errorFailed')}: ${result.error ?? ''}`);
        } else {
            setEmailSuccessMessage(t('security.changeEmail.success'));
            setNewEmail('');
        }

        setEmailLoading(false);
    };

    // Handle email change button click (opens reauth modal)
    const handleEmailChangeClick = (e: React.FormEvent) => {
        e.preventDefault();
        setEmailSuccessMessage(null);
        setEmailErrorMessage(null);

        if (!newEmail.trim()) {
            setEmailErrorMessage(t('security.changeEmail.errorEmpty'));
            return;
        }

        setShowReauthForEmail(true);
    };

    // Handle password change
    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordSuccessMessage(null);
        setPasswordErrorMessage(null);

        if (!currentPassword.trim() || !newPassword.trim() || !confirmNewPassword.trim()) {
            setPasswordErrorMessage(t('security.changePassword.errorEmpty'));
            return;
        }

        if (newPassword !== confirmNewPassword) {
            setPasswordErrorMessage(t('security.changePassword.errorMismatch'));
            return;
        }

        setPasswordLoading(true);

        // 1) Reauth with current password
        const reauthResult = await reauthenticate(currentPassword);
        if (!reauthResult.success) {
            setPasswordLoading(false);
            setPasswordErrorMessage(reauthResult.error ?? t('security.changePassword.errorFailed'));
            return;
        }

        // 2) Update password
        const updateResult = await updatePassword(newPassword);
        setPasswordLoading(false);

        if (!updateResult.success) {
            setPasswordErrorMessage(updateResult.error ?? t('security.changePassword.errorFailed'));
            return;
        }

        setPasswordSuccessMessage(t('security.changePassword.success'));
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
    };

    return (
        <>
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
                                    {t('security.description')}
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
                <CardContent className="space-y-6">
                    {/* Current Email Display */}
                    <div className="p-3 bg-white/70 rounded-lg border border-slate-200">
                        <div className="text-xs text-slate-600 mb-1">{t('fields.email')}</div>
                        <div className="text-sm font-medium text-slate-900">{user?.email || t('fields.notAvailable')}</div>
                    </div>

                    {/* Personal Info Fields */}
                    <div className="space-y-4">
                        {/* Full Name */}
                        <FormField
                            control={form.control}
                            name="full_name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-sm">{t('fields.fullName')}</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder={t('fields.fullNamePlaceholder')}
                                            {...field}
                                            disabled={loading}
                                            className="h-9"
                                        />
                                    </FormControl>
                                    <FormMessage className="text-xs" />
                                </FormItem>
                            )}
                        />

                        {/* Phone Number */}
                        <FormField
                            control={form.control}
                            name="phone_number"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-sm">{t('fields.phoneNumber')}</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder={t('fields.phoneNumberPlaceholder')}
                                            {...field}
                                            disabled={loading}
                                            className="h-9"
                                        />
                                    </FormControl>
                                    <FormMessage className="text-xs" />
                                </FormItem>
                            )}
                        />
                    </div>

                    <div className="border-t border-slate-200" />

                    {/* Change Email Section */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-blue-600" />
                            <h4 className="text-sm font-semibold text-slate-900">{t('security.changeEmail.title')}</h4>
                        </div>
                        <p className="text-xs text-slate-600">{t('security.changeEmail.description')}</p>

                        {emailSuccessMessage && (
                            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                                <p className="text-sm text-emerald-800">{emailSuccessMessage}</p>
                            </div>
                        )}

                        {emailErrorMessage && (
                            <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                                <p className="text-sm text-red-800">{emailErrorMessage}</p>
                            </div>
                        )}

                        <div className="space-y-3">
                            <div className="flex gap-2">
                                <Input
                                    type="email"
                                    placeholder={t('security.changeEmail.placeholder')}
                                    value={newEmail}
                                    onChange={(e) => setNewEmail(e.target.value)}
                                    disabled={emailLoading}
                                    className="flex-1"
                                />
                                <Button
                                    onClick={handleEmailChangeClick}
                                    disabled={emailLoading}
                                    size="sm"
                                    className="bg-blue-600 hover:bg-blue-700"
                                >
                                    {emailLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            {t('security.changeEmail.sending')}
                                        </>
                                    ) : (
                                        <>
                                            <Mail className="mr-2 h-4 w-4" />
                                            {t('security.changeEmail.button')}
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-slate-200" />

                    {/* Change Password Section */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <KeyRound className="h-4 w-4 text-blue-600" />
                            <h4 className="text-sm font-semibold text-slate-900">{t('security.changePassword.title')}</h4>
                        </div>
                        <p className="text-xs text-slate-600">{t('security.changePassword.description')}</p>

                        {passwordSuccessMessage && (
                            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                                <p className="text-sm text-emerald-800">{passwordSuccessMessage}</p>
                            </div>
                        )}

                        {passwordErrorMessage && (
                            <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                                <p className="text-sm text-red-800">{passwordErrorMessage}</p>
                            </div>
                        )}

                        <div className="space-y-3">
                            <Input
                                type="password"
                                placeholder={t('security.changePassword.currentPassword')}
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                disabled={passwordLoading}
                            />
                            <Input
                                type="password"
                                placeholder={t('security.changePassword.newPassword')}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                disabled={passwordLoading}
                            />
                            <Input
                                type="password"
                                placeholder={t('security.changePassword.confirmPassword')}
                                value={confirmNewPassword}
                                onChange={(e) => setConfirmNewPassword(e.target.value)}
                                disabled={passwordLoading}
                            />
                            <Button
                                onClick={handleChangePassword}
                                disabled={passwordLoading}
                                size="sm"
                                className="w-full bg-blue-600 hover:bg-blue-700"
                            >
                                {passwordLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        {t('security.changePassword.updating')}
                                    </>
                                ) : (
                                    t('security.changePassword.button')
                                )}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Reauthentication Modal for Email Change */}
            <ReauthModal
                isOpen={showReauthForEmail}
                onClose={() => setShowReauthForEmail(false)}
                onSuccess={handleChangeEmail}
            />
        </>
    );
}
