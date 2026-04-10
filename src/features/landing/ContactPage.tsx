import { useTranslation } from "react-i18next";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { SEO } from "@/components/common/SEO";
import { Mail, MessageSquare } from "lucide-react";

export const ContactPage = () => {
  const { t } = useTranslation("landing");

  return (
    <>
      <SEO
        title={`${t("contact.title")} - emlakcrm`}
        description={t("contact.metaDescription")}
      />
      <div className="min-h-screen bg-white">
        <LandingHeader />
        <main className="max-w-4xl mx-auto px-6 py-16">
          <div className="prose prose-lg max-w-none">
            <h1 className="text-4xl font-bold text-gray-900 mb-8">
              {t("contact.title")}
            </h1>
            
            <div className="space-y-8 text-gray-700 leading-relaxed">
              <p className="text-lg">
                {t("contact.description")}
              </p>

              <div className="grid md:grid-cols-2 gap-6 mt-12">
                {/* Email Contact */}
                <div className="border border-gray-200 rounded-lg p-6 hover:border-blue-300 transition-colors">
                  <div className="flex items-center gap-3 mb-4">
                    <Mail className="h-6 w-6 text-blue-600" />
                    <h2 className="text-xl font-semibold text-gray-900">
                      {t("contact.email.title")}
                    </h2>
                  </div>
                  <p className="text-gray-600 mb-4">
                    {t("contact.email.description")}
                  </p>
                  <a
                    href="mailto:destek@emlakcrm.app"
                    className="text-blue-600 hover:text-blue-700 underline font-medium"
                  >
                    destek@emlakcrm.app
                  </a>
                </div>

                {/* Support Info */}
                <div className="border border-gray-200 rounded-lg p-6 hover:border-blue-300 transition-colors">
                  <div className="flex items-center gap-3 mb-4">
                    <MessageSquare className="h-6 w-6 text-blue-600" />
                    <h2 className="text-xl font-semibold text-gray-900">
                      {t("contact.support.title")}
                    </h2>
                  </div>
                  <p className="text-gray-600">
                    {t("contact.support.description")}
                  </p>
                </div>
              </div>

              <div className="mt-12 p-6 bg-gray-50 rounded-lg">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  {t("contact.responseTime.title")}
                </h2>
                <p className="text-gray-600">
                  {t("contact.responseTime.description")}
                </p>
              </div>
            </div>
          </div>
        </main>
        <LandingFooter />
      </div>
    </>
  );
};

