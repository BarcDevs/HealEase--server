import nodemailer from 'nodemailer'
import { emailConfig } from '../../config'

const transporter = nodemailer.createTransport({
    service: emailConfig.service,
    secure: emailConfig.secure,
    port: emailConfig.port,
    auth: {
        user: emailConfig.emailUser,
        pass: emailConfig.emailPass,
    },
})

const sendEmail = (email: string, subject: string, text: string) => {
    const mailOptions = {
        from: emailConfig.emailUser,
        to: email,
        subject,
        text,
    }

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            throw new Error(error.message)
        } else {
            console.log(`Email sent: ${info.response}`)
        }
    })
}

export { sendEmail }
