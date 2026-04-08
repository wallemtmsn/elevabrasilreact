import { getInitials } from '@/utils/formatters'

interface AvatarProps {
  nome: string
  fotoUrl?: string | null
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-base',
  xl: 'w-20 h-20 text-xl',
}

export function Avatar({ nome, fotoUrl, size = 'md', className = '' }: AvatarProps) {
  if (fotoUrl) {
    return (
      <img
        src={fotoUrl}
        alt={nome}
        className={`${sizeClasses[size]} rounded-full object-cover flex-shrink-0 ${className}`}
      />
    )
  }

  return (
    <div
      className={`${sizeClasses[size]} rounded-full bg-navy-500 text-white flex items-center justify-center font-semibold flex-shrink-0 ${className}`}
      aria-label={nome}
    >
      {getInitials(nome)}
    </div>
  )
}
