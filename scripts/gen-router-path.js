const { glob } = require('glob')
const fs = require('node:fs')
const path = require('node:path')

const routerPath = {}
const ignorePages = ['_app', '_document', '404']

const cleanPath = (path = '') => {
    return path
        .replaceAll('/', ' ')
        .replaceAll('\\', ' ')
        .trim()
        .replaceAll(' ', '_')
        .replaceAll('[', '')
        .replaceAll(']', '')
        .replace('.tsx', '')
        .replace('_index', '')
        .toUpperCase()
}

const cleanRouter = (router = '') => {
    const r = router.replace('/index.tsx', '')
    return r === '' ? '/' : r
}

const basePath = path.join('apps', 'client')
glob(path.join(basePath, '*'), {}).then(async (subsystems) => {
    for (const subsystem of subsystems) {
        const subsystemKey = subsystem
            .replace(`${basePath}/`, '')
            .toUpperCase()
            .replaceAll('-', '_')
        routerPath[subsystemKey] = {}
        const pages = await glob(
            path.join(subsystem, 'src', 'pages', '**', '*.tsx'),
            {}
        )

        for (const page of pages) {
            if (ignorePages.some((ignorePage) => page.includes(ignorePage)))
                continue
            const key = page.replace(path.join(subsystem, 'src', 'pages'), '')
            routerPath[subsystemKey][cleanPath(key)] = cleanRouter(key)
            console.log(
                'Processing:',
                subsystemKey,
                cleanPath(key),
                '=>',
                cleanRouter(key)
            )
        }
    }

    const generatedPath = path.join(
        process.cwd(),
        'packages',
        'router',
        'generated'
    )

    fs.existsSync(generatedPath) || fs.mkdirSync(generatedPath)
    fs.writeFileSync(
        path.join(generatedPath, 'router.json'),
        `${JSON.stringify(routerPath, null, 2)}`
    )
})
