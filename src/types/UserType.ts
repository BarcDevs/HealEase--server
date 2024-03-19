export type UserType = {
    id: string
    name: string
    email: string
    imageUrl: string | null
    password: string
    resetPasswordOTP: number | null
    resetPasswordExpiration: Date | null
    password_updated_at: Date | null
    created_at: Date
    updated_at: Date
}
