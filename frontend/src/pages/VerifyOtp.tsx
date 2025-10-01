import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

export function VerifyOtp() {
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    if (otp.length !== 6) {
      setError('Please enter a 6-digit OTP')
      setLoading(false)
      return
    }

    try {
      const response = await axios.post('/api/auth/verify-otp', {
        email: email,
        otp: otp
      })

      if (response.data.verified) {
        setSuccess('Email verified successfully! Redirecting to login...')
        setTimeout(() => {
          navigate('/login')
        }, 2000)
      } else {
        setError(response.data.message || 'Verification failed')
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Verification failed')
    } finally {
      setLoading(false)
    }
  }

  async function resendOtp() {
    if (!email) {
      setError('Please enter your email first')
      return
    }

    setLoading(true)
    try {
      await axios.post('/api/auth/resend-otp', { email: email })
      setSuccess('New OTP sent to your email!')
    } catch (err: any) {
      setError('Failed to resend OTP')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid place-items-center p-4">
      <div className="card w-full max-w-md">
        <h1 className="text-2xl font-semibold mb-4">🔐 Verify Your Email</h1>

        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-4">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            📧 Check your email for the 6-digit OTP
          </p>
          <p className="text-sm text-blue-600 dark:text-blue-300 mt-1">
            Enter the code below to verify your account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-2">Email Address</label>
            <input
              type="email"
              className="input"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your-email@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm mb-2">6-Digit OTP</label>
            <input
              type="text"
              className="input text-center text-xl font-mono tracking-widest"
              value={otp}
              onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="123456"
              maxLength={6}
              pattern="[0-9]{6}"
              inputMode="numeric"
              required
            />
          </div>

          {error && <div className="text-red-600 text-sm">{error}</div>}
          {success && <div className="text-green-600 text-sm bg-green-50 dark:bg-green-900/20 p-3 rounded">{success}</div>}

          <button
            className="btn btn-primary w-full"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Verifying...' : 'Verify OTP'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={resendOtp}
            disabled={loading}
            className="text-sm text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
          >
            Didn't receive OTP? Resend
          </button>
        </div>

        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            Remember your password?{' '}
            <a href="/login" className="text-indigo-600 hover:text-indigo-800">
              Sign in instead
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
