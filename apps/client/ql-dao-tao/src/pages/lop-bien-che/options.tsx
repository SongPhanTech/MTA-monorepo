import UserProfilePageDs from "@pages/ql-sinh-vien";
import { useCountFixedClassStudent, useFindManyFixedClassStudent } from "@workspace/db/hooks";
import { Flex } from "antd";
import { useEffect } from "react";

export default function OptionsPage({ fixedClass }: any) {
    const fixedClassId = fixedClass.id

    const { data = [], refetch } = useFindManyFixedClassStudent({
        take: 1000,
        skip: 0,
    });

    console.log(data);  // Log data trả về


    const { data: count } = useCountFixedClassStudent({
        where: {
            fixedClassId: fixedClassId,
        }
    });

    useEffect(() => {
        // refetch();
    }, [fixedClassId]);  // chỉ gọi lại khi fixedClassId thay đổi
    if (count === 0) {
        return <Flex justify="center">Không có dữ liệu</Flex>
    } else return <UserProfilePageDs />
}
