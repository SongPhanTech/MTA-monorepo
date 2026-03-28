import type { AppState } from "./app-state"
import type { ImageViewer } from "./image-viewer"

interface StoreModel {
  appState: AppState
  imageViewer: ImageViewer
}

export type { StoreModel, AppState, ImageViewer }
