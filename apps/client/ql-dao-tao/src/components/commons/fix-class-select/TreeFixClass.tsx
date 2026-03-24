import { useFindManyFixedClass, useFindManyTrainingCourse } from '@workspace/db/hooks' // Thay bằng hook thực tế của bạn
import { useTrainingObjectTypeStore } from '@workspace/ui'
import { Spin, Tree } from 'antd'
import type React from 'react'

interface TreeFixClassProps {
    onChangeSelected: (selected: any) => void
}

const TreeFixClass: React.FC<TreeFixClassProps> = ({ onChangeSelected }) => {
    // Lấy danh sách Training Courses
    const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()

    const { data: trainingCourses = [], isLoading: trainingCoursesLoading } =
        useFindManyTrainingCourse({
            orderBy: {
                semesterStart: {
                    startDate: 'desc',
                },
            },
            where: { trainingObjectTypeId },
        })

    // Lấy danh sách Fixed Classes
    const { data: fixedClasses = [], isLoading: fixedClassesLoading } = useFindManyFixedClass({
        where: {
            trainingCourseId: {
                in: trainingCourses.map((course) => course.id),
            },
        },
    })

    // Tạo cấu trúc cây từ dữ liệu
    const treeData = trainingCourses.map((course) => ({
        title: course.name || `Khoá học ${course.id}`, // Tên khoá học
        key: `course-${course.id}`,
        children: fixedClasses
            .filter((fixedClass) => fixedClass.trainingCourseId === course.id)
            .map((fixedClass) => ({
                title: fixedClass.name || `Lớp ${fixedClass.id}`, // Tên lớp cố định
                key: `${fixedClass.id}`,
            })),
    }))

    // Hiển thị loading khi dữ liệu đang tải
    if (trainingCoursesLoading || fixedClassesLoading) {
        return <Spin tip="Đang tải dữ liệu..." />
    }

    return (
        <div style={{ maxHeight: 500, overflowY: 'auto' }}>
            {treeData.length > 0 ? (
                <Tree
                    treeData={treeData}
                    defaultExpandAll // Mở rộng tất cả các node mặc định
                    showLine // Hiển thị đường dẫn giữa các node
                    blockNode // Node chiếm toàn bộ chiều rộng
                    onSelect={onChangeSelected}
                />
            ) : (
                <p>Không có dữ liệu để hiển thị.</p>
            )}
        </div>
    )
}

export default TreeFixClass
