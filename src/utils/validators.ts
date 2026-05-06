export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

// Algoritmo oficial da Receita Federal: rejeita sequências repetidas
// (000.000.000-00, 111..., ..., 999...) e valida ambos os dígitos verificadores.
export function isValidCPF(cpf: string): boolean {
  const c = cpf.replace(/\D/g, '')
  if (c.length !== 11) return false
  if (/^(\d)\1{10}$/.test(c)) return false

  let sum = 0
  for (let i = 0; i < 9; i++) sum += parseInt(c[i], 10) * (10 - i)
  let dv1 = (sum * 10) % 11
  if (dv1 === 10) dv1 = 0
  if (dv1 !== parseInt(c[9], 10)) return false

  sum = 0
  for (let i = 0; i < 10; i++) sum += parseInt(c[i], 10) * (11 - i)
  let dv2 = (sum * 10) % 11
  if (dv2 === 10) dv2 = 0
  if (dv2 !== parseInt(c[10], 10)) return false

  return true
}

export function isValidPhone(phone: string): boolean {
  return phone.replace(/\D/g, '').length >= 10
}

export function isStrongPassword(password: string): boolean {
  return password.length >= 6
}
