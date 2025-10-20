import Table from '@components/commons/table'
import DefaultLayout from '@layouts/default-layout'

export default function DanhSachThiPage() {
    return (
        <Table
            columns={[
                {
                    title: 'STT',
                    width: 60,
                    align: 'center',
                    render: (_, __, index) => index + 1,
                },
                {
                    title: 'Mã phòng thi',
                    width: 100,
                },
                {
                    title: 'Môn học',
                    width: 150,
                },
                {
                    title: 'Số sinh viên',
                    width: 60,
                    align: 'center',
                },
            ]}
        />
    )
}

DanhSachThiPage.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
