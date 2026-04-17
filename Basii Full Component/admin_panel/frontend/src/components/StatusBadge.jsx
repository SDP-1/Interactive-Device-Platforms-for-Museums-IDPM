const STATUS_STYLES = {
  draft:          { bg: 'bg-slate-100/80', text: 'text-slate-600', dot: 'bg-slate-400' },
  ai_generated:   { bg: 'bg-purple-100/80', text: 'text-purple-700', dot: 'bg-purple-500' },
  pending_review: { bg: 'bg-amber-100/80', text: 'text-amber-700', dot: 'bg-amber-500 animate-pulse' },
  approved:       { bg: 'bg-emerald-100/80', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  rejected:       { bg: 'bg-rose-100/80', text: 'text-rose-700', dot: 'bg-rose-500' },
  published:      { bg: 'bg-indigo-100/80', text: 'text-indigo-700', dot: 'bg-indigo-500' },
  regenerating:   { bg: 'bg-sky-100/80', text: 'text-sky-700', dot: 'bg-sky-500 animate-bounce' },
}

const STATUS_LABELS = {
  regenerating: 'Regenerating',
}

export default function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] ?? { bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400' }
  const label = STATUS_LABELS[status] ?? status?.replace(/_/g, ' ')
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider backdrop-blur-sm border border-white/50 shadow-sm ${style.bg} ${style.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`}></span>
      {label}
    </span>
  )
}
