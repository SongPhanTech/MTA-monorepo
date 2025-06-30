import ability from './ability'

const useAbility = () => {
    return {
        can: (action: string, subject: string) => ability.can(action, subject),
        cannot: (action: string, subject: string) => ability.cannot(action, subject),
    }
}

export { useAbility }
