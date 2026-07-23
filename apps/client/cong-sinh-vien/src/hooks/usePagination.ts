import { DEFAULT_PAGINATE_SIZE } from "@constants/constants"
import { useCallback, useState } from "react"

export function usePagination(defaultPageSize = DEFAULT_PAGINATE_SIZE) {
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(defaultPageSize)

  const onChange = useCallback(
    (page: number, nextPageSize: number) => {
      if (pageSize === nextPageSize) {
        setCurrentPage(page)
      } else {
        setCurrentPage(1)
        setPageSize(nextPageSize)
      }
    },
    [pageSize]
  )

  const reset = useCallback(() => {
    setCurrentPage(1)
  }, [])

  return {
    currentPage,
    pageSize,
    setCurrentPage,
    setPageSize,
    onChange,
    reset,
    skip: (currentPage - 1) * pageSize,
    take: pageSize,
  }
}
