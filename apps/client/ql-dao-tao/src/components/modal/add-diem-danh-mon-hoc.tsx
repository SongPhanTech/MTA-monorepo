import PutFormModal from '@components/commons/put-modal'
import useSpinner from '@hooks/spinner'
import {
    useFindManyDM_GioiTinh,
    useFindManySubjectClassAttendanceStudent,
} from '@workspace/db/hooks'
import { Checkbox, Form, message } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import { sqlTransaction } from '@workspace/libs/api/model'
import { useSession } from '@workspace/auth/react'
import { Table } from '@components/commons/table'
import { queryClient } from '@api/index'
import dayjs from 'dayjs'
import { FilterProps } from '@constants/type'
export type PutSubjectClassAttendance = {
    list: any[]
}

const AddSubjectClassAttendanceStudent = () => {
    const [form] = Form.useForm<PutSubjectClassAttendance>()
    const { data: sessionData } = useSession()
    const [filters, setFilters] = useState<FilterProps>({
        code: '',
        name: '',
        dateOfBirth: undefined,
        academicRankType: undefined,
        academicDegreeType: undefined,
        organization: undefined,
        gender: undefined,
        rankId: undefined,
        officerNumber: undefined,
        staffType: undefined,
        idCardNumber: undefined,
    })
    const id = sessionData?.sDM_NhanVienId || '266369db-fbaa-453e-b5fc-147ed06f959d'
    const { isOpen, onClose, input } = useDisclosure<{ id?: string; subjectClassId?: string }>({
        tag: 'AddSubjectClassAttendanceStudent',
        onClose: form.resetFields,
    })
    // const { data: initialValue } = useFindUniqueSubjectClassAttendance(
    //     {
    //         where: { id: input?.id },
    //         include:{
    //             subjectClassAttendanceStudent:true,
    //             subjectClass:{
    //                 include:{
    //                     subjectClassStudent:true
    //                 }
    //             }
    //         }
    //     },
    //     {
    //         refetchOnWindowFocus: false,
    //         enabled: !!input?.id,
    //     }
    // )
    const where: any = useMemo(() => {
        return {
            subjectClassAttendanceId: input?.id,
            ...((filters.name ||
                filters.idCardNumber ||
                filters.gender ||
                filters.dateOfBirth?.length === 2) && {
                student: {
                    userProfile: {
                        ...(filters.name
                            ? {
                                  fullname: {
                                      contains: filters.name,
                                      mode: 'insensitive',
                                  },
                              }
                            : {}),
                        ...(filters.idCardNumber
                            ? {
                                  idCardNumber: {
                                      contains: filters.idCardNumber,
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
                },
            }),
            ...(filters.code
                ? {
                      code: {
                          contains: filters.code,
                          mode: 'insensitive',
                      },
                  }
                : {}),
        }
    }, [input?.id, filters])
    const { data: dataStudent = [] } = useFindManySubjectClassAttendanceStudent(
        {
            where,
            include: {
                subjectClassAttendance: true,
                student: {
                    include: {
                        userProfile: {
                            include: {
                                gender: true,
                            },
                        },
                    },
                },
            },
        },
        {
            refetchOnWindowFocus: false,
            enabled: !!input?.id,
        }
    )
    const { showSpinner, hideSpinner } = useSpinner()
    async function onOk(output?: PutSubjectClassAttendance) {
        if (!output || !input?.subjectClassId) return

        try {
            showSpinner()
            let listTransacyion: any = []
            dataStudent.forEach((opt, index) => {
                listTransacyion.push({
                    model: 'SubjectClassAttendanceStudent',
                    operation: 'update',
                    data: {
                        where: { id: opt.id },
                        data: {
                            attendanceStatus: output.list[index].attendanceStatus,
                        },
                    },
                })
            })
            let res = await sqlTransaction(listTransacyion)
            if (res.status === 200) {
                message.success('Điểm danh thành công')
                queryClient.invalidateQueries({
                    queryKey: ['zenstack', 'SubjectClassAttendance'],
                })
                onClose()
            }
        } catch (error: any) {
            message.error('Điểm danh thất bại')
        } finally {
            hideSpinner()
        }
    }
    const { data: genderTypeData = [] } = useFindManyDM_GioiTinh()
    // biome-ignore lint/correctness/useExhaustiveDependencies: <>
    useEffect(() => {
        if (dataStudent) {
            form.setFieldsValue({
                list: dataStudent,
            })
        }
    }, [dataStudent])

    return (
        <PutFormModal
            open={isOpen}
            form={form}
            onFinish={onOk}
            onCancel={onClose}
            maskClosable={true}
            title={input?.id ? 'Điểm danh' : 'Điểm danh'}
            className="w-[1000px]"
        >
            <Table
                rowKey="id"
                dataSource={dataStudent}
                filters={filters}
                setFilters={(value) => {
                    setFilters(value)
                }}
                columns={[
                    {
                        title: 'STT',
                        width: 40,
                        align: 'center',
                        fixed: 'left',
                        render: (_, __, index) => index + 1,
                    },
                    {
                        title: 'Mã SV',
                        width: 150,
                        align: 'center',
                        dataIndex: 'code',
                        type: 'input',
                        render: (_, record) => record?.student?.code || '',
                    },
                    {
                        title: 'Tên sinh viên',
                        width: 250,
                        align: 'center',
                        dataIndex: 'name',
                        type: 'input',
                        render: (_, record) => record?.student?.userProfile?.fullname || '',
                    },
                    {
                        title: 'CCCD/CMND',
                        width: 150,
                        align: 'center',
                        dataIndex: 'idCardNumber',
                        type: 'input',
                        render: (__, record) =>
                            record?.student?.userProfile
                                ? `${record?.student?.userProfile?.idCardNumber}`
                                : '',
                    },
                    {
                        title: 'Ngày sinh',
                        width: 150,
                        align: 'center',
                        dataIndex: 'dateOfBirth',
                        type: 'date',
                        render: (__, record) =>
                            record?.student?.userProfile?.dateOfBirth
                                ? dayjs(record?.student?.userProfile?.dateOfBirth).format(
                                      'DD/MM/YYYY'
                                  )
                                : '',
                    },
                    {
                        title: 'Giới tính',
                        align: 'center',
                        width: 100,
                        type: 'select',
                        dataIndex: 'gender',
                        options: genderTypeData.map((i) => ({
                            label: i.sTen,
                            value: i.Id,
                        })),
                        render: (__, record) =>
                            record?.student?.userProfile?.gender?.sTen
                                ? record?.student?.userProfile?.gender?.sTen
                                : '',
                    },
                    {
                        title: 'Điểm danh',
                        width: 50,
                        align: 'center',
                        render: (_, record, index) => {
                            return (
                                <Form.Item
                                    className="w-full mb-0"
                                    name={['list', index, 'attendanceStatus']}
                                    label=""
                                    valuePropName="checked"
                                >
                                    <Checkbox className="w-full flex justify-center" />
                                </Form.Item>
                            )
                        },
                    },
                ]}
                pagination={{
                    hideOnSinglePage: true,
                }}
            />
        </PutFormModal>
    )
}

export default AddSubjectClassAttendanceStudent
