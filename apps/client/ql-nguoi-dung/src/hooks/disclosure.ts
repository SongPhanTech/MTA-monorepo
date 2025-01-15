import { useStoreActions, useStoreState } from '@redux/hook'
import { useEffect, useMemo } from 'react'
import * as modals from '@components/modal'
interface DisclosureHook {
    tag: string
    isOpen?: boolean
    onOpen?: () => void
    onClose?: () => void
    onToggle?: () => void
    onChange?: (isOpen: boolean) => void
}

/**
 * Hook quản lý trạng thái mở/đóng của một component. Các hook sử dụng cùng một tag sẽ chia sẻ trạng thái mở/đóng với nhau.
 * Mặc định, tag sẽ là pathname hiện tại.
 * @example
 * ```ts
 * "use client"
 * import useDisclosure from '@hooks/use-disclosure'
 *
 * const { isOpen, onChange, onClose, onOpen } = useDisclosure({
 *      onClose: () => {
 *         resetForm()
 *      },
 *      tag: 'my-disclosure',
 * })
 * ```
 *
 */

const useDisclosure = (disclosureHook: DisclosureHook) => {
    const tag = disclosureHook.tag

    // isOpen là payload của tag đó, nếu tag đó không tồn tại thì isOpen = false
    const isOpen = useStoreState((state) => state.dialog.modalTags[tag])
    const clearDisclosureTag = useStoreActions(
        (actions) => actions.dialog.clearModalTag
    )
    useEffect(() => {
        isOpen ? onOpen(isOpen) : onClose()
        return () => {
            clearDisclosureTag(tag)
        }
    }, [isOpen])

    const onOpenAction = useStoreActions((actions) => actions.dialog.openModal)
    const onCloseAction = useStoreActions(
        (actions) => actions.dialog.closeModal
    )
    const onToggleAction = useStoreActions(
        (actions) => actions.dialog.toggleModal
    )
    const onOpen = (payload?: any) => {
        onOpenAction({
            tag,
            payload,
        })
        disclosureHook && disclosureHook.onOpen && disclosureHook.onOpen()
    }
    const onClose = () => {
        onCloseAction(tag)
        disclosureHook && disclosureHook.onClose && disclosureHook.onClose()
    }
    const onToggle = () => {
        onToggleAction(tag)
        disclosureHook && disclosureHook.onToggle && disclosureHook.onToggle()
    }

    return {
        isOpen: !!isOpen,
        payload: typeof isOpen == 'boolean' ? undefined : isOpen,
        onOpen,
        onClose,
        onToggle,
    }
}

const useModal = () => {
    const isOpens = useStoreState((state) => state.dialog.modalTags)

    const modalOpened = useMemo(() => {
        return Object.entries(modals)
            .filter(([tag]) => isOpens[tag])
            .map(([_, modal]) => modal)
    }, [isOpens])

    return modalOpened
}

export { useModal }

export default useDisclosure
