'use client'
import { getInitials } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { User } from '@/types'

interface AvatarProps {
  user: User
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  showTooltip?: boolean
}

const SIZE_CLASSES = {
  xs: 'w-5 h-5 text-[10px]',
  sm: 'w-7 h-7 text-xs',
  md: 'w-9 h-9 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-24 h-24 text-2xl',
}

export function Avatar({ user, size = 'md', className }: AvatarProps) {
  if (user.photoUrl) {
    return (
      <img
        src={user.photoUrl}
        alt={user.name}
        className={cn('rounded-full object-cover ring-2 ring-slate-700', SIZE_CLASSES[size], className)}
      />
    )
  }
  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-semibold ring-2 ring-slate-700 flex-shrink-0',
        SIZE_CLASSES[size],
        className
      )}
      style={{ backgroundColor: user.color, color: '#fff' }}
      title={user.name}
    >
      {getInitials(user.name)}
    </div>
  )
}
