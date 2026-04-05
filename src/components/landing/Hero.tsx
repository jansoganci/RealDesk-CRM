// Hero — Linear-style dark hero. No canvas, no i18n, US market.
import { useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { ROUTES } from "@/config/constants"
import "./Hero.css"

// ── DashboardMock ─────────────────────────────────────────────────────────────

const DashboardMock = () => (
  <div className="dash">

    {/* Stats */}
    <div className="dash-stats">
      <div className="dash-stat">
        <div className="dash-stat-label">Portföy</div>
        <div className="dash-stat-value">24</div>
        <div className="dash-stat-delta">+3 bu ay</div>
      </div>
      <div className="dash-stat">
        <div className="dash-stat-label">Gelir</div>
        <div className="dash-stat-value">₺875k</div>
        <div className="dash-stat-delta">+12% aylık</div>
      </div>
      <div className="dash-stat">
        <div className="dash-stat-label">Sözleşme</div>
        <div className="dash-stat-value">18</div>
        <div className="dash-stat-delta">2 bitiyor</div>
      </div>
    </div>

    {/* Properties */}
    <div className="dash-section-header">
      <span className="dash-section-title">Aktif Mülkler</span>
      <span className="dash-section-badge">24 toplam</span>
    </div>
    <div className="dash-cards">
      <div className="dash-card">
        <div className="dash-card-icon">🏙️</div>
        <div className="dash-card-body">
          <div className="dash-card-label">Bağdat Cad. No:142</div>
          <div className="dash-card-sub">Austin, TX · For Rent</div>
        </div>
        <div className="dash-card-right">
          <div className="dash-card-price">₺45.000/ay</div>
          <span className="dash-card-status dash-card-status-green">Dolu</span>
        </div>
      </div>
      <div className="dash-card">
        <div className="dash-card-icon">🏡</div>
        <div className="dash-card-body">
          <div className="dash-card-label">123 Park Avenue #4B</div>
          <div className="dash-card-sub">New York, NY · For Sale</div>
        </div>
        <div className="dash-card-right">
          <div className="dash-card-price">$2,450,000</div>
          <span className="dash-card-status dash-card-status-yellow">Under Offer</span>
        </div>
      </div>
      <div className="dash-card">
        <div className="dash-card-icon">🌆</div>
        <div className="dash-card-body">
          <div className="dash-card-label">456 Market Street</div>
          <div className="dash-card-sub">San Francisco, CA · For Rent</div>
        </div>
        <div className="dash-card-right">
          <div className="dash-card-price">$4,200/mo</div>
          <span className="dash-card-status dash-card-status-blue">Available</span>
        </div>
      </div>
    </div>

    {/* Reminder */}
    <div className="dash-reminder">
      <div className="dash-reminder-icon">🔔</div>
      <div className="dash-reminder-body">
        <div className="dash-reminder-title">Lease Expiring — Park Avenue</div>
        <div className="dash-reminder-sub">Tenant: John Smith · Created by EmlakCRM</div>
      </div>
      <div className="dash-reminder-time">3 days</div>
    </div>

  </div>
)

// ── Hero ──────────────────────────────────────────────────────────────────────

export const Hero = () => {
  const navigate    = useNavigate()
  const sectionRef  = useRef<HTMLElement>(null)
  const frameRef    = useRef<HTMLDivElement>(null)

  // Entrance animation
  useEffect(() => {
    const timer = setTimeout(() => {
      sectionRef.current?.classList.add('hero-loaded')
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  // Scroll parallax + perspective flatten
  useEffect(() => {
    const frame = frameRef.current
    if (!frame) return

    const onScroll = () => {
      const scrollY   = window.scrollY
      const maxScroll = window.innerHeight
      const t         = Math.min(scrollY / maxScroll, 1)
      const translateY = t * -40
      const rotateX    = 4 - t * 3   // 4deg → 1deg
      const rotateY    = -3 + t * 2  // -3deg → -1deg

      frame.style.transform = `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(${translateY}px)`
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <section ref={sectionRef} className="hero-section">

      {/* Background orbs */}
      <div className="hero-orb-1" aria-hidden="true" />
      <div className="hero-orb-2" aria-hidden="true" />

      <div className="hero-inner">

        {/* ── Left copy ── */}
        <div className="hero-copy">

          <div className="hero-badge">
            <span className="hero-badge-dot" />
            For US Real Estate Professionals
          </div>

          <h1 className="hero-headline">
            Emlak işiniz,<br />
            <em>tek bir yerde.</em>
          </h1>

          <p className="hero-subtitle">
            Kaostan kurtulun. Portföyünüzü, sözleşmelerinizi ve
            müşterilerinizi tek bir panelden yönetin — Excel'e gerek yok.
          </p>

          <div className="hero-cta-row">
            <button
              className="hero-cta-primary"
              onClick={() => navigate(ROUTES.REGISTER)}
            >
              Ücretsiz Başla
            </button>
            <span className="hero-cta-secondary">14 gün ücretsiz · kredi kartı gerekmez</span>
          </div>

          <div className="hero-trust">
            <span className="hero-trust-dot" />
            KVKK Uyumlu · Şifreli Veri · Günlük Yedekleme
          </div>

        </div>

        {/* ── Right visual ── */}
        <div className="hero-visual">
          <div className="browser-frame" ref={frameRef}>

            {/* Chrome bar */}
            <div className="browser-chrome">
              <div className="browser-lights">
                <div className="browser-light browser-light-red"   />
                <div className="browser-light browser-light-yellow"/>
                <div className="browser-light browser-light-green" />
              </div>
              <div className="browser-address">
                <div className="browser-address-lock" />
                <span className="browser-address-text">emlakcrm.app/kontrol-paneli</span>
              </div>
            </div>

            {/* App content */}
            <DashboardMock />

          </div>
        </div>

      </div>
    </section>
  )
}
