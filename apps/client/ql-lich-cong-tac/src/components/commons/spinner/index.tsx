import useSpinner from "@hooks/spinner"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

const loaderVariants = cva("animate-spin text-primary", {
  variants: {
    size: {
      small: "size-6",
      medium: "size-8",
      large: "size-12",
    },
    show: {
      true: "absolute z-50 top-1/2 left-1/2",
      false: "hidden",
    },
  },
  defaultVariants: {
    size: "medium",
  },
})

interface SpinnerContentProps extends VariantProps<typeof loaderVariants> {
  className?: string
  children?: React.ReactNode
}

export function Spinner({ size, className }: SpinnerContentProps) {
  const { isShow } = useSpinner()
  if (!isShow) return null
  return (
    <div
      className="fixed top-0 left-0 right-0 w-full h-full backdrop-blur-sm justify-center flex items-center"
      style={{
        zIndex: 9998,
      }}
    >
      <Loader2 className={cn(loaderVariants({ size, show: isShow }), className)} />
    </div>
  )
}
