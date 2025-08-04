import { CloseOutlined, PlusOutlined } from '@ant-design/icons'
import { queryClient } from '@api/index'
import DocumentPaths from '@components/commons/documentPaths'
import FormItem from '@components/commons/form-item'
import { useDiplomaFieldOptions } from '@hooks/diplomaFields'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import type { DiplomaFields, DiplomaType, DocumentFile } from '@workspace/db'
import {
    useFindManyDiplomaPlaceHolder,
    useFindUniqueDiplomaType,
    useUpdateDiplomaType,
    useUpsertDiplomaPlaceHolder,
} from '@workspace/db/hooks'
import { ROUTER_PATH } from '@workspace/router'
import { Button, Col, Divider, Flex, Form, Input, Modal, message, Row } from 'antd'
import dayjs from 'dayjs'
import { BookPlus } from 'lucide-react'
import { useRouter } from 'next/router'
import { useEffect, useRef, useState } from 'react'
import { DndProvider, useDrag, useDrop } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'

export type PutDiplomaType = DiplomaType & {
    front?: [DocumentFile]
    back?: [DocumentFile]
}

dayjs.locale('vi')

interface FieldItem {
    id: string
    field: DiplomaFields
    top: number
    left: number
    width: number
    height: number
    side: 'front' | 'back'
    value?: string
}

const DraggableFieldComponent = ({
    item,
    onUpdatePosition,
    onRemoveField,
}: {
    item: FieldItem
    onUpdatePosition: (id: string, pos: { top: number; left: number }) => void
    onRemoveField: (id: string) => void
}) => {
    const [{ isDragging }, drag] = useDrag(
        () => ({
            type: 'FIELD',
            item: { id: item.id },
            collect: (monitor) => ({
                isDragging: !!monitor.isDragging(),
            }),
            end: (draggedItem, monitor) => {
                if (monitor.didDrop()) {
                    const dropResult = monitor.getDropResult()
                    console.log(dropResult)

                    if (
                        dropResult &&
                        typeof dropResult === 'object' &&
                        'top' in dropResult &&
                        'left' in dropResult
                    ) {
                        onUpdatePosition(draggedItem.id, {
                            top: (dropResult as { top: number; left: number }).top,
                            left: (dropResult as { top: number; left: number }).left,
                        })
                    }
                }
                console.log(item)
            },
        }),
        [item.id, onUpdatePosition]
    )

    const [, drop] = useDrop(
        () => ({
            accept: 'PLACED_FIELD',
            drop: (draggedItem: { id: string }, monitor) => {
                const offset = monitor.getClientOffset()
                console.log(111, offset)

                if (offset) {
                    const imgElement = document.querySelector('.diploma-image-container img')
                    if (imgElement) {
                        const rect = imgElement.getBoundingClientRect()
                        const top = Math.max(0, ((offset.y - rect.top) / rect.height) * 100)
                        const left = Math.max(0, ((offset.x - rect.left) / rect.width) * 100)

                        return { top, left }
                    }
                }
                return undefined
            },
        }),
        []
    )

    return (
        <div
            // ref={drag}
            className="absolute bg-white p-1 border border-dashed border-blue-500 cursor-move group"
            style={{
                top: `${item.top}%`,
                left: `${item.left}%`,
                width: `${item.width}%`,
                height: `${item.height}%`,
                opacity: isDragging ? 0.5 : 1,
            }}
        >
            <div className="relative h-full w-full">
                {item.field === 'OTHER' ? item.value : `[${item.field}]`}
                <Button
                    className="absolute -top-2 -right-2 bg-red-500 rounded-full w-4 h-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                        e.stopPropagation()
                        onRemoveField(item.id)
                    }}
                >
                    <CloseOutlined className="text-white text-xs" />
                </Button>
            </div>
        </div>
    )
}

const FieldItem = ({
    field,
    label,
    onClick,
}: {
    field: DiplomaFields
    label: string
    onClick: () => void
}) => {
    return (
        <div
            className="flex justify-between items-center px-2 py-1 border border-gray-300 rounded hover:bg-gray-50 cursor-pointer"
            onClick={onClick}
        >
            <span>{label}</span>
            <PlusOutlined />
        </div>
    )
}

