import { ModalTag } from '@redux/models'
import { action } from 'easy-peasy'

const dialog: ModalTag = {
    modalTags: {},
    openModal: action((state, payload) => {
        state.modalTags[payload.tag] = payload.payload ? payload.payload : true
    }),
    closeModal: action((state, payload) => {
        state.modalTags[payload] = false
    }),
    toggleModal: action((state, payload) => {
        state.modalTags[payload] = !state.modalTags[payload]
    }),
    clearModalTag: action((state, payload) => {
        delete state.modalTags[payload]
    }),
    clearAllModalTags: action((state) => {
        state.modalTags = {}
    }),
}

export { dialog }
