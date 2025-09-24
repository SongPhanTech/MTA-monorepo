import { useEffect, useRef, useState } from 'react'

type TypeProps = {
    arr: { key: string; label: string }[]
    key: string
}
export default function TextTruncate({ arr, key }: TypeProps) {
    const [show, setShow] = useState(false)
    const [showButton, setShowButton] = useState(false)
    const textRef = useRef<HTMLDivElement>(null)

    const handleShowMore = () => {
        setShow(!show)
    }

    useEffect(() => {
        if (textRef.current) {
            const el = textRef.current
            if (el.scrollHeight >= 44 && arr?.length > 2) {
                console.log(el.scrollHeight, arr?.length > 2)

                setShowButton(true)
            }
        }
    }, [arr?.length])
    return (
        <div ref={textRef} className="relative collapse-content">
            <ul
                style={{
                    paddingLeft: 0,
                    margin: 0,
                }}
                className={`content text-left ${!showButton && !show ? '' : 'is-collapsed'} ${show ? '' : 'line-clamp-2'}  `}
            >
                {arr?.map((val: any, index: number) => (
                    <li key={val.key}>- {val.label}</li>
                ))}
            </ul>
            {showButton && (
                <div
                    onClick={() => handleShowMore()}
                    className="flex  justify-end text-xs text-green-600"
                >
                    {show ? 'Ẩn bớt' : 'Xem thêm'}
                </div>
            )}
        </div>
    )
}
