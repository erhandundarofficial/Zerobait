import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login(username.trim(), password)
      navigate('/')
    } catch (e: any) {
      setError(e?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <h1 className="text-white text-3xl font-bold">Log In</h1>
      <p className="text-gray-300 mt-2">Welcome back. Enter your credentials to continue.</p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <div>
          <label className="block text-sm text-gray-300 mb-1">Username</label>
          <input
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-gray-100 placeholder:text-gray-500 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
          />
        </div>
        <div>
          <label className="block text-sm text-gray-300 mb-1">Password</label>
          <input
            type="password"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-gray-100 placeholder:text-gray-500 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-emerald-400 px-4 py-2 font-semibold text-gray-900 hover:bg-emerald-300 disabled:opacity-70"
        >
          {loading ? 'Logging in…' : 'Log In'}
        </button>
      </form>

      <p className="text-sm text-gray-400 mt-4">
        Don’t have an account?{' '}
        <Link to="/signup" className="text-emerald-300 hover:underline">Sign up</Link>
      </p>
    </div>
  )
}
