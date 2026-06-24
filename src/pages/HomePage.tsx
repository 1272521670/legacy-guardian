import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { User, Will, Executor, Guardian, Asset } from '../types'

interface Props { user: User }

export default function HomePage({ user }: Props) {
  const [stats, setStats] = useState({ wills: 0, executors: 0, guardians: 0, assets: 0 })
  const [activeWill, setActiveWill] = useState<Will | null>(null)
  const [recentActivity, setRecentActivity] = useState<any[]>([])

  useEffect(() => {
    loadDashboard()
  }, [user.id])

  const loadDashboard = async () => {
    const [wills, executors, guardians, assets] = await Promise.all([
      supabase.from('wills').select('*', { count: 'exact' }).eq('user_id', user.id),
      supabase.from('executors').select('*', { count: 'exact' }).eq('user_id', user.id),
      supabase.from('guardians').select('*', { count: 'exact' }).eq('user_id', user.id),
      supabase.from('assets').select('*', { count: 'exact' }).eq('user_id', user.id),
    ])
    setStats({
      wills: wills.count || 0,
      executors: executors.count || 0,
      guardians: guardians.count || 0,
      assets: assets.count || 0,
    })
    const active = wills.data?.find(w => w.is_active)
    setActiveWill(active || null)
  }

  const completionPercent = Math.round(
    ((stats.wills > 0 ? 1 : 0) +
     (stats.executors > 0 ? 1 : 0) +
     (stats.guardians > 0 ? 1 : 0) +
     (stats.assets > 0 ? 1 : 0)) / 4 * 100
  )

  const quickActions = [
    { icon: '📜', label: '配置遗嘱', desc: '定义数字遗产分配', path: '/will', color: '#7c3aed' },
    { icon: '🤝', label: '指定执行人', desc: '委托遗产执行人', path: '/executor', color: '#0891b2' },
    { icon: '🛡️', label: 'AI 守护', desc: '定期健康打卡', path: '/guardian', color: '#059669' },
    { icon: '💼', label: '数字资产', desc: '管理账号密码', path: '/assets', color: '#d97706' },
  ]

  return (
    <div>
      <div className="page-header">
        <div>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '4px' }}>欢迎回来</p>
          <h1 className="page-title">{user.full_name}</h1>
        </div>
        <div style={{
          width: 44, height: 44, borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--primary), var(--primary-light))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '18px', fontWeight: '700', color: 'white'
        }}>
          {user.full_name?.charAt(0) || 'U'}
        </div>
      </div>

      {activeWill ? (
        <div style={{
          background: 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(167,139,250,0.1))',
          border: '1px solid rgba(124,58,237,0.4)',
          borderRadius: 'var(--radius)', padding: '20px', marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <span className="badge badge-active">✓ 遗嘱已生效</span>
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>{activeWill.title}</h3>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
            {activeWill.content.substring(0, 80)}...
          </p>
          <Link to="/will" style={{
            display: 'inline-block', marginTop: '12px', fontSize: '14px',
            color: 'var(--primary-light)', textDecoration: 'none', fontWeight: '600'
          }}>
            查看完整遗嘱 →
          </Link>
        </div>
      ) : (
        <div style={{
          background: 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(251,191,36,0.05))',
          border: '1px solid rgba(245,158,11,0.3)',
          borderRadius: 'var(--radius)', padding: '20px', marginBottom: '20px'
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '8px' }}>⏳ 你的遗嘱还未配置</h3>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
            立即创建第一份数字遗嘱，为你的数字身份留下保障
          </p>
          <Link to="/will" className="btn btn-primary" style={{ width: 'auto', display: 'inline-flex', padding: '10px 20px' }}>
            创建遗嘱
          </Link>
        </div>
      )}

      <div style={{ marginBottom: '20px' }}>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
          保护完成度 · {completionPercent}%
        </p>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${completionPercent}%` }} />
        </div>
      </div>

      <h2 className="section-title">快捷操作</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        {quickActions.map(action => (
          <Link key={action.path} to={action.path} style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: '18px 14px',
            textDecoration: 'none',
            color: 'inherit',
            transition: 'transform 0.2s',
          }}>
            <div style={{ fontSize: '28px', marginBottom: '10px' }}>{action.icon}</div>
            <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>{action.label}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{action.desc}</div>
          </Link>
        ))}
      </div>

      <h2 className="section-title">保护概览</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
        {[
          { label: '遗嘱', value: stats.wills, icon: '📜' },
          { label: '执行人', value: stats.executors, icon: '🤝' },
          { label: '守护人', value: stats.guardians, icon: '🛡️' },
          { label: '资产', value: stats.assets, icon: '💼' },
        ].map(stat => (
          <div key={stat.label} style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: '12px', padding: '14px 8px', textAlign: 'center'
          }}>
            <div style={{ fontSize: '20px', marginBottom: '6px' }}>{stat.icon}</div>
            <div style={{ fontSize: '20px', fontWeight: '700' }}>{stat.value}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
