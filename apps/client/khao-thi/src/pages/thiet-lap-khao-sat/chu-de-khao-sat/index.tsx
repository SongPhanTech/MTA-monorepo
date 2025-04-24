import DefaultLayout from '@layouts/default-layout'
function Page() {
    return <div>Chủ đề khảo sát</div>
}

export default Page
Page.getLayout = function getLayout(page: React.ReactNode) {
    return <DefaultLayout>{page}</DefaultLayout>
}
