import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { useAuth } from "@/contexts/AuthContext"
import {
  Building2,
  FileText,
  Bell,
  Zap,
  ArrowRight,
  Globe,
  UserPlus,
  LayoutDashboard,
  Star,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { ROUTES } from "@/config/constants"

export const LandingPage = () => {
  const [isVisible, setIsVisible] = useState<{ [key: string]: boolean }>({})
  const observerRef = useRef<IntersectionObserver | null>(null)
  const navigate = useNavigate()
  const { t } = useTranslation('landing')
  const { t: tNav } = useTranslation('navigation')
  const { language, setLanguage } = useAuth()

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible((prev) => ({ ...prev, [entry.target.id]: true }))
          }
        })
      },
      { threshold: 0.1 },
    )

    const elements = document.querySelectorAll("[data-animate]")
    elements.forEach((el) => observerRef.current?.observe(el))

    return () => observerRef.current?.disconnect()
  }, [])

  const handleGetStarted = () => {
    navigate(ROUTES.LOGIN)
  }

  const changeLanguage = (lng: string) => {
    setLanguage(lng)
  }

  const features = [
    {
      icon: Building2,
      titleKey: "features.properties.title",
      descriptionKey: "features.properties.description",
      gradient: "from-blue-500 to-blue-600",
      delay: 0,
    },
    {
      icon: FileText,
      titleKey: "features.contracts.title",
      descriptionKey: "features.contracts.description",
      gradient: "from-orange-500 to-orange-600",
      delay: 100,
    },
    {
      icon: Bell,
      titleKey: "features.reminders.title",
      descriptionKey: "features.reminders.description",
      gradient: "from-red-500 to-red-600",
      delay: 200,
    },
  ]


  const howItWorksSteps = [
    {
      icon: UserPlus,
      titleKey: "howItWorks.step1.title",
      descriptionKey: "howItWorks.step1.description",
      gradient: "from-blue-500 to-blue-600",
    },
    {
      icon: Building2,
      titleKey: "howItWorks.step2.title",
      descriptionKey: "howItWorks.step2.description",
      gradient: "from-teal-500 to-teal-600",
    },
    {
      icon: LayoutDashboard,
      titleKey: "howItWorks.step3.title",
      descriptionKey: "howItWorks.step3.description",
      gradient: "from-green-500 to-green-600",
    },
  ]

  const testimonials = [
    {
      nameKey: "testimonials.testimonial1.name",
      titleKey: "testimonials.testimonial1.title",
      quoteKey: "testimonials.testimonial1.quote",
      imagePath: "/testimonials/testimonial1.jpg",
    },
    {
      nameKey: "testimonials.testimonial2.name",
      titleKey: "testimonials.testimonial2.title",
      quoteKey: "testimonials.testimonial2.quote",
      imagePath: "/testimonials/testimonial2.jpg",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-blue-50/30 to-slate-50">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded-md flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">Emlak CRM</span>
            </div>
            <nav className="hidden md:flex items-center gap-4">
              <a href="#features" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">
                {t("header.features")}
              </a>
              <a href="#benefits" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">
                {t("header.benefits")}
              </a>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Globe className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => changeLanguage('en')}>
                    {language === 'en' && '✓ '}
                    {tNav('language.english')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => changeLanguage('tr')}>
                    {language === 'tr' && '✓ '}
                    {tNav('language.turkish')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button 
                onClick={handleGetStarted}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md shadow-blue-500/30 text-white rounded-md"
              >
                {t("header.getStarted")}
              </Button>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-transparent to-teal-50 opacity-50" />
        <div className="max-w-7xl mx-auto relative">
          <div className="text-center max-w-4xl mx-auto animate-fade-in">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              {t("hero.title")}
              <span className="block bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
                {t("hero.titleHighlight")}
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 leading-relaxed max-w-2xl mx-auto">
              {t("hero.description")}
            </p>
            
            {/* Dashboard Preview Behind Text */}
            <div className="relative -mt-8 mb-8">
              <div className="absolute inset-0 bg-gradient-to-t from-slate-50 via-transparent to-transparent h-40 bottom-0 z-10" />
              <div className="relative mx-auto max-w-5xl">
                <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-2xl border border-gray-200 p-4 animate-float opacity-60">
                  <div className="bg-gradient-to-br from-blue-50 to-teal-50 rounded-lg aspect-video flex items-center justify-center">
                    <div className="text-center">
                      <Building2 className="w-24 h-24 text-blue-600 mx-auto mb-4 opacity-50" />
                      <p className="text-gray-500 font-medium">{t("hero.dashboardPreview")}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <Button 
                onClick={handleGetStarted}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-500/30 text-white rounded-md px-8 py-6 text-lg font-medium transition-all hover:shadow-xl hover:scale-105"
              >
                {t("hero.startTrial")}
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div
            id="features-header"
            data-animate
            className={`text-center mb-16 transition-all duration-700 ${
              isVisible["features-header"] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
            }`}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">{t("features.title")}</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {t("features.subtitle")}
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {features.map((feature, index) => (
              <div
                key={index}
                id={`feature-${index}`}
                data-animate
                className={`transition-all duration-700 ${
                  isVisible[`feature-${index}`] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
                }`}
                style={{ transitionDelay: `${feature.delay}ms` }}
              >
                <Card className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-100 p-6 h-full hover:shadow-xl transition-all hover:scale-105 group">
                  <div
                    className={`w-12 h-12 bg-gradient-to-r ${feature.gradient} rounded-md flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                  >
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{t(feature.titleKey)}</h3>
                  <p className="text-gray-600 leading-relaxed">{t(feature.descriptionKey)}</p>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 bg-white/50">
        <div className="max-w-7xl mx-auto">
          <div
            id="how-it-works-header"
            data-animate
            className={`text-center mb-16 transition-all duration-700 ${
              isVisible["how-it-works-header"] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
            }`}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">{t("howItWorks.title")}</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {t("howItWorks.subtitle")}
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {howItWorksSteps.map((step, index) => (
              <div
                key={index}
                id={`step-${index}`}
                data-animate
                className={`transition-all duration-700 ${
                  isVisible[`step-${index}`] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
                }`}
                style={{ transitionDelay: `${index * 150}ms` }}
              >
                <Card className="bg-white rounded-xl shadow-lg border border-gray-100 p-8 text-center hover:shadow-xl transition-all h-full relative">
                  {/* Step Number */}
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {index + 1}
                    </div>
                  </div>
                  
                  {/* Icon */}
                  <div className={`w-16 h-16 bg-gradient-to-r ${step.gradient} rounded-md flex items-center justify-center mx-auto mb-6 mt-4`}>
                    <step.icon className="w-8 h-8 text-white" />
                  </div>
                  
                  {/* Content */}
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{t(step.titleKey)}</h3>
                  <p className="text-gray-600 leading-relaxed">{t(step.descriptionKey)}</p>
                  
                  {/* Arrow (only between steps) */}
                  {index < howItWorksSteps.length - 1 && (
                    <div className="hidden md:block absolute top-1/2 -right-6 transform -translate-y-1/2">
                      <ChevronRight className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section - Simple & Visual */}
      <section id="benefits" className="py-20 px-4 sm:px-6 lg:px-8 bg-white/50">
        <div className="max-w-4xl mx-auto">
          <div
            id="benefits-header"
            data-animate
            className={`text-center mb-12 transition-all duration-700 ${
              isVisible["benefits-header"] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
            }`}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              {t("benefits.title")}
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { key: "benefits.item1", icon: Bell },
              { key: "benefits.item2", icon: Zap },
              { key: "benefits.item3", icon: Building2 },
            ].map((benefit, index) => (
              <div
                key={index}
                id={`benefit-${index}`}
                data-animate
                className={`transition-all duration-700 ${
                  isVisible[`benefit-${index}`] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <Card className="bg-white rounded-xl shadow-lg border border-gray-100 p-8 text-center hover:shadow-xl transition-all h-full">
                  <benefit.icon className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                  <p className="text-base font-semibold text-gray-800 leading-snug">{t(benefit.key)}</p>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div
            id="testimonials-header"
            data-animate
            className={`text-center mb-16 transition-all duration-700 ${
              isVisible["testimonials-header"] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
            }`}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">{t("testimonials.title")}</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {t("testimonials.subtitle")}
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                id={`testimonial-${index}`}
                data-animate
                className={`transition-all duration-700 ${
                  isVisible[`testimonial-${index}`] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
                }`}
                style={{ transitionDelay: `${index * 150}ms` }}
              >
                <Card className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all h-full">
                  {/* Stars */}
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  
                  {/* Quote */}
                  <p className="text-gray-700 mb-6 leading-relaxed italic">
                    "{t(testimonial.quoteKey)}"
                  </p>
                  
                  {/* Author */}
                  <div className="flex items-center gap-4">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={testimonial.imagePath} alt={t(testimonial.nameKey)} />
                      <AvatarFallback className="bg-gradient-to-r from-blue-500 to-teal-500 text-white">
                        {t(testimonial.nameKey)
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-gray-900">{t(testimonial.nameKey)}</p>
                      <p className="text-sm text-gray-600">{t(testimonial.titleKey)}</p>
                    </div>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-blue-700 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/10" />
        <div className="max-w-4xl mx-auto text-center relative">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            {t("cta.title")}
          </h2>
          <p className="text-xl text-blue-100 mb-10 leading-relaxed">
            {t("cta.description")}
          </p>
          <div className="flex justify-center">
            <Button 
              onClick={handleGetStarted}
              className="bg-white text-blue-700 hover:bg-blue-50 shadow-lg shadow-blue-900/30 rounded-md px-8 py-6 text-lg font-medium transition-all hover:shadow-xl hover:scale-105"
            >
              {t("cta.startTrial")}
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded-md flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white">Emlak CRM</span>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed">
                {t("footer.tagline")}
              </p>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">{t("footer.features")}</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#features" className="hover:text-blue-400 transition-colors">
                    {t("footer.properties")}
                  </a>
                </li>
                <li>
                  <a href="#features" className="hover:text-blue-400 transition-colors">
                    {t("footer.owners")}
                  </a>
                </li>
                <li>
                  <a href="#features" className="hover:text-blue-400 transition-colors">
                    {t("footer.tenants")}
                  </a>
                </li>
                <li>
                  <a href="#features" className="hover:text-blue-400 transition-colors">
                    {t("footer.contracts")}
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">{t("footer.company")}</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-blue-400 transition-colors">
                    {t("footer.about")}
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-blue-400 transition-colors">
                    {t("footer.contact")}
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-blue-400 transition-colors">
                    {t("footer.privacy")}
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-blue-400 transition-colors">
                    {t("footer.terms")}
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-400">
            <p>© 2025 Emlak CRM</p>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slide-down {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        .animate-fade-in {
          animation: fade-in 1s ease-out;
        }
        
        .animate-slide-down {
          animation: slide-down 0.8s ease-out;
        }
        
        .bg-grid-white\\/10 {
          background-image: linear-gradient(to right, rgba(255, 255, 255, 0.1) 1px, transparent 1px),
                            linear-gradient(to bottom, rgba(255, 255, 255, 0.1) 1px, transparent 1px);
          background-size: 40px 40px;
        }
      `}</style>
    </div>
  )
}
