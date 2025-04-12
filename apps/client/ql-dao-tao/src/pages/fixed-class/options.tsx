import UserProfilePageDs from "@pages/user-profile-ds";
import { useCountFixedClassStudent, useFindManyFixedClassStudent } from "@workspace/db/hooks";
import { Flex } from "antd";
import { useEffect } from "react";

export default function OptionsPage({ fixedClass }: any) {
    const fixedClassId = fixedClass.id;

    const { data = [], refetch } = useFindManyFixedClassStudent({
        where: {
            // fixedClassId,
            status: 'ENROLLED'
        },  // đừng quên filter theo fixedClassId
        include: {
            UserProfile: true,
            fixedClass: true
        },
    });

    const { data: count } = useCountFixedClassStudent({
        where: { fixedClassId }
    });

    useEffect(() => {
        refetch();
    }, [fixedClassId]);  // chỉ gọi lại khi fixedClassId thay đổi

    if (count === 0) {
        return <Flex justify="center">Không có dữ liệu</Flex>
    } else return <UserProfilePageDs />;
}
