export const emailValidator = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
}

export const emailValidatorRule = (email: string): string | true => {
    if (!email) {
        return 'Email is required'
    }
    if (!emailValidator(email)) {
        return 'Invalid email format'
    }
    return true
}
