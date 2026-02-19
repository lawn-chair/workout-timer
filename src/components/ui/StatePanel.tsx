import type { ReactNode } from 'react'
import IconMark from '@/components/ui/IconMark'

interface StatePanelProps {
  eyebrow?: string
  title: string
  description?: string
  action?: ReactNode
  tone?: 'default' | 'error'
}

export default function StatePanel({
  eyebrow,
  title,
  description,
  action,
  tone = 'default',
}: StatePanelProps) {
  const toneStyles =
    tone === 'error' ? 'border border-red-500/30 bg-red-500/5' : 'glass-panel'

  const iconStyles =
    tone === 'error'
      ? 'bg-red-500/15 text-red-200'
      : 'bg-lime-400/20 text-lime-300'

  return (
    <div className={`rounded-3xl px-8 py-10 text-center ${toneStyles}`}>
      <div
        className={`mx-auto h-16 w-16 rounded-2xl flex items-center justify-center mb-6 ${iconStyles}`}
      >
        <IconMark className="h-8 w-8" />
      </div>
      {eyebrow && (
        <p className="text-xs uppercase tracking-[0.4em] text-white/70">
          {eyebrow}
        </p>
      )}
      <h2 className="display-font text-3xl mt-3">{title}</h2>
      {description && (
        <p className="text-sm text-gray-400 mt-3">{description}</p>
      )}
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  )
}
