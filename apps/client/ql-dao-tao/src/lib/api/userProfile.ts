import signOutAction from '@components/layouts/avatar-dropdown/sign-out'
import { getStorage, removeStorage, setStorage } from '@lib/storage'
import { getSession } from 'next-auth/react'

export const fetchUploadFile = async (formData: FormData) => {
    let accessToken = getStorage('ACCESS_TOKEN')
    if (!accessToken) {
        const session = await getSession()
        if (session) {
            accessToken = session.user.access_token
            setStorage('ACCESS_TOKEN', accessToken)
        }
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL_NO_AUTH}/api/UserProfile/upload-excel-create-user-profile`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "multipart/form-data"
        },
        body: formData,
    })

    if (response.status === 401) {
        removeStorage('ACCESS_TOKEN')
        signOutAction()
    }

    return response
}

export const fetchUpdateFile = async (formData: FormData) => {
    let accessToken = getStorage('ACCESS_TOKEN')
    if (!accessToken) {
        const session = await getSession()
        if (session) {
            accessToken = session.user.access_token
            setStorage('ACCESS_TOKEN', accessToken)
        }
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL_NO_AUTH}/api/UserProfile/upload-excel-update-user-profile`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "multipart/form-data"
        },
        body: formData,
    })

    if (response.status === 401) {
        removeStorage('ACCESS_TOKEN')
        signOutAction()
    }

    return response
}

