import React, { useState, useEffect } from 'react'
import { useAuth } from '../state/auth'
import axios from 'axios'
import { Editor } from '../components/Editor'
import ReactMarkdown from 'react-markdown'

type TestResult = {
  testNumber: number
  passed: boolean
  hidden: boolean
  input?: string
  expectedOutput?: string
  actualOutput?: string
}

type ValidationResult = {
  success: boolean
  totalTests: number
  passedTests: number
  visiblePassed: number
  hiddenPassed: number
  score: number
  result: string
  testResults: TestResult[]
  message?: string
  warning?: string
  similarity?: number
  warningCount?: number
}

type Question = { 
  questionId: string
  title: string
  statement: string
  tags: string[]
  difficulty: string
  index: string
  points: number
  testCases: Array<{input: string; expected: string}>
}

type UserScore = {
  totalScore: number
  questionsSolved: number
  totalAttempts: number
}

export function DailyQuestionsModern() {
  const { token, user } = useAuth()
  const [questions, setQuestions] = useState<Question[]>([])
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null)
  const [language, setLanguage] = useState('java')
  const [code, setCode] = useState('')
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [userScore, setUserScore] = useState<UserScore | null>(null)
  const [attempts, setAttempts] = useState<any[]>([])
  const [showTestResults, setShowTestResults] = useState(false)
  
  const api = axios.create({ 
    baseURL: 'http://localhost:8080',
    headers: { Authorization: `Bearer ${token}` } 
  })

  const languages = [
    { value: 'java', label: 'Java', id: 62 },
    { value: 'python', label: 'Python 3', id: 71 },
    { value: 'cpp', label: 'C++ (GCC 9.2)', id: 54 },
    { value: 'c', label: 'C (GCC 9.2)', id: 50 },
    { value: 'javascript', label: 'JavaScript (Node.js)', id: 63 },
  ]

  const getDefaultCode = (lang: string) => {
    const templates: Record<string, string> = {
      java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        // Write your solution here
        
    }
}`,
      python: `# Write your solution here
import sys

def solve():
    pass

if __name__ == "__main__":
    solve()`,
      cpp: `#include <iostream>
#include <vector>
using namespace std;

int main() {
    // Write your solution here
    
    return 0;
}`,
      c: `#include <stdio.h>

