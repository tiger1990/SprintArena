import { PRIORITY_COLORS, PRIORITY_LABELS } from '@/types'
import type { Priority } from '@/types'
import { cn } from '@/lib/utils'

export function PriorityBadge({ priority, className }: { priority: Priority; className?: string }) {
  return (
    <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide', PRIORITY_COLORS[priority], className)}>
      {PRIORITY_LABELS[priority]}
    </span>
  )
}
