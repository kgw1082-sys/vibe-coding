export interface PasswordValidationResult {
  valid: boolean
  errors: string[]
  checks: {
    minLength: boolean
    hasUppercase: boolean
    hasSpecialChars: boolean
  }
}

const SPECIAL_CHARS = /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/g

export function validatePassword(password: string): PasswordValidationResult {
  const checks = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasSpecialChars: (password.match(SPECIAL_CHARS) ?? []).length >= 2,
  }

  const errors: string[] = []
  if (!checks.minLength) errors.push('비밀번호는 8자리 이상이어야 합니다.')
  if (!checks.hasUppercase) errors.push('영문 대문자를 1개 이상 포함해야 합니다.')
  if (!checks.hasSpecialChars) errors.push('특수문자(!@#$%^&* 등)를 2개 이상 포함해야 합니다.')

  return { valid: errors.length === 0, errors, checks }
}
