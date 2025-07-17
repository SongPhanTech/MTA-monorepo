import DashboardLayout from '@layouts/dashboard-layout'

function Page() {
    return <div>Home</div>
}

export default Page

Page.getLayout = function getLayout(page: React.ReactElement) {
    return <DashboardLayout>{page}</DashboardLayout>
}
