import { useStoreActions, useStoreState } from "@redux/hook"

const useSpinner = () => {
  const [isShow, setLoading] = [
    useStoreState((state) => state.appState.isShowSpinner),
    useStoreActions((actions) => actions.appState.setIsShowSpinner),
  ]

  const showSpinner = () => setLoading(true)

  const hideSpinner = () => setLoading(false)

  return { isShow, showSpinner, hideSpinner }
}

export default useSpinner
