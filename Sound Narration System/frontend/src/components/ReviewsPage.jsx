import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Loader2, Star } from 'lucide-react'
import { getReviewSummary, getReviews, submitReview } from '../services/api'
import logo from '../assets/logo.png'

/** One star: empty outline + orange fill clipped so `fill` in [0,1] fills from the left. */
function FractionalStar({ fill, size = 'md', variant = 'hero' }) {
  const dim = size === 'lg' ? 'h-8 w-8 shrink-0' : 'h-5 w-5 shrink-0'
  const f = Math.min(1, Math.max(0, Number(fill) || 0))
  const strokeW = variant === 'card' ? 1.5 : 2
  const emptyStroke =
    variant === 'card' ? 'text-stone-300 stroke-stone-300' : 'text-stone-300 stroke-stone-300'
  const fillCls =
    variant === 'card'
      ? 'text-[#F97316] fill-[#F97316] stroke-[#F97316]'
      : 'text-orange-500 fill-orange-500 stroke-orange-500'

  return (
    <span className={`relative inline-block ${dim}`} aria-hidden>
      <Star
        className={`pointer-events-none absolute left-0 top-0 ${dim} fill-transparent ${emptyStroke}`}
        strokeWidth={strokeW}
      />
      <span
        className="pointer-events-none absolute bottom-0 left-0 top-0 overflow-hidden"
        style={{ width: `${f * 100}%` }}
      >
        <Star
          className={`block ${dim} ${fillCls}`}
          strokeWidth={variant === 'card' && f >= 1 ? 0 : strokeW}
        />
      </span>
    </span>
  )
}

function StarRow({ value, max = 5, size = 'md', variant = 'hero' }) {
  const v = Math.max(0, Math.min(max, Number(value) || 0))
  const label =
    variant === 'hero'
      ? `${v.toFixed(1)} out of ${max} stars average`
      : `${Math.round(v)} out of ${max} stars`
  return (
    <div className="flex items-center gap-0.5" role="img" aria-label={label}>
      {Array.from({ length: max }).map((_, i) => {
        const fillFrac = Math.min(1, Math.max(0, v - i))
        return <FractionalStar key={i} fill={fillFrac} size={size} variant={variant} />
      })}
    </div>
  )
}

