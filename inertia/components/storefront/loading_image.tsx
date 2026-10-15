import { type ComponentProps, useCallback, useState } from 'react'
import { cn } from '~/lib/styles'

/**
 * An `<img>` that pulses as a skeleton until the photo has loaded (or
 * failed). Images already loaded before hydration stop pulsing on mount.
 */
export default function LoadingImage({
  className,
  onLoad,
  onError,
  ...props
}: ComponentProps<'img'>) {
  const [loaded, setLoaded] = useState(false)
  const ref = useCallback((node: HTMLImageElement | null) => {
    if (node?.complete) setLoaded(true)
  }, [])

  return (
    <img
      {...props}
      ref={ref}
      onLoad={(event) => {
        setLoaded(true)
        onLoad?.(event)
      }}
      onError={(event) => {
        setLoaded(true)
        onError?.(event)
      }}
      className={cn(className, !loaded && 'bg-sf-line motion-safe:animate-pulse')}
    />
  )
}
