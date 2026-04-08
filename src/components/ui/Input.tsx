import { InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helpText?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helpText,
  className = '',
  id,
  ...props
}, ref) => {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="lbl">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        className={[
          'inp',
          error ? 'border-brand-red focus:ring-brand-red' : '',
          className,
        ].join(' ')}
        {...props}
      />
      {error && <p className="text-xs text-brand-red">{error}</p>}
      {helpText && !error && <p className="text-xs text-steel-500">{helpText}</p>}
    </div>
  )
})

Input.displayName = 'Input'
