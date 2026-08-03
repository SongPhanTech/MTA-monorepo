import { createCache, extractStyle, StyleProvider } from "@ant-design/cssinjs"
import { getRuntimeEnv } from "@workspace/libs/utils"
import NextDocument, { type DocumentContext, Head, Html, Main, NextScript } from "next/document"

export default class MyDocument extends NextDocument {
  render() {
    return (
      <Html>
        <Head>
          <link
            rel="stylesheet"
            href={`${getRuntimeEnv("NEXT_PUBLIC_ASSET_PREFIX")}/mta-components.css`}
          />
        </Head>
        <body>
          <Main />
          <NextScript />
          <script src={`${getRuntimeEnv("NEXT_PUBLIC_ASSET_PREFIX")}/mta-components.umd.js`} />
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
