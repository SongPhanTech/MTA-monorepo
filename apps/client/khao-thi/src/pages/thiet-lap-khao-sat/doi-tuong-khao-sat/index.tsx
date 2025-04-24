import DefaultLayout from '@layouts/default-layout'
function Page() {
    return <div>Đối tượng khảo sát</div>
}

export default Page
Page.getLayout = function getLayout(page: React.ReactNode) {
    return <DefaultLayout>{page}</DefaultLayout>
}
