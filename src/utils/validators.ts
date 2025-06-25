export const emailValidator = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
}

export const emailValidatorRule = (email: string): string | true => {
    if (!email) {
        return 'Email est obligatoire'
    }
    if (!emailValidator(email)) {
        return "Votre email n'est pas valide"
    }
    return true
}
