import useSpinner from '@hooks/spinner'
import { Col, Form, message, TreeSelect } from 'antd'
import dayjs from 'dayjs'
import { useDisclosure } from 'react-hook-disclosure-modal'
import 'dayjs/locale/vi'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import TreeSelectSemester from '@components/commons/semester-select/TreeSelectSemester'
import { buildOrgTree } from '@lib/utils'
import { useFindManyDM_DonVi } from '@workspace/db/hooks'
import { exportPhanCongGiangDay } from '@workspace/libs/api/training'
import { saveAs } from 'file-saver'
import { useEffect } from 'react'

dayjs.locale('vi')

interface FilterProps {
    organizationId?: string
    semesterId?: string
}

const ModalExportFileSubjectClass = () => {
    const [form] = Form.useForm<Record<string, unknown>>()
    const {
        isOpen,
        onClose,
        input: id,
    } = useDisclosure<string>({
        tag: 'ModalExportFileSubjectClass',
        onClose: form.resetFields,
    })
    const { showSpinner, hideSpinner } = useSpinner()

    const { data: manageOrgData = [] } = useFindManyDM_DonVi({ orderBy: { sTen: 'asc' } })
    const treeData = buildOrgTree(manageOrgData)

    const handleExport = async (output?: FilterProps) => {
        if (!output?.organizationId || !output?.semesterId) {
            message.warning('Vui lòng chọn đầy đủ đơn vị và học kỳ')
            return
        }

        try {
            showSpinner()
            const res = await exportPhanCongGiangDay({
                organizationId: output.organizationId || '',
                semesterId: output.semesterId || '',
            })

            if (!res) {
                throw new Error('No response from server')
            }

            if (res.status === 200) {
                const currentDate = dayjs().format('DD-MM-YYYY')
                const filename = `PhanCongGiangDay_${currentDate}.xlsx`
                const blob = new Blob([res.data], {
                    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                })
                saveAs(blob, filename)
                message.success('Xuất file thành công')
            } else {
                throw new Error(`Server responded with status ${res.status}`)
            }
        } catch (error) {
            console.error('Export error:', error)
            message.error(
                `Xuất file thất bại: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`
            )
        } finally {
            hideSpinner()
        }
    }

    // biome-ignore lint/correctness/useExhaustiveDependencies: <>
    useEffect(() => {
        form.setFieldsValue({
            semesterId: id,
        })
    }, [])

    return (
        <PutFormModal
            form={form}
            onFinish={handleExport}
            open={isOpen}
            onCancel={onClose}
            title={'Xuất file mẫu'}
            className="w-[30vw]"
        >
            <Col span={24}>
                <FormItem form={form} name="organizationId" label="Đơn vị phụ trách" required>
                    <TreeSelect
                        placeholder="Chọn đơn vị quản lý"
                        allowClear
                        showSearch
                        treeDefaultExpandAll
                        treeData={treeData}
                        filterTreeNode={(input, node) =>
                            (node?.label as string)?.toLowerCase()?.includes(input?.toLowerCase())
                        }
                    />
                </FormItem>
            </Col>
            <Col span={24}>
                <FormItem form={form} name="semesterId" label="Kỳ học" required>
                    <TreeSelectSemester defaultValue={id || undefined} />
                </FormItem>
            </Col>
        </PutFormModal>
    )
}

export default ModalExportFileSubjectClass
