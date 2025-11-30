import DefaultLayout from '@layouts/default-layout'
import PostgraduateProject, { type PostgraduateProjectProps } from '../danh-muc-luan-van'

export default function PostgraduateProjectP7() {
    const data: PostgraduateProjectProps = {
        isManage: true,
        role: 'P7',
    }
    return <PostgraduateProject {...data} />
}
PostgraduateProjectP7.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
