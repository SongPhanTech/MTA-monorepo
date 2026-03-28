import { createStore } from "easy-peasy"
import type { StoreModel } from "./models"
import { appState, imageViewer } from "./stores"

const model: StoreModel = {
  appState,
  imageViewer,
}

const store = createStore<StoreModel>(model, {
  name: "tro-ly-ao-store",
  version: 1,
})

export default store
