import * as React from 'react'
import { IMaskInput } from 'react-imask'
import { cn } from '@/lib/utils'

interface NumberInputProps extends Omit<React.ComponentProps<'input'>, 'onChange' | 'value'> {
  value: string
  onChange: (value: string) => void
  thousandsSeparator?: string
}

function NumberInput({
  className,
  value,
  onChange,
  thousandsSeparator = '.',
  ...props
}: NumberInputProps) {
  const handleAccept = (unmaskedValue: string | number) => {
    // Lưu giá trị số thuần (không có dấu phân cách) dưới dạng string
    const stringValue = typeof unmaskedValue === 'number' ? String(unmaskedValue) : unmaskedValue
    onChange(stringValue || '')
  }

  // Chuyển đổi giá trị string thành số để format
  const numericValue = React.useMemo(() => {
    if (!value || value === '') return undefined
    const num = parseInt(value.replace(/\./g, '').replace(/,/g, ''), 10)
    return isNaN(num) ? undefined : num
  }, [value])

  // Tách min/max từ props để xử lý riêng
  const { min, max, ...restProps } = props

  return (
    <IMaskInput
      mask={Number}
      radix="."
      thousandsSeparator={thousandsSeparator}
      mapToRadix={['.']}
      value={numericValue === undefined ? '' : String(numericValue)}
      onAccept={handleAccept}
      unmask={true}
      min={typeof min === 'number' ? min : typeof min === 'string' ? Number(min) : 0}
      max={typeof max === 'number' ? max : typeof max === 'string' ? Number(max) : undefined}
      data-slot="input"
      className={cn(
        'file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
        'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
        className
      )}
      {...restProps}
    />
  )
}

export { NumberInput }

