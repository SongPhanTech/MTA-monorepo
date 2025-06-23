import { useSession } from '@workspace/auth/react'
import { useFindUniqueUser } from '@workspace/db/hooks'

export const useCurrentUser = () => {
    const { data: session } = useSession()

    const {
        data: user,
        isLoading,
        error,
    } = useFindUniqueUser({
        where: {
            ssoId: session?.sub || '',
        },
        // enabled: !!session?.user?.user_id, // chỉ gọi khi đã có user_id
    })

    return user
}

//  const userCurrent = useCurrentUser();
