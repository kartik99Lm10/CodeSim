import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../state/auth'

export function Nav() {
  const { token, logout } = useAuth()
  const { pathname } = useLocation()
  const link = (to: string, label: string) => (
    <Link to={to} className={`px-3 py-2 rounded-lg ${pathname===to?'bg-slate-200 dark:bg-slate-700':''}`}>{label}</Link>
  )
  return (
    <nav className="sticky top-0 z-20 bg-white/60 dark:bg-slate-900/50 backdrop-blur border-b border-slate-200/60 dark:border-slate-800/60">
      <div className="container h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/" className="font-semibold text-lg brand-gradient">CodeSim</Link>
          {link('/compare', 'Compare')}
          {link('/daily', 'Daily Questions')}
          {link('/leaderboard', 'Leaderboard')}
          {link('/playground', 'Playground')}
        </div>
        <div className="flex items-center gap-3">
          {token ? (
            <button className="btn btn-ghost" onClick={logout}>Logout</button>
          ) : (
            <Link to="/login" className="btn btn-ghost">Login</Link>
          )}
        </div>
      </div>
    </nav>
  )
}


