import type { AppState } from "@redux/models"
import { action } from "easy-peasy"

const appState: AppState = {
  clearAppState: action((state) => {
    state.isUpdateAbility = false
    state.isShowSpinner = false
    state.isShowSidebar = true
  }),
  isUpdateAbility: false,
  setIsUpdateAbility: action((state, payload) => {
    state.isUpdateAbility = payload
  }),
  isShowSpinner: false,
  setIsShowSpinner: action((state, payload) => {
    state.isShowSpinner = payload
  }),
  isShowSidebar: true,
  setIsShowSidebar: action((state, payload) => {
    state.isShowSidebar = payload
  }),
}

export { appState }
