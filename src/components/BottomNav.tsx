import { Link } from 'react-router-dom'
import { User } from '../types'

interface Props {
  user: User
}

export default function BottomNav({ user }: Props) {
  const path = window.location.pathname

  const items = [
    { path: '/', label: '首页', icon: '🏠' },
    { path: '/will', label: '遗嘱', icon: '📜' },
    { path: '/guardian', label: '守护', icon: '🛡️' },
    { path: '/assets', label: '资产', icon: '💼' },
    { path: '/profile', label: '我的', icon: '👤' },
  ]

  return (
    <nav className="bottom-nav">
      {items.map(item => (
        <Link
          key={item.path}
          to={item.path}
          className={`nav-item ${path === item.path ? 'active' : ''}`}
        >
          <span style={{ fontSize: '22px' }}>{item.icon}</span>
          <span>{item.label}</span>
        </Link>
      ))}
    </nav>
  )
}
