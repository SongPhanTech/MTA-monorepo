import { useState } from 'react'

type TypeProps = {
    arr: { key: string; label: string }[]
    key: string
    record: any
}
export default function TextTruncate({ arr, key, record }: TypeProps) {
    const [listShowAll, setListShowAll] = useState<string[]>([])

    const handleShowMore = (value: string) => {
        const result = listShowAll.includes(value)
        if (result) {
            setListShowAll(listShowAll.filter((item) => item !== value))
        } else {
            setListShowAll([...listShowAll, value])
        }
    }
    return (
        <div>
            <ul
                style={{
                    paddingLeft: 0,
                    margin: 0,
                }}
                className={`text-left transition-all duration-500 overflow-hidden ${listShowAll.includes(`${record.id}-${key}`) || arr.length <= 2 ? '' : 'line-clamp-2'}`}
            >
                {arr?.map((val: any, index: number) => (
                    <li key={val.key}>- {val.label}</li>
                ))}
            </ul>
            {arr?.length > 2 && (
                <div
                    onClick={() => handleShowMore(`${record.id}-${key}`)}
                    className="flex  justify-end text-xs text-green-600"
                >
                    {listShowAll.includes(`${record.id}-${key}`) ? 'Ẩn bớt' : 'Xem thêm'}
                </div>
            )}
        </div>
    )
}
