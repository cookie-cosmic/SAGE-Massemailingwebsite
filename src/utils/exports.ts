import type { School } from '../types'

const download = (content: string, filename: string, type: string) => {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const link = document.createElement('a')
  link.href = url; link.download = filename; link.click(); URL.revokeObjectURL(url)
}
const escapeCsv = (value: string) => `"${value.replace(/"/g, '""')}"`

export function exportCsv(items: Array<{ school: School; distance: number }>) {
  const header = ['School Name', 'School Type', 'Address', 'City', 'State', 'ZIP', 'Email', 'Website', 'Distance']
  const rows = items.map(({ school, distance }) => [school.name, school.type, school.address, school.city, school.state, school.zip, school.email ?? '', school.website, `${distance.toFixed(1)} miles`])
  download([header, ...rows].map((row) => row.map(escapeCsv).join(',')).join('\n'), 'sage-school-contacts.csv', 'text/csv')
}
export function exportTxt(emails: string[]) { download(emails.join('\n'), 'sage-selected-emails.txt', 'text/plain') }
