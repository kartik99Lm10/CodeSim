import { Link } from 'react-router-dom'
import { useAuth } from '../state/auth'

export function Home() {
  const { token } = useAuth()
  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/15 via-fuchsia-500/10 to-cyan-400/15 blur-3xl" />
        <div className="relative max-w-6xl mx-auto px-4 pt-16 pb-10 text-center">
          <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs border border-indigo-200/60 dark:border-indigo-800/60 bg-white/40 dark:bg-slate-800/60 mb-4">
            <span className="text-indigo-600">New</span>
            <span>Playground & Weekly Contests</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4">
            Detect Code Similarity with Confidence
          </h1>
          <p className="text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            Paste, upload, or submit code. Get clear similarity scores using Jaccard and Cosine metrics. Run weekly contests and keep academic integrity in check.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            {token ? (
              <>
                <Link to="/" className="btn btn-primary">Open App</Link>
                <Link to="/contests" className="btn border border-slate-300 dark:border-slate-700">Weekly Contest</Link>
              </>
            ) : (
              <>
                <Link to="/register" className="btn btn-primary">Get Started</Link>
                <Link to="/login" className="btn border border-slate-300 dark:border-slate-700">Sign In</Link>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-10 grid md:grid-cols-3 gap-4">
        <FeatureCard title="Paste or Upload" desc="Compare two snippets via editors or upload files to analyze instantly."/>
        <FeatureCard title="Reliable Metrics" desc="Balanced score combining Jaccard and Cosine for robust similarity."/>
        <FeatureCard title="Contests & Reviews" desc="Host weekly contests; review submissions with similarity insights."/>
      </section>

      <section className="max-w-6xl mx-auto px-4 pb-16">
        <div className="card md:flex items-center gap-6">
          <div className="md:w-2/3">
            <h3 className="text-xl font-semibold mb-1">In Development</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">Language-aware tokenizers, leaderboards, submission history, and admin dashboards are coming next evaluation.</p>
          </div>
          <div className="md:ml-auto mt-3 md:mt-0 flex gap-2">
            <Link to="/playground" className="btn">Try Playground</Link>
            <Link to={token ? '/' : '/register'} className="btn btn-primary">{token ? 'Open App' : 'Join Now'}</Link>
          </div>
        </div>
      </section>
    </div>
  )
}

function FeatureCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="card">
      <div className="text-lg font-semibold mb-1">{title}</div>
      <div className="text-sm text-slate-600 dark:text-slate-300">{desc}</div>
    </div>
  )
}


