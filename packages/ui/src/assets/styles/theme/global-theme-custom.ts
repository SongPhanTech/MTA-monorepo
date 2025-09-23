declare global {
    interface Number {
        toFixedSmart(fractionDigits: number): string
    }
}

Number.prototype.toFixedSmart = function (fractionDigits: number): string {
    const fixed = this.toFixed(fractionDigits)
    return fixed.includes('.') ? fixed.replace(/\.?0+$/, '') : fixed
}
const lightThemeCustom = {
    token: {
        colorPrimary: '#028850',
        fontFamily: '"Noto Serif", serif',
    },
    components: {
        Table: {
            headerBg: '#E8E8E8',
            padding: 10,
            headerColor: '#26273D',
            headerBorderRadius: 8,
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

export { lightThemeCustom }
