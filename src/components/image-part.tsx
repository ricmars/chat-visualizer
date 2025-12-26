import type { ImagePart as ImagePartType } from "@/lib/types"
import styled from "styled-components"

interface ImagePartProps {
  part: ImagePartType
}

const Container = styled.div`
  overflow: hidden;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  background: #fff;
`

const ImageWrapper = styled.div`
  position: relative;
  aspect-ratio: 16 / 9;
  width: 100%;
`

const Caption = styled.div`
  border-top: 1px solid #e5e7eb;
  background: rgba(0, 0, 0, 0.02);
  padding: 8px 12px;
`

const CaptionText = styled.p`
  font-size: 12px;
  color: #6b7280;
  margin: 0;
`

export function ImagePart({ part }: ImagePartProps) {
  return (
    <Container>
      <ImageWrapper>
        <img src={part.url || "/placeholder.svg"} alt={part.altText} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </ImageWrapper>
      {part.caption && (
        <Caption>
          <CaptionText>{part.caption}</CaptionText>
        </Caption>
      )}
    </Container>
  )
}
