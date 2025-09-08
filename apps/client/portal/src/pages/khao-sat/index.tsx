import DefaultLayout from '@layouts/default-layout'
import dayjs from 'dayjs'
import { useRouter } from 'next/router'
import { useState } from 'react'

dayjs.locale('vi')
export default function StudentScoreClassPage() {
    const router = useRouter()
    const studentId = router.query.id as string
    const [_filters, _setFilters] = useState({
        searchText: '',
    })

    return <div>Đăng ký học</div>
}

StudentScoreClassPage.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout breadcrumbList={[{ title: 'Đăng ký học' }]}>{page}</DefaultLayout>
}
