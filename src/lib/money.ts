/** All amounts default to Jamaican dollars. */
export function formatMoney(amount: number): string {
  return `J$${Math.round(amount).toLocaleString('en-JM')}`;
}
