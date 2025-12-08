import { Building2, Users, FileText, ArrowRight } from "lucide-react"
import { useTranslation } from "react-i18next"

export const MiniDashboardMockup = () => {
  const { t } = useTranslation('landing')

  return (
    <div className="relative w-full max-w-[650px] mx-auto px-4 md:px-0 animate-in fade-in zoom-in-95 duration-700">
      {/* Laptop Base Styling */}
      <div className="relative rounded-2xl bg-white border border-gray-200 shadow-2xl overflow-hidden aspect-[4/3] md:aspect-[16/10]">

        {/* Browser / Window Header */}
        <div className="h-6 md:h-8 bg-gray-50 border-b border-gray-100 flex items-center px-3 md:px-4 gap-1.5 md:gap-2">
          <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-red-400/80" />
          <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-amber-400/80" />
          <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-emerald-400/80" />
        </div>

        {/* Dashboard Content */}
        <div className="p-3 md:p-8 bg-slate-50/50 h-full flex flex-col gap-3 md:gap-8">

          {/* Stat Cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 md:gap-4">
            {[
              { icon: Building2, label: t('mockups.summary.propertiesLabel'), value: "24", color: "bg-blue-100 text-blue-600" },
              { icon: Users, label: t('mockups.summary.tenantsLabel'), value: "18", color: "bg-emerald-100 text-emerald-600" },
              { icon: FileText, label: t('mockups.summary.contractsLabel'), value: "12", color: "bg-purple-100 text-purple-600" }
            ].map((stat, i) => (
              <div key={i} className="bg-white p-3 md:p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 md:gap-3 mb-1 md:mb-2">
                  <div className={`w-7 h-7 md:w-8 md:h-8 rounded-lg ${stat.color} flex items-center justify-center`}>
                    <stat.icon className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  </div>
                  <span className="text-[10px] md:text-xs font-medium text-gray-400 uppercase tracking-wider">{stat.label}</span>
                </div>
                <div className="text-xl md:text-2xl font-bold text-gray-900">{stat.value}</div>
              </div>
            ))}
          </div>

          {/* Property List Preview */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex-1 p-3 md:p-6">
            <div className="flex items-center justify-between mb-3 md:mb-6">
              <div className="h-3 md:h-4 w-20 md:w-24 bg-gray-100 rounded-md" />
              <div className="h-6 w-6 md:h-8 md:w-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-300">
                <ArrowRight className="w-3 h-3 md:w-4 md:h-4" />
              </div>
            </div>

            <div className="space-y-2 md:space-y-4">
              {[
                { status: "bg-emerald-100 text-emerald-700", label: t('mockups.status.active') },
                { status: "bg-blue-100 text-blue-700", label: t('mockups.status.pending') },
                { status: "bg-amber-100 text-amber-700", label: t('mockups.status.review') }
              ].map((row, i) => (
                <div key={i} className="flex items-center justify-between py-1.5 md:py-2 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-2 md:gap-4">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-gray-50" />
                    <div className="space-y-1 md:space-y-2">
                      <div className="h-2.5 md:h-3 w-24 md:w-32 bg-gray-100 rounded" />
                      <div className="h-2 w-16 md:w-20 bg-gray-50 rounded" />
                    </div>
                  </div>
                  <div className={`px-2 md:px-3 py-0.5 md:py-1 rounded-full text-[10px] md:text-xs font-medium ${row.status}`}>
                    {row.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Laptop Bottom Shadow/Glow */}
      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-[90%] h-12 bg-gray-200 blur-2xl -z-10 opacity-50" />
    </div>
  )
}
