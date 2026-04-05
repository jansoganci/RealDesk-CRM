import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpApi from 'i18next-http-backend';

i18n
  .use(HttpApi)
  .use(initReactI18next)
  .init({
    debug: false,
    fallbackLng: 'en',
    lng: 'en',
    supportedLngs: ['en'],
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
    ns: ['common', 'tenants', 'properties', 'owners', 'contracts', 'reminders', 'navigation', 'dashboard', 'auth', 'photo', 'errors', 'components.tableActions', 'landing', 'calendar', 'finance', 'inquiries', 'profile', 'billing', 'cookie', 'onboarding'],
    defaultNS: 'common',
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json?v=1.1',
      allowMultiLoading: false,
      reloadInterval: false,
      requestOptions: {
        cache: 'no-store',
      },
    },
  });

export default i18n;
