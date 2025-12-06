import { Globe, Menu, X } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
      await setLanguage(lng)
    } catch (error) {
      console.error('Failed to change language:', error)
    }
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <span className="text-xl font-bold tracking-tight text-gray-900">emlakcrm</span>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-gray-600 hover:text-black">
                <Globe className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => changeLanguage('tr')}>
                {language === 'tr' && '✓ '} Türkçe
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => changeLanguage('en')}>
                {language === 'en' && '✓ '} English
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button 
            variant="ghost" 
            onClick={() => navigate(ROUTES.PRICING)}
            className="font-medium text-gray-600 hover:text-black hover:bg-gray-50"
          >
            {tNav('pricing', 'Fiyatlar')}
          </Button>

          <Button 
            variant="ghost" 
            onClick={() => navigate(ROUTES.LOGIN)}
            className="font-medium text-gray-600 hover:text-black hover:bg-gray-50"
          >
            {t('header.login', 'Giriş Yap')}
          </Button>
          
          <Button 
            onClick={() => navigate(ROUTES.LOGIN)}
            className="bg-black text-white hover:bg-gray-800 rounded-full px-6"
          >
            {t('header.getStarted')}
          </Button>
        </nav>

        {/* Mobile Menu Toggle */}
        <button 
          className="md:hidden text-gray-900"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-20 left-0 right-0 bg-white border-b border-gray-100 p-6 flex flex-col gap-4 shadow-lg">
          <div className="flex items-center justify-between py-2 border-b border-gray-50">
             <span className="text-sm font-medium text-gray-500">{tNav('language.label', 'Dil')}</span>
             <div className="flex gap-2">
               <Button 
                 variant={language === 'tr' ? 'default' : 'outline'} 
                 size="sm" 
                 onClick={() => changeLanguage('tr')}
                 className={language === 'tr' ? 'bg-black text-white' : ''}
               >
                 TR
               </Button>
               <Button 
                 variant={language === 'en' ? 'default' : 'outline'} 
                 size="sm" 
                 onClick={() => changeLanguage('en')}
                 className={language === 'en' ? 'bg-black text-white' : ''}
               >
                 EN
               </Button>
             </div>
          </div>
          <Button 
            variant="outline" 
            onClick={() => navigate(ROUTES.PRICING)}
            className="w-full justify-center"
          >
            {tNav('pricing', 'Fiyatlar')}
          </Button>
          <Button 
            variant="outline" 
            onClick={() => navigate(ROUTES.LOGIN)}
            className="w-full justify-center"
          >
            {t('header.login', 'Giriş Yap')}
          </Button>
          <Button 
            onClick={() => navigate(ROUTES.LOGIN)}
            className="w-full justify-center bg-black text-white hover:bg-gray-800"
          >
            {t('header.getStarted')}
          </Button>
        </div>
      )}
    </header>
  )
}
