// Builds PDFs in the browser. @react-pdf/renderer is large, so it is only
// downloaded the first time someone generates a PDF.
import type { ReactElement } from 'react'
import type { DocumentProps } from '@react-pdf/renderer'
import type { ShowSheetData } from '@/features/gigs/api'
import type { DocumentRow, Seller } from '../api'

async function save(element: () => Promise<ReactElement<DocumentProps>>, filename: string) {
  const [{ pdf }, { registerFonts }] = await Promise.all([import('@react-pdf/renderer'), import('./pdf-theme')])
  registerFonts()
  const blob = await pdf(await element()).toBlob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

const slug = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
    .slice(0, 60)

export function downloadDocumentPdf(doc: DocumentRow, seller: Seller) {
  const name = doc.number ?? `${doc.kind}-draft`
  const who = doc.buyer_company || doc.buyer_name
  return save(async () => {
    const { DocumentPdf } = await import('./document-pdf')
    return <DocumentPdf doc={doc} seller={seller} />
  }, `${slug([name, who].filter(Boolean).join(' '))}.pdf`)
}

export function downloadShowSheetPdf(data: ShowSheetData) {
  return save(async () => {
    const { ShowSheetPdf } = await import('@/features/gigs/show-sheet-pdf')
    return <ShowSheetPdf data={data} />
  }, `show-sheet-${slug(data.gig.title)}.pdf`)
}
