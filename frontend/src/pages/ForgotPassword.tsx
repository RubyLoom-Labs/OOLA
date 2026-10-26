import React, { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Mail,
  ArrowRight,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  KeyRound,
  ShieldCheck,
  Send,
  UserCheck,
} from 'lucide-react'
import { authApi } from '@/apis/authApi'

export default function ForgotPassword() {
  const [searchParams] = useSearchParams()
  const initialMode = searchParams.get('mode') === 'verify' ? 'verify' : 'reset'

  const [mode, setMode] = useState<'reset' | 'verify'>(initialMode)
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccessMessage(null)

    if (!email.trim()) {
      setError('Please provide a valid email address.')
      return
    }

    setLoading(true)
    try {
      if (mode === 'reset') {
        const res = await authApi.forgotPassword({ email: email.trim() })
        setSuccessMessage(
          res.message || 'If this email is registered in our system, a password reset link has been sent.'
        )
      } else {
        const res = await authApi.resendVerification({ email: email.trim() })
        setSuccessMessage(
          res.message || 'A verification and password setup link has been sent to your email.'
        )
      }
    } catch (err: any) {
      console.error('Request failed:', err)
      const msg =
        err?.message ||
        (err?.errors && Object.values(err.errors).flat().join(', ')) ||
        'Unable to process your request. Please verify the email and try again.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page-wrapper">
      {/* Ambient background glow */}
      <div className="login-ambient-glow" />

      <div className="flex-1 flex flex-col justify-center items-center px-4 py-12 relative z-10">
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-8">
          <Link to="/login" className="flex items-center gap-2.5 mb-2 hover:opacity-90 transition-opacity">
            <div className="login-brand-logo-icon">
              <span className="login-logo-letter">o</span>
            </div>
            <div className="login-brand-logo-text">
              <span className="brand-name-dark">OOLA</span> <span className="brand-name-blue">CRM</span>
            </div>
          </Link>
          <div className="text-xs text-slate-500 font-medium">Smart CRM for a Smarter Business</div>
        </div>

        {/* Card Container */}
        <div className="w-full max-w-md bg-white border border-slate-200/90 rounded-2xl shadow-xl p-8 relative">
          {/* Header Icon */}
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 mx-auto mb-4 border border-blue-100 shadow-xs">
            {mode === 'reset' ? <KeyRound size={22} /> : <UserCheck size={22} />}
          </div>

          <h2 className="text-2xl font-extrabold text-slate-900 text-center mb-1">
            {mode === 'reset' ? 'Forgot Password?' : 'Resend Activation Link'}
          </h2>

          <p className="text-xs text-slate-500 text-center mb-6 max-w-sm mx-auto leading-relaxed">
            {mode === 'reset'
              ? "Enter your account email below and we'll dispatch a secure password reset link to your inbox."
              : 'Enter your registered email address to receive a fresh account verification and password setup invitation.'}
          </p>

          {/* Mode Tabs */}
          <div className="flex rounded-xl bg-slate-100 p-1 mb-6 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setMode('reset')
                setError(null)
                setSuccessMessage(null)
              }}
              className={`flex-1 py-2 rounded-lg transition-all text-center cursor-pointer ${
                mode === 'reset'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Reset Password
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('verify')
                setError(null)
                setSuccessMessage(null)
              }}
              className={`flex-1 py-2 rounded-lg transition-all text-center cursor-pointer ${
                mode === 'verify'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Resend Activation
            </button>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2.5 animate-shake">
              <AlertCircle size={16} className="text-rose-600 flex-shrink-0 mt-0.5" />
              <p className="font-medium flex-1">{error}</p>
            </div>
          )}

          {/* Success State */}
          {successMessage ? (
            <div className="p-6 bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200/80 rounded-xl text-center space-y-4">
              <div className="w-14 h-14 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow-md ring-4 ring-emerald-100">
                <CheckCircle size={30} />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-slate-900">Email Dispatched!</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{successMessage}</p>
              </div>

              <div className="p-3 bg-white/80 rounded-lg border border-emerald-100 text-[11px] text-slate-500 text-left space-y-1">
                <p className="font-semibold text-slate-700">Didn't receive an email?</p>
                <p>1. Check your spam or junk folder.</p>
                <p>2. Ensure the email entered matches your registered account.</p>
                <p>3. Wait 1-2 minutes for Google SMTP delivery.</p>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSuccessMessage(null)
                  }}
                  className="w-full py-2.5 px-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Send to a different email
                </button>
                <Link
                  to="/login"
                  className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <span>Return to Login</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Registered Email Address
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-3 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    disabled={loading}
                    autoFocus
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold text-sm rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    <span>Sending Request...</span>
                  </>
                ) : (
                  <>
                    <Send size={15} />
                    <span>
                      {mode === 'reset' ? 'Send Password Reset Link' : 'Send Activation Link'}
                    </span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Footer Back Link */}
          <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-center text-xs text-slate-500">
            <Link
              to="/login"
              className="text-blue-600 hover:text-blue-700 font-semibold hover:underline flex items-center gap-1"
            >
              &larr; Back to Login
            </Link>
          </div>
        </div>

        {/* Global Security Footer */}
        <footer className="mt-8 flex items-center gap-4 text-xs text-slate-400">
          <div>© 2025 OORA Labz. All rights reserved.</div>
          <div className="flex items-center gap-1 text-emerald-600 font-medium">
            <ShieldCheck size={14} />
            <span>Secure & Encrypted</span>
          </div>
        </footer>
      </div>
    </div>
  )
}
