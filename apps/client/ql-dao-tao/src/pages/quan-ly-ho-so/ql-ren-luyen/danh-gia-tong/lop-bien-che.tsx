import { useFindManyFixedClass, useFindManyTrainingCourse } from '@workspace/db/hooks';
import { Tree } from 'antd';
import type React from 'react';
interface Item {
    code: string | null
    name: string
    id: string
    lecture?: string
}

interface FlatListProps {
    data: Item[]
    renderItem: (item: Item) => JSX.Element
}

const FlatList: React.FC<FlatListProps> = ({ data, renderItem }) => {
    return (
        <div>
            {data.map((item) => (
                <div key={item.code}>{renderItem(item)}</div>
            ))}
        </div>
    )
}

interface LopBienCheItemProps {
    dataTable: Array<{
        code: string
        id: string
        name: string
    }>
    onChangeSelected?: (selected: string) => void
    selectedItem?: string
    className?: string,
    objectTrainingTypeId?: string
}

const LopBienCheItem: React.FC<LopBienCheItemProps> = ({
    dataTable,
    onChangeSelected,
    selectedItem,
    className,
    objectTrainingTypeId,
}) => {
    const data: Item[] = dataTable.map(
        (item: {
            code: any
            name: any
            id: any
        }) => ({
            code: item.code,
            name: item.name,
            id: item.id,
        })
    )
    const { data: trainingCourses = [], isLoading: trainingCoursesLoading } =
        useFindManyTrainingCourse({
            orderBy: { name: 'asc' },
        })

    // Lấy danh sách Fixed Classes
    const { data: fixedClasses = [], isLoading: fixedClassesLoading } =
        useFindManyFixedClass({
            where: {
                trainingCourseId: {
                    in: trainingCourses.map((course) => course.id),
                },
                objectTrainingTypeId: objectTrainingTypeId ? objectTrainingTypeId : undefined,
                name: className ? { contains: className } : undefined,
            },
        })

    // Tạo cấu trúc cây từ dữ liệu
    const treeData = trainingCourses.map((course) => ({
        title: course.name || `Khóa học ${course.id}`, // Tên khóa học
        key: `course-${course.id}`,
        children: fixedClasses
            .filter((fixedClass) => fixedClass.trainingCourseId === course.id)
            .map((fixedClass) => ({
                title: fixedClass.name || `Lớp ${fixedClass.id}`, // Tên lớp cố định
                key: `${fixedClass.id}`,
            })),
    }))
    const renderItem = (item: Item) => (
        <div
            onClick={() => {
                onChangeSelected?.(item.id)
            }}
            style={{
                padding: '8px',
                border: '1px solid #ccc',
                borderRadius: '8px',
                marginBottom: '4px',
                width: '100%',
                backgroundColor:
                    selectedItem === item.id ? '#daf2ed' : 'transparent',
            }}
        >
            <h3>
                <strong>{item.name}</strong>
            </h3>
            <p>{item.code}</p>
            <p>{item.lecture}</p>
        </div>
    )

    return (
        <div style={{ width: '100%', padding: '16px', borderRadius: '8px' }}>
            <h2
                className="text-lg font-semibold"
                style={{ marginBottom: '12px' }}
            >
                Danh sách lớp s
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
                                onChangeSelected?.(selectedKeys[0] as string)
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