export default function ReviewsPage({
  onBack,
  defaultSessionType = 'kiosk',
  title = 'Visitor reviews',
}) {
  const [summary, setSummary] = useState({ avgRating: 0, totalReviews: 0 })
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const [s, r] = await Promise.all([getReviewSummary(), getReviews(40)])
      setSummary({
        avgRating: s.avgRating ?? 0,
        totalReviews: s.totalReviews ?? 0,
      })
      setReviews(r.reviews || [])
    } catch {
      setError('Could not load reviews. Check that MongoDB is running and the backend is configured.')
      setSummary({ avgRating: 0, totalReviews: 0 })
      setReviews([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const avgDisplay = useMemo(() => {
    const n = Number(summary.avgRating)
    if (!Number.isFinite(n) || summary.totalReviews === 0) return '—'
    return n.toFixed(1)
  }, [summary.avgRating, summary.totalReviews])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setNotice(null)
    setError(null)
    const nameTrim = name.trim()
    const ageNum = parseInt(age, 10)
    if (!nameTrim) {
      setError('Please enter your name.')
      setSubmitting(false)
      return
    }
    if (!Number.isFinite(ageNum) || ageNum < 1 || ageNum > 120) {
      setError('Please enter a valid age (1–120).')
      setSubmitting(false)
      return
    }

    try {
      await submitReview({
        rating,
        name: nameTrim,
        age: ageNum,
        comment: comment.trim() || undefined,
        session_type: defaultSessionType,
      })
      setComment('')
      setNotice('Thanks — your review was saved.')
      await load()
    } catch {
      setError('Could not submit review. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col text-stone-900">
      <header className="border-b border-stone-200 bg-white/95 backdrop-blur py-3 px-4 md:px-6 shadow-sm sticky top-0 z-30">
        <div className="w-full max-w-[1780px] mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-14 h-14 rounded-xl border border-stone-200 bg-white flex items-center justify-center overflow-hidden shadow-sm flex-shrink-0">
              <img src={logo} alt="Museum logo" className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl md:text-2xl font-bold text-stone-800 leading-tight truncate">
                {title}
              </h1>
              <p className="text-xs md:text-sm text-stone-500">Rate your kiosk experience</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onBack}
            className="bg-white hover:bg-orange-500 border-2 border-orange-500 text-orange-500 hover:text-white px-4 py-2.5 rounded-xl flex items-center gap-2 transition-colors font-semibold flex-shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        </div>
      </header>

      <main className="flex-1 w-full max-w-[1780px] mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6">
        <section className="bg-[#292524] rounded-3xl p-6 md:p-8 text-white shadow-2xl">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] text-white/70 mb-2 font-sans">
                Overall rating
              </p>
              <div className="flex items-end gap-4 flex-wrap">
                <p className="text-5xl md:text-6xl font-extrabold text-orange-300 leading-none">
                  {loading ? '…' : avgDisplay}
                </p>
                <div>
                  <StarRow value={summary.avgRating} max={5} size="lg" />
                  <p className="text-sm text-white/75 mt-2">
                    Based on {loading ? '…' : summary.totalReviews} review
                    {summary.totalReviews === 1 ? '' : 's'}
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl bg-white/10 border border-white/20 px-5 py-4 max-w-md">
              <p className="text-sm text-white/85">
                Share your name, age, star rating, and an optional comment. We do not store your
                question text.
              </p>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 xl:gap-6">
          <section className="xl:col-span-5 bg-white border border-stone-200 rounded-3xl shadow-xl p-5 md:p-7">
            <h2 className="text-2xl font-semibold text-stone-900 tracking-tight mb-4">Add your review</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="review-name" className="text-sm font-medium text-stone-700">
                    Name
                  </label>
                  <input
                    id="review-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                    placeholder="Your name"
                    className="mt-2 w-full px-4 py-3 border-2 border-stone-300 rounded-2xl focus:ring-2 focus:ring-orange-500/60 focus:border-orange-500 outline-none transition-all text-stone-700 placeholder-stone-400"
                    disabled={submitting}
                    maxLength={120}
                  />
                </div>
                <div>
                  <label htmlFor="review-age" className="text-sm font-medium text-stone-700">
                    Age
                  </label>
                  <input
                    id="review-age"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={120}
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="e.g. 12"
                    className="mt-2 w-full px-4 py-3 border-2 border-stone-300 rounded-2xl focus:ring-2 focus:ring-orange-500/60 focus:border-orange-500 outline-none transition-all text-stone-700 placeholder-stone-400"
                    disabled={submitting}
                  />
                </div>
              </div>

              <div className="font-sans">
                <p className="text-sm font-medium text-stone-800 mb-3">Your rating</p>
                <div
                  className="grid grid-cols-5 gap-2 sm:gap-3"
                  role="radiogroup"
                  aria-label="Rating from 1 to 5 stars"
                >
                  {[1, 2, 3, 4, 5].map((n) => {
                    const selected = rating === n
                    return (
                      <button
                        key={n}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        aria-label={`${n} out of 5 stars`}
                        onClick={() => setRating(n)}
                        disabled={submitting}
                        className={`flex min-h-[3.25rem] sm:min-h-14 items-center justify-center gap-1 rounded-xl border text-base font-semibold transition-all duration-150 active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none ${
                          selected
                            ? 'border-[#F97316] bg-[#F97316] text-white shadow-md shadow-orange-500/30'
                            : 'border-stone-300 bg-white text-stone-900 hover:border-stone-400 hover:bg-stone-50/80'
                        }`}
                      >
                        <span className="tabular-nums">{n}</span>
                        <Star
                          className={`h-[1.05rem] w-[1.05rem] sm:h-5 sm:w-5 shrink-0 ${
                            selected
                              ? 'fill-white text-white stroke-white'
                              : 'fill-stone-800 text-stone-800 stroke-stone-800'
                          }`}
                          strokeWidth={selected ? 0 : 1.25}
                        />
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <label htmlFor="review-comment" className="text-sm font-medium text-stone-700">
                  Comment <span className="text-stone-400 font-normal">(optional)</span>
                </label>
                <textarea
                  id="review-comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={4}
                  placeholder="What worked well? What could be clearer?"
                  className="mt-2 w-full px-4 py-3 border-2 border-stone-300 rounded-2xl focus:ring-2 focus:ring-orange-500/60 focus:border-orange-500 outline-none transition-all resize-none text-stone-700 placeholder-stone-400"
                  disabled={submitting}
                />
              </div>

              {notice && (
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 text-sm">
                  {notice}
                </div>
              )}
              {error && (
                <div className="rounded-xl bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-orange-900/20"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Submitting…
                  </>
                ) : (
                  <>Submit review</>
                )}
              </button>
            </form>
          </section>

          <section className="xl:col-span-7 bg-white border border-stone-200 rounded-3xl shadow-xl p-6 md:p-8 min-h-[320px]">
            <div className="flex items-center justify-between gap-3 mb-6">
              <h2 className="text-2xl font-semibold text-stone-900 tracking-tight">Recent feedback</h2>
              <button
                type="button"
                onClick={load}
                className="text-sm font-semibold text-[#EA580C] hover:text-orange-700 font-sans"
              >
                Refresh
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16 text-stone-500 gap-2 font-sans">
                <Loader2 className="w-5 h-5 animate-spin" />
                Loading…
              </div>
            ) : reviews.length === 0 ? (
              <p className="text-stone-500 py-10 text-center font-sans">
                No reviews yet — be the first to leave feedback.
              </p>
            ) : (
              <ul className="font-sans divide-y divide-stone-200 border border-stone-200 rounded-2xl overflow-hidden max-h-[min(65vh,560px)] overflow-y-auto">
                {reviews.map((r) => {
                  const displayName = r.name != null && String(r.name).trim() !== '' ? r.name : 'Visitor'
                  const hasAge = r.age != null && r.age !== ''
                  const ts = r.created_at
                    ? new Date(r.created_at).toLocaleString(undefined, {
                        dateStyle: 'short',
                        timeStyle: 'medium',
                      })
                    : ''
                  return (
                    <li key={r.id} className="bg-white px-4 sm:px-5 py-4 first:pt-4">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <p className="text-base font-bold text-stone-900 leading-snug">
                          {displayName}
                          {hasAge ? (
                            <span className="font-normal text-stone-500"> - age {r.age}</span>
                          ) : null}
                        </p>
                        {ts ? (
                          <time
                            dateTime={r.created_at}
                            className="text-xs text-stone-400 whitespace-nowrap shrink-0 pt-0.5"
                          >
                            {ts}
                          </time>
                        ) : null}
                      </div>
                      <div className="mb-3">
                        <StarRow value={r.rating} variant="card" />
                      </div>
                      {r.comment ? (
                        <p className="text-stone-800 text-base leading-relaxed whitespace-pre-wrap break-words">
                          {r.comment}
                        </p>
                      ) : (
                        <p className="text-stone-400 text-sm italic">No comment</p>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        </div>
      </main>
    </div>
  )
}
