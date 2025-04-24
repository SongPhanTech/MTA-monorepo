import { Header } from 'antd/es/layout/layout'

const lightThemeCustom = {
    token: {
        colorPrimary: '#028850',
    },
    components: {
        Table: {
            headerBg: '#028850',
            padding: 10,
            headerColor: '#fff',
            headerBorderRadius: 5,
        },
        Menu: {
            itemSelectedColor: '#fff',
            itemSelectedBg: '#028850',
            subMenuItemSelectedColor: '#028850',
        },
        Layout: {
            bodyBg: '#F3F6FB',
            headerPadding: '0 20px',
        },
    },
}

export default lightThemeCustom
