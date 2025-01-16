import { PutUserModal } from '@components/modal'
import { PutUserFormType } from '@components/modal/put-user'
import useDisclosure from '@hooks/disclosure'
import DefaultLayout from '@layouts/default-layout'
import { Button } from 'antd'
import React, { useCallback } from 'react'
export default function Page() {
    const { onOpen } = useDisclosure<string, PutUserFormType>({
        tag: PutUserModal.name,
        onOk: (output) => {
            console.log(output)
        },
    })
    const onOpenModal = useCallback(() => {
        onOpen()
    }, [])
    return (
        <div>
            User list:
            <Button onClick={onOpenModal}>Open modal</Button>
        </div>
    )
}

Page.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
