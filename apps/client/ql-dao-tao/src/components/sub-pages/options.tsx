import UserProfilePageDs from '@pages/ql-sinh-vien'
import type { FixedClass } from '@workspace/db'
import {
    useCountFixedClassStudent,
    useFindManyFixedClassStudent,
} from '@workspace/db/hooks'
import { Flex, Spin } from 'antd'
import { useEffect, useState } from 'react'
type Props = {
    fixedClass: FixedClass
}
export default function OptionsPage({ fixedClass }: any) {
    const fixedClassId = fixedClass.id
    console.log(fixedClass, 'đây')
    const code = fixedClass.trainingCourse.trainingObjectType.code
    console.log('code', code)
    const [ready, setReady] = useState(false)

    const { data: count } = useCountFixedClassStudent({
        where: {
            fixedClassId: {
                equals: fixedClassId,
            },
        },
    })
    const { data = [], refetch } = useFindManyFixedClassStudent({
        // where: {
        //     fixedClassId: {
        //         equals: fixedClassId,
        //     },
        // },
    })
    console.log(fixedClassId, count, 'đây he', data)
    useEffect(() => {
        const timeout = setTimeout(() => {
            setReady(true)
        }, 150) // Đợi 1 tí cho layout ổn định

        return () => clearTimeout(timeout)
    }, [fixedClassId])

    if (!ready) {
        return (
            <div style={{ width: '100%' }}>
                <Flex justify="center" align="center" style={{ height: 100 }}>
                    <Spin />
                </Flex>
            </div>
        )
    }

    if (count === 0) {
        return (
            <div style={{ width: '100%', overflowX: 'hidden' }}>
                <Flex justify="center">Không có dữ liệu</Flex>
            </div>
        )
    }

    return (
        <div style={{ width: '100%', overflowX: 'hidden' }}>
            <UserProfilePageDs />
        </div>
    )
}
