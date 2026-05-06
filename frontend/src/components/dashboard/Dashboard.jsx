import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TrendingUp, Clock, CheckCircle2, AlertTriangle, Layers, ListTodo, Activity } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { Card, Avatar, Badge, Spinner, EmptyState } from '../ui'
import { STATUS_META, PRIORITY_META, fmtRelative, fmtDate, isOverdue } from '../../lib/utils'
import api from '../../lib/api'

const StatCard = ({ icon: Icon, label, value, color, sub, delay }) => (
  <Card className={`fade-up-${delay}`} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div style={{ fontSize: '13px', color: 'var(--text-2)', fontWeight: 500 }}>{label}</div>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={15} color={color} />
      </div>
    </div>
    <div style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text)' }}>{value}</div>
    {sub && <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>{sub}</div>}
  </Card>
)

const DonutChart = ({ done, total }) => {
  const pct = total > 0 ? done / total : 0
  const r = 36, cx = 44, cy = 44
  const circ = 2 * Math.PI * r
  const dash = circ * pct
  return (
    <svg width={88} height={88}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--bg-4)" strokeWidth={8} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--accent)" strokeWidth={8}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`} style={{ transition: 'stroke-dasharray 0.6s ease' }} />
      <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle"
        style={{ fill: 'var(--text)', fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700 }}>
        {Math.round(pct * 100)}%
      </text>
    </svg>
  )
}

const StatusBar = ({ label, value, total, color }) => {
  const pct = total > 0 ? (value / total) * 100 : 0
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
        <span style={{ color: 'var(--text-2)' }}>{label}</span>
        <span style={{ color: 'var(--text)', fontWeight: 600 }}>{value}</span>
      </div>
      <div style={{ height: 4, borderRadius: 4, background: 'var(--bg-4)', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 4, transition: 'width 0.6s ease' }} />
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/dashboard/').then(r => setStats(r.data)).finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60 }}>
      <Spinner size={32} />
    </div>
  )

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <div style={{ padding: '28px 32px', flex: 1, maxWidth: 1200, margin: '0 auto', width: '100%' }}>
      {/* Header */}
      <div className="fade-up" style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <Avatar user={user} size={36} />
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 800, letterSpacing: '-0.02em' }}>
              {greeting}, {user?.full_name?.split(' ')[0]} 👋
            </h1>
            <p style={{ color: 'var(--text-2)', fontSize: '13px' }}>Here's what's happening today</p>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
        <StatCard icon={Layers} label="Total Tasks" value={stats?.total_tasks ?? 0} color="var(--accent)" sub={`${stats?.my_tasks} assigned to me`} delay={1} />
        <StatCard icon={Activity} label="In Progress" value={stats?.in_progress ?? 0} color="#7c6af7" sub={`${stats?.in_review} in review`} delay={2} />
        <StatCard icon={CheckCircle2} label="Completed" value={stats?.done ?? 0} color="var(--green)" sub={`${stats?.completion_rate}% rate`} delay={3} />
        <StatCard icon={AlertTriangle} label="Overdue" value={stats?.overdue ?? 0} color="var(--red)" sub="Need attention" delay={4} />
        <StatCard icon={ListTodo} label="Projects" value={stats?.total_projects ?? 0} color="var(--blue)" sub="Active" delay={5} />
      </div>

      {/* Middle row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20, marginBottom: 24 }}>
        {/* Recent tasks */}
        <Card className="fade-up-2">
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 16, fontSize: '15px' }}>Recent Tasks</div>
          {stats?.recent_tasks?.length === 0
            ? <EmptyState icon="📋" title="No tasks yet" description="Create a task in a project to get started" />
            : (stats?.recent_tasks || []).map(task => (
              <div
                key={task.id}
                onClick={() => navigate(`/tasks?highlight=${task.id}`)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0',
                  borderBottom: '1px solid var(--border)', cursor: 'pointer',
                  transition: 'opacity 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>{task.project?.icon} {task.project?.name}</span>
                    <span style={{ color: 'var(--border)' }}>·</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>{fmtRelative(task.created_at)}</span>
                  </div>
                </div>
                <Badge {...STATUS_META[task.status]} />
              </div>
            ))}
        </Card>

        {/* Progress overview */}
        <Card className="fade-up-3">
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 16, fontSize: '15px' }}>Progress</div>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
            <DonutChart done={stats?.done ?? 0} total={stats?.total_tasks ?? 0} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <StatusBar label="To Do" value={stats?.todo ?? 0} total={stats?.total_tasks} color="var(--text-3)" />
            <StatusBar label="In Progress" value={stats?.in_progress ?? 0} total={stats?.total_tasks} color="var(--accent)" />
            <StatusBar label="In Review" value={stats?.in_review ?? 0} total={stats?.total_tasks} color="var(--yellow)" />
            <StatusBar label="Done" value={stats?.done ?? 0} total={stats?.total_tasks} color="var(--green)" />
          </div>
        </Card>
      </div>

      {/* Overdue tasks */}
      {stats?.overdue_tasks?.length > 0 && (
        <Card className="fade-up-4" style={{ borderColor: 'rgba(255,95,109,0.2)', background: 'rgba(255,95,109,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <AlertTriangle size={16} color="var(--red)" />
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '15px', color: 'var(--red)' }}>Overdue Tasks</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {stats.overdue_tasks.map(task => (
              <div key={task.id} onClick={() => navigate('/tasks')}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--bg-3)', borderRadius: 8, cursor: 'pointer' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 500 }}>{task.title}</div>
                  <div style={{ fontSize: '11px', color: 'var(--red)', marginTop: 2 }}>Due {fmtDate(task.due_date)}</div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <Badge {...PRIORITY_META[task.priority]} />
                  {task.assignee && <Avatar user={task.assignee} size={22} />}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
