"use client"

import * as React from "react"
import Image, { type ImageProps } from "next/image"

import { cn } from "@/lib/utils"

type AvatarStatus = "idle" | "loading" | "loaded" | "error"

interface AvatarContextValue {
  status: AvatarStatus
  setStatus: (status: AvatarStatus) => void
}

const AvatarContext = React.createContext<AvatarContextValue | null>(null)

function useAvatarContext(component: string) {
  const context = React.useContext(AvatarContext)
  if (!context) {
    throw new Error(`${component} must be used within an Avatar`)
  }
  return context
}

const Avatar = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, children, ...props }, ref) => {
    const [status, setStatus] = React.useState<AvatarStatus>("idle")
    const contextValue = React.useMemo(() => ({ status, setStatus }), [status])

    return (
      <AvatarContext.Provider value={contextValue}>
        <div
          ref={ref}
          data-slot="avatar"
          className={cn(
            "relative flex size-8 shrink-0 overflow-hidden rounded-full",
            className,
          )}
          {...props}
        >
          {children}
        </div>
      </AvatarContext.Provider>
    )
  },
)
Avatar.displayName = "Avatar"

type AvatarImageProps = Omit<ImageProps, "src" | "alt" | "fill"> & {
  src?: ImageProps["src"] | null
  alt?: string
}

const AvatarImage = React.forwardRef<HTMLImageElement, AvatarImageProps>(
  ({ className, src, alt, onLoad, onError, sizes, ...props }, ref) => {
    const { setStatus } = useAvatarContext("AvatarImage")

    React.useEffect(() => {
      if (!src) {
        setStatus("error")
      } else {
        setStatus("loading")
      }
    }, [src, setStatus])

    if (!src) {
      return null
    }

    const handleLoad = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
      setStatus("loaded")
      onLoad?.(event)
    }

    const handleError = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
      setStatus("error")
      onError?.(event)
    }

    return (
      <Image
        ref={ref}
        fill
        data-slot="avatar-image"
        className={cn("absolute inset-0 size-full object-cover", className)}
        src={src}
        alt={alt ?? ""}
        sizes={sizes ?? "100%"}
        onLoad={handleLoad}
        onError={handleError}
        {...props}
      />
    )
  },
)
AvatarImage.displayName = "AvatarImage"

interface AvatarFallbackProps extends React.ComponentProps<"span"> {
  delayMs?: number
}

const AvatarFallback = React.forwardRef<HTMLSpanElement, AvatarFallbackProps>(
  ({ className, delayMs, children, ...props }, ref) => {
    const { status } = useAvatarContext("AvatarFallback")
    const [canRender, setCanRender] = React.useState(delayMs === undefined)

    React.useEffect(() => {
      if (delayMs === undefined) return
      const timer = window.setTimeout(() => setCanRender(true), delayMs)
      return () => window.clearTimeout(timer)
    }, [delayMs])

    if (!canRender || status === "loaded") {
      return null
    }

    return (
      <span
        ref={ref}
        data-slot="avatar-fallback"
        className={cn(
          "bg-muted flex size-full items-center justify-center rounded-full",
          className,
        )}
        suppressHydrationWarning
        {...props}
      >
        {children}
      </span>
    )
  },
)
AvatarFallback.displayName = "AvatarFallback"

export { Avatar, AvatarImage, AvatarFallback }
