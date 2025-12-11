"use client"

import type { ImagePart as ImagePartType } from "@/lib/types"
import Image from "next/image"

interface ImagePartProps {
  part: ImagePartType
}

export function ImagePart({ part }: ImagePartProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="relative aspect-video w-full">
        <Image src={part.url || "/placeholder.svg"} alt={part.altText} fill className="object-cover" />
      </div>
      {part.caption && (
        <div className="border-t border-border bg-muted/30 px-3 py-2">
          <p className="text-xs text-muted-foreground">{part.caption}</p>
        </div>
      )}
    </div>
  )
}
