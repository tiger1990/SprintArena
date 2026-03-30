import { cn } from '@/lib/utils'

export function PointsBadge({ points, className }: { points: number; className?: string }) {
  return (
    <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30', className)}>
      ● {points} pts
    </span>
  )
}
