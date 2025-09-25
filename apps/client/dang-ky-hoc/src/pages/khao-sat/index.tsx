import DefaultLayout from '@layouts/default-layout'
import dayjs from 'dayjs'
import { useState } from 'react'

dayjs.locale('vi')
export default function StudentScoreClassPage() {
    const [_filters, _setFilters] = useState({
        searchText: '',
    })

    return <div>Khảo sát</div>
}

StudentScoreClassPage.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout breadcrumbList={[{ title: 'Đăng ký học' }]}>{page}</DefaultLayout>
}
