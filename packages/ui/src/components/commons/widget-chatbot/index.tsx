'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { IconChatBot } from '../../icon'

interface WidgetChatbotProps {
    src?: string
    size?: number
    className?: string
}

export function WidgetChatbot({ src = 'http://localhost:3000/tro-ly-ao' }: WidgetChatbotProps) {
    const [isOpen, setIsOpen] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('chatbot-open') === 'true'
        }
        return false
    })
    const [hasError, setHasError] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [hasLoadedOnce, setHasLoadedOnce] = useState(false)
    const iframeRef = useRef<HTMLIFrameElement>(null)

    const handleToggle = () => {
        const newState = !isOpen
        setIsOpen(newState)

        if (newState && !hasLoadedOnce && !hasError) {
            setIsLoading(true)
        }

        if (typeof window !== 'undefined') {
            localStorage.setItem('chatbot-open', newState.toString())
        }
    }

    const handleIframeError = () => {
        setHasError(true)
        setIsLoading(false)
    }

    const handleIframeLoad = (e: React.SyntheticEvent<HTMLIFrameElement>) => {
        const iframe = e.target as HTMLIFrameElement
        try {
            if (iframe.contentWindow) {
                const url = iframe.contentWindow.location.href
                if (url.includes('404') || url.includes('error')) {
                    setHasError(true)
                    setIsLoading(false)
                    return
                }
            }
        } catch (error) {}

        setIsLoading(false)
        setHasLoadedOnce(true)
    }

    useEffect(() => {
        if (isOpen && iframeRef.current && !hasLoadedOnce && !hasError) {
            fetch(src, { method: 'HEAD', mode: 'no-cors' })
                .then((response) => {
                    if (response.status === 404 || response.status >= 400) {
                        setHasError(true)
                        setIsLoading(false)
                        return
                    }
                    if (iframeRef.current) {
                        iframeRef.current.src = src
                        setIsLoading(true)
                    }
                })
                .catch(() => {
                    if (iframeRef.current) {
                        iframeRef.current.src = src
                        setIsLoading(true)

                        const timeout = setTimeout(() => {
                            if (iframeRef.current) {
                                try {
                                    const doc = iframeRef.current.contentDocument
                                    if (
                                        doc &&
                                        (doc.title.includes('404') ||
                                            doc.body?.textContent?.includes('404'))
                                    ) {
                                        setHasError(true)
                                        setIsLoading(false)
                                    }
                                } catch (error) {}
                            }
                        }, 3000)

                        return () => clearTimeout(timeout)
                    }
                })
        }
    }, [isOpen, src, hasError, hasLoadedOnce])

    if (typeof window === 'undefined') return null

    return (
        <>
            {createPortal(
                <button
                    type="button"
                    onClick={handleToggle}
                    className="rounded-full bg-white shadow-lg hover:shadow-xl transition-shadow duration-200 flex items-center justify-center"
                    style={{
                        position: 'fixed',
                        bottom: '20px',
                        right: '20px',
                        zIndex: 9999,
                        width: '64px',
                        height: '64px',
                    }}
                    aria-label="Toggle chatbot"
                >
                    <IconChatBot size={40} className="text-blue-600" />
                </button>,
                document.body
            )}

            {createPortal(
                <div
                    style={{
                        position: 'fixed',
                        bottom: '100px',
                        right: '20px',
                        zIndex: 9998,
                        width: '450px',
                        height: '600px',
                        display: isOpen ? 'block' : 'none',
                    }}
                    className="bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden"
                >
                    <div className="h-full relative">
                        <div className="h-full relative">
                            {isLoading && !hasError && !hasLoadedOnce && (
                                <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
                                    <div className="text-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2" />
                                        <p className="text-sm text-gray-600">Đang tải...</p>
                                    </div>
                                </div>
                            )}

                            {hasError ? (
                                <div className="h-full flex items-center justify-center p-6 text-center">
                                    <div>
                                        <div className="text-6xl mb-4">⚠️</div>
                                        <p className="text-red-600 mb-2 font-semibold">
                                            Không thể kết nối
                                        </p>
                                        <p className="text-sm text-gray-600 mb-4">
                                            Đường dẫn không hợp lệ hoặc server không phản hồi
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setHasError(false)
                                                setHasLoadedOnce(false)
                                                setIsLoading(true)
                                                if (iframeRef.current) {
                                                    iframeRef.current.src = src
                                                }
                                            }}
                                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                                        >
                                            Thử lại
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <iframe
                                    ref={iframeRef}
                                    className="w-full h-full border-0"
                                    onError={handleIframeError}
                                    onLoad={handleIframeLoad}
                                    title="Chatbot"
                                    sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
                                />
                            )}
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    )
}
