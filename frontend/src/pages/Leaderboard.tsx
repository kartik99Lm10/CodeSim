import React, { useState, useEffect } from 'react'
import { useAuth } from '../state/auth'
import axios from 'axios'

type LeaderboardEntry = {
  rank: number
  userId: string
  totalScore: number
  questionsSolved: number
}

export function Leaderboard() {
  const { user } = useAuth()
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])

  const api = axios.create({
    baseURL: 'http://localhost:8080'
  })

  useEffect(() => {
    fetchLeaderboard()
  }, [date])

  const fetchLeaderboard = async () => {
    setLoading(true)
    try {
      const response = await api.get('/api/daily/leaderboard', {
        params: { date }
      })
      setLeaderboard(response.data.leaderboard || [])
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error)
      setLeaderboard([])
    } finally {
      setLoading(false)
    }
  }

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'text-yellow-400'
    if (rank === 2) return 'text-slate-300'
    if (rank === 3) return 'text-orange-400'
    return 'text-slate-400'
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return `#${rank}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            🏆 Leaderboard
          </h1>
          <p className="text-slate-400">
            Top performers for {new Date(date).toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>

        {/* Date Selector */}
        <div className="mb-6 flex items-center gap-4">
          <label className="text-sm text-slate-400">Select Date:</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
            className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => setDate(new Date().toISOString().split('T')[0])}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors"
          >
            Today
          </button>
        </div>

        {/* Leaderboard */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-xl font-semibold text-slate-300 mb-2">No Data Yet</h3>
            <p className="text-slate-400">
              Be the first to solve problems and appear on the leaderboard!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Top 3 Podium */}
            {leaderboard.length >= 3 && (
              <div className="grid grid-cols-3 gap-4 mb-8">
                {/* 2nd Place */}
                <div className="bg-gradient-to-br from-slate-700 to-slate-800 rounded-lg p-6 border border-slate-600 transform translate-y-4">
                  <div className="text-center">
                    <div className="text-4xl mb-2">🥈</div>
                    <div className="text-2xl font-bold text-slate-300 mb-1">
                      {leaderboard[1].userId}
                    </div>
                    <div className="text-3xl font-bold text-blue-400 mb-2">
                      {leaderboard[1].totalScore}
                    </div>
                    <div className="text-sm text-slate-400">
                      {leaderboard[1].questionsSolved} solved
                    </div>
                  </div>
                </div>

                {/* 1st Place */}
                <div className="bg-gradient-to-br from-yellow-600/20 to-yellow-800/20 rounded-lg p-6 border-2 border-yellow-500 shadow-lg shadow-yellow-500/20">
                  <div className="text-center">
                    <div className="text-5xl mb-2">🥇</div>
                    <div className="text-2xl font-bold text-yellow-400 mb-1">
                      {leaderboard[0].userId}
                    </div>
                    <div className="text-4xl font-bold text-yellow-300 mb-2">
                      {leaderboard[0].totalScore}
                    </div>
                    <div className="text-sm text-slate-300">
                      {leaderboard[0].questionsSolved} solved
                    </div>
                  </div>
                </div>

                {/* 3rd Place */}
                <div className="bg-gradient-to-br from-slate-700 to-slate-800 rounded-lg p-6 border border-slate-600 transform translate-y-4">
                  <div className="text-center">
                    <div className="text-4xl mb-2">🥉</div>
                    <div className="text-2xl font-bold text-orange-400 mb-1">
                      {leaderboard[2].userId}
                    </div>
                    <div className="text-3xl font-bold text-blue-400 mb-2">
                      {leaderboard[2].totalScore}
                    </div>
                    <div className="text-sm text-slate-400">
                      {leaderboard[2].questionsSolved} solved
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Rest of Leaderboard */}
            <div className="bg-slate-800/50 rounded-lg border border-slate-700 overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-800 border-b border-slate-700">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Rank</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">User</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-slate-300">Solved</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-slate-300">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {leaderboard.map((entry) => (
                    <tr
                      key={entry.rank}
                      className={`hover:bg-slate-700/50 transition-colors ${
                        entry.userId === user?.username ? 'bg-blue-900/20 border-l-4 border-blue-500' : ''
                      }`}
                    >
                      <td className="px-6 py-4">
                        <span className={`text-lg font-bold ${getRankColor(entry.rank)}`}>
                          {getRankIcon(entry.rank)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white">
                            {entry.userId}
                          </span>
                          {entry.userId === user?.username && (
                            <span className="text-xs bg-blue-600 px-2 py-1 rounded-full">You</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center gap-1 text-slate-300">
                          <span className="text-green-400">✓</span>
                          {entry.questionsSolved}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-xl font-bold text-blue-400">
                          {entry.totalScore}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Stats */}
        {leaderboard.length > 0 && (
          <div className="mt-8 grid grid-cols-3 gap-4">
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
              <div className="text-sm text-slate-400 mb-1">Total Participants</div>
              <div className="text-2xl font-bold text-white">{leaderboard.length}</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
              <div className="text-sm text-slate-400 mb-1">Highest Score</div>
              <div className="text-2xl font-bold text-yellow-400">
                {Math.max(...leaderboard.map(e => e.totalScore))}
              </div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
              <div className="text-sm text-slate-400 mb-1">Average Score</div>
              <div className="text-2xl font-bold text-blue-400">
                {Math.round(leaderboard.reduce((sum, e) => sum + e.totalScore, 0) / leaderboard.length)}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
