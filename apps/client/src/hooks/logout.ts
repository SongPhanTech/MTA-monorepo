import ROUTER_PATH from '@constants/page-path'
import ability from '@lib/casl/ability'
import store from '@redux/store'

const useLogout = () => {
    const logout = () => {
        ability.update([])
        localStorage.clear()
        store.dispatch.appState.clearAppState()
        if (window) window.location.href = ROUTER_PATH.AUTH_LOGIN
    }

    return { logout }
}

export default useLogout
