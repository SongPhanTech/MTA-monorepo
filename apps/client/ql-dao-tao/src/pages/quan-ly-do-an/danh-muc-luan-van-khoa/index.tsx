import DefaultLayout from '@layouts/default-layout'
import PostgraduateProject, { type PostgraduateProjectProps } from '../danh-muc-luan-van'

export default function PostgraduateProjectKhoa() {
    const data: PostgraduateProjectProps = {
        isManage: true,
        role: 'P2',
    }
    return <PostgraduateProject {...data} />
}
PostgraduateProjectKhoa.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
