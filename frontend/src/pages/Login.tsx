import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  User,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Users,
  FolderKanban,
  DollarSign,
  Calendar,
  ShieldCheck,
  AlertCircle,
  Info,
  X,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()

  const [email, setEmail] = useState('admin@ooralabz.com')
  const [password, setPassword] = useState('password123')
  const [rememberMe, setRememberMe] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [infoMessage, setInfoMessage] = useState<string | null>(null)

  const from = (location.state as any)?.from?.pathname || '/'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!email.trim()) {
      setErrorMessage('Please enter your email or username.')
      return
    }
    if (!password) {
      setErrorMessage('Please enter your password.')
      return
    }

    setIsSubmitting(true)
    try {
      await login({ email: email.trim(), password }, rememberMe)
      navigate(from, { replace: true })
    } catch (err: any) {
      console.error('Login error:', err)
      const msg =
        err?.message ||
        (err?.errors && Object.values(err.errors).flat().join(', ')) ||
        'Invalid credentials. Please check your username/password and try again.'
      setErrorMessage(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="login-page-wrapper">
      {/* Top / Background Ambient Glow */}
      <div className="login-ambient-glow" />

      <div className="login-container">
        {/* ── Left Side: Platform Showcase ── */}
        <div className="login-left-showcase">
          {/* Logo Brand Header */}
          <div className="login-brand-header">
            <div className="login-brand-logo-box">
              <div className="login-brand-logo-icon">
                <span className="login-logo-letter">o</span>
              </div>
              <div className="login-brand-logo-text">
                <span className="brand-name-dark">OOLA</span>{' '}
                <span className="brand-name-blue">CRM</span>
              </div>
            </div>
            <div className="login-brand-tagline">Manage • Track • Grow</div>
          </div>

          {/* Hero Content */}
          <div className="login-hero-content">
            <span className="login-hero-eyebrow">WELCOME TO OOLA CRM</span>
            <h1 className="login-hero-title">
              Your Complete Business Management Platform
            </h1>
            <p className="login-hero-description">
              Manage leads, projects, companies, payments and more — all in one
              place. Build stronger relationships, streamline your workflow and
              grow your business with OOLA CRM.
            </p>
          </div>

          {/* 4 Feature Cards */}
          <div className="login-features-grid">
            <div className="login-feature-card">
              <div className="feature-icon-circle bg-blue-light text-primary-600">
                <Users size={16} />
              </div>
              <div className="feature-card-title">Leads & Deals</div>
              <div className="feature-card-desc">Track and convert more leads</div>
            </div>

            <div className="login-feature-card">
              <div className="feature-icon-circle bg-green-light text-emerald-600">
                <FolderKanban size={16} />
              </div>
              <div className="feature-card-title">Projects</div>
              <div className="feature-card-desc">Manage projects and tasks</div>
            </div>

            <div className="login-feature-card">
              <div className="feature-icon-circle bg-cyan-light text-sky-600">
                <DollarSign size={16} />
              </div>
              <div className="feature-card-title">Payments</div>
              <div className="feature-card-desc">Track finances and invoices</div>
            </div>

            <div className="login-feature-card">
              <div className="feature-icon-circle bg-purple-light text-purple-600">
                <Calendar size={16} />
              </div>
              <div className="feature-card-title">Calendar</div>
              <div className="feature-card-desc">Never miss important events</div>
            </div>
          </div>

          {/* Laptop Dashboard Mockup */}
          <div className="login-laptop-mockup-wrapper">
            <div className="login-plant-decor" />
            <div className="login-laptop-frame">
              <div className="login-laptop-screen">
                <div className="laptop-screen-header">
                  <div className="laptop-dots">
                    <span className="dot red" />
                    <span className="dot yellow" />
                    <span className="dot green" />
                  </div>
                  <div className="laptop-url-bar">app.oolacrm.com/dashboard</div>
                </div>
                <div className="laptop-dashboard-preview">
                  {/* Miniature CRM UI Preview */}
                  <div className="mini-crm-sidebar">
                    <div className="mini-logo">
                      <span className="mini-logo-icon" />
                      <span className="mini-logo-text">OOLA CRM</span>
                    </div>
                    <div className="mini-nav-item active">📊 Dashboard</div>
                    <div className="mini-nav-item">👥 Leads</div>
                    <div className="mini-nav-item">💼 Projects / Deals</div>
                    <div className="mini-nav-item">🏢 Companies / Contacts</div>
                    <div className="mini-nav-item">📅 Calendar</div>
                    <div className="mini-nav-item">💳 Payments</div>
                  </div>

                  <div className="mini-crm-body">
                    {/* Stat Badges Row */}
                    <div className="mini-stats-row">
                      <div className="mini-stat-card">
                        <span className="mini-stat-label">Total Leads</span>
                        <span className="mini-stat-value">
                          248 <span className="mini-badge-pos">+12%</span>
                        </span>
                      </div>
                      <div className="mini-stat-card">
                        <span className="mini-stat-label">Converted</span>
                        <span className="mini-stat-value">
                          86 <span className="mini-badge-pos">+6%</span>
                        </span>
                      </div>
                      <div className="mini-stat-card">
                        <span className="mini-stat-label">Revenue</span>
                        <span className="mini-stat-value">
                          $24,780 <span className="mini-badge-pos">+12%</span>
                        </span>
                      </div>
                      <div className="mini-stat-card">
                        <span className="mini-stat-label">Pending</span>
                        <span className="mini-stat-value">
                          $8,650 <span className="mini-badge-pos">+3%</span>
                        </span>
                      </div>
                    </div>

                    {/* Chart Rows */}
                    <div className="mini-charts-row">
                      <div className="mini-chart-card funnel-card">
                        <div className="mini-card-title">Sales Pipeline</div>
                        <div className="mini-funnel-visual">
                          <div className="funnel-bar f-1"><span>New</span><span>56</span></div>
                          <div className="funnel-bar f-2"><span>Contacted</span><span>42</span></div>
                          <div className="funnel-bar f-3"><span>Qualified</span><span>28</span></div>
                          <div className="funnel-bar f-4"><span>Proposal</span><span>18</span></div>
                          <div className="funnel-bar f-5"><span>Won</span><span>6</span></div>
                        </div>
                      </div>

                      <div className="mini-chart-card line-card">
                        <div className="mini-card-title">Revenue Overview</div>
                        <svg className="mini-line-svg" viewBox="0 0 100 45">
                          <path
                            d="M 5,38 Q 25,32 45,26 T 70,18 T 95,8"
                            fill="none"
                            stroke="#3b82f6"
                            strokeWidth="2.5"
                          />
                          <path
                            d="M 5,38 Q 25,32 45,26 T 70,18 T 95,8 L 95,45 L 5,45 Z"
                            fill="url(#miniBlueGrad)"
                            opacity="0.25"
                          />
                          <defs>
                            <linearGradient id="miniBlueGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#3b82f6" />
                              <stop offset="100%" stopColor="#ffffff" />
                            </linearGradient>
                          </defs>
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="login-laptop-base">
                <div className="laptop-notch" />
              </div>
            </div>
          </div>
        </div>

        {/* ── Right Side: Login Card ── */}
        <div className="login-right-section">
          {/* Top Tagline */}
          <div className="login-top-tagline">
            — Smart CRM for a Smarter Business
          </div>

          {/* Floating Login Card */}
          <div className="login-card-container">
            {/* Logo in Card */}
            <div className="login-card-logo-box">
              <div className="login-brand-logo-icon">
                <span className="login-logo-letter">o</span>
              </div>
              <div className="login-brand-logo-text">
                <span className="brand-name-dark">OOLA</span>{' '}
                <span className="brand-name-blue">CRM</span>
              </div>
            </div>

            <h2 className="login-card-title">Welcome Back!</h2>
            <p className="login-card-subtitle">
              Sign in to your account to continue
            </p>

            {/* Error Message Alert */}
            {errorMessage && (
              <div className="login-error-alert animate-shake">
                <AlertCircle size={16} className="text-danger flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Info Message Alert */}
            {infoMessage && (
              <div
                className="flex items-start gap-2.5 p-3 rounded-lg text-xs animate-fade-in mb-3"
                style={{
                  background: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  color: '#1d4ed8',
                }}
              >
                <Info size={15} className="flex-shrink-0 mt-0.5 text-blue-600" />
                <div className="flex-1">
                  <span>{infoMessage}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setInfoMessage(null)}
                  className="text-blue-400 hover:text-blue-700 ml-1"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="login-form">
              {/* Username / Email Input */}
              <div className="login-form-group">
                <label className="login-input-label" htmlFor="login-email">
                  Username
                </label>
                <div className="login-input-wrapper">
                  <User size={17} className="login-input-icon" />
                  <input
                    id="login-email"
                    type="text"
                    className="login-input-field"
                    placeholder="john.doe"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="username email"
                    disabled={isSubmitting}
                    required
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="login-form-group">
                <label className="login-input-label" htmlFor="login-password">
                  Password
                </label>
                <div className="login-input-wrapper">
                  <Lock size={17} className="login-input-icon" />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    className="login-input-field"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    disabled={isSubmitting}
                    required
                  />
                  <button
                    type="button"
                    className="login-password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password Row */}
              <div className="login-options-row">
                <label className="login-remember-label">
                  <input
                    type="checkbox"
                    className="custom-checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span>Remember me</span>
                </label>

                <a
                  href="#forgot-password"
                  className="login-forgot-link"
                  onClick={(e) => {
                    e.preventDefault()
                    setInfoMessage('Please contact your administrator to reset your password.')
                  }}
                >
                  Forgot password?
                </a>
              </div>

              {/* Sign In Button */}
              <button
                type="submit"
                className="login-submit-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="login-btn-spinner" />
                ) : (
                  <>
                    <ArrowRight size={17} className="mr-1.5" />
                    <span>Sign In</span>
                  </>
                )}
              </button>
            </form>

            {/* Card Footer */}
            <div className="login-card-footer">
              <span>Don't have an account? </span>
              <a
                href="#contact-admin"
                className="login-contact-link"
                onClick={(e) => {
                  e.preventDefault()
                  setInfoMessage('Please contact your administrator for system account creation.')
                }}
              >
                Contact your administrator
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ── Global Bottom Footer ── */}
      <footer className="login-global-footer">
        <div className="login-footer-copyright">
          © 2025 OORA Labz. All rights reserved.
        </div>
        <div className="login-footer-security">
          <ShieldCheck size={15} className="text-emerald-500" />
          <span>Secure & Encrypted</span>
        </div>
      </footer>
    </div>
  )
}
