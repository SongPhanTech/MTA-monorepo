import type { Action } from "easy-peasy"

interface ImageViewer {
  images: string[]
  currentImage?: string
  setImages: Action<
    ImageViewer,
    {
      images: string[]
      currentImage?: string
    }
  >
  clearImages: Action<ImageViewer>
}

export type { ImageViewer }
