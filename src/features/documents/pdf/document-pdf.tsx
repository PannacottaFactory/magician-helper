import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import { formatCurrency, formatDay } from '@/lib/format'
import type { DocumentRow, Seller } from '../api'
import { base, ink } from './pdf-theme'

const s = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 36 },
  seller: { maxWidth: 260 },
  sellerName: { fontSize: 22, lineHeight: 1.1, marginBottom: 6 },
  meta: { alignItems: 'flex-end' },
  docTitle: { fontSize: 30, lineHeight: 1, marginTop: 6, marginBottom: 10 },
  metaRow: { flexDirection: 'row', gap: 10, marginTop: 2 },
  metaLabel: { color: ink.faint, width: 70, textAlign: 'right' },
  metaValue: { minWidth: 80, textAlign: 'right' },
  parties: { flexDirection: 'row', gap: 24, marginBottom: 28 },
  billTo: { flex: 1, backgroundColor: ink.tint, borderRadius: 4, padding: 12 },
  subject: { flex: 1, padding: 12, paddingLeft: 0 },
  table: { borderTopWidth: 1, borderTopColor: ink.text },
  row: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: ink.rule, paddingVertical: 7 },
  headRow: { flexDirection: 'row', paddingVertical: 6, borderBottomWidth: 0.5, borderBottomColor: ink.rule },
  cDesc: { flex: 1, paddingRight: 12 },
  cQty: { width: 44, textAlign: 'right' },
  cPrice: { width: 84, textAlign: 'right' },
  cAmount: { width: 92, textAlign: 'right' },
  totals: { marginTop: 14, marginLeft: 'auto', width: 240 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  dueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: ink.gold,
  },
  due: { fontSize: 13, fontWeight: 600 },
  section: { marginTop: 26 },
  legal: { marginTop: 22, fontSize: 8, color: ink.muted },
  draft: {
    position: 'absolute',
    top: 330,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 110,
    color: '#000000',
    opacity: 0.05,
    transform: 'rotate(-28deg)',
  },
})

const lines = (value: string | null | undefined) => (value ? value.split('\n').filter((l) => l.trim()) : [])

