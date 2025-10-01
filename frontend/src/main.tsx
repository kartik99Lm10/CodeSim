import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { VerifyOtp } from './pages/VerifyOtp'
import { Compare } from './pages/Compare'
import { DailyQuestionsModern } from './pages/DailyQuestionsModern'
import { Playground } from './pages/Playground'
import { Home } from './pages/Home'
import { Leaderboard } from './pages/Leaderboard'
import { AuthProvider, useAuth } from './state/auth'
import { Nav } from './components/Nav'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuth()
  if (!token) return <Navigate to="/login" replace />
  return <>{children}</>
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Nav />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-otp" element={<VerifyOtp />} />
          <Route path="/" element={<Home />} />
          <Route path="/compare" element={<ProtectedRoute><Compare /></ProtectedRoute>} />
          <Route path="/daily" element={<ProtectedRoute><DailyQuestionsModern /></ProtectedRoute>} />
          <Route path="/playground" element={<ProtectedRoute><Playground /></ProtectedRoute>} />
          <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
)


