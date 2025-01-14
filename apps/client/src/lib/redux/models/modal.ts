import { Action } from 'easy-peasy'

type ModalTagPayload = {
    tag: string
    payload?: any
}

interface ModalTag {
    modalTags: {
        [tag: string]: any
    }
    openModal: Action<ModalTag, ModalTagPayload>
    closeModal: Action<ModalTag, string>
    toggleModal: Action<ModalTag, string>
    clearModalTag: Action<ModalTag, string>
    clearAllModalTags: Action<ModalTag>
}

export type { ModalTag }
