// FeatureReminders – DARK section. Smart reminders feature.
import { useTranslation } from "react-i18next"
import { NotificationReminderMockup } from "./NotificationReminderMockup"

export const FeatureReminders = () => {
  const { t } = useTranslation('landing')

  return (
    <section className="ld-dark text-center py-32 px-6">
      <div className="relative z-10 max-w-4xl mx-auto space-y-16">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex justify-center">
            <span className="ld-eyebrow">
              <span className="ld-eyebrow-dot" />
              {t('featureReminders.eyebrow')}
            </span>
          </div>

          <h2 className="ld-serif text-4xl md:text-5xl lg:text-6xl text-[#f0ece4]">
            {t('featureReminders.title')}
          </h2>
          <p className="text-lg text-[#f0ece4]/55 font-light leading-relaxed">
            {t('featureReminders.description')}
          </p>
        </div>

        <div className="w-full flex items-center justify-center">
          <NotificationReminderMockup />
        </div>
      </div>
    </section>
  )
}
