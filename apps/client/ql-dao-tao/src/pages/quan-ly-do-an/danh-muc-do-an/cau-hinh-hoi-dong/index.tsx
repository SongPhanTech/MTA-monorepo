import FormItem from "@components/commons/form-item"
import useSpinner from "@hooks/spinner"
import {
  CouncilProposalStatus,
  CouncilRole,
  type ExpertProfile,
  type SubjectClass,
} from "@workspace/db/client"
import {
  useCreateManyCouncil,
  useFindManyDefenseSession,
  useFindManyExpertProfile,
  useFindManyRoom,
  useFindUniqueSubjectClass,
  useUpdateThesisProject,
} from "@workspace/db/hooks"
import { Button, Col, Form, message, Select } from "antd"
import dayjs from "dayjs"
import "dayjs/locale/vi"
import DatePicker from "@components/commons/date-picker"
import Table from "@components/commons/table"
import type { FilterProps } from "@constants/type"
import DefaultLayout from "@layouts/default-layout"
import { ROUTER_PATH } from "@workspace/router"
import { debounce } from "lodash"
import { useRouter } from "next/router"
import React, { useCallback, useEffect, useMemo, useState } from "react"

export type PutSettingClass = SubjectClass & {
  roomIds?: string[]
  defenseSessionIds?: string[]
  defenseDate?: Date
}
dayjs.locale("vi")

