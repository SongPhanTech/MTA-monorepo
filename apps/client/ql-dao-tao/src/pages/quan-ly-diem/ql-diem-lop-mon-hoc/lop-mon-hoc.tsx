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

interface LopMonHocItemProps {
    dataTable: Array<Item & {
        mainLecturer: { userProfile: { firstName: string; lastName: string } } | null
    }>
    onChangeSelected?: (selected: string) => void
    selectedItem?: string
}

const LopMonHocItem: React.FC<LopMonHocItemProps> = ({
    dataTable,
    onChangeSelected,
    selectedItem,
}) => {
    const data: Item[] = dataTable.map(
        ({ mainLecturer, ...rest }) => ({
            lecture:
                mainLecturer?.userProfile
                    ? `${mainLecturer.userProfile.lastName} ${mainLecturer.userProfile.firstName}`
                    : 'Chưa có giảng viên',
            ...rest
        })
    )

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
        <div
            style={{
                width: '100%',
                padding: '16px',
                backgroundColor: '#f9f9f9',
                borderRadius: '8px',
            }}
        >
            <h2
                className="text-lg font-semibold"
                style={{ marginBottom: '12px' }}
            >
                Danh sách lớp
            </h2>
            <FlatList data={data} renderItem={renderItem} />
        </div>
    )
}

export default LopMonHocItem
