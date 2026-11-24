import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import type { ComponentProps } from 'react'
import { cn } from '@/components/utils'

const buttonVariants = cva(
  'inline-flex min-h-11 items-center justify-center rounded-md px-4 py-2 text-base font-bold transition-colors disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground',
      },
    },
    defaultVariants: { variant: 'default' },
  },
)

type ButtonProps = ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }

export function Button({
  asChild = false,
  className,
  variant,
  type,
  ...props
}: ButtonProps) {
  const Component = asChild ? Slot : 'button'

  return (
    <Component
      data-slot="button"
      className={cn(buttonVariants({ variant }), className)}
      type={asChild ? type : (type ?? 'button')}
      {...props}
    />
  )
}
