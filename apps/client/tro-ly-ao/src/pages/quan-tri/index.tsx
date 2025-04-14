import DefaultLayout from '@layouts/default-layout'

function Page() {
    return <>page</>
}
Page.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}

export default Page
