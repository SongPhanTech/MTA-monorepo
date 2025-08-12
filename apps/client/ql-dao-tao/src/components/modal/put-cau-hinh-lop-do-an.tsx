import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import useSpinner from '@hooks/spinner'
import type { SubjectClass } from '@workspace/db'
import {
    useFindManyExpertProfile,
    useFindUniqueSubjectClass,
    useUpdateSubjectClass,
} from '@workspace/db/hooks'
import { Col, Form, message, Select } from 'antd'
import dayjs from 'dayjs'
import { useDisclosure } from 'react-hook-disclosure-modal'
import 'dayjs/locale/vi'
import { debounce } from 'lodash'
import { useCallback, useEffect, useState } from 'react'

export type PutSettingClass = SubjectClass & {
    expertProfileIds?: string[]
}
dayjs.locale('vi')

const PutSettingClass = () => {
    const [searchExpert, setSearchExpert] = useState('')
    const [form] = Form.useForm<PutSettingClass>()
    const { isOpen, onClose, input } = useDisclosure<{ subjectClassId: string }>({
        tag: PutSettingClass.name,
        onClose: form.resetFields,
    })

    const { showSpinner, hideSpinner } = useSpinner()
    const { data: expert = [], refetch } = useFindManyExpertProfile({
        where: {
            ...(searchExpert
                ? {
                      lecturer: {
                          userProfile: {
                              fullname: { contains: searchExpert, mode: 'insensitive' },
                          },
                      },
                  }
                : {}),
        },
        include: {
            lecturer: {
                include: {
                    userProfile: true,
                },
            },
        },
    })

    const { data: subjectClass } = useFindUniqueSubjectClass({
        where: {
            id: input?.subjectClassId,
        },
        include: {
            expertProfile: true,
        },
    })

    const debouncedRefetch = useCallback(
        debounce(() => {
            refetch()
        }, 500),
        []
    )

    const handleSearchExpert = (value: string) => {
        setSearchExpert(value)
        debouncedRefetch()
    }

    useEffect(() => {
        if (subjectClass) {
            form.setFieldsValue({
                expertProfileIds: subjectClass.expertProfile.map((item: { id: string }) => item.id),
            })
        }
    }, [subjectClass, form])

    const { mutateAsync: updateSubjectClass } = useUpdateSubjectClass()
    async function onOk(output?: PutSettingClass) {
        if (!output) return

        try {
            showSpinner()
            const values = (await form.validateFields()) as PutSettingClass

            if (input?.subjectClassId) {
                await updateSubjectClass({
                    where: { id: input.subjectClassId },
                    data: {
                        expertProfile: {
                            connect: values.expertProfileIds?.map((id) => ({
                                id,
                            })),
                        },
                    },
                })
                message.success('Cập nhật thành công')
            }
            onClose()
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
            internal: true,
            name: item.name || '',
            eligiblePresident: item.eligiblePresident,
            eligibleSecretary: item.eligibleSecretary,
        })) || []

    type Person = {
        id: number
        name: string
        internal: boolean // internal can be director/secretary
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

        // print summary
        console.log(`Generated ${batches.length} batches.`)
        batches.forEach((batch, bi) => {
            console.log(`\n=== Batch ${bi + 1} (committees=${batch.length}) ===`)
            batch.forEach((c, ci) => {
                console.log(
                    `C${ci + 1}: Dir=${c.director.name}, Sec=${
                        c.secretary.name
                    }, Cand=${c.candidates.map((x) => x.name).join(', ')}`
                )
            })
        })
    }

    if (ps.length !== 0) {
        main()
    }

    return (
        <PutFormModal
            open={isOpen}
            form={form}
            onFinish={onOk}
            onCancel={onClose}
            maskClosable={true}
            title="Cấu hình lớp đồ án"
            className="w-[60vw]"
        >
            <Col span={12}>
                <FormItem form={form} name="expertProfileIds" label="Danh sách chuyên gia" required>
                    <Select
                        mode="multiple"
                        placeholder="Chọn chuyên gia"
                        options={expert.map((item) => ({
                            label: `${item.lecturer?.userProfile.fullname || item.name} - ${item.code}`,
                            value: item.id,
                        }))}
                        showSearch
                        onSearch={handleSearchExpert}
                        filterOption={false}
                        allowClear
                    />
                </FormItem>
            </Col>
        </PutFormModal>
    )
}

export default PutSettingClass
