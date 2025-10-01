import { useState } from 'react'
import { useAuth } from '../state/auth'
import axios from 'axios'

type Result = {
  score: number
  verdict: string
  jaccard: number
  cosine: number
  levenshtein: number
  winnowing: number
}

export function Compare() {
  const { token, logout } = useAuth()
  const [codeA, setCodeA] = useState('')
  const [codeB, setCodeB] = useState('')
  const [fileA, setFileA] = useState<File | null>(null)
  const [fileB, setFileB] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<Result | null>(null)

  // --- Similarity helpers ---
  function normalize(text: string): string {
    // Basic normalization: lowercase and collapse whitespace
    return text.replace(/\r\n|\r/g, '\n').toLowerCase().replace(/\s+/g, ' ').trim()
  }

  function tokenize(text: string): string[] {
    return normalize(text).split(/[^a-z0-9_]+/).filter(Boolean)
  }

  function jaccardSimilarity(a: string, b: string): number {
    const setA = new Set(tokenize(a))
    const setB = new Set(tokenize(b))
    let inter = 0
    for (const t of setA) if (setB.has(t)) inter++
    const union = setA.size + setB.size - inter
    return union === 0 ? 1 : inter / union
  }

  function cosineSimilarity(a: string, b: string): number {
    const tokensA = tokenize(a)
    const tokensB = tokenize(b)
    const freqA = new Map<string, number>()
    const freqB = new Map<string, number>()
    for (const t of tokensA) freqA.set(t, (freqA.get(t) || 0) + 1)
    for (const t of tokensB) freqB.set(t, (freqB.get(t) || 0) + 1)
    const all = new Set([...freqA.keys(), ...freqB.keys()])
    let dot = 0, magA = 0, magB = 0
    for (const t of all) {
      const va = freqA.get(t) || 0
      const vb = freqB.get(t) || 0
      dot += va * vb
      magA += va * va
      magB += vb * vb
    }
    if (magA === 0 && magB === 0) return 1
    if (magA === 0 || magB === 0) return 0
    return dot / (Math.sqrt(magA) * Math.sqrt(magB))
  }

  function levenshteinSimilarity(a: string, b: string): number {
    const s = normalize(a)
    const t = normalize(b)
    const n = s.length
    const m = t.length
    if (n === 0 && m === 0) return 1
    if (n === 0 || m === 0) return 0
    const dp = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0))
    for (let i = 0; i <= n; i++) dp[i][0] = i
    for (let j = 0; j <= m; j++) dp[0][j] = j
    for (let i = 1; i <= n; i++) {
      const si = s.charCodeAt(i - 1)
      for (let j = 1; j <= m; j++) {
        const cost = si === t.charCodeAt(j - 1) ? 0 : 1
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,
          dp[i][j - 1] + 1,
          dp[i - 1][j - 1] + cost
        )
      }
    }
    const dist = dp[n][m]
    const maxLen = Math.max(n, m)
    return 1 - dist / maxLen
  }

  function winnowingSimilarity(a: string, b: string, k = 5, t = 9): number {
    // Based on Schleimer et al. Winnowing algorithm
    // k-gram hashing, window size w = t - k + 1, select mins
    const w = Math.max(1, t - k + 1)
    const hashesA = winnowingFingerprints(normalize(a), k, w)
    const hashesB = winnowingFingerprints(normalize(b), k, w)
    if (hashesA.size === 0 && hashesB.size === 0) return 1
    if (hashesA.size === 0 || hashesB.size === 0) return 0
    let inter = 0
    for (const h of hashesA) if (hashesB.has(h)) inter++
    const union = hashesA.size + hashesB.size - inter
    return union === 0 ? 1 : inter / union
  }

  function winnowingFingerprints(text: string, k: number, w: number): Set<string> {
    const grams: number[] = []
    // Simple rolling hash base
    const base = 257
    const mod = 2_147_483_647 // large prime
    const n = text.length
    if (n < k) return new Set()
    let hash = 0
    let power = 1
    for (let i = 0; i < k; i++) {
      hash = (hash * base + text.charCodeAt(i)) % mod
      if (i < k - 1) power = (power * base) % mod
    }
    grams.push(hash)
    for (let i = k; i < n; i++) {
      const left = text.charCodeAt(i - k)
      const right = text.charCodeAt(i)
      hash = (hash - (left * power) % mod + mod) % mod
      hash = (hash * base + right) % mod
      grams.push(hash)
    }
    // Windowed minima
    const fingerprints = new Set<string>()
    let lastMinIndex = -1
    for (let i = 0; i <= grams.length - w; i++) {
      let minHash = Number.POSITIVE_INFINITY
      let minIndex = i
      for (let j = i; j < i + w; j++) {
        const h = grams[j]
        if (h <= minHash) {
          minHash = h
          minIndex = j
        }
      }
      if (minIndex !== lastMinIndex) {
        fingerprints.add(`${minHash}@${minIndex}`)
        lastMinIndex = minIndex
      }
    }
    return fingerprints
  }

  async function onCheck() {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const A = codeA
      const B = codeB
      if (!A.trim() || !B.trim()) {
        setError('Please provide both code snippets or upload two files')
        return
      }
      const api = axios.create({ headers: { Authorization: `Bearer ${token}` } })
      const res = await api.post('/api/similarity/compare', { codeA: A, codeB: B })
      setResult({
        score: res.data.score,
        verdict: res.data.verdict,
        jaccard: res.data.jaccard,
        cosine: res.data.cosine,
        levenshtein: res.data.levenshtein,
        winnowing: res.data.winnowing,
      })
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Comparison failed'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  function handleFile(setter: (f: File | null) => void, setCode: (s: string) => void) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0] || null
      setter(f)
      if (!f) return
      const reader = new FileReader()
      reader.onload = () => setCode(String(reader.result || ''))
      reader.readAsText(f)
    }
  }

  return (
    <div className="min-h-screen p-4">
      <header className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Code Similarity</h1>
        <button className="btn" onClick={logout}>Logout</button>
      </header>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-medium">Snippet A</h2>
            <input type="file" accept=".txt,.js,.ts,.java,.py,.cpp,.c,.cs,.go,.rb,.php,.kt,.swift,.rs,.scala" onChange={handleFile(setFileA, setCodeA)} />
          </div>
          <textarea className="input min-h-[260px] font-mono" value={codeA} onChange={e => setCodeA(e.target.value)} placeholder="Paste code here"></textarea>
        </div>
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-medium">Snippet B</h2>
            <input type="file" accept=".txt,.js,.ts,.java,.py,.cpp,.c,.cs,.go,.rb,.php,.kt,.swift,.rs,.scala" onChange={handleFile(setFileB, setCodeB)} />
          </div>
          <textarea className="input min-h-[260px] font-mono" value={codeB} onChange={e => setCodeB(e.target.value)} placeholder="Paste code here"></textarea>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button className="btn btn-primary" onClick={onCheck} disabled={loading}>{loading ? 'Checking...' : 'Check Similarity'}</button>
        {error && <span className="text-red-600 text-sm">{error}</span>}
      </div>
      {result && (
        <div className="card mt-4">
          <div className="flex items-end gap-6">
            <div>
              <div className="text-4xl font-bold">{result.score}%</div>
              <div className="text-slate-500">{result.verdict}</div>
            </div>
            <div className="ml-auto grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="card"><div className="font-medium">Jaccard</div><div>{Math.round(result.jaccard * 100)}%</div></div>
              <div className="card"><div className="font-medium">Cosine</div><div>{Math.round(result.cosine * 100)}%</div></div>
              <div className="card"><div className="font-medium">Levenshtein</div><div>{Math.round(result.levenshtein * 100)}%</div></div>
              <div className="card"><div className="font-medium">Winnowing</div><div>{Math.round(result.winnowing * 100)}%</div></div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


