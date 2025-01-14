const fs = require('fs')
const { join } = require('path')
const { glob } = require('glob')

const assets = {}
fs.existsSync('generated') || fs.mkdirSync('generated')
const pathPublic = join(process.cwd(), 'public', 'assets', '**', '*.*')
glob(pathPublic, {
    posix: true,
    dotRelative: true,
}).then((files) => {
    files.forEach((file) => {
        file = file.split('public/assets/').pop()
        const [name] = file.split('.')
        assets[
            name
                .split('/')
                .join('_')
                .split(' ')
                .join('_')
                .split('-')
                .join('_')
                .toUpperCase()
        ] = `/assets/${file}`
    })

    console.log('Generated: assets.json')

    fs.writeFileSync(
        'generated/assets.json',
        `${JSON.stringify(assets, null, 2)}`
    )
})
