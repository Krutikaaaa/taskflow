import { formatDistanceToNow, format, isPast, isToday, isTomorrow } from 'date-fns'

export const fmtDate = (d) => {
  if (!d) return null
  const date = new Date(d)
  if (isToday(date)) return 'Today'
  if (isTomorrow(date)) return 'Tomorrow'
  return format(date, 'MMM d')
}

export const fmtDateFull = (d) => d ? format(new Date(d), 'MMM d, yyyy') : '—'
export const fmtRelative = (d) => d ? formatDistanceToNow(new Date(d), { addSuffix: true }) : '—'

export const isOverdue = (d, status) =>
  d && status !== 'done' && isPast(new Date(d))

export const PRIORITY_META = {
  low:      { label: 'Low',      color: '#4eadff', bg: 'rgba(78,173,255,0.12)' },
  medium:   { label: 'Medium',   color: '#f5c542', bg: 'rgba(245,197,66,0.12)' },
  high:     { label: 'High',     color: '#ff8c42', bg: 'rgba(255,140,66,0.12)' },
  critical: { label: 'Critical', color: '#ff5f6d', bg: 'rgba(255,95,109,0.12)' },
}

export const STATUS_META = {
  todo:        { label: 'To Do',       color: '#9898b0', bg: 'rgba(152,152,176,0.12)' },
  in_progress: { label: 'In Progress', color: '#7c6af7', bg: 'rgba(124,106,247,0.12)' },
  in_review:   { label: 'In Review',   color: '#f5c542', bg: 'rgba(245,197,66,0.12)' },
  done:        { label: 'Done',        color: '#22d47c', bg: 'rgba(34,212,124,0.12)' },
}

export const initials = (name = '') =>
  name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

export const cn = (...classes) => classes.filter(Boolean).join(' ')
