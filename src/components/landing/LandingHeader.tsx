import { Menu, X, ChevronRight } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useTranslation } from "react-i18next"
import { useAuth } from "@/contexts/AuthContext"
import { useNavigate } from "react-router-dom"
import { ROUTES } from "@/config/constants"

export const LandingHeader = () => {
  const { t } = useTranslation('landing')
  const { t: tNav } = useTranslation('navigation')
  const { language, setLanguage } = useAuth()
  const navigate = useNavigate()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const changeLanguage = async (lng: string) => {
    try {
      // Import setManualLanguage dynamically to mark as manual selection
      const { setManualLanguage } = await import('@/lib/localeDetection')
      setManualLanguage(lng as 'tr' | 'en')
      await setLanguage(lng)
    } catch (error) {
      console.error('Failed to change language:', error)
    }
  }

  const scrollToFeatures = () => {
    const featuresSection = document.getElementById('features')
    if (featuresSection) {
      featuresSection.scrollIntoView({ behavior: 'smooth' })
    }
    setIsMobileMenuOpen(false)
  }

  const handleNavigation = (route: string) => {
    navigate(route)
    setIsMobileMenuOpen(false)
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
        {/* Logo */}
        <div
          className="flex items-center gap-2 cursor-pointer group"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow duration-200">
            <span className="text-white font-bold text-sm">E</span>
          </div>
          <span className="text-lg font-bold tracking-tight text-gray-900">emlakcrm</span>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center">
          {/* Nav Links */}
          <div className="flex items-center gap-6">
            <button
              onClick={scrollToFeatures}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-50 transition-all duration-200"
            >
              {t('header.features')}
            </button>

            <button
              onClick={() => handleNavigation(ROUTES.PRICING)}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-50 transition-all duration-200"
            >
              {tNav('pricing')}
            </button>
          </div>

          {/* Spacing between center and right group (gap-8 = 32px) */}
          <div className="w-8" />

          {/* Actions */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => handleNavigation(ROUTES.LOGIN)}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors duration-200"
            >
              {t('header.login')}
            </button>

            {/* Primary CTA - Refined to Ghost/Outline style for Header balance */}
            <Button
              onClick={() => handleNavigation(ROUTES.REGISTER)}
              variant="outline"
              className="border-blue-600 text-blue-600 hover:bg-blue-50 rounded-full px-6 h-10 text-sm font-semibold transition-all duration-200"
            >
              {t('header.cta')}
            </Button>
          </div>
        </nav>

        {/* Mobile: Menu Toggle */}
        <div className="md:hidden flex items-center gap-3">
          <button
            className="p-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={isMobileMenuOpen ? t('header.menuCloseLabel') : t('header.menuOpenLabel')}
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`md:hidden absolute top-16 left-0 right-0 bg-white border-b border-gray-100 shadow-lg transition-all duration-300 ease-in-out ${
          isMobileMenuOpen
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 -translate-y-2 pointer-events-none'
        }`}
      >
        <div className="p-4 flex flex-col gap-2">
          {/* Language Switcher */}
          <div className="flex items-center justify-between py-3 px-3 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium text-gray-600">{tNav('language.label')}</span>
            <div className="flex gap-1">
              <button
                onClick={() => changeLanguage('tr')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                  language === 'tr'
                    ? 'bg-gray-900 text-white'
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
                }`}
              >
                TR
              </button>
              <button
                onClick={() => changeLanguage('en')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                  language === 'en'
                    ? 'bg-gray-900 text-white'
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
                }`}
              >
                EN
              </button>
            </div>
          </div>

          {/* Nav Links */}
          <button
            onClick={scrollToFeatures}
            className="flex items-center justify-between py-3 px-3 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors duration-200"
          >
            {t('header.features')}
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>

          <button
            onClick={() => handleNavigation(ROUTES.PRICING)}
            className="flex items-center justify-between py-3 px-3 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors duration-200"
          >
            {tNav('pricing')}
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>

          <button
            onClick={() => handleNavigation(ROUTES.LOGIN)}
            className="flex items-center justify-between py-3 px-3 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors duration-200"
          >
            {t('header.login')}
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>

          {/* Primary CTA */}
          <Button
            onClick={() => handleNavigation(ROUTES.REGISTER)}
            className="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-3 text-sm font-semibold shadow-md hover:shadow-lg transition-all duration-200"
          >
            {t('header.cta')}
          </Button>
        </div>
      </div>
    </header>
  )
}
