import FormItem from '@components/commons/form-item'
import useSpinner from '@hooks/spinner'
import {
    CouncilProposalStatus,
    CouncilRole,
    type ExpertProfile,
    type SubjectClass,
} from '@workspace/db'
import {
    useCreateManyCouncil,
    useFindManyExpertProfile,
    useFindManyRoom,
    useFindUniqueSubjectClass,
    useUpdateSubjectClass,
    useUpdateThesisProject,
} from '@workspace/db/hooks'
import { Button, Col, Form, message, Select } from 'antd'
import dayjs from 'dayjs'
import 'dayjs/locale/vi'
import Table from '@components/commons/table'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import type { FilterProps } from '@constants/type'
import DefaultLayout from '@layouts/default-layout'
import { debounce } from 'lodash'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useMemo, useState } from 'react'

export type PutSettingClass = SubjectClass & {
    roomIds?: string[]
}
dayjs.locale('vi')

export default function SettingClass() {
    const router = useRouter()
    const [searchExpert, setSearchExpert] = useState('')
    const [form] = Form.useForm<PutSettingClass>()
    const [selectedLeftKeys, setSelectedLeftKeys] = useState<React.Key[]>([])
    const [selectedRightKeys, setSelectedRightKeys] = useState<React.Key[]>([])
    const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>([])
    const [leftData, setLeftData] = useState<ExpertProfile[]>([])
    const [rightData, setRightData] = useState<ExpertProfile[]>([])
    const [currentPage, setCurrentPage] = useState(1)
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
    const subjectClassIdStr = Array.isArray(subjectClassId)
        ? subjectClassId[0]
        : subjectClassId || ''

    const where = useMemo(
        () => ({
            ...(filters.code
                ? { code: { contains: filters.code, mode: 'insensitive' as const } }
                : {}),
            ...(filters.name
                ? { name: { contains: filters.name, mode: 'insensitive' as const } }
                : {}),
            ...(filters.academicRank
                ? { academicRank: { contains: filters.academicRank, mode: 'insensitive' as const } }
                : {}),
            ...(filters.academicDegree
                ? {
                      academicDegree: {
                          contains: filters.academicDegree,
                          mode: 'insensitive' as const,
                      },
                  }
                : {}),
            ...(filters.specialization
                ? {
                      specialization: {
                          contains: filters.specialization,
                          mode: 'insensitive' as const,
                      },
                  }
                : {}),
            ...(filters.workplace
                ? { workplace: { contains: filters.workplace, mode: 'insensitive' as const } }
                : {}),
            ...(filters.phone
                ? { phone: { contains: filters.phone, mode: 'insensitive' as const } }
                : {}),
            ...(filters.email
                ? { email: { contains: filters.email, mode: 'insensitive' as const } }
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
                        supervisor: true,
                        room: true,
                        council: {
                            include: {
                                members: {
                                    include: {
                                        expert: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        { enabled: !!subjectClassIdStr }
    )

    const { data: room = [], refetch } = useFindManyRoom({})

    const debouncedRefetch = useCallback(
        debounce(() => {
            refetch()
        }, 500),
        []
    )

    const handleSearchRoom = (value: string) => {
        setSearchExpert(value)
        debouncedRefetch()
    }

    // useEffect(() => {
    //     if (subjectClass) {
    //         form.setFieldsValue({
    //             roomIds: subjectClass.expertProfile.map((item: { id: string }) => item.id),
    //         })
    //     }
    // }, [subjectClass, form])

    const { mutateAsync: updateSubjectClass } = useUpdateSubjectClass()
    async function onOk(output?: PutSettingClass) {
        if (!output) return

        try {
            showSpinner()
            // const values = (await form.validateFields()) as PutSettingClass

            if (subjectClassId) {
                await updateSubjectClass({
                    where: { id: subjectClassIdStr },
                    data: {
                        expertProfile: {
                            connect: rightData?.map((rightData) => ({
                                id: rightData.id,
                            })),
                        },
                    },
                })
                message.success('Cập nhật thành công')
            }
        } catch (_error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        } finally {
            hideSpinner()
        }
    }

    //
    const ps =
        subjectClass?.expertProfile?.map((item, index) => ({
            id: index,
            expertId: item.id,
            internal: true,
            name: item.name || '',
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

    /* ---------- Utilities & sample data ---------- */

    function generateSamplePeople(): Person[] {
        const people: Person[] = []
        for (let i = 0; i < 40; i++) {
            const internal = i < 16
            people.push({
                id: i,
                name: `P${i + 1}`,
                internal,
                eligiblePresident: internal, // only internal eligible
                eligibleSecretary: internal,
            })
        }
        return people
    }

    function shuffle<T>(arr: T[]): T[] {
        const a = arr.slice()
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1))
            // @ts-ignore
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
            throw new Error('Số Chủ tịch không dủ')
        }

        const eligibleSecretariesCount = people.filter((p) => p.eligibleSecretary).length
        if (eligibleSecretariesCount < perBatch) {
            throw new Error('Số Thư ký không dủ')
        }

        const eligibleBothCount = people.filter((p) => p.eligiblePresident || p.eligibleSecretary)
        if (
            eligibleDirectorsCount + eligibleSecretariesCount - eligibleBothCount.length <
            perBatch * 2
        ) {
            throw new Error('Tổng số Chủ tịch và Thư ký không đủ')
        }

        if (people.length < 5 * perBatch) {
            throw new Error('Số người không đủ')
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
                            // @ts-ignore
                            pairCount[all[i].id][all[j].id]++
                            // @ts-ignore
                            pairCount[all[j].id][all[i].id]++
                        }
                    }
                    all.forEach((p) => usedInBatch.add(p.id))
                } // end for committees in batch

                if (!fail && batch.length === committeesThisBatch) {
                    batches.push(batch)
                    remainingCommitteesGlobal -= committeesThisBatch
                    success = true
                }
            } // end attempts per batch

            if (!success) {
                throw new Error(
                    'Failed to build batch after many attempts — consider increasing retry limit or relaxing constraints.'
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
            // @ts-ignore
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
            const usedIds = new Set<number>([...usedInBatch])
            ;[director, secretary, ...cand].forEach((p) => usedIds.add(p.id))
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
                    // @ts-ignore
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

    function main() {
        const people = generateSamplePeople()
        const batches = generateBatchesWithLookahead(ps, 2, 2, 4000)
        return batches
    }

    const { mutateAsync: createManyCouncil } = useCreateManyCouncil()
    const { mutateAsync: updateThesisProject } = useUpdateThesisProject()
    const handleCreateCouncil = async () => {
        if (ps.length !== 0) {
            const thesisIds = subjectClass?.thesisProjects.map((tp) => tp.id) ?? []
            try {
                const batches = main()

                const councilsData = batches.flatMap((batch, batchIndex) =>
                    batch.map((committee, committeeIndex) => {
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
                            thesis: {
                                connect: {
                                    id: subjectClass?.thesisProjects[
                                        batchIndex * batch.length + committeeIndex
                                    ].id,
                                },
                            },
                            proposedDate: new Date(),
                            status: CouncilProposalStatus.PENDING,
                        }
                    })
                )

                await createManyCouncil({
                    data: councilsData,
                    skipDuplicates: true,
                })

                if (selectedRoomIds?.length && thesisIds.length) {
                    await Promise.all(
                        thesisIds.map((thesisId, index) => {
                            const roomId = selectedRoomIds[index % selectedRoomIds.length]
                            return updateThesisProject({
                                where: { id: thesisId },
                                data: { roomId },
                            })
                        })
                    )
                }

                message.success('Tạo hội đồng thành công')
            } catch (_error) {
                message.error('Lỗi khi tạo hội đồng:')
            }
        }
    }

    useEffect(() => {
        setLeftData(expertProfileData || [])
    }, [expertProfileData])

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

    return (
        <Col span={24}>
            <Col span={24} className="flex justify-end">
                <Button onClick={() => handleCreateCouncil()} type="primary">
                    Tạo hội đồng
                </Button>
            </Col>
            <Col span={24} className="mt-4">
                <FormItem form={form} name="roomIds" label="Danh sách phòng">
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
            <Col span={24} className="flex flex-row gap-2">
                <Col span={12}>
                    <Table
                        rowKey="id"
                        id="expert-profile"
                        filters={filters}
                        setFilters={setFilters}
                        rowSelection={{
                            selectedRowKeys: selectedLeftKeys,
                            onChange: setSelectedLeftKeys,
                        }}
                        columns={[
                            {
                                title: 'STT',
                                width: 60,
                                align: 'center',
                                fixed: 'left',
                                render: (_, __, index: number) =>
                                    index + 1 + (currentPage - 1) * DEFAULT_PAGINATE_SIZE,
                            },
                            {
                                title: 'Tên chuyên gia',
                                dataIndex: 'name',
                                width: 150,
                                type: 'input',
                                align: 'center',
                            },
                            {
                                title: 'Học hàm',
                                dataIndex: 'academicRank',
                                width: 150,
                                align: 'center',
                                type: 'input',
                            },
                            {
                                title: 'Hàm vị',
                                dataIndex: 'academicDegree',
                                width: 150,
                                align: 'center',
                                type: 'input',
                            },
                            {
                                title: 'Chuyên ngành',
                                dataIndex: 'specialization',
                                width: 150,
                                align: 'center',
                                type: 'input',
                            },
                            {
                                title: 'Đơn vị công tác',
                                dataIndex: 'workplace',
                                width: 150,
                                align: 'center',
                                type: 'input',
                            },
                            {
                                title: 'Số điện thoại',
                                dataIndex: 'phone',
                                width: 150,
                                align: 'center',
                                type: 'input',
                            },
                            {
                                title: 'Email',
                                dataIndex: 'email',
                                width: 150,
                                align: 'center',
                                type: 'input',
                            },
                        ]}
                        data={leftData}
                    />
                </Col>
                <Col
                    span={1}
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        gap: '8px',
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
                    <Table
                        rowKey="id"
                        id="expert-profile"
                        rowSelection={{
                            selectedRowKeys: selectedRightKeys,
                            onChange: setSelectedRightKeys,
                        }}
                        columns={[
                            {
                                title: 'STT',
                                width: 60,
                                align: 'center',
                                fixed: 'left',
                                render: (_, __, index: number) =>
                                    index + 1 + (currentPage - 1) * DEFAULT_PAGINATE_SIZE,
                            },
                            {
                                title: 'Tên chuyên gia',
                                dataIndex: 'name',
                                width: 150,
                                align: 'center',
                            },
                            {
                                title: 'Học hàm',
                                dataIndex: 'academicRank',
                                width: 150,
                                align: 'center',
                            },
                            {
                                title: 'Hàm vị',
                                dataIndex: 'academicDegree',
                                width: 150,
                                align: 'center',
                            },
                            {
                                title: 'Chuyên ngành',
                                dataIndex: 'specialization',
                                width: 150,
                                align: 'center',
                            },
                            {
                                title: 'Đơn vị công tác',
                                dataIndex: 'workplace',
                                width: 150,
                                align: 'center',
                            },
                            {
                                title: 'Số điện thoại',
                                dataIndex: 'phone',
                                width: 150,
                                align: 'center',
                            },
                            {
                                title: 'Email',
                                dataIndex: 'email',
                                width: 150,
                                align: 'center',
                            },
                        ]}
                        data={rightData}
                    />
                </Col>
            </Col>
            {
                // TODO: ghép ca, kíp bảo vệ
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 12 }}>
                        <thead>
                            <tr>
                                <th rowSpan={2} style={{ ...cell, width: '50px' }}>
                                    TT
                                </th>
                                <th rowSpan={2} style={{ ...cell, width: '100px' }}>
                                    Thời gian bắt đầu
                                </th>
                                {subjectClass?.thesisProjects.map((tp) => (
                                    <th colSpan={3} style={{ ...cell, height: '25px' }}>
                                        {tp.room?.name}
                                    </th>
                                ))}
                            </tr>
                            <tr>
                                {subjectClass?.thesisProjects.map((tp) => (
                                    <>
                                        <th style={cell}>CD</th>
                                        <th style={cell}>Hội đồng</th>
                                        <th style={cell}>PB</th>
                                    </>
                                ))}
                            </tr>
                        </thead>

                        <tbody>
                            <tr>
                                <th rowSpan={6} style={cell}>
                                    1
                                </th>
                                <th rowSpan={6} style={cell}>
                                    7:30 ... 15/11/2025
                                </th>
                                {subjectClass?.thesisProjects.map((tp) => (
                                    <td colSpan={3} style={cell}>
                                        <div>GVHD:{tp.supervisor.name}</div>
                                    </td>
                                ))}
                            </tr>
                            <tr>
                                {subjectClass?.thesisProjects?.map((thesis) => {
                                    const chairman = thesis.council?.members.find(
                                        (m) => m.role === CouncilRole.CHAIRMAN
                                    )
                                    return (
                                        <>
                                            <td style={cell}>CT</td>
                                            <td style={cell}>{chairman?.expert.name || ''}</td>
                                            <td style={cell}> </td>
                                        </>
                                    )
                                })}
                            </tr>

                            <tr>
                                {subjectClass?.thesisProjects?.map((thesis) => {
                                    const chairman = thesis.council?.members.find(
                                        (m) => m.role === CouncilRole.SECRETARY
                                    )
                                    return (
                                        <>
                                            <td style={cell}>TK</td>
                                            <td style={cell}>{chairman?.expert.name || ''}</td>
                                            <td style={cell}> </td>
                                        </>
                                    )
                                })}
                            </tr>
                            <tr>
                                {subjectClass?.thesisProjects?.map((thesis) => {
                                    const chairman = thesis.council?.members.find(
                                        (m) => m.role === CouncilRole.REVIEWER_1
                                    )
                                    return (
                                        <>
                                            <td style={cell}>UV</td>
                                            <td style={cell}>{chairman?.expert.name || ''}</td>
                                            <td style={cell}>PB1</td>
                                        </>
                                    )
                                })}
                            </tr>
                            <tr>
                                {subjectClass?.thesisProjects?.map((thesis) => {
                                    const chairman = thesis.council?.members.find(
                                        (m) => m.role === CouncilRole.REVIEWER_2
                                    )
                                    return (
                                        <>
                                            <td style={cell}>UV</td>
                                            <td style={cell}>{chairman?.expert.name || ''}</td>
                                            <td style={cell}>PB2</td>
                                        </>
                                    )
                                })}
                            </tr>
                            <tr>
                                {subjectClass?.thesisProjects?.map((thesis) => {
                                    const chairman = thesis.council?.members.find(
                                        (m) => m.role === CouncilRole.MEMBER
                                    )
                                    return (
                                        <>
                                            <td style={cell}>UV</td>
                                            <td style={cell}>{chairman?.expert.name || ''}</td>
                                            <td style={cell}> </td>
                                        </>
                                    )
                                })}
                            </tr>
                        </tbody>
                        <tbody>
                            <tr>
                                <th rowSpan={6} style={cell}>
                                    2
                                </th>
                                <th rowSpan={6} style={cell}>
                                    9:00 ... 15/11/2025
                                </th>
                                {subjectClass?.thesisProjects.map((tp) => (
                                    <td colSpan={3} style={cell}>
                                        <div>GVHD:{tp.supervisor.name}</div>
                                    </td>
                                ))}
                            </tr>
                            <tr>
                                {subjectClass?.thesisProjects?.map((thesis) => {
                                    const chairman = thesis.council?.members.find(
                                        (m) => m.role === CouncilRole.CHAIRMAN
                                    )
                                    return (
                                        <>
                                            <td style={cell}>CT</td>
                                            <td style={cell}>{chairman?.expert.name || ''}</td>
                                            <td style={cell}> </td>
                                        </>
                                    )
                                })}
                            </tr>

                            <tr>
                                {subjectClass?.thesisProjects?.map((thesis) => {
                                    const chairman = thesis.council?.members.find(
                                        (m) => m.role === CouncilRole.SECRETARY
                                    )
                                    return (
                                        <>
                                            <td style={cell}>TK</td>
                                            <td style={cell}>{chairman?.expert.name || ''}</td>
                                            <td style={cell}> </td>
                                        </>
                                    )
                                })}
                            </tr>
                            <tr>
                                {subjectClass?.thesisProjects?.map((thesis) => {
                                    const chairman = thesis.council?.members.find(
                                        (m) => m.role === CouncilRole.REVIEWER_1
                                    )
                                    return (
                                        <>
                                            <td style={cell}>UV</td>
                                            <td style={cell}>{chairman?.expert.name || ''}</td>
                                            <td style={cell}>PB1</td>
                                        </>
                                    )
                                })}
                            </tr>
                            <tr>
                                {subjectClass?.thesisProjects?.map((thesis) => {
                                    const chairman = thesis.council?.members.find(
                                        (m) => m.role === CouncilRole.REVIEWER_2
                                    )
                                    return (
                                        <>
                                            <td style={cell}>UV</td>
                                            <td style={cell}>{chairman?.expert.name || ''}</td>
                                            <td style={cell}>PB2</td>
                                        </>
                                    )
                                })}
                            </tr>
                            <tr>
                                {subjectClass?.thesisProjects?.map((thesis) => {
                                    const chairman = thesis.council?.members.find(
                                        (m) => m.role === CouncilRole.MEMBER
                                    )
                                    return (
                                        <>
                                            <td style={cell}>UV</td>
                                            <td style={cell}>{chairman?.expert.name || ''}</td>
                                            <td style={cell}> </td>
                                        </>
                                    )
                                })}
                            </tr>
                        </tbody>
                    </table>
                </div>
            }
        </Col>
    )
}

const cell: React.CSSProperties = {
    border: '1px solid #000',
    padding: 4,
    textAlign: 'center',
    verticalAlign: 'middle',
}

SettingClass.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
