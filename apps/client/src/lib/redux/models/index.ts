import { AppState } from './app-state'
import { ModalTag } from './modal'
import { ImageViewer } from './image-viewer'

interface StoreModel {
    appState: AppState
    dialog: ModalTag
    imageViewer: ImageViewer
}

export type { StoreModel, AppState, ModalTag, ImageViewer }
