export function buildWhatsAppLink(phone: string, message: string): string {
  const digits = phone.replace(/\D/g, '')
  const normalized = digits.startsWith('88') ? digits : `88${digits}`
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`
}

export function orderWhatsAppMessage(orderNumber: string, customerName: string): string {
  return `আসসালামু আলাইকুম ${customerName}, আপনার অর্ডার ${orderNumber} এর বিষয়ে যোগাযোগ করছি। — সোনালী ফসল অর্গানিকস`
}
