import React, { useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import {
  Lock,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Mail,
  RefreshCw,
  KeyRound,
  Check,
} from 'lucide-react'
import { authApi } from '@/apis/authApi'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const emailParam = searchParams.get('email') || ''
  const tokenParam = searchParams.get('token') || ''

  const [email, setEmail] = useState(emailParam)
  const [token, setToken] = useState(tokenParam)
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Validation criteria
  const hasMinLength = password.length >= 8
  const hasUppercase = /[A-Z]/.test(password)
  const hasNumberOrSymbol = /[0-9!@#$%^&*(),.?":{}|<>]/.test(password)
  const passwordsMatch = password.length > 0 && password === passwordConfirmation

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setResendSuccess(null)

    if (!email.trim()) {
      setError('Please provide a valid email address.')
      return
    }

    if (!token.trim()) {
      setError('Password reset token is missing. Please use the link sent to your email or request a new one.')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.')
      return
    }

    if (password !== passwordConfirmation) {
      setError('Passwords do not match. Please verify your confirmation password.')
      return
    }

    setLoading(true)
    try {
      await authApi.resetPassword({
        email: email.trim(),
        token: token.trim(),
        password,
        password_confirmation: passwordConfirmation,
      })
      setSuccess(true)
      setTimeout(() => navigate('/login'), 2500)
    } catch (err: any) {
      console.error('Password reset failed:', err)
      const msg =
        err?.message ||
        (err?.errors && Object.values(err.errors).flat().join(', ')) ||
        'Failed to reset password. The link may be invalid or expired.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (!email.trim()) {
      setError('Please enter your email address to request a new link.')
      return
    }
    setResending(true)
    setError(null)
    try {
      const res = await authApi.resendVerification({ email: email.trim() })
      setResendSuccess(res.message || 'A new verification link has been dispatched to your email.')
    } catch (err: any) {
      setError(err?.message || 'Failed to resend link. Please try again or contact your administrator.')
    } finally {
      setResending(false)
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
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 mx-auto mb-4 border border-blue-100 shadow-xs">
            <KeyRound size={22} />
          </div>

          <h2 className="text-2xl font-extrabold text-slate-900 text-center mb-1">
            {emailParam ? 'Set Your Password' : 'Reset Password'}
          </h2>

          <p className="text-xs text-slate-500 text-center mb-6 max-w-sm mx-auto leading-relaxed">
            {email ? (
              <>
                Setting a password for <strong className="text-slate-800 font-semibold">{email}</strong> will verify your email and activate your account.
              </>
            ) : (
              'Enter your new password below to secure and activate your account.'
            )}
          </p>

          {/* Missing Token Warning */}
          {!tokenParam && (
            <div className="mb-5 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2.5">
              <AlertCircle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold mb-0.5">Missing Reset Token</p>
                <p className="text-[11px] leading-relaxed">
                  No reset token was found in the URL. If you received an email, make sure to click the link directly, or request a new link below.
                </p>
              </div>
            </div>
          )}

          {/* Error Alert */}
          {error && (
            <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2.5 animate-shake">
              <AlertCircle size={16} className="text-rose-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium">{error}</p>
                {error.toLowerCase().includes('expired') || error.toLowerCase().includes('invalid') ? (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resending}
                    className="mt-2 text-xs font-semibold text-rose-800 underline hover:text-rose-950 inline-flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw size={12} className={resending ? 'animate-spin' : ''} />
                    <span>{resending ? 'Sending new link...' : 'Click here to resend a new link'}</span>
                  </button>
                ) : null}
              </div>
            </div>
          )}

          {/* Resend Success Message */}
          {resendSuccess && (
            <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start gap-2.5">
              <CheckCircle size={16} className="text-emerald-600 flex-shrink-0 mt-0.5" />
              <p className="font-medium">{resendSuccess}</p>
            </div>
          )}

          {/* Success State */}
          {success ? (
            <div className="p-6 bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200/80 rounded-xl text-center space-y-3">
              <div className="w-14 h-14 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow-md ring-4 ring-emerald-100">
                <CheckCircle size={30} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Account Activated!</h3>
                <p className="text-xs text-slate-600 mt-1">
                  Your password has been saved successfully. Redirecting you to login...
                </p>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="w-full py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <span>Go to Login Now</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email (only editable if missing from URL) */}
              {!emailParam && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-3 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="user@example.com"
                      className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>
              )}

              {/* Token (only editable if missing from URL) */}
              {!tokenParam && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Reset Token</label>
                  <input
                    type="text"
                    required
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="Paste 64-character token"
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
              )}

              {/* New Password */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">New Password</label>
                  <span className="text-[11px] text-slate-400">Min. 8 characters</span>
                </div>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-3 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-10 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {/* Password Criteria Checklist */}
                {password.length > 0 && (
                  <div className="mt-2 grid grid-cols-2 gap-1.5 text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <div className={`flex items-center gap-1.5 ${hasMinLength ? 'text-emerald-600 font-medium' : 'text-slate-400'}`}>
                      <Check size={12} className={hasMinLength ? 'text-emerald-600' : 'text-slate-300'} />
                      <span>8+ characters</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${hasUppercase ? 'text-emerald-600 font-medium' : 'text-slate-400'}`}>
                      <Check size={12} className={hasUppercase ? 'text-emerald-600' : 'text-slate-300'} />
                      <span>Uppercase letter</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${hasNumberOrSymbol ? 'text-emerald-600 font-medium' : 'text-slate-400'}`}>
                      <Check size={12} className={hasNumberOrSymbol ? 'text-emerald-600' : 'text-slate-300'} />
                      <span>Number or symbol</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${passwordsMatch ? 'text-emerald-600 font-medium' : 'text-slate-400'}`}>
                      <Check size={12} className={passwordsMatch ? 'text-emerald-600' : 'text-slate-300'} />
                      <span>Passwords match</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm New Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm New Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-3 text-slate-400" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={passwordConfirmation}
                    onChange={(e) => setPasswordConfirmation(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full pl-9 pr-10 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold text-sm rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    <span>Activating Account...</span>
                  </>
                ) : (
                  <>
                    <span>Verify Email & Activate Account</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Footer Back Link */}
          <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <Link to="/login" className="text-blue-600 hover:text-blue-700 font-semibold hover:underline flex items-center gap-1">
              &larr; Back to Login
            </Link>
            <Link to="/forgot-password" className="text-slate-500 hover:text-slate-800 hover:underline">
              Need a new link?
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
