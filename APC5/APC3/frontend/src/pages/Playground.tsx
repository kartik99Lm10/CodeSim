import { useEffect, useMemo, useRef, useState } from 'react'
import { Editor } from '../components/Editor'

type WorkerMsg = { type: string; payload: any }

export function Playground() {
  const [code, setCode] = useState<string>(`// JS Playground\n// Write JavaScript and click Run\n\nfunction add(a, b){\n  return a + b;\n}\n\nconsole.log('add(2,3)=', add(2,3));\n`)
  const [logs, setLogs] = useState<string[]>([])
  const [running, setRunning] = useState(false)
  const workerRef = useRef<Worker | null>(null)

  useEffect(() => {
    const w = new Worker(new URL('../workers/sandbox.worker.ts', import.meta.url), { type: 'module' })
    w.onmessage = (e: MessageEvent<WorkerMsg>) => {
      const { type, payload } = e.data
      if (type === 'log' || type === 'warn' || type === 'error') {
        setLogs(prev => [...prev, String(payload)])
      } else if (type === 'result') {
        setLogs(prev => [...prev, `[result] ${String(payload)}`])
      } else if (type === 'done') {
        setRunning(false)
      }
    }
    workerRef.current = w
    return () => { w.terminate(); workerRef.current = null }
  }, [])

  function onRun() {
    setLogs([])
    setRunning(true)
    workerRef.current?.postMessage({ code })
  }

  return (
    <div className="min-h-screen p-4 space-y-4">
      <h1 className="text-2xl font-semibold">Playground</h1>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Editor value={code} onChange={setCode} className="min-h-[360px]" />
          <div className="mt-3">
            <button className="btn btn-primary" onClick={onRun} disabled={running}>{running ? 'Running...' : 'Run'}</button>
          </div>
        </div>
        <div className="card min-h-[360px]">
          <div className="font-medium mb-2">Console</div>
          <pre className="text-sm whitespace-pre-wrap">{logs.join('\n')}</pre>
        </div>
      </div>
      <div className="card">
        <div className="font-medium mb-1">Planned: Multi-language support</div>
        <ul className="list-disc pl-5 text-sm text-slate-600 dark:text-slate-300">
          <li>Server-side compile for C/C++/Java/Python in isolated containers</li>
          <li>Test cases and runtime limits</li>
          <li>Code formatting and linting</li>
        </ul>
      </div>
    </div>
  )
}