int main() {
    // Write your solution here
    
    return 0;
}`,
      javascript: `// Write your solution here
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Your code here
`
    }
    return templates[lang] || templates.java
  }

  useEffect(() => {
    fetchDailyQuestions()
    if (user?.id) {
      fetchUserScore()
      fetchUserAttempts()
    }
  }, [user])

  useEffect(() => {
    if (selectedQuestion) {
      setCode(getDefaultCode(language))
      setValidationResult(null)
      setShowTestResults(false)
    }
  }, [selectedQuestion, language])

  const fetchDailyQuestions = async () => {
    try {
      const response = await api.get('/api/daily/questions')
      setQuestions(response.data)
      if (response.data.length > 0 && !selectedQuestion) {
        setSelectedQuestion(response.data[0])
      }
    } catch (error: any) {
      console.error('Failed to fetch daily questions:', error)
      setError('Failed to load daily questions')
    }
  }

  const fetchUserScore = async () => {
    if (!user?.id) return
    try {
      const response = await api.get(`/api/daily/score/${user.id}`)
      setUserScore(response.data.userScore)
    } catch (error) {
      console.error('Failed to fetch user score:', error)
    }
  }

  const fetchUserAttempts = async () => {
    if (!user?.id) return
    try {
      const response = await api.get(`/api/daily/attempts/${user.id}`)
      setAttempts(response.data.attempts || [])
    } catch (error) {
      console.error('Failed to fetch user attempts:', error)
    }
  }

  const handleSubmit = async () => {
    if (!selectedQuestion || !code.trim()) {
      setError('Please write some code')
      return
    }

    setLoading(true)
    setError('')
    setValidationResult(null)
    setShowTestResults(false)

    try {
      // Validate against all test cases
      const response = await api.post('/api/daily/validate', {
        questionId: selectedQuestion.questionId,
        code: code,
        language: language
      })

      const result: ValidationResult = response.data
      setValidationResult(result)
      setShowTestResults(true)

      // Submit attempt if user is logged in
      if (user?.id && result.success) {
        await api.post('/api/daily/submit', {
          userId: user.id,
          questionId: selectedQuestion.questionId,
          code: code,
          language: language,
          result: result.result,
          score: result.score
        })
        
        // Refresh user data
        fetchUserScore()
        fetchUserAttempts()
      }

    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to validate code')
    } finally {
      setLoading(false)
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY': return 'text-green-500'
      case 'MEDIUM': return 'text-yellow-500'
      case 'HARD': return 'text-red-500'
      default: return 'text-gray-500'
    }
  }

  const getDifficultyBg = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
      case 'MEDIUM': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
      case 'HARD': return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
      default: return 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300'
    }
  }

  const isSolved = (questionId: string) => {
    return attempts.some(a => a.questionId === questionId && a.isSolved)
  }

  const solvedCount = questions.filter(q => isSolved(q.questionId)).length

  return (
    <div className="h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="text-xl font-bold">Daily Challenge</h1>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-slate-600 dark:text-slate-400">Progress:</span>
              <span className="font-semibold text-blue-600">{solvedCount}/{questions.length}</span>
            </div>
          </div>
          
          {userScore && (
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-slate-600 dark:text-slate-400">Score:</span>
                <span className="font-bold text-green-600">{userScore.totalScore}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-600 dark:text-slate-400">Solved:</span>
                <span className="font-semibold">{userScore.questionsSolved}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Problem Statement */}
        <div className="w-1/2 flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          {/* Problem Selector */}
          <div className="border-b border-slate-200 dark:border-slate-800 p-4">
            <div className="flex gap-2 overflow-x-auto">
              {questions.map((q, idx) => (
                <button
                  key={q.questionId}
                  onClick={() => setSelectedQuestion(q)}
                  className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                    selectedQuestion?.questionId === q.questionId
                      ? 'bg-blue-500 text-white'
                      : isSolved(q.questionId)
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                      : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {idx + 1}. {q.title}
                  {isSolved(q.questionId) && <span className="ml-2">✓</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Problem Content */}
          {selectedQuestion && (
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                {/* Title and Meta */}
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-bold">{selectedQuestion.title}</h2>
                    {isSolved(selectedQuestion.questionId) && (
                      <span className="text-green-500 text-xl">✓</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm px-3 py-1 rounded-full font-medium ${getDifficultyBg(selectedQuestion.difficulty)}`}>
                      {selectedQuestion.difficulty}
                    </span>
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      {selectedQuestion.points} points
                    </span>
                    <div className="flex gap-2">
                      {selectedQuestion.tags.map(tag => (
                        <span key={tag} className="text-xs px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Problem Statement */}
                <div className="prose dark:prose-invert max-w-none">
                  <ReactMarkdown>{selectedQuestion.statement}</ReactMarkdown>
                </div>

                {/* Sample Test Cases */}
                {selectedQuestion.testCases && selectedQuestion.testCases.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Sample Test Cases</h3>
                    {selectedQuestion.testCases.map((testCase, index) => (
                      <div key={index} className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 space-y-2">
                        <div className="font-medium text-sm text-slate-600 dark:text-slate-400">
                          Example {index + 1}
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-slate-500 mb-1">Input:</div>
                          <pre className="text-sm bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-700">
                            {testCase.input}
                          </pre>
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-slate-500 mb-1">Output:</div>
                          <pre className="text-sm bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-700">
                            {testCase.expected}
                          </pre>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - Code Editor */}
        <div className="w-1/2 flex flex-col bg-slate-900">
          {/* Editor Header */}
          <div className="bg-slate-800 border-b border-slate-700 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-slate-300">Code</span>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-slate-700 text-white text-sm px-3 py-1.5 rounded border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {languages.map((lang) => (
                  <option key={lang.value} value={lang.value}>
                    {lang.label}
                  </option>
                ))}
              </select>
            </div>
            
            <button
              onClick={handleSubmit}
              disabled={loading || !code.trim()}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                loading
                  ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl'
              }`}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Running...
                </span>
              ) : (
                'Submit'
              )}
            </button>
          </div>

          {/* Code Editor */}
          <div className="flex-1 overflow-hidden">
            <Editor value={code} onChange={setCode} />
          </div>

          {/* Results Panel */}
          {(validationResult || error) && (
            <div className="bg-slate-800 border-t border-slate-700 p-4 max-h-64 overflow-y-auto">
              {error && (
                <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 text-red-300 text-sm">
                  {error}
                </div>
              )}

              {validationResult && (
                <div className="space-y-3">
                  {/* Overall Result */}
                  <div className={`rounded-lg p-4 ${
                    validationResult.success
                      ? 'bg-green-900/30 border border-green-700'
                      : 'bg-red-900/30 border border-red-700'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className={`text-lg font-bold ${
                          validationResult.success ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {validationResult.result}
                        </div>
                        <div className="text-sm text-slate-400 mt-1">
                          {validationResult.passedTests}/{validationResult.totalTests} test cases passed
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-white">
                          {validationResult.score}
                        </div>
                        <div className="text-xs text-slate-400">points</div>
                      </div>
                    </div>
                  </div>

                  {/* Similarity Warning - Progressive Penalties */}
                  {validationResult.warning && validationResult.warning !== 'NONE' && (
                    <div className={`rounded-lg p-4 border ${
                      validationResult.warning === 'ACCOUNT_SUSPENDED' ? 'bg-red-900/40 border-red-700' :
                      validationResult.warning === 'FINAL_WARNING' ? 'bg-red-900/30 border-red-700' :
                      validationResult.warning === 'SEVERE_WARNING' ? 'bg-orange-900/30 border-orange-700' :
                      'bg-yellow-900/30 border-yellow-700'
                    }`}>
                      <div className="flex items-start gap-3">
                        <span className="text-3xl">
                          {validationResult.warning === 'ACCOUNT_SUSPENDED' ? '🚫' :
                           validationResult.warning === 'FINAL_WARNING' ? '🔴' :
                           validationResult.warning === 'SEVERE_WARNING' ? '🟠' : '🟡'}
                        </span>
                        <div className="flex-1">
                          <div className={`font-bold mb-1 ${
                            validationResult.warning === 'ACCOUNT_SUSPENDED' ? 'text-red-400 text-lg' :
                            validationResult.warning === 'FINAL_WARNING' ? 'text-red-400' :
                            validationResult.warning === 'SEVERE_WARNING' ? 'text-orange-400' :
                            'text-yellow-400'
                          }`}>
                            {validationResult.warning === 'ACCOUNT_SUSPENDED' ? 'ACCOUNT SUSPENDED' :
                             validationResult.warning === 'FINAL_WARNING' ? 'FINAL WARNING' :
                             validationResult.warning === 'SEVERE_WARNING' ? 'SEVERE WARNING' :
                             'Plagiarism Warning'}
                          </div>
                          <div className="text-sm text-slate-200 mb-2">
                            {validationResult.message}
                          </div>
                          {validationResult.similarity && (
                            <div className="text-xs text-slate-400 mb-2">
                              Code Similarity: {validationResult.similarity.toFixed(1)}%
                            </div>
                          )}
                          {validationResult.warningCount && (
                            <div className={`mt-3 p-2 rounded text-xs font-mono ${
                              validationResult.warningCount >= 3 ? 'bg-red-900/50 text-red-300' :
                              validationResult.warningCount === 2 ? 'bg-orange-900/50 text-orange-300' :
                              'bg-yellow-900/50 text-yellow-300'
                            }`}>
                              ⚠️ Plagiarism Violations: {validationResult.warningCount}/3
                              {validationResult.warningCount >= 3 && ' - Next violation = ACCOUNT SUSPENSION!'}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Test Results */}
                  {showTestResults && (
                    <div className="space-y-2">
                      <div className="text-sm font-semibold text-slate-300">Test Cases</div>
                      {validationResult.testResults.map((test) => (
                        <div
                          key={test.testNumber}
                          className={`rounded p-3 text-sm ${
                            test.passed
                              ? 'bg-green-900/20 border border-green-800'
                              : 'bg-red-900/20 border border-red-800'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-slate-300">
                              Test {test.testNumber} {test.hidden && '(Hidden)'}
                            </span>
                            <span className={test.passed ? 'text-green-400' : 'text-red-400'}>
                              {test.passed ? '✓ Passed' : '✗ Failed'}
                            </span>
                          </div>
                          
                          {!test.hidden && (
                            <div className="space-y-1 text-xs">
                              <div>
                                <span className="text-slate-500">Input:</span>
                                <pre className="mt-1 p-2 bg-slate-900 rounded">{test.input}</pre>
                              </div>
                              <div>
                                <span className="text-slate-500">Expected:</span>
                                <pre className="mt-1 p-2 bg-slate-900 rounded text-green-400">{test.expectedOutput}</pre>
                              </div>
                              {test.actualOutput !== undefined && (
                                <div>
                                  <span className="text-slate-500">Your Output:</span>
                                  <pre className={`mt-1 p-2 bg-slate-900 rounded ${
                                    test.passed ? 'text-green-400' : 'text-red-400'
                                  }`}>{test.actualOutput}</pre>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
