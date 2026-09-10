import { useMutation } from "@tanstack/react-query"
import { customTrainingFetch } from "./custom-instance"

export type DeleteSubjectClassCascadePayload = {
  success: boolean
  message: string
  data?: {
    id: string
    code: string
    name: string
  }
}

type DeleteSubjectClassCascadeSuccess = {
  status: 200
  data: DeleteSubjectClassCascadePayload
  headers: Headers
}

type DeleteSubjectClassCascadeError = {
  status: 404 | 500
  data: { message?: string }
  headers: Headers
}

export type DeleteSubjectClassCascadeResponse =
  | DeleteSubjectClassCascadeSuccess
  | DeleteSubjectClassCascadeError

export const deleteSubjectClassCascade = async (
  id: string,
  options?: RequestInit
): Promise<DeleteSubjectClassCascadeResponse> => {
  return customTrainingFetch<DeleteSubjectClassCascadeResponse>(
    `/api/subject-class/${encodeURIComponent(id)}/cascade`,
    {
      ...options,
      method: "DELETE",
    }
  )
}

export const useDeleteSubjectClassCascade = () => {
  return useMutation({
    mutationFn: (id: string) => deleteSubjectClassCascade(id),
  })
}
