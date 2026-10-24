const rupees = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 })

/** Whole LKR rupees as 'Rs 2,500'. */
export function formatRupees(amount: number): string {
  return `Rs ${rupees.format(amount)}`
}
