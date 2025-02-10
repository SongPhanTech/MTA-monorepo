import type { AppState } from './app-state'
import type { ModalTag } from './modal'
import type { ImageViewer } from './image-viewer'

interface StoreModel {
    appState: AppState
    dialog: ModalTag
    imageViewer: ImageViewer
}

export type { StoreModel, AppState, ModalTag, ImageViewer }
