import type { ThemeConfig } from "antd"

const lightThemeCustom = {
  token: {
    colorPrimary: "#028850",
    fontFamily: '"Noto Serif", serif',
    fontSize: 12,
  },
  components: {
    Table: {
      headerBg: "#E8E8E8",
      padding: 10,
      headerColor: "#26273D",
      headerBorderRadius: 8,
      // rowSelectedBg: '#FFFFFF',
      rowHoverBg: "#FAFAFA",
      rowSelectedHoverBg: "#02885022",
    },
    Menu: {
      itemSelectedColor: "#fff",
      itemSelectedBg: "#028850",
      subMenuItemSelectedColor: "#028850",
      itemHoverColor: "#028850",
    },
    Layout: {
      bodyBg: "#F3F6FB",
      headerPadding: "0 20px",
    },
  },
} satisfies ThemeConfig

export { lightThemeCustom }
