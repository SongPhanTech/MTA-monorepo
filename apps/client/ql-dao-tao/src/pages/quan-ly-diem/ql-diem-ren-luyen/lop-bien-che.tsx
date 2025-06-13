import React from "react";
import TreeFixClass from '@components/commons/fix-class-selected/TreeFixClass'
interface Item {
    code: string;
    name: string;
    id: string;
    lecture?: string;
}

interface FlatListProps {
    data: Item[];
    renderItem: (item: Item) => JSX.Element;
}

const FlatList: React.FC<FlatListProps> = ({ data, renderItem }) => {
    return (
        <div>
            {data.map((item) => (
                <div key={item.code}>
                    {renderItem(item)}
                </div>
            ))}
        </div>
    );
};

interface LopBienCheItemProps {
    dataTable: Array<{
        code: string;
        id: string;
        name: string;
        mainLecturer: { userProfile: { firstName: string; lastName: string } };
        lecture?: string;
    }>;
    onChangeSelected?: (selected: string) => void;
    selectedItem?: string;
}

const LopBienCheItem: React.FC<LopBienCheItemProps> = ({ dataTable, onChangeSelected, selectedItem }) => {
    const data: Item[] = dataTable.map((item: {
        mainLecturer: any; code: any; name: any; id: any;
}) => ({
        code: item.code,
        name: item.name,
        lecture: item.mainLecturer && item.mainLecturer.userProfile
            ? `${item.mainLecturer.userProfile.lastName} ${item.mainLecturer.userProfile.firstName}`
            : "Chưa có giảng viên",
        id: item.id,
    }));

    const renderItem = (item: Item) => (
        <div
            onClick={() => {
                onChangeSelected?.(item.id);
            }}
            style={{
                padding: "8px",
                border: "1px solid #ccc",
                borderRadius: "8px",
                marginBottom: "4px",
                width: "100%",
                backgroundColor: selectedItem === item.id ? "#daf2ed" : "transparent",
            }}
        >
            <h3><strong>{item.name}</strong></h3>
            <p>{item.code}</p>
            <p>{item.lecture}</p>
        </div>
    );

    return (
        <div style={{width: "100%", padding: "16px", borderRadius: "8px"}}>
            <h2 className="text-lg font-semibold" style={{ marginBottom: "12px" }}>Danh sách lớp</h2>
            <TreeFixClass 
                onChangeSelected={(selected) => {
                    onChangeSelected?.(selected);
                }}
             />
        </div>
    );
};

export default LopBienCheItem;