export default function SettingClass() {
  const router = useRouter()
  const [searchRoom, setSearchRoom] = useState("")
  const [form] = Form.useForm<PutSettingClass>()
  const [selectedLeftKeys, setSelectedLeftKeys] = useState<React.Key[]>([])
  const [selectedRightKeys, setSelectedRightKeys] = useState<React.Key[]>([])
  const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>([])
  const [selectedDefenseSessionIds, setSelectedDefenseSessionIds] = useState<string[]>([])
  const [leftData, setLeftData] = useState<ExpertProfile[]>([])
  const [rightData, setRightData] = useState<ExpertProfile[]>([])
  const [filters, setFilters] = useState<FilterProps>({
    code: undefined,
    name: undefined,
    academicRank: undefined,
    academicDegree: undefined,
    specialization: undefined,
    workplace: undefined,
    phone: undefined,
    email: undefined,
  })
  const { subjectClassId } = router.query
  const subjectClassIdStr = Array.isArray(subjectClassId) ? subjectClassId[0] : subjectClassId || ""

  const where = useMemo(
    () => ({
      ...(filters.code ? { code: { contains: filters.code, mode: "insensitive" as const } } : {}),
      ...(filters.name ? { name: { contains: filters.name, mode: "insensitive" as const } } : {}),
      ...(filters.academicRank
        ? { academicRank: { contains: filters.academicRank, mode: "insensitive" as const } }
        : {}),
      ...(filters.academicDegree
        ? {
            academicDegree: {
              contains: filters.academicDegree,
              mode: "insensitive" as const,
            },
          }
        : {}),
      ...(filters.specialization
        ? {
            specialization: {
              contains: filters.specialization,
              mode: "insensitive" as const,
            },
          }
        : {}),
      ...(filters.workplace
        ? { workplace: { contains: filters.workplace, mode: "insensitive" as const } }
        : {}),
      ...(filters.phone
        ? { phone: { contains: filters.phone, mode: "insensitive" as const } }
        : {}),
      ...(filters.email
        ? { email: { contains: filters.email, mode: "insensitive" as const } }
        : {}),
    }),
    [
      filters.code,
      filters.name,
      filters.academicRank,
      filters.academicDegree,
      filters.specialization,
      filters.workplace,
      filters.phone,
      filters.email,
    ]
  )

  const { data: expertProfileData } = useFindManyExpertProfile(
    {
      where,
      include: { lecturer: { include: { userProfile: true } } },
    },
    { refetchOnWindowFocus: false }
  )

  const { showSpinner, hideSpinner } = useSpinner()

  const { data: subjectClass } = useFindUniqueSubjectClass(
    {
      where: {
        id: subjectClassIdStr,
      },
      include: {
        expertProfile: true,
        thesisProjects: {
          include: {
            registrations: { include: { student: { include: { userProfile: true } } } },
            supervisor: true,
            room: true,
            council: { include: { members: { include: { expert: true } } } },
            defenseSession: true,
          },
        },
      },
    },
    { enabled: !!subjectClassIdStr }
  )

  const experts = useMemo(() => {
    if (!subjectClass) return []

    const allExperts = subjectClass.thesisProjects.flatMap(
      (thesis) => thesis.council?.members.filter((m) => m.expert).map((m) => m.expert) || []
    )

    const uniqueExperts = Array.from(new Map(allExperts.map((exp) => [exp?.id, exp])).values())

    return uniqueExperts
  }, [subjectClass])

  const { data: room = [], refetch } = useFindManyRoom({
    where: {
      deletedAt: null,
      active: true,
      ...(searchRoom ? { name: { contains: searchRoom, mode: "insensitive" } } : {}),
    },
  })

  const { data: defenseSession } = useFindManyDefenseSession({})

  const debouncedRefetch = useCallback(
    debounce(() => {
      refetch()
    }, 500),
    []
  )

  const handleSearchRoom = (value: string) => {
    setSearchRoom(value)
    debouncedRefetch()
  }

  useEffect(() => {
    if (subjectClass) {
      const roomIds = subjectClass.thesisProjects
        .map((item) => item.room?.id)
        .filter((id): id is string => !!id)
        .filter((id, index, self) => self.indexOf(id) === index)

      const defenseSessionIds = subjectClass.thesisProjects
        .map((item) => item.defenseSession?.id)
        .filter((id): id is string => !!id)
        .filter((id, index, self) => self.indexOf(id) === index)

      form.setFieldsValue({
        roomIds,
        defenseSessionIds,
        defenseDate: subjectClass?.thesisProjects[0]?.defenseDate
          ? dayjs(subjectClass.thesisProjects[0].defenseDate)
          : undefined,
      })
    }
  }, [subjectClass, form])

  const listExperts =
    rightData?.map((item, index) => ({
      id: index,
      expertId: item.id,
      internal: true,
      name: item.name || "",
      eligiblePresident: item.eligiblePresident,
      eligibleSecretary: item.eligibleSecretary,
    })) || []

  type Person = {
    id: number
    name: string
    expertId?: string
    internal: boolean
    eligiblePresident: boolean
    eligibleSecretary: boolean
  }

  type Committee = {
    director: Person
    secretary: Person
    candidates: Person[] // length = 3
  }

  type Batch = Committee[]

  function shuffle<T>(arr: T[]): T[] {
    const a = arr.slice()
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[a[i], a[j]] = [a[j], a[i]]
    }
    return a
  }

  /* ---------- Core generator with lookahead ---------- */

  function generateBatchesWithLookahead(
    people: Person[],
    totalCommittees = 2,
    perBatch = 2,
    maxAttemptsPerBatch = 1000
  ): Batch[] {
    const n = people.length

    const eligibleDirectorsCount = people.filter((p) => p.eligiblePresident).length
    if (eligibleDirectorsCount < perBatch) {
      message.warning("Số Chủ tịch không dủ")
    }

    const eligibleSecretariesCount = people.filter((p) => p.eligibleSecretary).length
    if (eligibleSecretariesCount < perBatch) {
      message.warning("Số Thư ký không dủ")
    }

    const eligibleBothCount = people.filter((p) => p.eligiblePresident || p.eligibleSecretary)
    if (
      eligibleDirectorsCount + eligibleSecretariesCount - eligibleBothCount.length <
      perBatch * 2
    ) {
      message.warning("Tổng số Chủ tịch và Thư ký không đủ")
    }

    if (people.length < 5 * perBatch) {
      message.warning("Số người không đủ")
    }

    const pairCount: number[][] = Array.from({ length: n }, () => Array(n).fill(0))
    const batches: Batch[] = []
    let remainingCommitteesGlobal = totalCommittees

    while (remainingCommitteesGlobal > 0) {
      const committeesThisBatch = Math.min(perBatch, remainingCommitteesGlobal)
      let attemptBatch = 0
      let success = false

      // retry building this batch if fail
      while (attemptBatch++ < maxAttemptsPerBatch && !success) {
        const usedInBatch = new Set<number>()
        const batch: Batch = []
        let fail = false

        for (let idx = 0; idx < committeesThisBatch; idx++) {
          const remainingCommitteesInBatch = committeesThisBatch - idx - 1 // after we pick current one

          // available pool for this committee (not used earlier in this batch)
          const available = people.filter((p) => !usedInBatch.has(p.id))
          // candidate pools
          const availableDirectors = available.filter((p) => p.eligiblePresident)
          const availableSecretaries = available.filter((p) => p.eligibleSecretary)

          // If not enough eligible left to cover remaining committees (feasibility check),
          // we must ensure after picking current director/secretary and future chairs we can supply them.
          // Simple conservative feasibility: count of availableDirectors must be >= 1 + remainingCommitteesInBatch
          // same for secretaries.
          if (
            availableDirectors.length < 1 + remainingCommitteesInBatch ||
            availableSecretaries.length < 1 + remainingCommitteesInBatch
          ) {
            fail = true
            break
          }

          // pick director with min pair score relative to global pairCount and usedInBatch
          const director = pickMinPair(availableDirectors, [], pairCount)
          // remove director from consideration for secretary (most likely they are distinct)
          const secPool = availableSecretaries.filter((p) => p.id !== director.id)
          if (secPool.length === 0) {
            fail = true
            break
          }

          // pick secretary with min pair score and also ensure feasibility after picking them:
          // after removing director & secretary, we must still have enough eligible for remaining committees.
          const secretary = pickWithFeasibility(
            secPool,
            director,
            available,
            remainingCommitteesInBatch
          )
          if (!secretary) {
            fail = true
            break
          }

          // Now pick candidates (3 persons) — prefer externals to preserve eligibles
          const remainingPool = available.filter(
            (p) => p.id !== director.id && p.id !== secretary.id
          )

          // sort pool: externals first, then internals with higher pairCount to diversify (or random)
          const externals = remainingPool.filter((p) => !p.internal)
          const internals = remainingPool.filter((p) => p.internal)
          const candidatePool = shuffle(externals).concat(shuffle(internals))

          // choose candidates but ensure we don't consume too many eligibles for future committees.
          const candidates = pickCandidatesWithLookahead(
            candidatePool,
            director,
            secretary,
            pairCount,
            remainingCommitteesInBatch,
            people,
            usedInBatch
          )
          if (!candidates) {
            fail = true
            break
          }

          // commit committee
          batch.push({ director, secretary, candidates })
          // update pairCount and usedInBatch
          const all = [director, secretary, ...candidates]
          for (let i = 0; i < all.length; i++) {
            for (let j = i + 1; j < all.length; j++) {
              pairCount[all[i].id][all[j].id]++
              pairCount[all[j].id][all[i].id]++
            }
          }
          all.forEach((p) => {
            usedInBatch.add(p.id)
          })
        } // end for committees in batch

        if (!fail && batch.length === committeesThisBatch) {
          batches.push(batch)
          remainingCommitteesGlobal -= committeesThisBatch
          success = true
        }
      } // end attempts per batch

      if (!success) {
        throw new Error(
          "Failed to build batch after many attempts — consider increasing retry limit or relaxing constraints."
        )
      }
    } // end while global

    return batches
  }

  /* ---------- helper pick functions ---------- */

  // pick person among candidates minimizing sum of pairCount with currentGroup
  function pickMinPair(
    candidates: Person[],
    currentGroup: Person[],
    pairCount: number[][]
  ): Person {
    let min = Number.POSITIVE_INFINITY
    const best: Person[] = []
    for (const p of candidates) {
      const score = currentGroup.reduce((s, q) => s + pairCount[p.id][q.id], 0)
      if (score < min) {
        min = score
        best.length = 0
        best.push(p)
      } else if (score === min) best.push(p)
    }
    return best[Math.floor(Math.random() * best.length)] as Person
  }

  // pick secretary ensuring feasibility for remaining committees in batch
  function pickWithFeasibility(
    secPool: Person[],
    director: Person,
    availableAll: Person[],
    remainingCommitteesInBatch: number
  ): Person | null {
    const candidates = shuffle(secPool)
    for (const s of candidates) {
      // imagine we remove director & s from available, and also future committees will need directors & secretaries
      const availAfter = availableAll.filter((p) => p.id !== director.id && p.id !== s.id)
      const availDirAfter = availAfter.filter((p) => p.eligiblePresident)
      const availSecAfter = availAfter.filter((p) => p.eligibleSecretary)

      // conservative check: must have at least remainingCommitteesInBatch directors and secretaries available
      if (
        availDirAfter.length >= remainingCommitteesInBatch &&
        availSecAfter.length >= remainingCommitteesInBatch
      ) {
        return s // ok
      }
    }
    return null
  }

  // pick candidates ensuring feasibility: don't consume too many eligible directors/secretaries needed for remaining committees
  function pickCandidatesWithLookahead(
    pool: Person[],
    director: Person,
    secretary: Person,
    pairCount: number[][],
    remainingCommitteesInBatch: number,
    allPeople: Person[],
    usedInBatch: Set<number>
  ): Person[] | null {
    // prefer external first (pool already ordered externals then internals)
    // try several random combos and check feasibility
    const tries = 300
    let best: Person[] | null = null
    let bestScore = Number.POSITIVE_INFINITY

    const poolFiltered = pool.filter((p) => p.id !== director.id && p.id !== secretary.id)

    if (poolFiltered.length < 3) return null

    for (let t = 0; t < tries; t++) {
      const cand = shuffle(poolFiltered).slice(0, 3)
      // feasibility: after removing these candidates + director + secretary + usedInBatch,
      // ensure enough eligible directors & secretaries remain for remainingCommitteesInBatch
      const usedIds = new Set<number>(usedInBatch)
      ;[director, secretary, ...cand].forEach((p) => {
        usedIds.add(p.id)
      })
      const avail = allPeople.filter((p) => !usedIds.has(p.id))
      const availDir = avail.filter((p) => p.eligiblePresident)
      const availSec = avail.filter((p) => p.eligibleSecretary)
      if (
        availDir.length < remainingCommitteesInBatch ||
        availSec.length < remainingCommitteesInBatch
      ) {
        continue // infeasible
      }
      // score by sum of existing pairCounts inside group to minimize reuse
      const group = [director, secretary, ...cand]
      let score = 0
      for (let i = 0; i < group.length; i++) {
        for (let j = i + 1; j < group.length; j++) {
          score += pairCount[group[i].id][group[j].id]
        }
      }
      if (score < bestScore) {
        bestScore = score
        best = cand
        if (score === 0) break // ideal
      }
    }
    return best
  }

  /* ---------- Run example ---------- */
  function getCouncilMember() {
    const thesisProjects = subjectClass?.thesisProjects ?? []
    const perBatch = Math.ceil(thesisProjects.length / selectedDefenseSessionIds.length)
    const batches = generateBatchesWithLookahead(
      listExperts,
      subjectClass?.thesisProjects.length,
      perBatch,
      4000
    )
    return batches
  }

  const { mutateAsync: createManyCouncil } = useCreateManyCouncil()
  const { mutateAsync: updateThesisProject } = useUpdateThesisProject()
  const handleCreateCouncil = async () => {
    if (rightData.length === 0) {
      message.info("Vui lòng chọn chuyên gia để tạo hội đồng")
      return
    }
    try {
      const batches = getCouncilMember()
      const defenseDate = form.getFieldValue("defenseDate")

      showSpinner()
      const councilsData = batches.flatMap((batch, batchIndex) =>
        batch.map((committee, committeeIndex) => {
          let globalIndex = 0
          for (let i = 0; i < batchIndex; i++) {
            globalIndex += batches[i].length
          }
          globalIndex += committeeIndex

          const thesisId = subjectClass?.thesisProjects[globalIndex]?.id

          const membersData = [
            { ...committee.director, role: CouncilRole.CHAIRMAN },
            { ...committee.secretary, role: CouncilRole.SECRETARY },
            { ...committee.candidates[0], role: CouncilRole.REVIEWER_1 },
            { ...committee.candidates[1], role: CouncilRole.REVIEWER_2 },
            { ...committee.candidates[2], role: CouncilRole.MEMBER },
          ].map((member) => ({
            expert: { connect: { id: member.expertId } },
            role: member.role,
          }))

          return {
            members: { create: membersData },
            thesis: { connect: { id: thesisId } },
            proposedDate: new Date(),
            status: CouncilProposalStatus.PENDING,
          }
        })
      )

      await createManyCouncil({
        data: councilsData,
        skipDuplicates: true,
      })

      await Promise.all(
        batches.flatMap((batch, batchIndex) =>
          batch.map((committee, committeeIndex) => {
            let globalIndex = 0
            for (let i = 0; i < batchIndex; i++) {
              globalIndex += batches[i].length
            }
            globalIndex += committeeIndex

            const thesisProject = subjectClass?.thesisProjects[globalIndex]

            const defenseSessionId =
              selectedDefenseSessionIds[batchIndex] ??
              selectedDefenseSessionIds[selectedDefenseSessionIds.length - 1]

            const roomId =
              selectedRoomIds[committeeIndex] ?? selectedRoomIds[selectedRoomIds.length - 1]

            return updateThesisProject({
              where: { id: thesisProject?.id },
              data: {
                defenseSessionId,
                roomId,
                defenseDate,
              },
            })
          })
        )
      )

      message.success("Tạo hội đồng thành công")
      setRightData([])
      hideSpinner()
    } catch (error: any) {
      if (error?.info?.message) {
        message.error(error?.info?.message)
        return
      }
      message.error("Lỗi khi tạo hội đồng:")
    }
  }

  useEffect(() => {
    if (experts.length) {
      setRightData(experts as ExpertProfile[])

      const filtered = (expertProfileData || []).filter(
        (item) => !experts.some((exp) => exp?.id === item.id)
      )
      setLeftData(filtered)
    } else {
      setLeftData(expertProfileData || [])
    }
  }, [expertProfileData, experts])

  const moveRight = () => {
    const selectedItems = leftData.filter((item) => selectedLeftKeys.includes(item.id))
    setRightData([...rightData, ...selectedItems])
    setLeftData(leftData.filter((item) => !selectedLeftKeys.includes(item.id)))
    setSelectedLeftKeys([])
  }

  const moveLeft = () => {
    const selectedItems = rightData.filter((item) => selectedRightKeys.includes(item.id))
    setLeftData([...leftData, ...selectedItems])
    setRightData(rightData.filter((item) => !selectedRightKeys.includes(item.id)))
    setSelectedRightKeys([])
  }

  const defenseSessions = subjectClass?.thesisProjects.reduce(
    (acc, tp) => {
      const dsId = tp.defenseSession?.id
      if (!dsId) return acc
      if (!acc[dsId]) {
        acc[dsId] = {
          session: tp.defenseSession,
          rooms: {},
        }
      }
      const roomId = tp.room?.id
      if (roomId) {
        if (!acc[dsId].rooms[roomId]) {
          acc[dsId].rooms[roomId] = {
            room: tp.room,
            thesisProjects: [],
          }
        }
        acc[dsId].rooms[roomId].thesisProjects.push(tp)
      }
      return acc
    },
    {} as Record<
      string,
      {
        session: any
        rooms: Record<string, { room: any; thesisProjects: typeof subjectClass.thesisProjects }>
      }
    >
  )

  if (subjectClass && subjectClass?.thesisProjects.length > 0) {
    return (
      <Col span={24}>
        <Col span={24} className="flex justify-end">
          <Button onClick={() => handleCreateCouncil()} type="primary">
            Tạo hội đồng
          </Button>
        </Col>
        <Form form={form}>
          <Col span={12}>
            <FormItem form={form} name="defenseSessionIds" label="Thời gian bảo vệ">
              <Select
                mode="multiple"
                placeholder="Chọn thời gian bảo vệ"
                options={defenseSession?.map((item) => ({
                  label: `${item.startTime ? dayjs(item.startTime).format("HH:mm") : ""}`,
                  value: item.id,
                }))}
                showSearch
                allowClear
                onChange={(values: string[]) => {
                  setSelectedDefenseSessionIds(values)
                }}
              />
            </FormItem>
          </Col>
          <Col span={12} className="mt-4">
            <FormItem
              form={form}
              name="roomIds"
              label={`Danh sách phòng ${
                selectedDefenseSessionIds.length
                  ? `(Cần ít nhất ${Math.ceil((subjectClass?.thesisProjects.length || 0) / selectedDefenseSessionIds.length)} phòng)`
                  : ""
              }`}
            >
              <Select
                mode="multiple"
                placeholder="Chọn danh sách phòng"
                options={room.map((item) => ({
                  label: item.name,
                  value: item.id,
                }))}
                showSearch
                onSearch={handleSearchRoom}
                filterOption={false}
                allowClear
                onChange={(values: string[]) => {
                  setSelectedRoomIds(values)
                }}
              />
            </FormItem>
          </Col>
          <Col span={12}>
            <FormItem form={form} name="defenseDate" label="Thời gian bảo vệ">
              <DatePicker
                format={{
                  format: "DD/MM/YYYY",
                  type: "mask",
                }}
                className="w-full"
              />
            </FormItem>
          </Col>
        </Form>
        <Col span={24} className="flex flex-row gap-2">
          <Col span={12}>
            <div
              style={{
                fontWeight: "bold",
              }}
            >
              Danh sách chuyên gia
            </div>
            <Table
              rowKey="id"
              id="expert-profile"
              filters={filters}
              setFilters={(value) => {
                setFilters(value)
              }}
              rowSelection={{
                selectedRowKeys: selectedLeftKeys,
                onChange: setSelectedLeftKeys,
              }}
              columns={[
                {
                  title: "STT",
                  width: 60,
                  align: "center",
                  fixed: "left",
                  render: (_, __, index: number) => index + 1,
                },
                {
                  title: "Tên chuyên gia",
                  dataIndex: "name",
                  width: 150,
                  type: "input",
                  align: "center",
                },
                {
                  title: "Học hàm",
                  dataIndex: "academicRank",
                  width: 150,
                  align: "center",
                  type: "input",
                },
                {
                  title: "Hàm vị",
                  dataIndex: "academicDegree",
                  width: 150,
                  align: "center",
                  type: "input",
                },
                {
                  title: "Chuyên ngành",
                  dataIndex: "specialization",
                  width: 150,
                  align: "center",
                  type: "input",
                },
                {
                  title: "Đơn vị công tác",
                  dataIndex: "workplace",
                  width: 150,
                  align: "center",
                  type: "input",
                },
                {
                  title: "Số điện thoại",
                  dataIndex: "phone",
                  width: 150,
                  align: "center",
                  type: "input",
                },
                {
                  title: "Email",
                  dataIndex: "email",
                  width: 150,
                  align: "center",
                  type: "input",
                },
              ]}
              data={leftData}
            />
          </Col>
          <Col
            span={1}
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            <Button onClick={moveRight} disabled={!selectedLeftKeys.length}>
              →
            </Button>
            <Button onClick={moveLeft} disabled={!selectedRightKeys.length}>
              ←
            </Button>
          </Col>
          <Col span={11}>
            <div
              style={{
                fontWeight: "bold",
              }}
            >
              Danh sách chuyên gia hội đồng{" "}
              {selectedDefenseSessionIds.length
                ? `(Cần ít nhất ${Math.ceil((subjectClass?.thesisProjects.length || 0) / selectedDefenseSessionIds.length) * 5} chuyên gia)`
                : ""}
            </div>
            <Table
              rowKey="id"
              id="expert-profile"
              rowSelection={{
                selectedRowKeys: selectedRightKeys,
                onChange: setSelectedRightKeys,
              }}
              columns={[
                {
                  title: "STT",
                  width: 60,
                  align: "center",
                  fixed: "left",
                  render: (_, __, index: number) => index + 1,
                },
                {
                  title: "Tên chuyên gia",
                  dataIndex: "name",
                  width: 150,
                  align: "center",
                },
                {
                  title: "Học hàm",
                  dataIndex: "academicRank",
                  width: 150,
                  align: "center",
                },
                {
                  title: "Hàm vị",
                  dataIndex: "academicDegree",
                  width: 150,
                  align: "center",
                },
                {
                  title: "Chuyên ngành",
                  dataIndex: "specialization",
                  width: 150,
                  align: "center",
                },
                {
                  title: "Đơn vị công tác",
                  dataIndex: "workplace",
                  width: 150,
                  align: "center",
                },
                {
                  title: "Số điện thoại",
                  dataIndex: "phone",
                  width: 150,
                  align: "center",
                },
                {
                  title: "Email",
                  dataIndex: "email",
                  width: 150,
                  align: "center",
                },
              ]}
              data={rightData}
            />
          </Col>
        </Col>
        {Object.values(defenseSessions ?? {}).length > 0 && (
          <div style={{ overflowX: "auto" }}>
            <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 12 }}>
              <thead>
                <tr>
                  <th rowSpan={2} style={{ ...cell, width: "50px" }}>
                    TT
                  </th>
                  <th rowSpan={2} style={{ ...cell, width: "120px" }}>
                    Thời gian bắt đầu
                  </th>

                  {Array.from(
                    new Map(
                      Object.values(defenseSessions ?? {})
                        .flatMap((ds) => Object.values(ds.rooms))
                        .map((r) => [r.room.id, r])
                    ).values()
                  ).map((r) => (
                    <th key={r.room.id} colSpan={3} style={cell}>
                      {r.room?.name}
                    </th>
                  ))}
                </tr>

                <tr>
                  {Array.from(
                    new Map(
                      Object.values(defenseSessions ?? {})
                        .flatMap((ds) => Object.values(ds.rooms))
                        .map((r) => [r.room.id, r])
                    ).values()
                  ).map((r, index) => (
                    <React.Fragment key={`${r.room.id} ${index}-em`}>
                      <th style={cell}>CD</th>
                      <th style={cell}>Hội đồng</th>
                      <th style={cell}>PB</th>
                    </React.Fragment>
                  ))}
                </tr>
              </thead>

              <tbody>
                {Object.values(defenseSessions ?? {}).map((ds, idx) => (
                  <React.Fragment key={ds.session.id}>
                    <tr>
                      <td rowSpan={6} style={cell}>
                        {idx + 1}
                      </td>
                      <td rowSpan={6} style={cell}>
                        <div>
                          {new Date(ds.session.startTime).toLocaleTimeString("vi-VN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                        <div>
                          {subjectClass?.thesisProjects[0]?.defenseDate
                            ? dayjs(subjectClass.thesisProjects[0]?.defenseDate).format(
                                "DD/MM/YYYY"
                              )
                            : ""}
                        </div>
                      </td>

                      {Object.values(ds.rooms).map((r, index) => (
                        <td colSpan={3} style={cell} key={`${r.room.id}-${index}-tt`}>
                          {r.thesisProjects.map((tp) => (
                            <React.Fragment key={tp.id}>
                              {tp.registrations.map((reg) => (
                                <div key={reg.id}>{reg.student.userProfile.fullname}</div>
                              ))}
                              <div>GVHD: {tp.supervisor?.name}</div>
                            </React.Fragment>
                          ))}
                        </td>
                      ))}
                    </tr>

                    <tr>
                      {Object.values(ds.rooms).map((r, index) => {
                        const ct = r.thesisProjects[0]?.council?.members.find(
                          (m) => m.role === "CHAIRMAN"
                        )
                        return (
                          <React.Fragment key={`${r.room.id}-${index}-ch`}>
                            <td style={cell}>CT</td>
                            <td style={cell}>{ct?.expert?.name || ""}</td>
                            <td style={cell}> </td>
                          </React.Fragment>
                        )
                      })}
                    </tr>

                    <tr>
                      {Object.values(ds.rooms).map((r, index) => {
                        const tk = r.thesisProjects[0]?.council?.members.find(
                          (m) => m.role === "SECRETARY"
                        )
                        return (
                          <React.Fragment key={`${r.room.id} ${index} se`}>
                            <td style={cell}>TK</td>
                            <td style={cell}>{tk?.expert?.name || ""}</td>
                            <td style={cell}> </td>
                          </React.Fragment>
                        )
                      })}
                    </tr>

                    <tr>
                      {Object.values(ds.rooms).map((r, index) => {
                        const pb1 = r.thesisProjects[0]?.council?.members.find(
                          (m) => m.role === "REVIEWER_1"
                        )
                        return (
                          <React.Fragment key={`${r.room.id} ${index} rv1`}>
                            <td style={cell}>UV</td>
                            <td style={cell}>{pb1?.expert?.name || ""}</td>
                            <td style={cell}>PB1</td>
                          </React.Fragment>
                        )
                      })}
                    </tr>

                    <tr>
                      {Object.values(ds.rooms).map((r, index) => {
                        const pb2 = r.thesisProjects[0]?.council?.members.find(
                          (m) => m.role === "REVIEWER_2"
                        )
                        return (
                          <React.Fragment key={`${r.room.id}-${index}-rv2`}>
                            <td style={cell}>UV</td>
                            <td style={cell}>{pb2?.expert?.name || ""}</td>
                            <td style={cell}>PB2</td>
                          </React.Fragment>
                        )
                      })}
                    </tr>

                    <tr>
                      {Object.values(ds.rooms).map((r, index) => {
                        const uv = r.thesisProjects[0]?.council?.members.find(
                          (m) => m.role === "MEMBER"
                        )
                        return (
                          <React.Fragment key={`${r.room.id} ${index}-me`}>
                            <td style={cell}>UV</td>
                            <td style={cell}>{uv?.expert?.name || ""}</td>
                            <td style={cell}> </td>
                          </React.Fragment>
                        )
                      })}
                    </tr>
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Col>
    )
  }
  return <div className="text-center text-lg">Hiện chưa có đề tài nào trong lớp đồ án</div>
}

const cell: React.CSSProperties = {
  border: "1px solid #000",
  padding: 4,
  textAlign: "center",
  verticalAlign: "middle",
}

SettingClass.getLayout = function getLayout(page: React.ReactElement) {
  return (
    <DefaultLayout
      breadcrumbList={[
        { title: "Quản lý đồ án" },
        {
          title: "Danh mục đồ án",
          href: ROUTER_PATH.QL_DAO_TAO.QUAN_LY_DO_AN_DANH_MUC_DO_AN,
        },
        { title: "Cấu hình hội đồng" },
      ]}
    >
      {page}
    </DefaultLayout>
  )
}
