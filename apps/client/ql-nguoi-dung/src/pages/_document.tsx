import NextDocument, {
    type DocumentContext,
    Head,
    Html,
    Main,
    NextScript,
} from 'next/document'
import { createCache, extractStyle, StyleProvider } from '@ant-design/cssinjs'

export default class MyDocument extends NextDocument {
    render() {
        return (
            <Html>
                <Head />
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