const DroppableArea = ({
    documentData,
    side,
    fields,
    onUpdatePosition,
    onRemoveField,
}: {
    documentData: DocumentFile | null
    side: 'front' | 'back'
    fields: FieldItem[]
    onUpdatePosition: (id: string, pos: { top: number; left: number }) => void
    onRemoveField: (id: string) => void
}) => {
    const canvasRef = useRef<HTMLDivElement>(null)
    const [, drop] = useDrop(() => ({
        accept: 'FIELD',
        // hover: (draggedItem: { id: string }, monitor) => {
        //     const clientOffset = monitor.getClientOffset()
        //     console.log('!23:', clientOffset)

        //     const canvasRect = canvasRef.current?.getBoundingClientRect()

        //     if (clientOffset && canvasRect) {
        //         const left = clientOffset.x - canvasRect.left
        //         const top = clientOffset.y - canvasRect.top

        //         console.log('Dropped at:', { top, left })
        //         // You can update your state to place the item
        //     }
        // },
        drop(item, monitor) {
            const clientOffset = monitor.getClientOffset()

            const canvasRect = canvasRef.current?.getBoundingClientRect()
            console.log('!23:', canvasRect)

            if (clientOffset && canvasRect) {
                const left = clientOffset.x - canvasRect.left
                const top = clientOffset.y - canvasRect.top

                console.log('Dropped at:', { top, left })
                // You can update your state to place the item
            }
        },
    }))

    useEffect(() => {
        if (canvasRef) drop(canvasRef)
    }, [drop])

    return (
        <div ref={canvasRef} className="w-full h-full">
            {documentData && (
                <div className="overflow-scroll">
                    <div className="w-[297mm] relative diploma-image-container">
                        {fields
                            .filter((f) => f.side === side)
                            .map((item) => (
                                <DraggableFieldComponent
                                    key={item.id}
                                    item={item}
                                    onUpdatePosition={onUpdatePosition}
                                    onRemoveField={onRemoveField}
                                />
                            ))}
                        <img
                            src={`${process.env.NEXT_PUBLIC_MINIO_ENDPOINT}/${documentData.path}`}
                            alt={documentData.name}
                            className="w-full"
                        />
                    </div>
                </div>
            )}
        </div>
    )
}
export default function Diploma() {
    const [documentFront, setDocumentFront] = useState<DocumentFile | null>(null)
    const [documentBack, setDocumentBack] = useState<DocumentFile | null>(null)
    const [form] = Form.useForm<PutDiplomaType>()
    const router = useRouter()
    const { showSpinner, hideSpinner } = useSpinner()
    const diplomaTypeId = router.query.id as string
    const { options: diplomaFieldsOptions, getDiplomaFieldLabel } = useDiplomaFieldOptions()
    const [fields, setFields] = useState<FieldItem[]>([])
    const [currentField, setCurrentField] = useState<{
        field: DiplomaFields
        side: 'front' | 'back'
    } | null>(null)
    const [otherValue, setOtherValue] = useState('')

    const handleAddField = (field: DiplomaFields, side: 'front' | 'back') => {
        if (field === 'OTHER') {
            setCurrentField({ field, side })
        } else {
            // Default
            const newField: FieldItem = {
                id: `${field}-${Date.now()}`,
                field,
                top: 3,
                left: 3,
                width: 20,
                height: 5,
                side,
            }
            setFields([...fields, newField])
            console.log('Added field:', newField)
        }
    }

    const handleUpdatePosition = (id: string, pos: { top: number; left: number }) => {
        setFields(fields.map((f) => (f.id === id ? { ...f, top: pos.top, left: pos.left } : f)))
        console.log('Updated position:', { id, ...pos })
    }

    const handleSaveOtherValue = () => {
        if (currentField && otherValue) {
            const newField: FieldItem = {
                id: `OTHER-${Date.now()}`,
                field: 'OTHER',
                top: 3,
                left: 3,
                width: 20,
                height: 5,
                side: currentField.side,
                value: otherValue,
            }
            setFields([...fields, newField])
            console.log('Added OTHER field:', newField)
            setCurrentField(null)
            setOtherValue('')
        }
    }

    const handleRemoveField = (id: string) => {
        setFields(fields.filter((f) => f.id !== id))
    }

    const { data: initialData } = useFindUniqueDiplomaType(
        { where: { id: diplomaTypeId }, include: { front: true, back: true } },
        { enabled: !!diplomaTypeId }
    )

    const { data: keyInforData } = useFindManyDiplomaPlaceHolder(
        {
            where: {
                diplomaTypeId,
            },
        },
        { enabled: !!diplomaTypeId }
    )

    const { mutateAsync: updateDiplomaType } = useUpdateDiplomaType()
    const { mutateAsync: upsertDiplomaPlaceHolder } = useUpsertDiplomaPlaceHolder()

    const handleFrontBackDiplomaType = async (output?: PutDiplomaType) => {
        if (!output) return
        try {
            showSpinner()

            const updateData = {
                front: output.front
                    ? {
                          upsert: {
                              where: { id: output.front[0].id || '' },
                              create: {
                                  name: output.front[0].name,
                                  path: output.front[0].path,
                                  mimeType: output.front[0].mimeType,
                                  size: output.front[0].size,
                                  diplomaTypeFrontId: diplomaTypeId,
                              },
                              update: {
                                  name: output.front[0].name,
                                  path: output.front[0].path,
                                  mimeType: output.front[0].mimeType,
                                  size: output.front[0].size,
                              },
                          },
                      }
                    : undefined,
                back: output.back
                    ? {
                          upsert: {
                              where: { id: output.back[0].id || '' },
                              create: {
                                  name: output.back[0].name,
                                  path: output.back[0].path,
                                  mimeType: output.back[0].mimeType,
                                  size: output.back[0].size,
                                  diplomaTypeBackId: diplomaTypeId,
                              },
                              update: {
                                  name: output.back[0].name,
                                  path: output.back[0].path,
                                  mimeType: output.back[0].mimeType,
                                  size: output.back[0].size,
                              },
                          },
                      }
                    : undefined,
            }
            await updateDiplomaType({
                where: { id: diplomaTypeId },
                data: updateData,
            })

            message.success('Cập nhật thành công')
            queryClient.invalidateQueries({ queryKey: ['DiplomaType'] })
        } catch (error) {
            console.error(error)
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        } finally {
            hideSpinner()
        }
    }

    const handleClearImage = async (type: 'front' | 'back') => {
        try {
            showSpinner()
            await updateDiplomaType({
                where: { id: diplomaTypeId },
                data: {
                    [type]: { delete: true },
                },
            })
            message.success(`Đã xoá phôi mặt ${type === 'front' ? 'trước' : 'sau'}`)
            queryClient.invalidateQueries({ queryKey: ['DiplomaType'] })
            if (type === 'front') {
                setDocumentFront(null)
            } else {
                setDocumentBack(null)
            }
        } catch (err) {
            console.error(err)
            message.error('Xoá ảnh thất bại, vui lòng thử lại')
        } finally {
            hideSpinner()
        }
    }

    // biome-ignore lint/correctness/useExhaustiveDependencies: <>
    useEffect(() => {
        if (initialData) {
            form.setFieldsValue({
                ...initialData,
                front: initialData.front ? [initialData.front] : undefined,
                back: initialData.back ? [initialData.back] : undefined,
            })
            setDocumentFront(initialData.front)
            setDocumentBack(initialData.back)
        }
    }, [initialData])

    const renderPreviewOrUpload = (
        label: string,
        data: DocumentFile | null,
        titleForm: 'front' | 'back',
        relationType: 'diplomaTypeFrontId' | 'diplomaTypeBackId'
    ) => {
        return (
            <Col span={24}>
                <div className="flex items-center justify-between py-2 mx-10">
                    <span className="font-bold">{label}</span>
                    {data && <Button onClick={() => handleClearImage(titleForm)}>Xoá ảnh</Button>}
                </div>
                {data ? (
                    <DroppableArea
                        documentData={data}
                        side={titleForm}
                        fields={fields}
                        onUpdatePosition={handleUpdatePosition}
                        onRemoveField={handleRemoveField}
                    />
                ) : (
                    <FormItem form={form} name={titleForm}>
                        <DocumentPaths
                            form={form}
                            data={[]}
                            relationId={diplomaTypeId ?? ''}
                            relationType={relationType}
                            titleForm={titleForm}
                            multiple={false}
                            accept="image/*,.pdf"
                            text="image"
                        />
                    </FormItem>
                )}
            </Col>
        )
    }

    return (
        <DndProvider backend={HTML5Backend}>
            <div>
                <Divider orientation="left" orientationMargin={0}>
                    {[initialData?.code, initialData?.name, initialData?.englishName]
                        .filter(Boolean)
                        .join(' - ')}
                </Divider>
                <Row gutter={[16, 0]}>
                    <Col span={24}>
                        <div className="flex">
                            <Col span={7}>
                                <div className="border border-gray-200 p-3 rounded-md">
                                    <h3 className="font-semibold mb-2">Các trường dữ liệu</h3>
                                    <div className="flex flex-col gap-2 max-h-[600px] overflow-auto">
                                        {diplomaFieldsOptions.map((field) => (
                                            <FieldItem
                                                key={field.value}
                                                field={field.value}
                                                label={field.label}
                                                onClick={() =>
                                                    handleAddField(
                                                        field.value,
                                                        documentFront ? 'front' : 'back'
                                                    )
                                                }
                                            />
                                        ))}
                                    </div>
                                </div>
                            </Col>

                            <div className="border-r border-[#D1D5DB] h-auto mx-2" />

                            <Col span={17}>
                                <Flex justify="end" className="mb-4">
                                    <Button onClick={form.submit}>
                                        <BookPlus className="mr-1" />
                                        Lưu file phôi văn bằng
                                    </Button>
                                </Flex>
                                <Form form={form} onFinish={handleFrontBackDiplomaType}>
                                    {/* <FormItem form={form} name={'front'}>
                                        <DocumentPaths
                                            form={form}
                                            data={[]}
                                            relationId={diplomaTypeId ?? ''}
                                            relationType={'diplomaTypeFrontId'}
                                            titleForm={'front'}
                                            multiple={false}
                                            accept="image/*,.pdf"
                                        />
                                    </FormItem> */}
                                    <Row gutter={[0, 32]}>
                                        {renderPreviewOrUpload(
                                            'Phôi mặt trước (A4 nằm ngang)',
                                            documentFront,
                                            'front',
                                            'diplomaTypeFrontId'
                                        )}
                                        {renderPreviewOrUpload(
                                            'Phôi mặt sau (A4 nằm ngang)',
                                            documentBack,
                                            'back',
                                            'diplomaTypeBackId'
                                        )}
                                    </Row>
                                </Form>
                            </Col>
                        </div>
                    </Col>
                </Row>
                <Modal
                    title="Nhập giá trị cho trường tùy chỉnh"
                    open={!!currentField}
                    onOk={handleSaveOtherValue}
                    onCancel={() => setCurrentField(null)}
                    okText="Lưu"
                    cancelText="Hủy"
                >
                    <Input
                        value={otherValue}
                        onChange={(e) => setOtherValue(e.target.value)}
                        placeholder="Nhập giá trị"
                    />
                </Modal>
            </div>
        </DndProvider>
    )
}

Diploma.getLayout = function getLayout(page: React.ReactElement) {
    return (
        <DefaultLayout
            breadcrumbList={[
                { title: 'Quản lý văn bằng' },
                {
                    title: 'Danh mục văn bằng',
                    href: ROUTER_PATH.QL_DAO_TAO.QL_VAN_BANG_DANH_MUC_VAN_BANG,
                },
                { title: 'Quản lý phôi văn bằng' },
            ]}
        >
            {page}
        </DefaultLayout>
    )
}
