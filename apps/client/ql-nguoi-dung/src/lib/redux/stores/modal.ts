import { ModalTag } from '@redux/models'
import { action } from 'easy-peasy'

const dialog: ModalTag = {
    modalTags: {},
    openModal: action((state, payload) => {
        state.modalTags[payload.tag] = {
            ...state.modalTags[payload.tag],
            input: payload.input ? payload.input : true,
        }
    }),
    okModal: action((state, payload) => {
        state.modalTags[payload.tag] = {
            ...state.modalTags[payload.tag],
            output: payload.output,
        }
    }),
    closeModal: action((state, payload) => {
        state.modalTags[payload] = {
            input: false,
        }
    }),
    toggleModal: action((state, payload) => {
        state.modalTags[payload] = {
            ...state.modalTags[payload],
            input: !state.modalTags[payload]?.input,
        }
    }),
    clearModalTag: action((state, payload) => {
        delete state.modalTags[payload]
    }),
    clearAllModalTags: action((state) => {
        state.modalTags = {}
    }),
}

export { dialog }
