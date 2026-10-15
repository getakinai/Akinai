import { useEffect, useRef, useState } from 'react'

/**
 * Object URL preview for a picked file. The previous URL is revoked when a
 * new file is picked, cleared, or the component unmounts.
 */
export function useFilePreview() {
  const [preview, setPreview] = useState<{ file: File; url: string } | null>(null)
  const current = useRef<string | null>(null)

  useEffect(
    () => () => {
      if (current.current) URL.revokeObjectURL(current.current)
    },
    []
  )

  function set(file: File | null) {
    if (current.current) URL.revokeObjectURL(current.current)
    const url = file ? URL.createObjectURL(file) : null
    current.current = url
    setPreview(file && url ? { file, url } : null)
  }

  return [preview, set] as const
}
