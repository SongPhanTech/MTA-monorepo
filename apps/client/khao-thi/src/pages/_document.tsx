import { createCache, extractStyle, StyleProvider } from '@ant-design/cssinjs'
import NextDocument, { type DocumentContext, Head, Html, Main, NextScript } from 'next/document'
import { env } from '@/env'

export default class MyDocument extends NextDocument {
    render() {
        return (
            <Html>
                <Head>
                    <link
                        rel="stylesheet"
                        href={`${env.NEXT_PUBLIC_ASSET_PREFIX}/mta-components.css`}
                    />
                    <script
                        src={`${process.env.NEXT_PUBLIC_ONLY_OFFICE_ENDPOINT}/web-apps/apps/api/documents/api.js`}
                        async
                    />
                    <script src={`${env.NEXT_PUBLIC_ASSET_PREFIX}/mta-components.umd.js`} />
                </Head>
                <body>
                    <Main />
                    <NextScript />
                </body>
            </Html>
        )
    }
}

MyDocument.getInitialProps = async (ctx: DocumentContext) => {
    const cache = createCache()
    const originalRenderPage = ctx.renderPage
    ctx.renderPage = () =>
        originalRenderPage({
            enhanceApp: (App) => (props) => (
                <StyleProvider cache={cache}>
                    <App {...props} />
                </StyleProvider>
            ),
        })

    const initialProps = await NextDocument.getInitialProps(ctx)
    const style = extractStyle(cache, true)
    return {
        ...initialProps,
        styles: (
            <>
                {initialProps.styles}
                <style dangerouslySetInnerHTML={{ __html: style }} />
            </>
        ),
    }
}
