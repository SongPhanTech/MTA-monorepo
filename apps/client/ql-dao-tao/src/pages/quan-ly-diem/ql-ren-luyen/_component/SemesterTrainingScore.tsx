import Table from '@components/commons/table'
import {  Button,
Col, Flex, Form, InputNumber, message, Row,Tag } from 'antd'
import { FilterProps } from '@constants/type'
import { useEffect,
useMemo, useState } from 'react'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import { useAbility } from '@workspace/permissions/hooks'
import { useRouter } from 'next/router'
import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import { QL_DAO_TAO_PERMISSION } from '@workspace/router'
import {
    useCountStudent,
    useFindManyStudent,
} from '@workspace/db/hooks'
import { useSemesterStore } from '@workspace/ui'
import dayjs from 'dayjs';
import { UserProfile } from '@workspace/db';
import { useStudentTrainingTypeOptions,
useTrainingScoreStatusStatusOptions } from '@hooks/studentTrainingType';
import { Save } from 'lucide-react';
import useSpinner from '@hooks/spinner';
import { sqlTransaction } from '@workspace/libs/api/model';
// import { useDisclosure } from 'react-hook-disclosure-modal'
export default function SemesterTrainingScore({selectedFixedClass}:{selectedFixedClass?:string}) {

    const { showSpinner, hideSpinner } = useSpinner()
    const [form] = Form.useForm<{ list: Record<string, { score: number | null }> }>()
    const router = useRouter()
    const { id: semesterId } = useSemesterStore()
    const { can, canSome } = useAbility()
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [filters, setFilters] = useState<FilterProps>({
        code: '',
        name: '',
    })
        const {
        options: studentTrainingTypeOptions,
        getStudentTrainingTypeLabel,
        getStudentTrainingTypeColor,
    } = useStudentTrainingTypeOptions()
    const {
        statusOptions: trainingScoreStatusOptions,
        getTrainingScoreStatusLabel,
        getTrainingScoreStatusColor,
    } = useTrainingScoreStatusStatusOptions()

    const where = useMemo(
        () => ({
            fixedClass: {
                id: selectedFixedClass
            },
            // semesterTrainingScore: {
            //     some: {
            //         semesterId:semesterId
            //     }
            // },
            ...(filters.code
                ? {
                      code: {
                          contains: filters.code,
                          mode: 'insensitive' as const,
                      },
                  }
                : {}),
                 ...(filters.name
                ? {
                    userProfile:{
                        OR: [
                            {
                                fullname: {
                                    contains: filters.name,
                                    mode: 'insensitive' as const,
                                },
                            },
                            {
                                firstName: {
                                    contains: filters.name,
                                    mode: 'insensitive' as const,
                                },
                            },
                             {
                                lastName: {
                                    contains: filters.name,
                                    mode: 'insensitive' as const,
                                },
                            },
                        ]
                    }
                  }
                : {}),
        }),
        [filters,selectedFixedClass]
    )

    const { data = [], refetch } = useFindManyStudent({
        where,
        include: {
           userProfile: true,
           semesterTrainingScore: {
            where: {
                semesterId:semesterId
            }
           }
        },
        orderBy: [{ createdAt: 'desc' }],
        take: numberOfPages,
        skip: (currentPage - 1) * numberOfPages,
    },{
        enabled:!!selectedFixedClass
    })

    const { data: count, refetch: refetchCount } = useCountStudent({
        where: {
            ...where,
            deletedAt: null,
        },
    },{
        enabled:!!selectedFixedClass
    })

    // const { onOpen, onClose } = useDisclosure<{
    //     tag?: string
    //     preSelectedValues?: {
    //         trainingObjectTypeId?: string
    //         trainingCourseId?: string
    //         fixedClassId?: string
    //     }
    //     id?: string | null
    // }>({
    //     tag: 'PutStudentModal',
    // })

    //  const handleModal = () => {
    //     onOpen({
    //         preSelectedValues: {},
    //     })
    // }

     const handleSave = async () => {
        try {
            showSpinner()
            const dataSubmit=form.getFieldsValue()
            const keys = Object.keys(dataSubmit.list);
            const listCreate:any= [];
            const listUpdate:any= [];
           Object.entries(dataSubmit.list).forEach(([key, value])=> {
                  const item:any = data.find(i=>i.id===key);
                if (item?.semesterTrainingScore?.length>0) {
                    listUpdate.push({
                        ...item,
                        semesterTrainingScoreId: item.semesterTrainingScore[0].id,
                        score: value.score,
                    });
                }else {
                    listCreate.push({
                        ...item,
                        score: value.score,
                    })
                }
            });
           
            let listTransaction: any = [];
            if (listCreate.length > 0) {
                listTransaction.push({
                  model: 'SemesterTrainingScore',
                        operation: 'createMany',
                        data:{
                            data: listCreate.map((t:any) => {
                                return {
                                    studentId: t.id,
                                    score: t.score,
                                    semesterId:semesterId
                                }
                            })
                        }

                });
            }
            if (listUpdate.length > 0) {
                listUpdate.forEach((t:any) => {
                      listTransaction.push({
                  model: 'SemesterTrainingScore',
                        operation: 'update',
                        data:{
                            where:{
                                id:t.semesterTrainingScoreId
                            },
                            data: {
                        score: t.score,
                            }
                        }

                });
                })
              
            }
            if (listTransaction.length > 0) {
                const res = await sqlTransaction(listTransaction)
                if (res?.status === 200) {
                    message.success('Lưu điểm rén luyện thành công');
                    refetch();
            }
            } 

            
      

            // message.success('Lưu điểm rèn luyện thành công')
            // refetch()
            // setEditableData(new Map())
        } catch (error) {
            message.error('Đã xảy ra lỗi khi lưu điểm rèn luyện')
        } finally {
            hideSpinner()
        }
    }
        // biome-ignore lint/correctness/useExhaustiveDependencies: <>
        useEffect(() => {
      if(data?.length>0){
        const list=data.map(i=>{
            return {
                score:i.semesterTrainingScore[0]?.score,
            }
        })
         form.setFieldsValue({
                list: data.reduce(
                    (acc, cur) => {
                        if (!acc) {
                            return {

                            }
                        }
                        acc[cur.id] = {
                            ...cur,
                            score: cur.semesterTrainingScore[0]?.score
                        }
                        return acc
                    },
                    {} as any
                ),
            })
      }
    }, [data])
    return (
        <Row gutter={[0, 0]}>
                 <Col span={24}>
                <Flex justify="end" align="center">
                        {can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DIEM_QL_REN_LUYEN, 'SUA') && (
                                        <Button
                                            type="primary"
                                            onClick={handleSave}
                                        >
                                            <Save stroke="white" />
                                            Lưu
                                        </Button>
                                )}
                </Flex>
            </Col>
            <Col span={24}>
                <Form form={form}>
                    <Form.Item name="list">
                               <Table
                    filters={filters}
                    setFilters={(value) => {
                        setFilters(value)
                        setCurrentPage(1)
                    }}
                    columns={[
                        {
                            title: 'STT',
                            width: 50,
                            align: 'center',
                            fixed: 'left',
                            render: (_, __, index) =>
                                index + 1 + (currentPage - 1) * DEFAULT_PAGINATE_SIZE,
                        },
                        {
                                        title: 'Mã sinh viên',
                                        align: 'center',
                                        width: 150,
                                        render: (_, record) => record.code || '',
                                    },
                                    {
                                        title: 'Họ và tên',
                                        align: 'center',
                                        dataIndex: 'name',
                                        render: (_, record) => record?.userProfile?.fullname,
                                    },
                                             {
                                title: 'Ngày sinh',
                                align: 'center',
                                width: 120,
                                render: (__, record) =>
                                    record.userProfile?.dateOfBirth
                                        ? dayjs(record.userProfile.dateOfBirth).format('DD/MM/YYYY')
                                        : '',
                            },
                            {
                                title: 'CCCD',
                                align: 'center',
                                width: 100,
                                dataIndex: 'idCardNumber',
                                type: 'input',
                                render: (__, record: { userProfile?: UserProfile }) =>
                                    record.userProfile?.idCardNumber,
                            },
                            {
                                    title: 'Điểm',
                                    width: 150,
                                    align: 'center',
                                    fixed: 'left',
                                    render: (_, record) => {
                                        return (
                                            <Form.Item
                                                className="w-full mb-0"
                                                name={['list', record.id, 'score']}
                                                label=""
                                                // rules={[
                                                //     {
                                                //         validator: (_, value) =>
                                                //             validateExamScore(value),
                                                //     },
                                                // ]}
                                            >
                                                <InputNumber
                                                    style={{ width: '100%' }}
                                                    step={1}
                                                    controls={false}
                                                    parser={(value) => {
                                                        if (!value) return ''
                                                        const num = Number(value)
                                                        if (Number.isNaN(num)) return ''
                                                        return num > 10
                                                            ? Number((num / 10).toFixedSmart(2))
                                                            : num
                                                    }}
                                                    formatter={(value) => {
                                                        if (!value) return ''
                                                        const num = Number(value)
                                                        if (Number.isNaN(num)) return ''
                                                        return num > 10
                                                            ? (num / 10).toFixedSmart(2)
                                                            : num.toString()
                                                    }}
                                                />
                                            </Form.Item>
                                        )
                                    },
                                },
                               {
                                        title: 'Trạng thái',
                                        align: 'center',
                                        dataIndex: 'name',
                                        width: 150,
                                        render: (_, record) => (
                                            <Tag
                                                color={getTrainingScoreStatusColor(
                                                    record.status
                                                )}
                                            >
                                                {getTrainingScoreStatusLabel(record.status)}
                                            </Tag>
                                        ),
                                    },

                        {
                            title: 'Thao tác',
                            width: 130,
                            align: 'center',
                            fixed: 'right',
                            render: (_, record) => (
                                <Row className="justify-center gap-2">
                                    {can(
                                        QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_HO_SO_QL_SINH_VIEN,
                                        'SUA'
                                    ) && (
                                        <EditIcon
                                            // onClick={onOpenUpdate.bind(null, {
                                            //     id: record.id,
                                            // })}
                                            className="text-sm text-blue-700 cursor-pointer"
                                        />
                                    )}
                                    {can(
                                        QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_HO_SO_QL_SINH_VIEN,
                                        'XOA'
                                    ) && (
                                        <DeleteIcon
                                        // popConfirm={{
                                        //     onConfirm: () => handleDelete(record.id),
                                        // }}
                                        />
                                    )}
                                </Row>
                            ),
                        },
                    ]}
                    rowKey="id"
                    // rowSelection={{
                    //     selectedRowKeys,
                    //     onChange: (selectedKeys) => setSelectedRowKeys(selectedKeys),
                    // }}
                    data={data}
                    pagination={{
                        current: currentPage,
                        pageSize: numberOfPages,
                        total: count,

                        onChange: (page, pageSize) => {
                            if (numberOfPages === pageSize) {
                                setCurrentPage(page)
                            } else {
                                setCurrentPage(1)
                                setNumberOfPages(pageSize)
                            }
                        },
                        showTotal: (total, range) =>
                            `${range[0]} - ${range[1]} trong tổng số ${total} bản ghi`,
                    }}
                />
                    </Form.Item>
                </Form>
        
            </Col>
        </Row>
    )
}
