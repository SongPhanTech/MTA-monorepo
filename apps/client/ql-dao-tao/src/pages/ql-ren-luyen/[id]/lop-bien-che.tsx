import { useFindManyFixedClass, useFindManyTrainingCourse } from '@workspace/db/hooks'
import { Tree } from 'antd'
import type React from 'react'

interface LopBienCheItemProps {
    onChangeSelected?: (selected: string) => void
    className?: string
    objectTrainingTypeId?: string
}

const LopBienCheItem: React.FC<LopBienCheItemProps> = ({
    onChangeSelected,
    className,
    objectTrainingTypeId,
}) => {
    const { data: trainingCourses = [] } = useFindManyTrainingCourse({
        where: {
            trainingObjectTypeId: { not: undefined },
        },
        orderBy: { name: 'asc' },
    })

    // Lấy danh sách Fixed Classes
    const { data: fixedClasses = [], isLoading: fixedClassesLoading } = useFindManyFixedClass({
        where: {
            // trainingCourseId: {
            //     in: trainingCourses.map((course) => course.id),
            // },
            trainingCourse: {
                id: { in: trainingCourses.map((course) => course.id) },
                trainingObjectTypeId: objectTrainingTypeId ? objectTrainingTypeId : undefined,
            },
            // curriculumVersion: {
            //     trainingObjectTypeId: objectTrainingTypeId ? objectTrainingTypeId : undefined,
            // },
            name: className ? { contains: className } : undefined,
        },
    })

    // Tạo cấu trúc cây từ dữ liệu
    const treeData = trainingCourses
        .map((course) => {
            const children = fixedClasses
                .filter((fixedClass) => fixedClass.trainingCourseId === course.id)
                .map((fixedClass) => ({
                    title: fixedClass.name || `Lớp ${fixedClass.id}`,
                    key: `${fixedClass.id}`,
                }))

            if (children.length === 0) return null

            return {
                title: course.name || `Khóa học ${course.id}`,
                key: `course-${course.id}`,
                children,
            }
        })
        .filter((item): item is Exclude<typeof item, null> => item !== null)

    return (
        <div style={{ width: '100%', padding: '16px', borderRadius: '8px' }}>
            <h2 className="text-lg font-semibold px-[6]" style={{ marginBottom: '12px' }}>
                Danh sách lớp
            </h2>
            <div style={{ maxHeight: 500, overflowY: 'auto' }}>
                {treeData.length > 0 ? (
                    <Tree
                        treeData={treeData}
                        // defaultExpandAll // Mở rộng tất cả các node mặc định
                        showLine // Hiển thị đường dẫn giữa các node
                        blockNode // Node chiếm toàn bộ chiều rộng
                        onSelect={(selectedKeys) => {
                            if (selectedKeys.length > 0) {
                                const selectedKey = selectedKeys[0] as string
                                if (!selectedKey.startsWith('course-')) {
                                    onChangeSelected?.(selectedKey)
                                }
                            }
                        }}
                    />
                ) : (
                    <p>Không có dữ liệu để hiển thị.</p>
                )}
            </div>
        </div>
    )
}

export default LopBienCheItem
