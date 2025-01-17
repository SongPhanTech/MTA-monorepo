import DefaultLayout from '@layouts/default-layout'

export default function Page() {
    return <div>User Profile</div>
}

Page.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
