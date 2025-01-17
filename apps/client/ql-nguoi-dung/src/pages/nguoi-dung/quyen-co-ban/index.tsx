import { PutUserModal } from '@components/modal'
import type { PutUserFormType } from '@components/modal/put-user'
import useDisclosure from '@hooks/disclosure'
import DefaultLayout from '@layouts/default-layout'
import { useRouter } from 'next/router'
import { useFindManyUser } from '@workspace/db/hooks'
export default function Page() {
    const { data = [] } = useFindManyUser()
    const router = useRouter()
    const { onOpen } = useDisclosure<string, PutUserFormType>({
        tag: PutUserModal.name,
        onOk: (output) => {
            console.log(output)
        },
    })

    return (
        <div>
            User list:
            {JSON.stringify(data)}
        </div>
    )
}

Page.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
