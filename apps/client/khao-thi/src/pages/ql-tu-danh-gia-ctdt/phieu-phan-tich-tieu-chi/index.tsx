import DefaultLayout from '@layouts/default-layout'

export default function CriteriaAnalysisPage() {
    return <div>Phiếu phân tích page</div>
}

CriteriaAnalysisPage.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
