import { useState } from 'react'
import axios from 'axios'
import { useAuth } from '../state/auth'

type Result = {
  score: number
  verdict: string
  jaccard: number
  cosine: number
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

  function api() {
    return axios.create({
      headers: { Authorization: `Bearer ${token}` }
    })
  }

  async function onCheck() {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      let res
      if (fileA && fileB) {
        const fd = new FormData()
        fd.append('fileA', fileA)
        fd.append('fileB', fileB)
        res = await api().post('/api/check-similarity/upload', fd)
      } else {
        res = await api().post('/api/check-similarity', { codeA, codeB })
      }
      setResult(res.data)
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Request failed'
      setError(msg)
      if (err?.response?.status === 401) logout()
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
            <div className="ml-auto grid grid-cols-2 gap-4 text-sm">
              <div className="card"><div className="font-medium">Jaccard</div><div>{Math.round(result.jaccard * 100)}%</div></div>
              <div className="card"><div className="font-medium">Cosine</div><div>{Math.round(result.cosine * 100)}%</div></div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


