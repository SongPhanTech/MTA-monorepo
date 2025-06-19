import signOutAction from '@components/layouts/avatar-dropdown/sign-out'
import { getStorage, removeStorage, setStorage } from '@lib/storage'
import { getSession } from '@workspace/auth/react'

export const fetchUploadFile = async (formData: FormData, url: string) => {
    let accessToken = getStorage('ACCESS_TOKEN')
    if (!accessToken) {
        const session = await getSession()
        if (session) {
            accessToken = session.access_token
            setStorage('ACCESS_TOKEN', accessToken)
        }
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/${url}`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            // 'Content-Type': 'multipart/form-data',
        },
        body: formData,
    })

    if (response.status === 401) {
        removeStorage('ACCESS_TOKEN')
        signOutAction()
    }

    return response
}

export const fetchThongTinBaoCao = async () => {
    let accessToken = getStorage('ACCESS_TOKEN')
    if (!accessToken) {
        const session = await getSession()
        if (session) {
            accessToken = session.access_token
            setStorage('ACCESS_TOKEN', accessToken)
        }
    }

    const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/fixed-class/docx-list-student-fixed-class-labels`,
        {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        }
    )

    if (response.status === 401) {
        removeStorage('ACCESS_TOKEN')
        signOutAction()
    }

    return response.json()
}

export const exportHocVienLop = async (fixedClassId: string) => {
    let accessToken = getStorage('ACCESS_TOKEN')
    if (!accessToken) {
        const session = await getSession()
        if (session) {
            accessToken = session.access_token
            setStorage('ACCESS_TOKEN', accessToken)
        }
    }

    const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/fixed-class/export-docx-list-student-fixed-class?fixedClassId=${fixedClassId}`,
        {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        }
    )

    if (response.status === 401) {
        removeStorage('ACCESS_TOKEN')
        signOutAction()
    }

    return response.blob()
}
