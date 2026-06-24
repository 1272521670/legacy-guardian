import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { User, Will } from '../types'
import toast from 'react-hot-toast'

interface Props { user: User }

const WILL_TEMPLATES = [
  {
    category: '社交账号',
    title: '社交媒体账号处理',
    content: `关于我在各大社交平台账号的处理意见：

1. 微信账号：希望家人保留与我最亲密的微信账号，可以将其转化为纪念账号，永久保存我的聊天记录和照片。如有需要，可整理成电子纪念册。

2. 微博/小红书账号：建议保留一段时间后，由执行人决定是否转为纪念账号或注销。

3. QQ账号：包含了我学生时代的大量回忆，希望保留。

关于账号密码，请咨询我的执行人或查看资产清单中的详细记录。`
  },
  {
    category: '金融资产',
    title: '数字金融资产处理',
    content: `关于我的数字金融资产：

1. 银行数字账户：请执行人持相关证件到各银行网点办理遗产公证和账户查询。

2. 支付宝/微信支付：请执行人联系客服申请遗产继承，需提供死亡证明、亲属关系证明等材料。

3. 股票/基金账户：请执行人联系相关券商办理账户冻结和遗产过户。

如有任何疑问，请联系我的个人律师或执行人。`
  },
  {
    category: '游戏资产',
    title: '游戏及虚拟资产',
    content: `关于我在各游戏平台账号的处理：

1. 游戏账号：我投入了大量时间经营的游戏角色和装备，希望家人可以继续游玩，或赠送给游戏中的好友。

2. 虚拟物品：如有任何有价值的 NFT 或虚拟货币，请执行人按当时市场价值处理。

3. Steam/Epic 账号：这些账号承载了我的娱乐时光，建议家人保留作为纪念。`
  },
]

export default function WillPage({ user }: Props) {
  const [wills, setWills] = useState<Will[]>([])
  const [loading, setLoading] = useState(true)
  const [showEditor, setShowEditor] = useState(false)
  const [editingWill, setEditingWill] = useState<Will | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null)

  useEffect(() => {
    loadWills()
  }, [user.id])

  const loadWills = async () => {
    const { data } = await supabase
      .from('wills')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
    setWills(data || [])
    setLoading(false)
  }

  const openNew = () => {
    setEditingWill(null)
    setTitle('')
    setContent('')
    setSelectedTemplate(null)
    setShowEditor(true)
  }

  const openEdit = (will: Will) => {
    setEditingWill(will)
    setTitle(will.title)
    setContent(will.content)
    setSelectedTemplate(null)
    setShowEditor(true)
  }

  const applyTemplate = (idx: number) => {
    const t = WILL_TEMPLATES[idx]
    setTitle(t.title)
    setContent(t.content)
    setSelectedTemplate(idx)
  }

  const saveWill = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error('请填写标题和内容')
      return
    }
    setSaving(true)
    if (editingWill) {
      const { error } = await supabase
        .from('wills')
        .update({ title, content, updated_at: new Date().toISOString() })
        .eq('id', editingWill.id)
      if (error) toast.error('保存失败')
      else { toast.success('保存成功'); loadWills(); setShowEditor(false) }
    } else {
      const { error } = await supabase
        .from('wills')
        .insert({ user_id: user.id, title, content, is_active: wills.length === 0 })
      if (error) toast.error('创建失败')
      else { toast.success('创建成功'); loadWills(); setShowEditor(false) }
    }
    setSaving(false)
  }

  const setActive = async (will: Will) => {
    await supabase.from('wills').update({ is_active: false }).eq('user_id', user.id)
    await supabase.from('wills').update({ is_active: true }).eq('id', will.id)
    toast.success('已设为有效遗嘱')
    loadWills()
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">数字遗嘱</h1>
        <button className="btn btn-primary" style={{ width: 'auto', padding: '8px 16px', fontSize: '14px' }} onClick={openNew}>
          + 新建
        </button>
      </div>

      {wills.length === 0 && !loading ? (
        <div className="empty-state">
          <div className="empty-icon">📜</div>
          <div className="empty-title">暂无遗嘱</div>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
            创建你的第一份数字遗嘱，<br />定义你的数字遗产分配方案
          </p>
          <button className="btn btn-primary" style={{ width: 'auto', display: 'inline-flex' }} onClick={openNew}>
            创建遗嘱
          </button>
        </div>
      ) : (
        <>
          <div style={{ marginBottom: '8px' }}>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
              共 {wills.length} 份遗嘱
            </p>
          </div>
          {wills.map(will => (
            <div className="card" key={will.id} style={{ cursor: 'pointer' }} onClick={() => openEdit(will)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <h3 className="card-title">{will.title}</h3>
                <span className={`badge ${will.is_active ? 'badge-active' : 'badge-inactive'}`}>
                  {will.is_active ? '✓ 有效' : '草稿'}
                </span>
              </div>
              <p className="card-sub" style={{ lineHeight: '1.6' }}>
                {will.content.substring(0, 100)}{will.content.length > 100 ? '...' : ''}
              </p>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '10px' }}>
                更新于 {new Date(will.updated_at).toLocaleDateString('zh-CN')}
              </p>
            </div>
          ))}
        </>
      )}

      {showEditor && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowEditor(false)}>
          <div className="modal-sheet">
            <div className="modal-handle" />
            <h2 className="modal-title">{editingWill ? '编辑遗嘱' : '新建遗嘱'}</h2>

            {!editingWill && (
              <>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                  选择一个模板快速开始，或直接从空白开始
                </p>
                <div className="will-category">
                  <button className={`category-chip ${selectedTemplate === null ? 'active' : ''}`}
                    onClick={() => setSelectedTemplate(null)}>空白</button>
                  {WILL_TEMPLATES.map((t, i) => (
                    <button key={t.category} className={`category-chip ${selectedTemplate === i ? 'active' : ''}`}
                      onClick={() => applyTemplate(i)}>
                      {t.category}
                    </button>
                  ))}
                </div>
              </>
            )}

            <div className="form-group">
              <label className="form-label">标题</label>
              <input className="form-input" value={title} onChange={e => setTitle(e.target.value)} placeholder="遗嘱标题" />
            </div>
            <div className="form-group">
              <label className="form-label">内容</label>
              <textarea className="form-input" value={content} onChange={e => setContent(e.target.value)}
                placeholder="在这里写下你的数字遗产处理方案..." style={{ minHeight: '200px' }} />
            </div>

            <button className="btn btn-primary" onClick={saveWill} disabled={saving} style={{ marginTop: '8px' }}>
              {saving ? <span className="spinner" /> : (editingWill ? '保存修改' : '创建遗嘱')}
            </button>
            {editingWill && (
              <>
                {!editingWill.is_active && (
                  <button className="btn btn-secondary" onClick={() => { setActive(editingWill); setShowEditor(false) }}
                    style={{ marginTop: '10px' }}>
                    设为有效遗嘱
                  </button>
                )}
                <button className="btn btn-ghost" onClick={() => setShowEditor(false)} style={{ marginTop: '8px' }}>
                  取消
                </button>
              </>
            )}
            {!editingWill && (
              <button className="btn btn-ghost" onClick={() => setShowEditor(false)} style={{ marginTop: '8px' }}>
                取消
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
