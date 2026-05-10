import { useTranslation } from "react-i18next";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { SEO } from "@/components/common/SEO";

export const AboutPage = () => {
  const { t } = useTranslation("landing");

  return (
    <>
      <SEO
        title={`${t("about.title")} - emlakcrm`}
        description={t("about.metaDescription")}
      />
      <div className="min-h-screen bg-white dark:bg-slate-950">
        <LandingHeader />
        <main className="max-w-4xl mx-auto px-6 py-16">
          <div className="prose prose-lg max-w-none">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-slate-100 mb-8">
              {t("about.title")}
            </h1>
            
            <div className="space-y-6 text-gray-700 dark:text-slate-300 leading-relaxed">
              <p className="text-lg">
                {t("about.description")}
              </p>

              <h2 className="text-2xl font-semibold text-gray-900 dark:text-slate-100 mt-8 mb-4">
                {t("about.mission.title")}
              </h2>
              <p>
                {t("about.mission.description")}
              </p>

              <h2 className="text-2xl font-semibold text-gray-900 dark:text-slate-100 mt-8 mb-4">
                {t("about.vision.title")}
              </h2>
              <p>
                {t("about.vision.description")}
              </p>

              <h2 className="text-2xl font-semibold text-gray-900 dark:text-slate-100 mt-8 mb-4">
                {t("about.contact.title")}
              </h2>
              <p>
                {t("about.contact.description")}
              </p>
              <p>
                <a
                  href="mailto:destek@emlakcrm.app"
                  className="text-blue-600 hover:text-blue-700 underline"
                >
                  destek@emlakcrm.app
                </a>
              </p>
            </div>
          </div>
        </main>
        <LandingFooter />
      </div>
    </>
  );
};

