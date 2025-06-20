import { useFindUniqueUser } from '@workspace/db/hooks'
import { useSession } from 'next-auth/react'

export const useCurrentUser = () => {
    const { data: session } = useSession()

    const {
        data: user,
        isLoading,
        error,
    } = useFindUniqueUser({
        where: {
            ssoId: session?.user?.user_id || '',
        },
        // enabled: !!session?.user?.user_id, // chỉ gọi khi đã có user_id
    })

    return user
}

//  const userCurrent = useCurrentUser();
