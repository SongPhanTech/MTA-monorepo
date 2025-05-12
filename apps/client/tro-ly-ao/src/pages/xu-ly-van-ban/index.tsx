import XuLyVanBanLayout from '@layouts/xu-ly-van-ban-layout'

function Page() {
    return <div>Page</div>
}

export default Page
Page.getLayout = function getLayout(page: React.ReactElement) {
    return <XuLyVanBanLayout>{page}</XuLyVanBanLayout>
}
