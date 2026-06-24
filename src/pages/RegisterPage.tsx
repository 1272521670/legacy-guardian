import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } }
    })
    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }
    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        email,
        full_name: fullName,
        created_at: new Date().toISOString()
      })
      toast.success('注册成功！欢迎加入')
      navigate('/')
    }
  }

  return (
    <div className="auth-page">
      <svg className="auth-logo" viewBox="0 0 100 100">
        <defs>
          <linearGradient id="g2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#a78bfa' }} />
            <stop offset="100%" style={{ stopColor: '#7c3aed' }} />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="48" fill="url(#g2)" />
        <path d="M50 20 L50 55 M50 55 C35 55 25 65 25 75 C25 85 35 90 50 90 C65 90 75 85 75 75 C75 65 65 55 50 55"
          stroke="white" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="50" cy="40" r="8" fill="white" opacity="0.9" />
      </svg>
      <h1 className="auth-title">创建账户</h1>
      <p className="auth-subtitle">只需几分钟，为你的数字遗产建立一份安心</p>

      <div className="auth-card">
        <form onSubmit={handleRegister}>
          <div className="form-group">
            <label className="form-label">姓名</label>
            <input
              className="form-input"
              type="text"
              placeholder="你的真实姓名"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              required
            />
          </div>
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
              placeholder="至少 6 位"
              value={password}
              onChange={e => setPassword(e.target.value)}
              minLength={6}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? <span className="spinner" /> : '注册'}
          </button>
        </form>
      </div>

      <p className="auth-footer">
        已有账户？<Link to="/login">立即登录</Link>
      </p>
    </div>
  )
}
