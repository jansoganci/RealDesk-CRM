// FeatureReminders – focus on reminders and not missing key dates.
import { useTranslation } from "react-i18next"
import { NotificationReminderMockup } from "./NotificationReminderMockup"

export const FeatureReminders = () => {
  const { t } = useTranslation('landing')

  return (
    <section className="min-h-screen flex flex-col items-center justify-center px-6 bg-gray-50 text-center py-20">
      <div className="max-w-4xl mx-auto space-y-16">
        <div className="max-w-2xl mx-auto space-y-6">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight">
            {t('featureReminders.title')}
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed">
            {t('featureReminders.description')}
            </p>
        </div>

        {/* Notification Mockup */}
        <div className="w-full flex items-center justify-center">
          <NotificationReminderMockup />
        </div>
      </div>
    </section>
  )
}