export function DocumentPdf({ doc, seller }: { doc: DocumentRow; seller: Seller }) {
  const money = (n: number | string) => formatCurrency(Number(n), doc.currency)
  const isQuote = doc.kind === 'quote'
  const label = isQuote ? 'Quote' : 'Invoice'
  const taxRate = Number(doc.tax_rate)
  const deposit = Number(doc.deposit_paid)
  const contact = [seller.email, seller.phone, seller.website].filter(Boolean)

  return (
    <Document
      title={`${label} ${doc.number ?? '(draft)'}${seller.business_name ? ` — ${seller.business_name}` : ''}`}
      author={seller.business_name ?? undefined}
      creator="Magician Helper"
      producer="Magician Helper"
    >
      <Page size="A4" style={base.page}>
        {doc.status === 'draft' && (
          <Text style={[base.display, s.draft]} fixed>
            DRAFT
          </Text>
        )}

        <View style={s.header}>
          <View style={s.seller}>
            <Text style={[base.display, s.sellerName]}>{seller.business_name || 'Your business name'}</Text>
            {lines(seller.address).map((l, i) => (
              <Text key={i} style={base.muted}>
                {l}
              </Text>
            ))}
            {contact.length > 0 && <Text style={[base.muted, { marginTop: 4 }]}>{contact.join('  ·  ')}</Text>}
            {seller.tax_id && <Text style={base.muted}>{seller.tax_id}</Text>}
          </View>
          <View style={s.meta}>
            <Text style={base.eyebrow}>{label}</Text>
            <Text style={[base.display, s.docTitle]}>{doc.number ?? 'Draft'}</Text>
            <View style={s.metaRow}>
              <Text style={s.metaLabel}>Date</Text>
              <Text style={s.metaValue}>{formatDay(doc.issue_date, { day: 'numeric', month: 'long', year: 'numeric' })}</Text>
            </View>
            {doc.due_date && (
              <View style={s.metaRow}>
                <Text style={s.metaLabel}>{isQuote ? 'Valid until' : 'Due date'}</Text>
                <Text style={s.metaValue}>{formatDay(doc.due_date, { day: 'numeric', month: 'long', year: 'numeric' })}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={s.parties}>
          <View style={s.billTo}>
            <Text style={base.label}>{isQuote ? 'Prepared for' : 'Bill to'}</Text>
            <Text style={base.bold}>{doc.buyer_name || '—'}</Text>
            {doc.buyer_company && <Text>{doc.buyer_company}</Text>}
            {lines(doc.buyer_address).map((l, i) => (
              <Text key={i} style={base.muted}>
                {l}
              </Text>
            ))}
            {doc.buyer_email && <Text style={base.muted}>{doc.buyer_email}</Text>}
          </View>
          <View style={s.subject}>
            {doc.title && (
              <>
                <Text style={base.label}>Subject</Text>
                <Text>{doc.title}</Text>
              </>
            )}
          </View>
        </View>

        <View style={s.table}>
          <View style={s.headRow} fixed>
            <Text style={[base.label, s.cDesc, { marginBottom: 0 }]}>Description</Text>
            <Text style={[base.label, s.cQty, { marginBottom: 0 }]}>Qty</Text>
            <Text style={[base.label, s.cPrice, { marginBottom: 0 }]}>Unit price</Text>
            <Text style={[base.label, s.cAmount, { marginBottom: 0 }]}>Amount</Text>
          </View>
          {doc.lines.map((line, i) => (
            <View key={i} style={s.row} wrap={false}>
              <Text style={s.cDesc}>{line.description}</Text>
              <Text style={s.cQty}>{line.quantity}</Text>
              <Text style={s.cPrice}>{money(line.unit_price)}</Text>
              <Text style={s.cAmount}>{money(Math.round(line.quantity * line.unit_price * 100) / 100)}</Text>
            </View>
          ))}
        </View>

        <View style={s.totals} wrap={false}>
          <View style={s.totalRow}>
            <Text style={base.muted}>Subtotal</Text>
            <Text>{money(doc.subtotal)}</Text>
          </View>
          {taxRate > 0 && (
            <View style={s.totalRow}>
              <Text style={base.muted}>VAT ({taxRate}%)</Text>
              <Text>{money(doc.tax_amount)}</Text>
            </View>
          )}
          <View style={s.totalRow}>
            <Text style={base.bold}>Total</Text>
            <Text style={base.bold}>{money(doc.total)}</Text>
          </View>
          {deposit > 0 && (
            <View style={s.totalRow}>
              <Text style={base.muted}>Deposit received</Text>
              <Text>− {money(deposit)}</Text>
            </View>
          )}
          {!isQuote && (
            <View style={s.dueRow}>
              <Text style={s.due}>Amount due</Text>
              <Text style={s.due}>{money(doc.amount_due)}</Text>
            </View>
          )}
        </View>

        {doc.notes && (
          <View style={s.section} wrap={false}>
            <Text style={base.label}>Notes</Text>
            {lines(doc.notes).map((l, i) => (
              <Text key={i}>{l}</Text>
            ))}
          </View>
        )}

        {!isQuote && seller.payment_instructions && (
          <View style={s.section} wrap={false}>
            <Text style={base.label}>Payment</Text>
            {lines(seller.payment_instructions).map((l, i) => (
              <Text key={i}>{l}</Text>
            ))}
          </View>
        )}

        {isQuote && (
          <View style={s.section} wrap={false}>
            <Text style={base.label}>Acceptance</Text>
            <Text style={base.muted}>Good for agreement — date and signature:</Text>
            <View style={{ marginTop: 8, height: 54, width: 240, borderWidth: 0.5, borderColor: ink.rule, borderRadius: 4 }} />
          </View>
        )}

        {seller.legal_note && <Text style={s.legal}>{seller.legal_note}</Text>}

        <View style={base.footer} fixed>
          <Text>{[seller.business_name, seller.tax_id].filter(Boolean).join('  ·  ')}</Text>
          <Text render={({ pageNumber, totalPages }) => `${doc.number ?? 'Draft'}  ·  ${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  )
}
