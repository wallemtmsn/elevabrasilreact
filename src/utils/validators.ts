export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function isValidCPF(cpf: string): boolean {
  return cpf.replace(/\D/g, '').length === 11
}

export function isValidPhone(phone: string): boolean {
  return phone.replace(/\D/g, '').length >= 10
}

export function isStrongPassword(password: string): boolean {
  return password.length >= 6
}
