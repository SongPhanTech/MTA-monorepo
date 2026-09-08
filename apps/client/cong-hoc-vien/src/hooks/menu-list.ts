import NAVIGATION from "@workspace/router"

const useMenuList = () => {
  return NAVIGATION.CONG_HOC_VIEN.menus.filter((menu) => !menu.hidden)
}

export { useMenuList }
