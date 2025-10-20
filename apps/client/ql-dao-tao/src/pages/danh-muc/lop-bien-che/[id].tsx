import { SafetyCertificateOutlined } from '@ant-design/icons'
import Table from '@components/commons/table'
import DeleteIcon from '@components/icons/delete'
import ExportStudentInFixedClass from '@components/modal/export-list-student-in-fixedClass'
import { FIXED_CLASS_STUDENT_STATUS } from '@constants/constants'
import type { FilterProps } from '@constants/type'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import type { Student } from '@workspace/db'
import {
    useFindManyCurriculumVersion,
    useFindManyDM_GioiTinh,
    useFindManyStudent,
    useFindManyTrainingField,
    useFindManyTrainingMajor,
    useFindUniqueFixedClass,
    useUpdateManyStudent,
    useUpdateStudent,
} from '@workspace/db/hooks'
import { Docxtemplater, exportFile, loadFile } from '@workspace/libs/docxjs'
import { saveAs } from 'file-saver'
import { ROUTER_PATH } from '@workspace/router'
import { Button, Col, Divider, Dropdown, Flex, message, Popconfirm, Row, Tag, Tooltip } from 'antd'
import dayjs from 'dayjs'
import _ from 'lodash'
import { BookCheckIcon } from 'lucide-react'
import { useRouter } from 'next/router'

