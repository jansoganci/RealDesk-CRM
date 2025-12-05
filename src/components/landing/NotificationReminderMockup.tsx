import { Bell, AlertCircle, Calendar, TrendingUp } from "lucide-react"
import { useTranslation } from "react-i18next"

export function NotificationReminderMockup() {
  const { t } = useTranslation('landing')

  return (
    <div className="relative mx-auto w-full max-w-[420px] animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Background Glow */}
      <div className="absolute -inset-4 bg-gradient-to-b from-amber-100/50 to-transparent rounded-[2rem] blur-xl -z-10" />

      {/* Main Card */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white border border-gray-100 shadow-sm flex items-center justify-center relative">
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">{t('mockups.reminders.title')}</h3>
              <p className="text-xs text-gray-500 font-medium">{t('mockups.reminders.subtitle')}</p>
            </div>
          </div>
          <div className="px-2.5 py-1 bg-red-50 text-red-600 text-[10px] font-bold uppercase tracking-wide rounded-full border border-red-100">
            {t('mockups.reminders.actionRequired')}
          </div>
        </div>

        {/* List */}
        <div className="divide-y divide-gray-50">
          {/* Item 1: Urgent Contract */}
          <div className="p-4 hover:bg-gray-50/50 transition-colors flex items-center gap-4 group cursor-default">
            <div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
              <AlertCircle className="w-5 h-5 text-rose-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start mb-0.5">
                <p className="text-sm font-bold text-gray-900 truncate">{t('mockups.reminders.item1.title')}</p>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-rose-100 text-rose-700">
                  {t('mockups.reminders.urgent')}
                </span>
              </div>
              <p className="text-xs text-gray-500 truncate">{t('mockups.reminders.item1.detail')}</p>
              <p className="text-[10px] font-medium text-rose-600 mt-1">{t('mockups.reminders.item1.time')}</p>
            </div>
          </div>

          {/* Item 2: Rent Increase */}
          <div className="p-4 hover:bg-gray-50/50 transition-colors flex items-center gap-4 group cursor-default">
            <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
              <TrendingUp className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start mb-0.5">
                <p className="text-sm font-bold text-gray-900 truncate">{t('mockups.reminders.item2.title')}</p>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-700">
                  {t('mockups.reminders.soon')}
                </span>
              </div>
              <p className="text-xs text-gray-500 truncate">{t('mockups.reminders.item2.detail')}</p>
              <p className="text-[10px] font-medium text-amber-600 mt-1">{t('mockups.reminders.item2.time')}</p>
            </div>
          </div>

          {/* Item 3: Viewing */}
          <div className="p-4 hover:bg-gray-50/50 transition-colors flex items-center gap-4 group cursor-default">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start mb-0.5">
                <p className="text-sm font-bold text-gray-900 truncate">{t('mockups.reminders.item3.title')}</p>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-700">
                  {t('mockups.reminders.today')}
                </span>
              </div>
              <p className="text-xs text-gray-500 truncate">{t('mockups.reminders.item3.detail')}</p>
              <p className="text-[10px] font-medium text-blue-600 mt-1">{t('mockups.reminders.item3.time')}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-gray-50 border-t border-gray-100 text-center">
          <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">{t('mockups.generatedBy')}</p>
        </div>
      </div>
    </div>
  )
}
