// Removed unused component in favor of page-based playground.

interface ExecutionResult {
  success: boolean
  stdout: string
  stderr: string
  executionTime: number
  memoryUsed: number
  result: string
  score: number
}

export function Playground() {
  const [code, setCode] = useState(`// Welcome to the Multi-Language Playground!
// Select your language and write your code here

public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}`)
  
  const [language, setLanguage] = useState('java')
  const [input, setInput] = useState('')
  const [result, setResult] = useState<ExecutionResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const languages = [
    { value: 'java', label: 'Java', extension: 'java' },
    { value: 'python', label: 'Python', extension: 'py' },
    { value: 'cpp', label: 'C++', extension: 'cpp' },
    { value: 'c', label: 'C', extension: 'c' },
    { value: 'javascript', label: 'JavaScript', extension: 'js' },
    { value: 'go', label: 'Go', extension: 'go' },
    { value: 'rust', label: 'Rust', extension: 'rs' }
  ]

  const getDefaultCode = (lang: string) => {
    const templates = {
      java: `public class Main {
    public static void main(String[] args) {
        // Write your solution here
        System.out.println("Hello, World!");
    }
}`,
      python: `# Write your solution here
print("Hello, World!")`,
      cpp: `#include <iostream>
using namespace std;

int main() {
    // Write your solution here
    cout << "Hello, World!" << endl;
    return 0;
}`,
      c: `#include <stdio.h>

int main() {
    // Write your solution here
    printf("Hello, World!\\n");
    return 0;
}`,
      javascript: `// Write your solution here
console.log("Hello, World!");`,
      go: `package main

import "fmt"

func main() {
    // Write your solution here
    fmt.Println("Hello, World!")
}`,
      rust: `fn main() {
    // Write your solution here
    println!("Hello, World!");
}`
    }
    return templates[lang as keyof typeof templates] || templates.java
  }

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage)
    setCode(getDefaultCode(newLanguage))
  }

  const runCode = async () => {
    if (!code.trim()) {
      setError('Please enter some code')
      return
    }

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const response = await axios.post('/api/playground/run', {
        code,
        language,
        input: input.trim()
      })

      setResult(response.data)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to execute code')
    } finally {
      setLoading(false)
    }
  }

  const getResultColor = (result: string) => {
    switch (result) {
      case 'ACCEPTED': return 'text-green-600'
      case 'WRONG_ANSWER': return 'text-red-600'
      case 'TIME_LIMIT_EXCEEDED': return 'text-yellow-600'
      case 'RUNTIME_ERROR': return 'text-orange-600'
      case 'COMPILATION_ERROR': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  return (
    <div className="min-h-screen p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Multi-Language Playground</h1>
        <div className="flex items-center gap-4">
          <select
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="input"
          >
            {languages.map(lang => (
              <option key={lang.value} value={lang.value}>
                {lang.label}
              </option>
            ))}
          </select>
          <button
            onClick={runCode}
            disabled={loading}
            className="btn btn-primary"
          >
            {loading ? 'Running...' : 'Run Code'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Code Editor */}
        <div className="space-y-4">
          <div className="card p-0">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-medium">Code Editor</h3>
              <p className="text-sm text-slate-500">Language: {languages.find(l => l.value === language)?.label}</p>
            </div>
            <Editor value={code} onChange={setCode} />
          </div>

          {/* Input */}
          <div className="card">
            <h3 className="font-medium mb-2">Input (stdin)</h3>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter input for your program..."
              className="input w-full h-32"
            />
          </div>
        </div>

        {/* Output */}
        <div className="space-y-4">
          {error && (
            <div className="card border border-red-400 bg-red-50 dark:bg-red-950 text-red-800 dark:text-red-200">
              <div className="font-medium">Error</div>
              <div className="text-sm">{error}</div>
            </div>
          )}

          {result && (
            <div className="space-y-4">
              {/* Result Summary */}
              <div className="card">
                <h3 className="font-medium mb-2">Execution Result</h3>
                <div className="flex items-center gap-4">
                  <span className={`font-semibold ${getResultColor(result.result)}`}>
                    {result.result}
                  </span>
                  <span className="text-sm text-slate-500">
                    Score: {result.score}/100
                  </span>
                  <span className="text-sm text-slate-500">
                    Time: {result.executionTime?.toFixed(2)}s
                  </span>
                  {result.memoryUsed && (
                    <span className="text-sm text-slate-500">
                      Memory: {(result.memoryUsed / 1024).toFixed(1)}KB
                    </span>
                  )}
                </div>
              </div>

              {/* Output */}
              {result.stdout && (
                <div className="card">
                  <h3 className="font-medium mb-2">Output (stdout)</h3>
                  <pre className="bg-green-50 dark:bg-green-950 p-3 rounded text-sm whitespace-pre-wrap">
                    {result.stdout}
                  </pre>
                </div>
              )}

              {/* Error */}
              {result.stderr && (
                <div className="card">
                  <h3 className="font-medium mb-2">Error (stderr)</h3>
                  <pre className="bg-red-50 dark:bg-red-950 p-3 rounded text-sm whitespace-pre-wrap text-red-800 dark:text-red-200">
                    {result.stderr}
                  </pre>
                </div>
              )}
            </div>
          )}

          {loading && (
            <div className="card">
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="ml-2">Executing code...</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
