const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯']

export function toBanglaDigits(value: string | number): string {
  return String(value).replace(/\d/g, (digit) => bnDigits[Number(digit)])
}

export function formatNumber(value: number, locale = 'en-US'): string {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(value)
}

export function formatBDT(value: number, options?: { bangla?: boolean; compact?: boolean }): string {
  const number = options?.compact
    ? new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(value)
    : formatNumber(value)
  return `৳${options?.bangla ? toBanglaDigits(number) : number}`
}

export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 11) {
    return `${digits.slice(0, 5)}-${digits.slice(5)}`
  }
  return phone
}

export function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}
