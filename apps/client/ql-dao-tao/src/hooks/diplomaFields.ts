// import { DiplomaFields } from '@workspace/db'

// export type DiplomaFieldOption = {
//     value: DiplomaFields
//     label: string
// }

// export const useDiplomaFieldOptions = () => {
//     const options: DiplomaFieldOption[] = [
//         { value: DiplomaFields.VI_FULLNAME, label: 'Họ và tên (Tiếng Việt)' },
//         { value: DiplomaFields.EN_FULLNAME, label: 'Họ và tên (Tiếng Anh)' },
//         { value: DiplomaFields.VI_FULLNAME_UPPERCASE, label: 'Họ và tên (Tiếng Việt - in hoa)' },
//         { value: DiplomaFields.EN_FULLNAME_UPPERCASE, label: 'Họ và tên (Tiếng Anh - in hoa)' },
//         { value: DiplomaFields.DATE_OF_BIRTH, label: 'Ngày sinh (DD/MM/YYYY)' },
//         { value: DiplomaFields.TRAINING_MAJOR, label: 'Chuyên ngành' },
//         { value: DiplomaFields.GPA, label: 'Điểm trung bình (GPA)' },
//         { value: DiplomaFields.YEAR_OF_GRADUATION, label: 'Năm tốt nghiệp (YYYY)' },
//         { value: DiplomaFields.CLASSIFICATION, label: 'Xếp loại tốt nghiệp' },
//         { value: DiplomaFields.TRAINING_FORM, label: 'Hình thức đào tạo' },
//         { value: DiplomaFields.DD, label: 'Ngày cấp (DD)' },
//         { value: DiplomaFields.MM, label: 'Tháng cấp (MM)' },
//         { value: DiplomaFields.YYYY, label: 'Năm cấp (YYYY)' },
//         { value: DiplomaFields.OTHER, label: 'Trường khác' },
//     ]

//     const getDiplomaFieldLabel = (value: DiplomaFields | null | undefined): string => {
//         return options.find((opt) => opt.value === value)?.label || ''
//     }

//     return {
//         options,
//         getDiplomaFieldLabel,
//     }
// }
