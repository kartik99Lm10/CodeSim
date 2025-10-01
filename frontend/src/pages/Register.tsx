import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../state/auth'

export function Register() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showOtpForm, setShowOtpForm] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    try {
      const res = await axios.post('/api/auth/register', { username, email, password })
      const user = {
        id: res.data.userId || res.data.id || username,
        username: res.data.username || username,
        email: email
      }

      if (res.data.requiresVerification) {
        setUserEmail(email)
        setShowOtpForm(true)
        setSuccess(res.data.message)
      } else {
        login(res.data.token, user)
        setTimeout(() => navigate('/'), 2000)
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Registration failed')
    }
  }

  async function verifyOtp(otp: string) {
    setError(null)
    setSuccess(null)
    try {
      const res = await axios.post('/api/auth/verify-otp', {
        email: userEmail,
        otp: otp
      })

      if (res.data.verified) {
        setSuccess('Email verified successfully! Redirecting...')
        setTimeout(() => {
          login(res.data.token, {
            id: username,
            username: username,
            email: userEmail
          })
          navigate('/')
        }, 1500)
      } else {
        setError(res.data.message || 'Verification failed')
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Verification failed')
    }
  }

  async function resendOtp() {
    try {
      await axios.post('/api/auth/resend-otp', { email: userEmail })
      setSuccess('New OTP sent to your email!')
    } catch (err: any) {
      setError('Failed to resend OTP')
    }
  }

  if (showOtpForm) {
    return (
      <div className="min-h-screen grid place-items-center p-4">
        <div className="card w-full max-w-md">
          <h1 className="text-2xl font-semibold mb-4">🔐 Verify Your Email</h1>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-4">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              📧 Check your email: <strong>{userEmail}</strong>
            </p>
            <p className="text-sm text-blue-600 dark:text-blue-300 mt-1">
              Enter the 6-digit OTP you received
            </p>
          </div>

          <div className="space-y-3">
            <OtpInput onComplete={verifyOtp} />

            {error && <div className="text-red-600 text-sm">{error}</div>}
            {success && <div className="text-green-600 text-sm bg-green-50 dark:bg-green-900/20 p-3 rounded">{success}</div>}

            <button
              onClick={resendOtp}
              className="w-full text-sm text-indigo-600 hover:text-indigo-800"
            >
              Didn't receive OTP? Resend
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen grid place-items-center p-4">
      <div className="card w-full max-w-md">
        <h1 className="text-2xl font-semibold mb-4">Create your account</h1>
        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="block text-sm mb-1">Username</label>
            <input className="input" value={username} onChange={e => setUsername(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm mb-1">Email</label>
            <input type="email" className="input" value={email} onChange={e => setEmail(e.target.value)} required placeholder="your-email@example.com" />
          </div>
          <div>
            <label className="block text-sm mb-1">Password</label>
            <input type="password" className="input" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          {error && <div className="text-red-600 text-sm">{error}</div>}
          {success && <div className="text-green-600 text-sm bg-green-50 dark:bg-green-900/20 p-3 rounded">{success}</div>}
          <button className="btn btn-primary w-full" type="submit">Create account</button>
        </form>
        <p className="text-sm mt-3">Have an account? <Link className="text-indigo-600" to="/login">Sign in</Link></p>
      </div>
    </div>
  )
}

function OtpInput({ onComplete }: { onComplete: (otp: string) => void }) {
  const [otp, setOtp] = useState(['', '', '', '', '', ''])

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) return

    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.querySelector(`input[data-index="${index + 1}"]`) as HTMLInputElement
      nextInput?.focus()
    }

    // Call onComplete when all digits are filled
    if (newOtp.every(digit => digit !== '') && newOtp.join('').length === 6) {
      onComplete(newOtp.join(''))
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.querySelector(`input[data-index="${index - 1}"]`) as HTMLInputElement
      prevInput?.focus()
    }
  }

  return (
    <div className="flex gap-2 justify-center">
      {otp.map((digit, index) => (
        <input
          key={index}
          type="text"
          data-index={index}
          value={digit}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          className="w-12 h-12 text-center text-xl font-mono border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
          maxLength={1}
          pattern="[0-9]"
          inputMode="numeric"
          required
        />
      ))}
    </div>
  )
}