import { useCallback, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import { useTrainingObjectTypeStore } from '@workspace/ui'
import ReportGenerator from '@components/report/ReportGenerator'
dayjs.locale('vi')

export default function StudentFixedClassPage() {
    const router = useRouter()
    const fixedClassId = router.query.id as string
    const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([])
    const [open, setOpen] = useState(false)
    const [filters, setFilters] = useState<FilterProps>({
        gender: undefined,
        name: '',
        code: '',
        curriculumVersion: undefined,
        trainingMajors: undefined,
        trainingField: undefined,
        dateOfBirth: undefined,
        phone: undefined,
        statusStudent: undefined,
        rank: undefined,
    })
    const { data: trainingMajorData = [] } = useFindManyTrainingMajor({
        orderBy: { name: 'asc' },
    })

    const { data: trainingFieldData = [] } = useFindManyTrainingField({
        orderBy: { name: 'asc' },
    })

    const { data: curriculumVersionData = [] } = useFindManyCurriculumVersion({
        orderBy: { name: 'asc' },
    })

    const { getLabel: getLabelTrainingObjectType } = useTrainingObjectTypeStore()
    const { data: genderData = [] } = useFindManyDM_GioiTinh()

    const { data: fixedClass } = useFindUniqueFixedClass(
        {
            where: {
                id: fixedClassId,
            },
            include: {
                _count: {
                    select: {
                        students: {
                            where: {
                                active: true,
                                status: 'ENROLLED',
                            },
                        },
                    },
                },
                trainingCourse: {
                    include: {
                        trainingObjectType: true,
                    },
                },
                curriculumVersion: {
                    include: {
                        curriculum: {
                            include: {
                                trainingMajor: {
                                    include: {
                                        trainingField: true,
                                    },
                                },
                            },
                        },
                        trainingBlocks: {
                            include: {
                                subjects: {
                                    include: {
                                        subject: {
                                            include: {
                                                managementOrganization: true,
                                            },
                                        },
                                        trainingBlockOnCurriculumVersion: {
                                            select: {
                                                trainingBlock: {
                                                    select: {
                                                        name: true,
                                                    },
                                                },
                                            },
                                        },
                                    },
                                    orderBy: {
                                        semester: 'asc',
                                    },
                                },
                            },
                            orderBy: {
                                priority: 'asc',
                            },
                        },
                    },
                },
                managementOrganization: true,
            },
        },
        {
            enabled: !!fixedClassId,
        }
    )

    const { data = [], refetch } = useFindManyStudent({
        where: {
            fixedClassId,
            userProfile: {
                OR: [
                    {
                        firstName: {
                            contains: filters.name,
                            mode: 'insensitive',
                        },
                    },
                    {
                        lastName: {
                            contains: filters.name,
                            mode: 'insensitive',
                        },
                    },
                ],
                ...(filters.rank
                    ? {
                          rank: {
                              sTen: {
                                  contains: filters.rank,
                                  mode: 'insensitive',
                              },
                          },
                      }
                    : {}),
                ...(filters.phone
                    ? {
                          phoneNumber: {
                              contains: filters.phone,
                              mode: 'insensitive',
                          },
                      }
                    : {}),
                ...(filters.gender
                    ? {
                          genderId: {
                              in: filters.gender,
                          },
                      }
                    : {}),
                ...(filters.dateOfBirth?.length === 2
                    ? {
                          dateOfBirth: {
                              gte: dayjs(filters.dateOfBirth?.[0], 'DD/MM/YYYY').toDate(),
                              lte: dayjs(filters.dateOfBirth?.[1], 'DD/MM/YYYY').toDate(),
                          },
                      }
                    : {}),
            },

            ...(filters.code
                ? {
                      code: {
                          contains: filters.code,
                          mode: 'insensitive',
                      },
                  }
                : {}),
            ...(filters.curriculumVersion
                ? {
                      curriculumVersionId: {
                          in: filters.curriculumVersion,
                      },
                  }
                : {}),
            ...(filters.statusStudent
                ? {
                      status: {
                          in: filters.statusStudent,
                      },
                  }
                : {}),
            fixedClass: {
                curriculumVersion: {
                    curriculum: {
                        trainingMajor: {
                            ...(filters.trainingMajors
                                ? {
                                      id: {
                                          in: filters.trainingMajors,
                                      },
                                  }
                                : {}),
                            ...(filters.trainingField
                                ? {
                                      trainingFieldId: {
                                          in: filters.trainingField,
                                      },
                                  }
                                : {}),
                        },
                    },
                },
            },
        },
        include: {
            userProfile: {
                include: {
                    rank: true,
                },
            },
            trainingObjectType: {
                include: {
                    trainingFields: {
                        include: {
                            trainingField: true,
                        },
                    },
                    trainingMajors: {
                        include: {
                            trainingMajor: true,
                        },
                    },
                },
            },
            fixedClass: {
                include: {
                    trainingCourse: true,
                    curriculumVersion: {
                        include: {
                            curriculum: {
                                include: {
                                    trainingMajor: {
                                        include: {
                                            trainingField: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
            curriculumVersion: {
                include: {
                    curriculum: true,
                },
            },
        },
        orderBy: {
            userProfile: {
                firstName: 'asc',
            },
        },
    })

    const debouncedRefetch = useCallback(
        _.debounce(() => {
            refetch()
        }, 500),
        []
    )
    const { onOpen } = useDisclosure<{
        id: string
    }>({
        tag: 'AddStudentToFixedClassModal',
    })

    const { onOpen: onOpenPrint } = useDisclosure<{
        dataTable: Student[]
        dataFixedClass: any
    }>({
        tag: 'ModalPrintToDSHV',
    })

    const { onOpen: onOpenStandardOutput } = useDisclosure<{
        id: string
    }>({
        tag: 'PutChuanDauRaModal',
    })

    // TODO!: anh TUẤN sửa
    // const { onOpen: onOpenUpdate } = useDisclosure<{
    //     tag?: string
    //     preSelectedValues?: {
    //         trainingObjectTypeId?: string
    //         trainingCourseId?: string
    //         fixedClassId?: string
    //     }
    //     id: string | null
    // }>({
    //     tag: 'PutStudentModal',
    // })

    const { showSpinner, hideSpinner } = useSpinner()

    const handleModal = () => {
        onOpen({ id: fixedClassId })
    }

    const handleModalPrint = () => {
        onOpenPrint({ dataFixedClass: fixedClass, dataTable: data })
    }

    const { mutateAsync: updateUserProfile } = useUpdateStudent()
    const { mutateAsync: updateManyUserProfile } = useUpdateManyStudent()
    async function handleDelete(id: string) {
        try {
            showSpinner()
            await updateUserProfile({
                where: {
                    id,
                },
                data: {
                    fixedClassId: null,
                },
            })
            setSelectedRowKeys([])
        } catch (error: any) {
            if (error?.info?.message) {
                message.error(error?.info?.message)
                return
            }
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        } finally {
            hideSpinner()
        }
    }

    async function handleDeleteMulti() {
        try {
            showSpinner()
            if (selectedRowKeys?.length > 0) {
                await updateManyUserProfile({
                    where: {
                        id: {
                            in: selectedRowKeys,
                        },
                    },
                    data: {
                        fixedClassId: null,
                    },
                })
            }
            setOpen(false)
            setSelectedRowKeys([])
        } catch (error: any) {
            if (error?.info?.message) {
                message.error(error?.info?.message)
                return
            }
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        } finally {
            hideSpinner()
        }
    }

    const handleCancel = () => {
        setOpen(false)
    }

    const showPopconfirm = () => {
        setOpen(true)
    }

    return (
        <div>
            <Divider orientation="left" orientationMargin={0}>
                {[
                    fixedClass?.trainingCourse?.trainingObjectType?.name,
                    fixedClass?.trainingCourse?.name,
                    fixedClass?.curriculumVersion?.name,
                    fixedClass?.curriculumVersion?.curriculum?.trainingMajor?.name,
                    fixedClass?.curriculumVersion?.curriculum?.trainingMajor?.trainingField?.name,
                ]
                    .filter(Boolean)
                    .join(' - ')}
            </Divider>
            <Row gutter={[16, 0]}>
                <Col span={24}>
                    {/* Row nút thêm */}
                    <Row gutter={[8, 8]} align="top" justify="space-between">
                        <Col span={12} />

                        {/* Hàng chứa các button */}
                        <Col xs={12}>
                            <Flex justify="end" wrap="wrap" gap="8px" className="mt-1">
                                <Dropdown
                                    menu={{
                                        items: [
                                            {
                                                label: 'CTTK dài hạn',
                                                key: 'CTTK-dai-han',
                                                onClick: async () => {
                                                    const res = await loadFile(
                                                        '/lms/templates/chuong-trinh-dao-tao/CTTK-dai-han.docx'
                                                    )
                                                    const doc = new Docxtemplater(res, {
                                                        linebreaks: true,
                                                        paragraphLoop: true,
                                                    })
                                                    await doc.renderAsync({
                                                        d: dayjs().format('DD'),
                                                        m: dayjs().format('MM'),
                                                        y: dayjs().format('YYYY'),
                                                        TEN_CTDT:
                                                            fixedClass?.curriculumVersion?.name?.toUpperCase(),
                                                        KHOA_HOC:
                                                            fixedClass?.trainingCourse?.name?.toUpperCase(),
                                                        lop_quan_ly: fixedClass?.name,
                                                        mon_hoc:
                                                            fixedClass?.curriculumVersion?.trainingBlocks
                                                                .flatMap((e) => e.subjects)
                                                                .map((e, index) => ({
                                                                    tt: index + 1,
                                                                    ten_mon: e.subject.name,
                                                                    trong_so: e.subject.credit,
                                                                    so_tiet: e.subject.period,
                                                                    dv_phu_trach:
                                                                        e.subject
                                                                            ?.managementOrganization
                                                                            ?.sMa ?? '',
                                                                    ghi_chu:
                                                                        e.trainingBlockOnCurriculumVersion?.trainingBlock?.name?.firstCase() ??
                                                                        '',
                                                                    ky_1:
                                                                        e.semester === 1 &&
                                                                        e.subject.period
                                                                            ? e.subject.period
                                                                            : '',
                                                                    ky_2:
                                                                        e.semester === 2 &&
                                                                        e.subject.period
                                                                            ? e.subject.period
                                                                            : '',
                                                                    ky_3:
                                                                        e.semester === 3 &&
                                                                        e.subject.period
                                                                            ? e.subject.period
                                                                            : '',
                                                                })),
                                                        tong_trong_so:
                                                            fixedClass?.curriculumVersion?.trainingBlocks
                                                                .flatMap((e) => e.subjects)
                                                                .reduce(
                                                                    (total, curr) =>
                                                                        total +
                                                                        (curr.subject.credit || 0),
                                                                    0
                                                                ),
                                                        tong_so_tiet:
                                                            fixedClass?.curriculumVersion?.trainingBlocks
                                                                ?.flatMap((e) => e.subjects)
                                                                .reduce(
                                                                    (total, curr) =>
                                                                        total +
                                                                        (curr.subject.period || 0),
                                                                    0
                                                                ),
                                                        tong_ky_1:
                                                            fixedClass?.curriculumVersion?.trainingBlocks
                                                                .flatMap((e) => e.subjects)
                                                                .reduce(
                                                                    (total, curr) =>
                                                                        total +
                                                                        (curr.semester === 1
                                                                            ? curr.subject.period ||
                                                                              0
                                                                            : 0),
                                                                    0
                                                                ),
                                                        tong_ky_2:
                                                            fixedClass?.curriculumVersion?.trainingBlocks
                                                                .flatMap((e) => e.subjects)
                                                                .reduce(
                                                                    (total, curr) =>
                                                                        total +
                                                                        (curr.semester === 2
                                                                            ? curr.subject.period ||
                                                                              0
                                                                            : 0),
                                                                    0
                                                                ),
                                                        tong_ky_3:
                                                            fixedClass?.curriculumVersion?.trainingBlocks
                                                                .flatMap((e) => e.subjects)
                                                                .reduce(
                                                                    (total, curr) =>
                                                                        total +
                                                                        (curr.semester === 3
                                                                            ? curr.subject.period ||
                                                                              0
                                                                            : 0),
                                                                    0
                                                                ),
                                                    })
                                                    const blob = exportFile(doc.getZip())
                                                    saveAs(
                                                        blob,
                                                        `CTTK-dai-han.${dayjs().format('DDMMYY')}.docx`
                                                    )
                                                },
                                            },
                                            {
                                                label: 'CTTK ngắn hạn',
                                                key: 'CTTK-ngan-han',
                                                onClick: async () => {
                                                    const res = await loadFile(
                                                        '/lms/templates/chuong-trinh-dao-tao/CTTK-ngan-han.docx'
                                                    )
                                                    const doc = new Docxtemplater(res, {
                                                        linebreaks: true,
                                                        paragraphLoop: true,
                                                    })
                                                    await doc.renderAsync({
                                                        d: dayjs().format('DD'),
                                                        m: dayjs().format('MM'),
                                                        y: dayjs().format('YYYY'),
                                                        TEN_CTDT:
                                                            fixedClass?.curriculumVersion?.name?.toUpperCase(),
                                                        KHOA_HOC:
                                                            fixedClass?.trainingCourse?.name?.toUpperCase(),
                                                        lop_quan_ly: fixedClass?.name,
                                                        mon_hoc:
                                                            fixedClass?.curriculumVersion?.trainingBlocks
                                                                .flatMap((e) => e.subjects)
                                                                .map((e, index) => ({
                                                                    tt: index + 1,
                                                                    ten_mon: e.subject.name,
                                                                    trong_so: e.subject.credit,
                                                                    so_tiet: e.subject.period,
                                                                    dv_phu_trach:
                                                                        e.subject
                                                                            ?.managementOrganization
                                                                            ?.sMa ?? '',
                                                                    ghi_chu:
                                                                        e.trainingBlockOnCurriculumVersion?.trainingBlock?.name?.firstCase() ??
                                                                        '',
                                                                    ky_1:
                                                                        e.semester === 1 &&
                                                                        e.subject.period
                                                                            ? e.subject.period
                                                                            : '',
                                                                    ky_2:
                                                                        e.semester === 2 &&
                                                                        e.subject.period
                                                                            ? e.subject.period
                                                                            : '',
                                                                })),
                                                        tong_trong_so:
                                                            fixedClass?.curriculumVersion?.trainingBlocks
                                                                .flatMap((e) => e.subjects)
                                                                .reduce(
                                                                    (total, curr) =>
                                                                        total +
                                                                        (curr.subject.credit || 0),
                                                                    0
                                                                ),
                                                        tong_so_tiet:
                                                            fixedClass?.curriculumVersion?.trainingBlocks
                                                                ?.flatMap((e) => e.subjects)
                                                                .reduce(
                                                                    (total, curr) =>
                                                                        total +
                                                                        (curr.subject.period || 0),
                                                                    0
                                                                ),
                                                        tong_ky_1:
                                                            fixedClass?.curriculumVersion?.trainingBlocks
                                                                .flatMap((e) => e.subjects)
                                                                .reduce(
                                                                    (total, curr) =>
                                                                        total +
                                                                        (curr.semester === 1
                                                                            ? curr.subject.period ||
                                                                              0
                                                                            : 0),
                                                                    0
                                                                ),
                                                        tong_ky_2:
                                                            fixedClass?.curriculumVersion?.trainingBlocks
                                                                .flatMap((e) => e.subjects)
                                                                .reduce(
                                                                    (total, curr) =>
                                                                        total +
                                                                        (curr.semester === 2
                                                                            ? curr.subject.period ||
                                                                              0
                                                                            : 0),
                                                                    0
                                                                ),
                                                    })
                                                    const blob = exportFile(doc.getZip())
                                                    saveAs(
                                                        blob,
                                                        `CTTK-ngan-han.${dayjs().format('DDMMYY')}.docx`
                                                    )
                                                },
                                            },
                                            {
                                                label: 'KHTK định hướng nghiên cứu',
                                                key: 'KHTK-ding-huong-nghien-cuu',
                                                onClick: async () => {
                                                    const res = await loadFile(
                                                        '/lms/templates/chuong-trinh-dao-tao/KHTK-ding-huong-nghien-cuu.docx'
                                                    )
                                                    const doc = new Docxtemplater(res, {
                                                        linebreaks: true,
                                                        paragraphLoop: true,
                                                    })
                                                    await doc.renderAsync({
                                                        d: dayjs().format('DD'),
                                                        m: dayjs().format('MM'),
                                                        y: dayjs().format('YYYY'),
                                                        HE: getLabelTrainingObjectType(
                                                            fixedClass?.trainingCourse
                                                                .trainingObjectType.type
                                                        ).toUpperCase(),
                                                        KHOA_HOC:
                                                            fixedClass?.trainingCourse?.name?.toUpperCase(),
                                                        ten_lop: fixedClass?.name,
                                                        chuyen_nganh:
                                                            fixedClass?.curriculumVersion
                                                                ?.curriculum?.trainingMajor?.name ??
                                                            '',
                                                        ma_nganh:
                                                            fixedClass?.curriculumVersion
                                                                ?.curriculum?.trainingMajor?.code ??
                                                            '',
                                                        quan_so: fixedClass?._count.students ?? 0,
                                                        mon_hoc:
                                                            fixedClass?.curriculumVersion?.trainingBlocks
                                                                .flatMap((e) => e.subjects)
                                                                .map((e, index) => ({
                                                                    tt: index + 1,
                                                                    ten_mon: e.subject.name,
                                                                    trong_so: e.subject.credit,
                                                                    so_tiet: e.subject.period,
                                                                    dv_phu_trach:
                                                                        e.subject
                                                                            ?.managementOrganization
                                                                            ?.sMa ?? '',
                                                                    ghi_chu:
                                                                        e.trainingBlockOnCurriculumVersion?.trainingBlock?.name?.firstCase() ??
                                                                        '',
                                                                    ky_1:
                                                                        e.semester === 1 &&
                                                                        e.subject.period
                                                                            ? e.subject.period
                                                                            : '',
                                                                    ky_2:
                                                                        e.semester === 2 &&
                                                                        e.subject.period
                                                                            ? e.subject.period
                                                                            : '',
                                                                    ky_3:
                                                                        e.semester === 3 &&
                                                                        e.subject.period
                                                                            ? e.subject.period
                                                                            : '',
                                                                    ky_4:
                                                                        e.semester === 4 &&
                                                                        e.subject.period
                                                                            ? e.subject.period
                                                                            : '',
                                                                })),
                                                        tong_trong_so:
                                                            fixedClass?.curriculumVersion?.trainingBlocks
                                                                .flatMap((e) => e.subjects)
                                                                .reduce(
                                                                    (total, curr) =>
                                                                        total +
                                                                        (curr.subject.credit || 0),
                                                                    0
                                                                ),
                                                        tong_so_tiet:
                                                            fixedClass?.curriculumVersion?.trainingBlocks
                                                                ?.flatMap((e) => e.subjects)
                                                                .reduce(
                                                                    (total, curr) =>
                                                                        total +
                                                                        (curr.subject.period || 0),
                                                                    0
                                                                ),
                                                        tong_ky_1:
                                                            fixedClass?.curriculumVersion?.trainingBlocks
                                                                .flatMap((e) => e.subjects)
                                                                .reduce(
                                                                    (total, curr) =>
                                                                        total +
                                                                        (curr.semester === 1
                                                                            ? curr.subject.period ||
                                                                              0
                                                                            : 0),
                                                                    0
                                                                ),
                                                        tong_ky_2:
                                                            fixedClass?.curriculumVersion?.trainingBlocks
                                                                .flatMap((e) => e.subjects)
                                                                .reduce(
                                                                    (total, curr) =>
                                                                        total +
                                                                        (curr.semester === 2
                                                                            ? curr.subject.period ||
                                                                              0
                                                                            : 0),
                                                                    0
                                                                ),
                                                        tong_ky_3:
                                                            fixedClass?.curriculumVersion?.trainingBlocks
                                                                .flatMap((e) => e.subjects)
                                                                .reduce(
                                                                    (total, curr) =>
                                                                        total +
                                                                        (curr.semester === 3
                                                                            ? curr.subject.period ||
                                                                              0
                                                                            : 0),
                                                                    0
                                                                ),
                                                        tong_ky_4:
                                                            fixedClass?.curriculumVersion?.trainingBlocks
                                                                .flatMap((e) => e.subjects)
                                                                .reduce(
                                                                    (total, curr) =>
                                                                        total +
                                                                        (curr.semester === 4
                                                                            ? curr.subject.period ||
                                                                              0
                                                                            : 0),
                                                                    0
                                                                ),
                                                    })
                                                    const blob = exportFile(doc.getZip())
                                                    saveAs(
                                                        blob,
                                                        `KHTK-ding-huong-nghien-cuu.${dayjs().format('DDMMYY')}.docx`
                                                    )
                                                },
                                            },
                                            {
                                                label: 'KHTK định hướng ứng dụng',
                                                key: 'KHTK-ding-huong-ung-dung',
                                                onClick: async () => {
                                                    const res = await loadFile(
                                                        '/lms/templates/chuong-trinh-dao-tao/KHTK-ding-huong-ung-dung.docx'
                                                    )
                                                    const doc = new Docxtemplater(res, {
                                                        linebreaks: true,
                                                        paragraphLoop: true,
                                                    })
                                                    await doc.renderAsync({
                                                        d: dayjs().format('DD'),
                                                        m: dayjs().format('MM'),
                                                        y: dayjs().format('YYYY'),
                                                        HE: getLabelTrainingObjectType(
                                                            fixedClass?.trainingCourse
                                                                .trainingObjectType.type
                                                        ).toUpperCase(),
                                                        KHOA_HOC:
                                                            fixedClass?.trainingCourse?.name?.toUpperCase(),
                                                        ten_lop: fixedClass?.name,
                                                        chuyen_nganh:
                                                            fixedClass?.curriculumVersion
                                                                ?.curriculum?.trainingMajor?.name ??
                                                            '',
                                                        ma_nganh:
                                                            fixedClass?.curriculumVersion
                                                                ?.curriculum?.trainingMajor?.code ??
                                                            '',
                                                        quan_so: fixedClass?._count.students ?? 0,
                                                        mon_hoc:
                                                            fixedClass?.curriculumVersion?.trainingBlocks
                                                                .flatMap((e) => e.subjects)
                                                                .map((e, index) => ({
                                                                    tt: index + 1,
                                                                    ten_mon: e.subject.name,
                                                                    trong_so: e.subject.credit,
                                                                    so_tiet: e.subject.period,
                                                                    dv_phu_trach:
                                                                        e.subject
                                                                            ?.managementOrganization
                                                                            ?.sMa ?? '',
                                                                    ghi_chu:
                                                                        e.trainingBlockOnCurriculumVersion?.trainingBlock?.name?.firstCase() ??
                                                                        '',
                                                                    ky_1:
                                                                        e.semester === 1 &&
                                                                        e.subject.period
                                                                            ? e.subject.period
                                                                            : '',
                                                                    ky_2:
                                                                        e.semester === 2 &&
                                                                        e.subject.period
                                                                            ? e.subject.period
                                                                            : '',
                                                                    ky_3:
                                                                        e.semester === 3 &&
                                                                        e.subject.period
                                                                            ? e.subject.period
                                                                            : '',
                                                                    ky_4:
                                                                        e.semester === 4 &&
                                                                        e.subject.period
                                                                            ? e.subject.period
                                                                            : '',
                                                                })),
                                                        tong_trong_so:
                                                            fixedClass?.curriculumVersion?.trainingBlocks
                                                                .flatMap((e) => e.subjects)
                                                                .reduce(
                                                                    (total, curr) =>
                                                                        total +
                                                                        (curr.subject.credit || 0),
                                                                    0
                                                                ),
                                                        tong_so_tiet:
                                                            fixedClass?.curriculumVersion?.trainingBlocks
                                                                ?.flatMap((e) => e.subjects)
                                                                .reduce(
                                                                    (total, curr) =>
                                                                        total +
                                                                        (curr.subject.period || 0),
                                                                    0
                                                                ),
                                                        tong_ky_1:
                                                            fixedClass?.curriculumVersion?.trainingBlocks
                                                                .flatMap((e) => e.subjects)
                                                                .reduce(
                                                                    (total, curr) =>
                                                                        total +
                                                                        (curr.semester === 1
                                                                            ? curr.subject.period ||
                                                                              0
                                                                            : 0),
                                                                    0
                                                                ),
                                                        tong_ky_2:
                                                            fixedClass?.curriculumVersion?.trainingBlocks
                                                                .flatMap((e) => e.subjects)
                                                                .reduce(
                                                                    (total, curr) =>
                                                                        total +
                                                                        (curr.semester === 2
                                                                            ? curr.subject.period ||
                                                                              0
                                                                            : 0),
                                                                    0
                                                                ),
                                                        tong_ky_3:
                                                            fixedClass?.curriculumVersion?.trainingBlocks
                                                                .flatMap((e) => e.subjects)
                                                                .reduce(
                                                                    (total, curr) =>
                                                                        total +
                                                                        (curr.semester === 3
                                                                            ? curr.subject.period ||
                                                                              0
                                                                            : 0),
                                                                    0
                                                                ),
                                                        tong_ky_4:
                                                            fixedClass?.curriculumVersion?.trainingBlocks
                                                                .flatMap((e) => e.subjects)
                                                                .reduce(
                                                                    (total, curr) =>
                                                                        total +
                                                                        (curr.semester === 4
                                                                            ? curr.subject.period ||
                                                                              0
                                                                            : 0),
                                                                    0
                                                                ),
                                                    })
                                                    const blob = exportFile(doc.getZip())
                                                    saveAs(
                                                        blob,
                                                        `KHTK-ding-huong-ung-dung.${dayjs().format('DDMMYY')}.docx`
                                                    )
                                                },
                                            },
                                        ],
                                    }}
                                >
                                    <Button type="primary">Xuất mẫu</Button>
                                </Dropdown>
                                <Popconfirm
                                    title="Xác nhận xóa dữ liệu?"
                                    description="Bạn có chắc chắn muốn xoá những sinh viên đã chọn ra khỏi lớp này không?"
                                    open={open}
                                    onConfirm={handleDeleteMulti}
                                    onCancel={handleCancel}
                                >
                                    <Button
                                        disabled={selectedRowKeys?.length <= 0}
                                        onClick={showPopconfirm}
                                        type="primary"
                                    >
                                        {selectedRowKeys?.length > 0 && (
                                            <span>({selectedRowKeys?.length})</span>
                                        )}
                                        Xoá SV khỏi lớp
                                    </Button>
                                </Popconfirm>
                                <ExportStudentInFixedClass
                                    data={data}
                                    fixedClassName={`${fixedClass?.name}_${fixedClass?.trainingCourse?.name}`}
                                />
                                <ReportGenerator />
                                <Button onClick={handleModalPrint} type="primary">
                                    In danh sách
                                </Button>
                                <Button onClick={handleModal} type="primary">
                                    Thêm SV
                                </Button>
                                {/* <Dropdown overlay={menuDownload} trigger={['hover']}>
                                    <Button type="primary" icon={<DownloadOutlined />}>
                                        Tải file mẫu
                                    </Button>
                                </Dropdown>
                                <Dropdown overlay={menuUpload} trigger={['hover']}>
                                    <Button type="primary" icon={<UploadOutlined />}>
                                        Nhập file
                                    </Button>
                                </Dropdown> */}
                            </Flex>
                        </Col>
                    </Row>
                </Col>
                <Col span={24}>
                    <Table
                        rowKey="id"
                        rowSelection={{
                            selectedRowKeys,
                            onChange: (selectedKeys: any) => setSelectedRowKeys(selectedKeys),
                        }}
                        filters={filters}
                        setFilters={setFilters}
                        columns={[
                            {
                                title: 'STT',
                                width: 60,
                                align: 'center',
                                fixed: 'left',
                                render: (_, __, index) => index + 1,
                            },
                            {
                                title: 'Mã sinh viên',
                                dataIndex: 'code',
                                fixed: 'left',
                                width: 150,
                                align: 'center',
                                type: 'input',
                            },
                            {
                                title: 'Họ và tên',
                                width: 150,
                                fixed: 'left',
                                align: 'center',
                                type: 'input',
                                dataIndex: 'name',
                                render: (__, record) =>
                                    record.userProfile
                                        ? `${record.userProfile.lastName} ${record.userProfile.firstName}`
                                        : '',
                            },
                            {
                                title: 'Ngày sinh',
                                align: 'center',
                                width: 150,
                                dataIndex: 'dateOfBirth',
                                type: 'date',
                                render: (__, record) =>
                                    record.userProfile?.dateOfBirth
                                        ? dayjs(record.userProfile.dateOfBirth).format('DD/MM/YYYY')
                                        : '',
                            },
                            {
                                title: 'Giới tính',
                                align: 'center',
                                width: 120,
                                type: 'select',
                                dataIndex: 'gender',
                                // options: [
                                //     { label: 'Nam', value: 'Male' },
                                //     { label: 'Nữ', value: 'Female' },
                                // ],
                                options: genderData.map((i) => ({
                                    label: i.sTen,
                                    value: i.Id,
                                })),

                                render: (__, record) =>
                                    record?.userProfile?.gender
                                        ? record?.userProfile?.gender?.sTen
                                        : '',
                            },
                            {
                                title: 'SĐT',
                                align: 'center',
                                width: 120,
                                dataIndex: 'phone',
                                type: 'input',
                                render: (__, record) =>
                                    record.userProfile?.phoneNumber
                                        ? record.userProfile?.phoneNumber
                                        : '',
                            },
                            {
                                title: 'Cấp bậc',
                                align: 'center',
                                width: 120,
                                dataIndex: 'rank',
                                type: 'input',
                                render: (__, record) =>
                                    record.userProfile?.rank?.sTen
                                        ? record.userProfile?.rank?.sTen
                                        : '',
                            },
                            {
                                title: 'Ngành',
                                width: 150,
                                align: 'center',
                                type: 'select',
                                dataIndex: 'trainingField',
                                options: trainingFieldData.map((item) => ({
                                    label: item.name,
                                    value: item.id,
                                })),
                                render: (__, record) => {
                                    return (
                                        record?.fixedClass?.curriculumVersion?.curriculum
                                            ?.trainingMajor?.trainingField?.name || ''
                                    )
                                },
                            },
                            {
                                title: 'Chuyên ngành',
                                width: 180,
                                align: 'center',
                                type: 'select',
                                dataIndex: 'trainingMajors',
                                options: trainingMajorData.map((item) => ({
                                    label: item.name,
                                    value: item.id,
                                })),
                                render: (__, record) => {
                                    return (
                                        record?.fixedClass?.curriculumVersion?.curriculum
                                            ?.trainingMajor?.name || ''
                                    )
                                },
                            },
                            {
                                title: 'Chương trình đào tạo',
                                width: 250,
                                align: 'center',
                                dataIndex: 'curriculumVersion',
                                type: 'select',
                                options: curriculumVersionData.map((item) => ({
                                    label: item.name,
                                    value: item.id,
                                })),
                                render: (__, record) => {
                                    const curriculum = record.curriculumVersion
                                    return curriculum ? curriculum.name : ''
                                },
                            },
                            {
                                title: 'Trạng thái',
                                align: 'center',
                                width: 120,
                                type: 'select',
                                dataIndex: 'status',
                                options: Object.entries(FIXED_CLASS_STUDENT_STATUS).map(
                                    ([value, item]) => ({
                                        label: item.label,
                                        value,
                                    })
                                ),
                                render: (_, record) => {
                                    const statusInfo =
                                        FIXED_CLASS_STUDENT_STATUS[
                                            record.status as keyof typeof FIXED_CLASS_STUDENT_STATUS
                                        ]
                                    return statusInfo ? (
                                        <Tag color={statusInfo.color}>{statusInfo.label}</Tag>
                                    ) : (
                                        <Tag color="default">Không xác định</Tag>
                                    )
                                },
                            },
                            {
                                title: 'Thao tác',
                                width: 100,
                                align: 'center',
                                fixed: 'right',
                                render: (_, { id }) => (
                                    <Row className="justify-center gap-2">
                                        <Tooltip title="Kết quả học tập">
                                            <BookCheckIcon
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    router.push(
                                                        ROUTER_PATH.QL_DAO_TAO.DANH_MUC_LOP_BIEN_CHE_KET_QUA_HOC_TAP_ID.replace(
                                                            '[id]',
                                                            id
                                                        )
                                                    )
                                                }}
                                                size={16}
                                            />
                                        </Tooltip>
                                        <Tooltip title="Chuẩn đầu ra">
                                            <SafetyCertificateOutlined
                                                onClick={() => onOpenStandardOutput(id)}
                                            />
                                        </Tooltip>
                                        <DeleteIcon
                                            popConfirm={{
                                                onConfirm: () => handleDelete(id),
                                            }}
                                        />
                                    </Row>
                                ),
                            },
                        ]}
                        data={data}
                        scroll={{ x: 'max-content' }}
                        pagination={false}
                    />
                </Col>
            </Row>
        </div>
    )
}

StudentFixedClassPage.getLayout = function getLayout(page: React.ReactElement) {
    return (
        <DefaultLayout
            breadcrumbList={[
                { title: 'Danh mục' },
                {
                    title: 'Lớp quản lý',
                    href: ROUTER_PATH.QL_DAO_TAO.DANH_MUC_LOP_BIEN_CHE,
                },
                { title: 'Chi tiết lớp quản lý' },
            ]}
        >
            {page}
        </DefaultLayout>
    )
}
