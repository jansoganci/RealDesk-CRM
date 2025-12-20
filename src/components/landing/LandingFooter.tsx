import { useTranslation } from "react-i18next"
import { useAuth } from "@/contexts/AuthContext"
import { Link } from "react-router-dom"
import { CookieSettingsLink } from "@/components/ui/cookie-settings-link"

export const LandingFooter = () => {
  const { t } = useTranslation('landing')
  const { language } = useAuth()

  const currentYear = new Date().getFullYear()
  const privacyLink = `/legal/privacy-policy-${language === 'tr' ? 'tr' : 'en'}.html`
  const termsLink = `/legal/terms-of-service-${language === 'tr' ? 'tr' : 'en'}.html`

  return (
    <footer className="bg-gray-50 border-t border-gray-200 py-16 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-sm">E</span>
              </div>
              <span className="text-xl font-bold text-gray-900">emlakcrm</span>
            </div>
            <p className="text-gray-500 max-w-xs leading-relaxed">
              {t('footer.tagline')}
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">{t('footer.company')}</h3>
            <ul className="space-y-3 text-sm text-gray-600">
              <li>
                <Link to="/about" className="hover:text-black transition-colors">
                  {t('footer.about')}
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-black transition-colors">
                  {t('footer.contact')}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-4">{t('footer.privacy')}</h3>
            <ul className="space-y-3 text-sm text-gray-600">
              <li>
                <a href={privacyLink} target="_blank" rel="noopener noreferrer" className="hover:text-black transition-colors">
                  {t('footer.privacy')}
                </a>
              </li>
              <li>
                <a href={termsLink} target="_blank" rel="noopener noreferrer" className="hover:text-black transition-colors">
                  {t('footer.terms')}
                </a>
              </li>
              <li>
                <CookieSettingsLink />
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500">
          <p>© {currentYear} emlakcrm. {t('footer.allRightsReserved')}</p>
        </div>
      </div>
    </footer>
  )
}

