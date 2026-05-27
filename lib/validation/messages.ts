import type { Lang } from '@/lib/translations'

const MESSAGES = {
  vi: {
    emailRequired: 'Email là bắt buộc',
    emailInvalid: 'Email không hợp lệ (kiểm tra lại phần sau @, ví dụ .com)',
    emailTooShort: 'Email quá ngắn',
    emailTooLong: 'Email quá dài',
    passwordRequired: 'Mật khẩu là bắt buộc',
    passwordTooShort: 'Mật khẩu tối thiểu 6 ký tự',
    passwordTooLong: 'Mật khẩu quá dài',
    invalidLogin: 'Email hoặc mật khẩu không đúng',
    passwordMismatch: 'Mật khẩu không khớp',
    fullNameRequired: 'Họ tên là bắt buộc',
    fullNameTooLong: 'Họ tên quá dài',
    emailAlreadyRegistered: 'Email đã được đăng ký',
    registerFailed: 'Đăng ký thất bại, thử lại sau',
    serverError: 'Lỗi máy chủ, thử lại sau',
    invalidJson: 'Dữ liệu không hợp lệ',
  },
  en: {
    emailRequired: 'Email is required',
    emailInvalid: 'Invalid email (check the part after @, e.g. .com)',
    emailTooShort: 'Email is too short',
    emailTooLong: 'Email is too long',
    passwordRequired: 'Password is required',
    passwordTooShort: 'Password must be at least 6 characters',
    passwordTooLong: 'Password is too long',
    invalidLogin: 'Invalid email or password',
    passwordMismatch: 'Passwords do not match',
    fullNameRequired: 'Full name is required',
    fullNameTooLong: 'Full name is too long',
    emailAlreadyRegistered: 'Email is already registered',
    registerFailed: 'Registration failed, please try again',
    serverError: 'Server error, please try again',
    invalidJson: 'Invalid request body',
  },
} as const

export function validationMsg(lang: Lang, key: keyof (typeof MESSAGES)['vi']): string {
  return MESSAGES[lang][key] ?? MESSAGES.vi[key]
}
