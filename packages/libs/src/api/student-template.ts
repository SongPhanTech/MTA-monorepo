// import { useMutation } from '@tanstack/react-query'
// import type { UseMutationOptions } from '@tanstack/react-query'
// import { customTrainingFetch } from './training'

// export type downloadStudentImportTemplateResponse200 = {
//     data: Blob
//     status: 200
// }

// export type downloadStudentImportTemplateResponse404 = {
//     data: { message: string }
//     status: 404
// }

// export type downloadStudentImportTemplateResponse500 = {
//     data: { message: string; error?: string }
//     status: 500
// }

// export type downloadStudentImportTemplateResponseSuccess =
//     downloadStudentImportTemplateResponse200 & {
//         headers: Headers
//     }

// export type downloadStudentImportTemplateResponseError =
//     | (downloadStudentImportTemplateResponse404 & {
//           headers: Headers
//       })
//     | (downloadStudentImportTemplateResponse500 & {
//           headers: Headers
//       })

// export type downloadStudentImportTemplateResponse =
//     | downloadStudentImportTemplateResponseSuccess
//     | downloadStudentImportTemplateResponseError

// export const getDownloadStudentImportTemplateUrl = () => {
//     return `/api/student/download-student-import-template`
// }

// export const downloadStudentImportTemplate = async (
//     options?: RequestInit
// ): Promise<downloadStudentImportTemplateResponse> => {
//     return customTrainingFetch<downloadStudentImportTemplateResponse>(
//         getDownloadStudentImportTemplateUrl(),
//         {
//             ...options,
//             method: 'GET',
//         }
//     )
// }

// export const useDownloadStudentImportTemplate = <
//     TError = { message: string },
//     TContext = unknown,
// >(options?: {
//     mutation?: UseMutationOptions<
//         Awaited<ReturnType<typeof downloadStudentImportTemplate>>,
//         TError,
//         void,
//         TContext
//     >
// }) => {
//     const mutationKey = ['downloadStudentImportTemplate']
//     const { mutation: mutationOptions } = options
//         ? options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey
//             ? options
//             : { ...options, mutation: { ...options.mutation, mutationKey } }
//         : { mutation: { mutationKey } }

//     return useMutation({
//         mutationFn: () => {
//             return downloadStudentImportTemplate()
//         },
//         ...mutationOptions,
//     })
// }
