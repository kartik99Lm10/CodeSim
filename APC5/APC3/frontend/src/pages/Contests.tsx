import React from 'react'
import { useState } from 'react'
import { useAuth } from '../state/auth'
import axios from 'axios'
import { Editor } from '../components/Editor'

 type Result = { score: number; verdict: string }

 export function Contests() {
   const { token } = useAuth()
   const [activeTab, setActiveTab] = useState<'question' | 'submission'>('question')
   const [problem] = useState(
     'Problem: Reverse a String\n\n' +
     'Write a Java program that reverses a given string and prints the result.\n\n' +
     'Requirements:\n' +
     '- Create a method that takes a string and returns its reverse\n' +
     '- Handle edge cases (null, empty string)\n' +
     '- Print the result to console\n\n' +
     'Test Cases:\n' +
     '1) Input: "hello" → Output: "olleh"\n' +
     '2) Input: "ab cd" → Output: "dc ba"\n' +
     '3) Input: "A man, a plan, a canal: Panama" → Output: "amanaP :lanac a ,nalp a ,nam A"\n' +
     '4) Input: "" → Output: ""\n' +
     '5) Input: "a" → Output: "a"\n\n' +
     'Your program should:\n' +
     '- Have a main method that tests all cases\n' +
     '- Print each test case and its result\n' +
     '- Be named "Solution" class\n\n' +
     'Example structure:\n' +
     'public class Solution {\n' +
     '    public static String reverse(String s) {\n' +
     '        // Your implementation here\n' +
     '    }\n' +
     '    \n' +
     '    public static void main(String[] args) {\n' +
     '        // Test your method with the given cases\n' +
     '    }\n' +
     '}'
   )
   const [submission, setSubmission] = useState(
     'public class Solution {\n' +
     '    public static void main(String[] args) {\n' +
     '        // Write your code here. Read from standard input if needed.\n' +
     '    }\n' +
     '}\n'
   )
   const [aiCode, setAiCode] = useState<string>('')
   const [compileOut, setCompileOut] = useState<string>('')
   const [runOut, setRunOut] = useState<string>('')
   const [result, setResult] = useState<Result | null>(null)
   const [warning, setWarning] = useState<string>('')
   const [loading, setLoading] = useState(false)
   const [hasAttempt, setHasAttempt] = useState(false)
   const [testResults, setTestResults] = useState<any[] | null>(null)
   const api = axios.create({ headers: { Authorization: `Bearer ${token}` } })

   async function fetchAiSolution(): Promise<string> {
     setLoading(true)
     setWarning('')
     let code = ''
     try {
       const res = await api.post('/api/ai/solve', { problem })
       code = res.data.code || ''
       setAiCode(code)
       if (submission.trim() && code.trim()) {
         await checkSimilarity(code, submission)
       }
       return code
     } finally {
       setLoading(false)
     }
   }

   async function compileJava() {
     setLoading(true)
     setCompileOut('')
     try {
       const res = await api.post('/api/compile/java', { code: submission, className: 'Solution' })
       const success: boolean = res.data.success
       const messages: string[] = res.data.messages || []
       const out = [`${success ? 'Success' : 'Failed'}`, ...messages].join('\n')
       setCompileOut(out)
       setHasAttempt(true)
     } finally {
       setLoading(false)
     }
   }

   async function runJava() {
     setLoading(true)
     setRunOut('')
     try {
       const res = await api.post('/api/compile/java/run', { code: submission, className: 'Solution' })
       const success: boolean = res.data.success
       const messages: string[] = res.data.messages || []
       const out = [`${success ? 'Success' : 'Failed'}`, ...messages].join('\n')
       setRunOut(out)
       setHasAttempt(true)

       // After run, automatically compare with AI (fetch AI if needed)
       try {
         if (!aiCode.trim()) {
           await fetchAiSolution()
         }
         await checkSimilarity()
       } catch {
         // Ignore similarity errors here; UI will show a warning if needed
       }
     } finally {
       setLoading(false)
     }
   }

   async function runTests() {
     setLoading(true)
     setTestResults(null)
     try {
       setWarning('Running tests...')
       const res = await api.post('/api/compile/java/test', {
         code: submission,
         className: 'Solution',
         timeoutMs: 2000
       })
       setTestResults(res.data.results || [])
       if (res.data && typeof res.data.passed === 'number' && typeof res.data.total === 'number') {
         setWarning(`Score: ${res.data.passed}/${res.data.total}`)
       }
       setHasAttempt(true)
     } catch (e: any) {
       const msg = e?.response?.data?.message || e?.message || 'Failed to run tests'
       setWarning(msg)
     } finally {
       setLoading(false)
     }
   }

   async function checkSimilarity(codeA?: string, codeB?: string) {
     setLoading(true)
     setResult(null)
     setWarning('')
     try {
       const A = codeA ?? aiCode
       const B = codeB ?? submission
       const res = await api.post('/api/check-similarity', { codeA: A, codeB: B })
       const score: number = res.data.score
       const verdict: string = res.data.verdict
       setResult({ score, verdict })
       if (score >= 85) {
         setWarning('High similarity detected (>=85%). Avoid relying on AI-generated code.')
       }
     } finally {
       setLoading(false)
     }
   }

   async function handleCheck() {
     if (!submission.trim()) return
     if (!aiCode.trim()) {
       setWarning('Fetch AI solution after you attempt compile/run, then compare.')
       return
     }
     await checkSimilarity()
   }

   return (
     <div className="min-h-screen p-4 space-y-4">
       <div className="flex items-center justify-between">
         <h1 className="text-2xl font-semibold">Weekly Contest</h1>
       </div>

       {warning && (
         <div className="card border border-amber-400 bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-200">
           <div className="font-medium">Warning</div>
           <div className="text-sm">{warning}</div>
         </div>
       )}

       <div className="card p-0">
         <div className="flex border-b border-slate-200 dark:border-slate-800">
           <button
             className={`px-4 py-2 ${activeTab === 'question' ? 'border-b-2 border-blue-500 font-medium' : 'text-slate-500'}`}
             onClick={() => setActiveTab('question')}
           >
             Question
           </button>
           <button
             className={`px-4 py-2 ${activeTab === 'submission' ? 'border-b-2 border-blue-500 font-medium' : 'text-slate-500'}`}
             onClick={() => setActiveTab('submission')}
           >
             Your Submission
           </button>
         </div>

         {activeTab === 'question' && (
           <div className="p-4 space-y-3">
             <div className="font-medium mb-2">Problem</div>
             <pre className="input min-h-[160px] whitespace-pre-wrap">{problem}</pre>
             <div className="flex items-center gap-3">
               <button className="btn" onClick={fetchAiSolution} disabled={loading || !hasAttempt}>
                 {loading ? 'Fetching AI...' : 'Get AI (Gemini) Solution'}
               </button>
               {!hasAttempt && <span className="text-sm text-slate-500">Try the problem first to unlock AI</span>}
               {aiCode && <span className="text-sm text-slate-500">AI code fetched</span>}
             </div>
             {aiCode && (
               <div>
                 <div className="mb-2 text-sm text-slate-500">AI Solution (read-only)</div>
                 <Editor value={aiCode} onChange={() => {}} className="opacity-80 pointer-events-none select-text" />
               </div>
             )}
           </div>
         )}

         {activeTab === 'submission' && (
           <div className="p-4 space-y-3">
             <div className="text-sm text-slate-500">Language: Java</div>
             <Editor value={submission} onChange={setSubmission} />
             {/* Program input removed for contest mode */}
             <div className="flex flex-wrap items-center gap-3">
               <button className="btn" onClick={compileJava} disabled={loading}>
                 {loading ? 'Compiling...' : 'Compile Java'}
               </button>
               <button className="btn" onClick={runJava} disabled={loading}>
                 {loading ? 'Running...' : 'Run Java'}
               </button>
               <button className="btn" onClick={runTests} disabled={loading || !submission.trim()}>
                 {loading ? 'Testing...' : 'Run Tests'}
               </button>
               <button className="btn btn-primary" onClick={handleCheck} disabled={loading || !submission.trim()}>
                 {loading ? 'Checking...' : 'Check Similarity With AI'}
               </button>
               {result && (
                 <div className="card">
                   <div className="text-lg font-semibold">{Math.round(result.score)}%</div>
                   <div className="text-slate-500">{result.verdict}</div>
                 </div>
               )}
             </div>
             {compileOut && (
               <pre className="card whitespace-pre-wrap text-sm">{compileOut}</pre>
             )}
             {runOut && (
               <pre className="card whitespace-pre-wrap text-sm bg-green-50 dark:bg-green-950">{runOut}</pre>
             )}
             {testResults && (
               <div className="card text-sm">
                 <div className="font-medium mb-2">Test Results</div>
                 {warning && <div className="mb-2">{warning}</div>}
                 <ul className="space-y-1">
                   {testResults.map((t: any) => (
                     <li key={t.index} className={t.pass ? 'text-green-600' : 'text-red-600'}>
                       #{t.index + 1}: {t.pass ? 'PASS' : 'FAIL'} {t.timeMs != null ? `(${t.timeMs} ms)` : ''}
                       {!t.pass && (
                         <div className="text-slate-600 dark:text-slate-300">
                           <div>expected: <code>{t.expected}</code></div>
                           <div>got: <code>{t.output}</code></div>
                           {t.error && <div>error: <code>{t.error}</code></div>}
                         </div>
                       )}
                     </li>
                   ))}
                 </ul>
               </div>
             )}
           </div>
         )}
       </div>
     </div>
   )
 }


