/** Contact links for a contributor. Numbers are Sri Lankan unless they start with another country code. */

type Contact = { phone: string | null; whatsapp: string | null }

/** `tel:` link for the phone number, or null when there's none. */
export function callUrl({ phone }: Contact): string | null {
  if (!phone) return null
  const number = phone.replace(/[^\d+]/g, '')
  return number ? `tel:${number}` : null
}

/**
 * `wa.me` link for the WhatsApp number, falling back to the phone number.
 * Local numbers (077 123 4567) get the Sri Lankan country code: wa.me/94771234567.
 * With `text`, WhatsApp opens with that message typed in, ready to send by hand.
 */
export function whatsappUrl({ phone, whatsapp }: Contact, text?: string): string | null {
  const number = internationalNumber(whatsapp) ?? internationalNumber(phone)
  if (!number) return null
  return text ? `https://wa.me/${number}?text=${encodeURIComponent(text)}` : `https://wa.me/${number}`
}

function internationalNumber(text: string | null): string | null {
  if (!text) return null
  const international = text.trim().startsWith('+') || text.trim().startsWith('00')
  const digits = text.replace(/\D/g, '')
  if (!digits) return null
  if (international) return digits.replace(/^00/, '')
  if (digits.startsWith('94') && digits.length === 11) return digits
  return `94${digits.replace(/^0/, '')}`
}
