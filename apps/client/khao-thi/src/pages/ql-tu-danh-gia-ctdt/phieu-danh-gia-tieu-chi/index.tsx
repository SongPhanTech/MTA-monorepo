import DefaultLayout from '@layouts/default-layout'

export default function CriteriaEvaluationPage() {
    return <div>Phiếu đánh giá page</div>
}

CriteriaEvaluationPage.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
