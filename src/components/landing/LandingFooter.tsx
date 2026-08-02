import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"
import { CookieSettingsLink } from "@/components/ui/cookie-settings-link"

export const LandingFooter = () => {
  const { t } = useTranslation(['landing', 'compliance'])
  const currentYear = new Date().getFullYear()
  const privacyLink = '/legal/privacy-policy-en.html'
  const termsLink = '/legal/terms-of-service-en.html'

  return (
    <footer className="bg-gray-50 border-t border-gray-200 py-16 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <img src="/brand/closewell-logo-light.png" alt="Closewell" className="h-10 w-auto" />
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
                <Link to="/privacy" className="hover:text-black transition-colors">
                  {t('compliance:page.title')}
                </Link>
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
          <p>© {currentYear} Closewell. {t('footer.allRightsReserved')}</p>
        </div>
      </div>
    </footer>
  )
}

