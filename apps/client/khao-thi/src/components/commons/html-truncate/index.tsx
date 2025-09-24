import { useEffect, useRef, useState } from 'react'

type TypeProps = {
    key: string
    children: React.ReactNode
}
export default function HtmlTruncate({ key, children }: TypeProps) {
    const [show, setShow] = useState(false)
    const [showButton, setShowButton] = useState(false)
    const textRef = useRef<HTMLDivElement>(null)

    //   const classContent=useMemo(()=>{
    //      let className = "";
    //   if (showButton) {
    //     if (show) className += " is-collapsed";
    //   }
    //   return className;
    //   },[])

    const handleShowMore = () => {
        setShow(!show)
        console.log(show)
    }

    useEffect(() => {
        if (textRef.current) {
            const el = textRef.current

            if (el.scrollHeight > 54) {
                setShowButton(true)
            }
        }
    }, [])
    return (
        <div className="relative collapse-content">
            <div
                className={`content text-left ${!showButton && !show ? '' : 'is-collapsed'} ${show ? '' : 'max-h-[44px]'}  `}
            >
                <div ref={textRef}>{children}</div>
            </div>
            {showButton && (
                <div className="flex justify-end">
                    <div onClick={() => handleShowMore()} className="text-xs text-green-600 ">
                        {show ? 'Ẩn bớt' : 'Xem thêm'}
                    </div>
                </div>
            )}
        </div>
    )
}
