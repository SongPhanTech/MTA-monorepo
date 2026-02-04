import Select from '@components/commons/select'
import DefaultLayout from '@layouts/default-layout'
import {
    useFindManyClusterSurvey,
    useFindManyDM_DonVi,
    useFindManyLecturer,
    useFindUniqueTrainingObjectType,
} from '@workspace/db/hooks'
import { Col, Flex, Input, Row, Skeleton, Tree } from 'antd'
import { useMemo, useState } from 'react'
// import OrganizationSurveyReport from '@/components/sub-pages/khao-sat/bao-cao-don-vi'
// import ClusterSurveyReport from '@components/sub-pages/khao-sat/bao-cao-cum'
// import LecturerSurveyReport from '@components/sub-pages/khao-sat/bao-cao-giang-vien'
// import SurveyReport from '@components/sub-pages/khao-sat/bao-cao'
import { useSemesterStore, useTrainingMajorStore } from '@workspace/ui'
import { FolderOpenOutlined, UserOutlined } from '@ant-design/icons'
import SurveylecturerReport from '@components/sub-pages/khao-sat/survey-lecturer-report'
import SurveyOrganizationReport from '@components/sub-pages/khao-sat/survey-oragation-report'
// import ClusterSurveyReport from '@components/sub-pages/khao-sat/bao-cao-cum';
import OrganizationSurveyReport from '@/components/sub-pages/khao-sat/bao-cao-don-vi'
import { debounce } from 'lodash'
interface MyTreeNode {
    title: string
    key: string
    value?: string // nếu bạn muốn gán giá trị riêng
    children?: MyTreeNode[]
}

type DonVi = {
    Id: string
    sTen: string
    sParentId: string | null
    children?: DonVi[]
}

function buildOrgAndLectureTree(
    list: Array<any>,
    lecturers: Array<any>,
    parentId: string | null = null
): Array<any> {
    return list
        .filter((item) => (item.parentId ?? null) === parentId)
        .map((item) => ({
            ...item,
            parent: list.find((p) => p.id === item.parentId),
            title: item.name || 'Đơn vị không tên',
            key: item.id,
            icon: <FolderOpenOutlined />,
            selectable: true,
            children: [
                ...lecturers
                    .filter((lecturer) => lecturer.organizationId === item.id)
                    .map((lecturer) => ({
                        ...lecturer,
                        title: lecturer.userProfile?.fullName || 'Giảng viên không tên',
                        key: `${lecturer.id}`,
                        icon: <UserOutlined />,
                        parent: item,
                    })),
                ...buildOrgAndLectureTree(list, lecturers, item.id),
            ],
        }))
}

