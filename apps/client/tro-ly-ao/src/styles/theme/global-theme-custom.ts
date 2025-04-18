import { Button } from 'antd'

const lightThemeCustom = {
    token: {
        colorPrimary: '#005f37',
    },
    components: {
        Table: {
            headerBg: '#005f37',
            padding: 10,
            headerColor: '#fff',
            headerBorderRadius: 5,
        },
        Menu: {
            itemSelectedColor: '#fff',
            itemSelectedBg: '#005f37',
            subMenuItemSelectedColor: '#005f37',
        },
        Button: {
            primaryShadow: '0',
        },
    },
}

export default lightThemeCustom
