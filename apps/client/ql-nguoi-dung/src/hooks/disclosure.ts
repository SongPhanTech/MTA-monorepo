import { useStoreActions, useStoreState } from '@redux/hook'
import { useEffect, useMemo } from 'react'
import * as modals from '@components/modal'
interface DisclosureHook<O> {
    tag: string
    isOpen?: boolean
    onOpen?: () => void
    onClose?: () => void
    onToggle?: () => void
    onChange?: (isOpen: boolean) => void
    onOk?: (output?: O) => void
    onCancel?: () => void
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
 *      tag: ConfirmModal.name,
 * })
 * ```
 *
 */

const useDisclosure = <I = any, O = any>(disclosureHook: DisclosureHook<O>) => {
    const tag = disclosureHook.tag

    // inputState là payload của tag đó, nếu tag đó không tồn tại thì isOpen = false
    const inputState = useStoreState(
        (state) => state.dialog.modalTags[tag]?.input
    )
    const outputState = useStoreState(
        (state) => state.dialog.modalTags[tag]?.output
    )
    const clearDisclosureTag = useStoreActions(
        (actions) => actions.dialog.clearModalTag
    )

    const onOpenAction = useStoreActions((actions) => actions.dialog.openModal)
    const okAction = useStoreActions((actions) => actions.dialog.okModal)
    const onCloseAction = useStoreActions(
        (actions) => actions.dialog.closeModal
    )
    const onToggleAction = useStoreActions(
        (actions) => actions.dialog.toggleModal
    )
    const onOpen = (input?: I) => {
        onOpenAction({
            tag,
            input,
        })
        disclosureHook?.onOpen?.()
    }
    const onClose = () => {
        onCloseAction(tag)
        disclosureHook?.onClose?.()
    }
    const onToggle = () => {
        onToggleAction(tag)
        disclosureHook?.onToggle?.()
    }

    useEffect(() => {
        if (inputState) {
            onOpen(inputState)
        } else {
            onClose()
        }
        return () => {
            clearDisclosureTag(tag)
        }
    }, [inputState])

    useEffect(() => {
        if (outputState) {
            onOk(outputState)
        }
    }, [outputState])

    const onOk = (output?: O) => {
        disclosureHook?.onOk?.(output)
        okAction({
            tag,
            output,
        })
    }

    return {
        isOpen: !!inputState,
        input: typeof inputState === 'boolean' ? undefined : inputState,
        onOpen,
        onClose,
        onToggle,
        onOk,
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
