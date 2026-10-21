import { $Enums } from "@workspace/db/client"
import { useFindManySubjectClass } from "@workspace/db/hooks"
import { type Key, useEffect, useRef, useState } from "react"

type PageRow = {
  id: string
  subject: { id: string }
}

const selectionCache = new Map<string, string[]>()

export function usePersistedSubjectClassSelection({
  studentId,
  semesterId,
  trainingObjectTypeId,
  type,
  pageRows,
}: {
  studentId?: string
  semesterId?: string
  trainingObjectTypeId?: string
  type: $Enums.SubjectClassType
  pageRows: PageRow[]
}) {
  const [selectedSubjectClassRowKeys, setSelectedSubjectClassRowKeys] = useState<Key[]>([])
  const [subjectVersionIds, setSubjectVersionIds] = useState<string[]>([])
  const [selectionReady, setSelectionReady] = useState(false)
  const initializedScopeRef = useRef<string | undefined>()
  const selectedKeysRef = useRef<string[]>([])
  const subjectIdByClassIdRef = useRef<Record<string, string>>({})
  const scopeRef = useRef("")

  const scope = `${studentId ?? ""}|${semesterId ?? ""}|${trainingObjectTypeId ?? ""}|${type}`
  scopeRef.current = scope

  const { data: enrolledClasses, isLoading: enrolledLoading } = useFindManySubjectClass(
    {
      where: {
        semesterId,
        trainingObjectTypeId,
        type,
        subjectClassStudent: {
          some: {
            studentId: studentId as string,
            deletedAt: null,
          },
        },
      },
      select: {
        id: true,
        subjectId: true,
      },
    },
    {
      enabled: !!studentId && !!semesterId && !!trainingObjectTypeId,
    }
  )

  if (enrolledClasses) {
    for (const item of enrolledClasses) {
      subjectIdByClassIdRef.current[item.id] = item.subjectId
    }
  }
  for (const item of pageRows) {
    subjectIdByClassIdRef.current[item.id] = item.subject.id
  }

  const applySubjectClassSelection = (nextKeys: Key[]) => {
    const uniqueKeys = [...new Set(nextKeys.map(String))]
    selectedKeysRef.current = uniqueKeys
    if (scopeRef.current) selectionCache.set(scopeRef.current, uniqueKeys)
    setSelectedSubjectClassRowKeys(uniqueKeys)
    setSubjectVersionIds(
      uniqueKeys
        .map((key) => subjectIdByClassIdRef.current[key])
        .filter((id): id is string => Boolean(id))
    )
  }

  useEffect(() => {
    if (!studentId || !semesterId || !trainingObjectTypeId) {
      initializedScopeRef.current = undefined
      applySubjectClassSelection([])
      setSelectionReady(false)
      return
    }
    if (initializedScopeRef.current === scope) return
    if (enrolledLoading || enrolledClasses === undefined) return

    initializedScopeRef.current = scope
    for (const item of enrolledClasses) {
      subjectIdByClassIdRef.current[item.id] = item.subjectId
    }
    const cached = selectionCache.get(scope)
    applySubjectClassSelection(cached ?? enrolledClasses.map((item) => item.id))
    setSelectionReady(true)
  }, [studentId, semesterId, trainingObjectTypeId, scope, enrolledClasses, enrolledLoading])

  const onSelectRow = (id: string, selected: boolean) => {
    const current = selectedKeysRef.current
    if (selected) {
      if (current.includes(id)) return
      applySubjectClassSelection([...current, id])
      return
    }
    applySubjectClassSelection(current.filter((key) => key !== id))
  }

  const onSelectRows = (ids: string[], selected: boolean) => {
    const current = selectedKeysRef.current
    if (selected) {
      applySubjectClassSelection([...current, ...ids])
      return
    }
    const removing = new Set(ids)
    applySubjectClassSelection(current.filter((id) => !removing.has(id)))
  }

  return {
    selectedSubjectClassRowKeys,
    subjectVersionIds,
    selectionReady,
    onSelectRow,
    onSelectRows,
  }
}
