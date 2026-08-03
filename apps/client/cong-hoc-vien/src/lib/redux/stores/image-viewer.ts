import type { ImageViewer } from "@redux/models"
import { action } from "easy-peasy"

const imageViewer: ImageViewer = {
  images: [],
  setImages: action((state, payload) => {
    state.images = payload.images
    state.currentImage = payload.currentImage
  }),
  clearImages: action((state) => {
    state.images = []
  }),
}

export { imageViewer }