export default function BaoCaoGiangVien() {
    const [filters, setFilters] = useState<any>({
        name: '',
        surveyName: '',
        surveyId: undefined,
        lectureId: undefined,
        organizationId: undefined,
        semesterIds: undefined,
        clusterId: undefined,
    })
    const [searchText, setSearchText] = useState<any>('')
    const [selectedKeys, setSelectedKeys] = useState<any>([])
    const [selectedItem, setSelectedItem] = useState<any>()

    const { id: semesterId } = useSemesterStore()
    const { id: trainingObjectTypeId } = useTrainingMajorStore()

    const { data: trainingObjectType } = useFindUniqueTrainingObjectType(
        {
            where: { id: trainingObjectTypeId },
            select: { name: true },
        },
        {
            enabled: !!trainingObjectTypeId,
        }
    )
    const trainingObjectTypeName = useMemo(
        () => trainingObjectType?.name ?? '',
        [trainingObjectType]
    )

    const { data = [], refetch } = useFindManyClusterSurvey({
        where: {
            surveys: {
                some: {
                    semesterId,
                    trainingObjectTypeId,
                },
            },
        },
        include: {
            surveyObjectType: true,
            surveyTopic: true,
            surveyQuestion: true,
            surveys: {
                include: {
                    surveySessions: true,
                    subjectClass: {
                        include: {
                            semester: true,
                        },
                    },
                },
            },
        },
        orderBy: { createdAt: 'desc' },
    })

    const {
        data: organizations = [],
        isLoading: organizationsLoading,
        isFetching,
        error: organizationsError,
    } = useFindManyDM_DonVi(
        {
            where: {
                iLoaiDonVi: {
                    in: [0, 5, 6, 7],
                },
            },
            select: {
                Id: true,
                sMa: true,
                sTen: true,
                bActive: true,
                iCapDonVi: true,
                iDictionaryKey: true,
                iLoaiDonVi: true,
                iNhomDonVi: true,
                sParentId: true,
            },
        },

        {
            refetchOnWindowFocus: false,
        }
    )

    const { data: lecturerData = [] } = useFindManyLecturer({
        where: {
            mainSubjectClasses: {
                some: {
                    ...(!!trainingObjectTypeId && { trainingObjectTypeId }),
                },
            },
            organization: {
                iCapDonVi: {
                    in: [0, 2, 3],
                },
            },
        },
        orderBy: {
            userProfile: {
                firstName: 'asc',
            },
        },
        include: {
            userProfile: true,
            mainSubjectClasses: true,
            organization: true,
        },
    })

    function buildDonViTree(list: any[]): DonVi[] {
        const map = new Map<string, DonVi>()
        const roots: DonVi[] = []

        // clone + init children
        list.forEach((item) => {
            map.set(item.key, { ...item, children: [] })
        })

        list.forEach((item) => {
            const node = map.get(item.Id)!

            // iCapDonVi = 2 → node gốc
            if (item.iCapDonVi === 2) {
                node.sParentId = null
                roots.push(node)
                return
            }

            // node con
            if (item.sParentId && map.has(item.sParentId)) {
                map.get(item.sParentId)!.children!.push(node)
            }
        })

        return roots
    }

    // Tạo treeData từ organizations và lecturers
    const treeData: any[] = useMemo(() => {
        if (!organizations.length || !lecturerData.length) return []
        // const treeData1 = buildDonViTree(organizations.map(i=>{return {...i,key:i.Id,title:i.sTen}}))

        // console.log(treeData1, '123')
        // return treeData1
        return buildOrgAndLectureTree(
            organizations.map((org) => ({
                ...org,
                id: org.Id,
                name: `${org.sMa} - ${org.sTen}`,
                parentId: org.sParentId,
            })),
            lecturerData.map((lec) => ({
                ...lec,
                id: lec.id,
                userProfile: {
                    ...lec.userProfile,
                    fullName:
                        `${lec.userProfile?.lastName ?? ''} ${
                            lec.userProfile?.firstName ?? ''
                        }`.trim() || 'Giảng viên không tên',
                },
                selectable: true,
                organizationId: lec.organizationId,
            })),
            null
        )
    }, [organizations, lecturerData])

    // const { data: SubjectVersion = [], isLoading } = useFindManySurvey(
    //     {
    //         include: {
    //             lecture: true,
    //             subjectClass: true,
    //         },
    //         where: {
    //             lectureId: filters?.lectureId,
    //             active: true,
    //             clusterSurveyId: filters?.clusterId,
    //         },
    //     },
    //     { enabled: !!filters?.lectureId || !!filters?.clusterId }
    // )

    const hanleSearchReport = () => {}

    const items = useMemo(() => {
        if (!filters?.clusterId) {
            return <div className="my-10 text-center text-primary text-base">Chọn đợt khảo sát</div>
        }
        if (filters?.clusterId) {
            if (selectedItem?.id && selectedItem?.iCapDonVi === 0) {
                return (
                    <OrganizationSurveyReport
                        selectedId={filters?.clusterId}
                        surveyName={filters?.surveyName}
                        organizationId={selectedItem?.id}
                        trainingObjectTypeName={trainingObjectTypeName}
                    />
                )
            }

            if (selectedItem?.id && selectedItem?.iCapDonVi) {
                return (
                    <SurveyOrganizationReport
                        selectedId={filters.clusterId}
                        organizationId={selectedItem.id}
                        surveyName={filters?.surveyName}
                        trainingObjectTypeName={trainingObjectTypeName}
                        organizationName={
                            selectedItem.iCapDonVi === 3
                                ? selectedItem.parent?.sTen
                                : selectedItem.sTen
                        }
                        organizationCode={
                            selectedItem.iCapDonVi === 3
                                ? selectedItem.parent?.sMa
                                : selectedItem.sMa
                        }
                        departmentName={selectedItem.iCapDonVi === 3 ? selectedItem.sTen : ''}
                        departmentCode={selectedItem.iCapDonVi === 3 ? selectedItem.sMa : ''}
                    />
                )
            }

            if (selectedItem?.id && !selectedItem?.iCapDonVi) {
                const org = selectedItem.organization
                const isDepartment = org?.iCapDonVi === 3
                return (
                    <SurveylecturerReport
                        selectedId={filters?.clusterId}
                        lectureId={selectedItem?.id}
                        surveyName={filters?.surveyName}
                        trainingObjectTypeName={trainingObjectTypeName}
                        organizationName={isDepartment ? org.parent?.sTen : org?.sTen}
                        organizationCode={isDepartment ? org.parent?.sMa : org?.sMa}
                        lecturerName={selectedItem?.userProfile?.fullName}
                        lecturerCode={selectedItem?.code}
                        departmentName={isDepartment ? org?.sTen : ''}
                        departmentCode={isDepartment ? org?.sMa : ''}
                    />
                )
            }
            return <>Vui lòng chọn đối tượng</>
            // if (filtersMore.surveyId) {
            //     return <SurveyReport selectedId={filtersMore?.surveyId || ''} />
            // }
            // if (filtersMore.lectureId) {
            //     return (
            //         <LecturerSurveyReport
            //             selectedId={filtersMore?.clusterId}
            //             lectureId={filtersMore?.lectureId || ''}
            //             sublectClass={filters}
            //             setSublectClass={(value: any) => {
            //                 setFilters({ ...filters, surveyId: value })
            //             }}
            //         />
            //     )
            // }
            // if (filtersMore.organizationId) {
            //     return (
            //         <ClusterSurveyReport
            //             selectedId={filtersMore?.clusterId}
            //             surveyName={filtersMore?.name}
            //             surveyId={filters?.surveyId || ''}
            //             setSurvey={(value) => {
            //                 setFilters({ ...filters, surveyId: value })
            //             }}
            //             organizationSelected={filters?.organizationId}
            //         />
            //     )
            // }
            // return (
            //     <OrganizationSurveyReport
            //         selectedId={filtersMore?.clusterId}
            //         surveyName={filtersMore?.name}
            //         organizationSelected={filters?.organizationId}
            //         setOrganizationSelected={(value) => {
            //             setFilters({ ...filters, organizationId: value })
            //         }}
            //     />
            // )
        }
        return
    }, [filters, selectedItem, trainingObjectTypeName])
    return (
        <Row gutter={[16, 4]}>
            <Col span={24}>
                <Flex justify="space-between">
                    <Flex>
                        <Select
                            onChange={(value, option: any) => {
                                setFilters((prev: any) => ({
                                    ...prev,
                                    clusterId: value,
                                    surveyName: option?.label,
                                }))
                                console.log(option?.label)
                            }}
                            className="mr-4 w-[250px]"
                            options={data.map((i) => {
                                return {
                                    label: i.name,
                                    value: i.id,
                                }
                            })}
                            placeholder="Chọn đợt khảo sát"
                            dropdownStyle={{
                                maxHeight: 400,
                                overflow: 'auto',
                                width: 'fit-content',
                                maxWidth: 400,
                            }}
                            dropdownMatchSelectWidth={false}
                        />
                        <Input
                            placeholder="Tìm kiếm"
                            className="mr-4 w-[250px]"
                            value={searchText}
                            onChange={debounce((e) => {
                                setSearchText(e.target.value)
                            }, 500)}
                        />
                    </Flex>
                    {/* <Button onClick={hanleSearchReport} type="primary">
                        Tìm kiếm
                    </Button> */}
                </Flex>
            </Col>
            <Col span={6}>
                {isFetching ? (
                    <Skeleton />
                ) : (
                    <Tree
                        showIcon
                        selectedKeys={selectedKeys}
                        treeData={treeData}
                        className="w-full mb-3"
                        onSelect={(key, info) => {
                            setSelectedKeys(key)
                            setSelectedItem(info.node)
                            // setFilters((prev: any) => ({
                            //     ...prev,
                            // }))
                            // console.log('selectedItem:', info.node)
                        }}
                    />
                )}
            </Col>

            <Col span={18}>{isFetching ?<Skeleton />:items}</Col>
        </Row>
    )
}
BaoCaoGiangVien.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
