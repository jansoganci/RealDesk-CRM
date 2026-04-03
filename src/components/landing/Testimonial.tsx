import { useTranslation } from "react-i18next"

export const Testimonial = () => {
  const { t } = useTranslation('landing')

  return (
    <section className="py-24 bg-blue-50">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <div className="flex flex-col items-center gap-8">
          {/* Quote Icon - Optional but adds touch of design */}
          <div className="text-blue-300">
            <svg width="45" height="36" viewBox="0 0 45 36" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M13.4 36C9.13333 36 5.6 34.6 2.8 31.8C0.933333 29 0 25.5333 0 21.4C0 17 1.26667 12.6667 3.8 8.4C6.33333 4.13333 10.3333 1.33333 15.8 0L17.8 4.2C13.9333 5.4 11.2667 7.4 9.8 10.2C8.33333 13 7.6 15.6667 7.6 18.2C7.6 19.8 7.93333 21 8.6 21.8C9.26667 22.6 10.4 23 12 23C14.1333 23 15.9333 23.8 17.4 25.4C18.8667 27 19.6 28.9333 19.6 31.2C19.6 32.5333 19.2667 33.7333 18.6 34.8C17.9333 35.6 16.2 36 13.4 36ZM38.4 36C34.1333 36 30.6 34.6 27.8 31.8C25.9333 29 25 25.5333 25 21.4C25 17 26.2667 12.6667 28.8 8.4C31.3333 4.13333 35.3333 1.33333 40.8 0L42.8 4.2C38.9333 5.4 36.2667 7.4 34.8 10.2C33.3333 13 32.6 15.6667 32.6 18.2C32.6 19.8 32.9333 21 33.6 21.8C34.2667 22.6 35.4 23 37 23C39.1333 23 40.9333 23.8 42.4 25.4C43.8667 27 44.6 28.9333 44.6 31.2C44.6 32.5333 44.2667 33.7333 43.6 34.8C42.9333 35.6 41.2 36 38.4 36Z" />
            </svg>
          </div>
          
          <blockquote className="text-2xl md:text-3xl font-medium text-gray-900 leading-relaxed italic">
            {t('testimonial.quote')}
          </blockquote>
          
          <div className="flex flex-col items-center gap-1">
            <cite className="not-italic font-bold text-gray-900 text-lg">{t('testimonial.name')}</cite>
            <span className="text-gray-500 text-sm tracking-wide uppercase">{t('testimonial.role')}</span>
          </div>
        </div>
      </div>
    </section>
  )
}
