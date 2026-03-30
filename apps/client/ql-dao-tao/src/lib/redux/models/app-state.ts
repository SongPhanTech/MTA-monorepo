import type { Action } from "easy-peasy"

interface AppState {
  clearAppState: Action<AppState>
  isUpdateAbility: boolean
  setIsUpdateAbility: Action<AppState, boolean>
  isShowSpinner: boolean
  setIsShowSpinner: Action<AppState, boolean>
  isShowSidebar: boolean
  setIsShowSidebar: Action<AppState, boolean>
}

export type { AppState }
