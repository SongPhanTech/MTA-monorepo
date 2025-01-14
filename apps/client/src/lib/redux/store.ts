import { createStore } from 'easy-peasy'
import { StoreModel } from './models'
import { appState, dialog, imageViewer } from './stores'

const model: StoreModel = {
    appState,
    dialog,
    imageViewer,
}

const store = createStore<StoreModel>(model)

export default store
