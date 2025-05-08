import { existsSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { glob } from 'glob'

const routerPath = {}
const ignorePages = ['_app', '_document', '404']

const cleanPath = (path = '') => {
    return path
        .replaceAll('/', ' ')
        .replaceAll('\\', ' ')
        .trim()
        .replaceAll(' ', '_')
        .replaceAll('-', '_')
        .replaceAll('[', '')
        .replaceAll(']', '')
        .replace('.tsx', '')
        .replace('_index', '')
        .toUpperCase()
}

const cleanRouter = (router = '') => {
    const r = router.replace('/index.tsx', '').replace('.tsx', '')
    return r === '' ? '/' : r
}

const basePath = join(process.cwd(), '..', '..', 'apps', 'client')
console.log('basePath:', basePath)

const subsystems = await glob(`${basePath}/*`, {
    dotRelative: true,
    posix: true,
})

for (const subsystem of subsystems.sort()) {
    const subsystemKey = subsystem
        .replace(`${basePath}/`, '')
        .toUpperCase()
        .replaceAll('-', '_')
    routerPath[subsystemKey] = {}
    const pages = await glob(`${subsystem}/src/pages/**/*.tsx`, {
        dotRelative: true,
        posix: true,
    })

    for (const page of pages.sort()) {
        if (ignorePages.some((ignorePage) => page.includes(ignorePage)))
            continue
        const key = page.replace(`${subsystem}/src/pages`, '')
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

const generatedPath = join(process.cwd(), 'generated')

if (!existsSync(generatedPath)) {
    await mkdir(generatedPath)
}

await writeFile(
    join(generatedPath, 'router.ts'),
    `export default ${JSON.stringify(routerPath, null, 2)}`
)

console.log(`
    Generated file: packages/router/generated/router.ts
    Define menu here: packages/router/src/index.ts
`)
