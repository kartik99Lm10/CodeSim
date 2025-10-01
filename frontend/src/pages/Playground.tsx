import React, { useState } from 'react'
import { Editor } from '../components/Editor'
import axios from 'axios'

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
        input
      })
      setResult(response.data)
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to execute code')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen p-4 space-y-4">
      <h1 className="text-2xl font-semibold">Multi-Language Playground</h1>
      
      <div className="card">
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <label htmlFor="language-select" className="text-sm font-medium">Language:</label>
            <select
              id="language-select"
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="input text-sm"
            >
              {languages.map((lang) => (
                <option key={lang.value} value={lang.value}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={runCode}
            disabled={loading}
            className="btn btn-primary"
          >
            {loading ? 'Running...' : 'Run Code'}
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <div className="mb-2 text-sm text-slate-600 dark:text-slate-400">
              Code Editor ({languages.find(l => l.value === language)?.label})
            </div>
            <Editor value={code} onChange={setCode} className="min-h-[300px]" />
          </div>
          
          <div>
            <div className="mb-2 text-sm text-slate-600 dark:text-slate-400">Input (stdin)</div>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter input for your program..."
              className="input min-h-[100px] mb-4"
            />
            
            <div className="mb-2 text-sm text-slate-600 dark:text-slate-400">Output</div>
            <div className="card min-h-[200px]">
              {error && (
                <div className="text-red-600 dark:text-red-400 mb-2">
                  <strong>Error:</strong> {error}
                </div>
              )}
              {result && (
                <div className="space-y-2">
                  <div className="flex items-center gap-4 text-sm">
                    <span className={`px-2 py-1 rounded text-xs ${
                      result.success ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {result.result}
                    </span>
                    <span className="text-slate-500">
                      {result.executionTime}ms
                    </span>
                    <span className="text-slate-500">
                      {result.memoryUsed}KB
                    </span>
                  </div>
                  
                  {result.stdout && (
                    <div>
                      <div className="text-sm font-medium text-green-600 dark:text-green-400 mb-1">Output:</div>
                      <pre className="text-sm bg-green-50 dark:bg-green-950 p-2 rounded whitespace-pre-wrap">{result.stdout}</pre>
                    </div>
                  )}
                  
                  {result.stderr && (
                    <div>
                      <div className="text-sm font-medium text-red-600 dark:text-red-400 mb-1">Error:</div>
                      <pre className="text-sm bg-red-50 dark:bg-red-950 p-2 rounded whitespace-pre-wrap">{result.stderr}</pre>
                    </div>
                  )}
                </div>
              )}
              {!result && !error && !loading && (
                <div className="text-slate-500 text-sm">Click "Run Code" to execute your program</div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="font-medium mb-2">Supported Languages</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
          {languages.map((lang) => (
            <div key={lang.value} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${language === lang.value ? 'bg-blue-500' : 'bg-slate-300 dark:bg-slate-600'}`}></div>
              <span>{lang.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
