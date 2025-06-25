export const capitalizeText = (text: string): string => {
    if (!text) return ''

    return text.charAt(0).toUpperCase() + text.slice(1)
}
