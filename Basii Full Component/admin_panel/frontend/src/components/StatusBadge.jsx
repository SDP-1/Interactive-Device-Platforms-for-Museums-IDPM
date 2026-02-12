const STATUS_STYLES = {
  draft:          'bg-gray-100 text-gray-700',
  ai_generated:   'bg-purple-100 text-purple-700',
  pending_review: 'bg-yellow-100 text-yellow-800',
  approved:       'bg-green-100 text-green-700',
  rejected:       'bg-red-100 text-red-700',
  published:      'bg-blue-100 text-blue-700',
}

export default function StatusBadge({ status }) {
  const cls = STATUS_STYLES[status] ?? 'bg-gray-100 text-gray-700'
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {status?.replace(/_/g, ' ')}
    </span>
  )
}
