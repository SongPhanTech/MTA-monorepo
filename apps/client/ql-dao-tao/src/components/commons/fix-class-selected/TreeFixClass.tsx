import React from 'react';
import { Tree, Spin } from 'antd';
import { useFindManyTrainingCourse, useFindManyFixedClass }from '@workspace/db/hooks'; // Thay bằng hook thực tế của bạn

interface TreeFixClassProps {
  onChangeSelected: (selected: any) => void;
}

const TreeFixClass: React.FC<TreeFixClassProps> = ({ onChangeSelected }) => {
  // Lấy danh sách Training Courses
  const { data: trainingCourses = [], isLoading: trainingCoursesLoading } = useFindManyTrainingCourse({});

  // Lấy danh sách Fixed Classes
  const { data: fixedClasses = [], isLoading: fixedClassesLoading } = useFindManyFixedClass({
    where: {
      trainingCourseId: {
        in: trainingCourses.map((course) => course.id),
      },
    },
  });

  // Tạo cấu trúc cây từ dữ liệu
  const treeData = trainingCourses.map((course) => ({
    title: course.name || `Khóa học ${course.id}`, // Tên khóa học
    key: `course-${course.id}`,
    children: fixedClasses
      .filter((fixedClass) => fixedClass.trainingCourseId === course.id)
      .map((fixedClass) => ({
        title: fixedClass.name || `Lớp ${fixedClass.id}`, // Tên lớp cố định
        key: `class-${fixedClass.id}`,
      })),
  }));

  // Hiển thị loading khi dữ liệu đang tải
  if (trainingCoursesLoading || fixedClassesLoading) {
    return <Spin tip="Đang tải dữ liệu..." />;
  }

  return (
    <div>

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
  );
};

export default TreeFixClass;