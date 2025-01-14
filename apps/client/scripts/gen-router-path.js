const { glob } = require('glob')
const fs = require('fs')

const routerPath = {}

const ignorePages = ['_app', '_document', '_error']
fs.existsSync('generated') || fs.mkdirSync('generated')
glob('./src/pages/**/*.tsx', {
    posix: true,
    dotRelative: true,
}).then((files) => {
    console.log(`Processing: ${files}`)
    files.forEach((file) => {
        file = file.toLowerCase()
        const path = file
            .replace('./src/pages/', '')
            .replace('src/pages/', '')
            .replace('src\\pages\\', '')
            .replace('.tsx', '')
        const key = path
            .split('/')
            .join('_')
            .split('\\')
            .join('_')
            .split('-')
            .join('_')
            .toUpperCase()
        if (!ignorePages.includes(key.toLowerCase())) {
            const keyOfRouter = key
                .replace('_INDEX', '')
                .split('[')
                .join('')
                .split(']')
                .join('')

            routerPath[keyOfRouter] = `/${path
                .replace('/index', '')
                .replace('index', '')
                .split('\\')
                .filter((e) => !!e)
                .join('/')}`
            console.log(
                `Generated: ${keyOfRouter} -> ${routerPath[keyOfRouter]}`
            )
        }
    })

    fs.writeFileSync(
        './generated/router.json',
        `${JSON.stringify(routerPath, null, 2)}`
    )
})
