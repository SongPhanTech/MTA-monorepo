import { createStore } from "easy-peasy"
import type { StoreModel } from "./models"
import { appState, imageViewer } from "./stores"

const model: StoreModel = {
  appState,
  imageViewer,
}

const store = createStore<StoreModel>(model)

export default store
