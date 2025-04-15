import UserProfilePageDs from "@pages/user-profile-ds";
import { useCountFixedClassStudent, useFindFirstFixedClassStudent, useFindManyFixedClassStudent } from "@workspace/db/hooks";
import { Flex } from "antd";
import { useEffect } from "react";

export default function OptionsPage({ fixedClass }: any) {
    const fixedClassId = fixedClass.id;

    const { data = [], error, isLoading } = useFindFirstFixedClassStudent({
        where: {
            fixedClassId: '550e8407-e29b-41d4-a716-446655440000',
            userProfileId: 'cm9cmc8oz00372k48lblsvtv0',
        },
        include: {
            UserProfile: true,
            fixedClass: true,
        },
    });

    console.log(data, error, isLoading);  // Log data trả về


    const { data: count } = useCountFixedClassStudent({
        where: {
            fixedClassId: '550e8407-e29b-41d4-a716-446655440000',
            userProfileId: 'cm9cmc8oz00372k48lblsvtv0',
        }
    });

    useEffect(() => {
        // refetch();
    }, [fixedClassId]);  // chỉ gọi lại khi fixedClassId thay đổi
    console.log(count, data, "nè he", error)
    if (count === 0) {
        return <Flex justify="center">Không có dữ liệu</Flex>
    } else return <UserProfilePageDs />;
}
