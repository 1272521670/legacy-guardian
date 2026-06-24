import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      toast.error(error.message)
      setLoading(false)
    } else {
      navigate('/')
    }
  }

  return (
    <div className="auth-page">
      <svg className="auth-logo" viewBox="0 0 100 100">
        <defs>
          <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#a78bfa' }} />
            <stop offset="100%" style={{ stopColor: '#7c3aed' }} />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="48" fill="url(#g1)" />
        <path d="M50 20 L50 55 M50 55 C35 55 25 65 25 75 C25 85 35 90 50 90 C65 90 75 85 75 75 C75 65 65 55 50 55"
          stroke="white" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="50" cy="40" r="8" fill="white" opacity="0.9" />
      </svg>
      <h1 className="auth-title">数字遗产守护</h1>
      <p className="auth-subtitle">为你的数字身份留下一份安心</p>

      <div className="auth-card">
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">邮箱</label>
            <input
              className="form-input"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">密码</label>
            <input
              className="form-input"
              type="password"
              placeholder="输入密码"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? <span className="spinner" /> : '登录'}
          </button>
        </form>
      </div>

      <p className="auth-footer">
        还没有账户？<Link to="/register">立即注册</Link>
      </p>
    </div>
  )
}
