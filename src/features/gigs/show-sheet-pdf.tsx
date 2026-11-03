import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import { base, ink } from '@/features/documents/pdf/pdf-theme'
import { formatDuration, formatGigWhen, formatTime } from '@/lib/format'
import type { ShowSheetData } from './api'

const s = StyleSheet.create({
  title: { fontSize: 28, lineHeight: 1.05, marginTop: 6 },
  when: { fontSize: 11, marginTop: 6 },
  facts: { flexDirection: 'row', gap: 16, marginTop: 22, marginBottom: 24 },
  fact: { flex: 1, backgroundColor: ink.tint, borderRadius: 4, padding: 10 },
  sectionTitle: { fontSize: 16, marginBottom: 12, marginTop: 6 },
  routine: { marginBottom: 14 },
  routineName: { flexDirection: 'row', justifyContent: 'space-between', paddingBottom: 4, borderBottomWidth: 1, borderBottomColor: ink.text },
  row: { flexDirection: 'row', paddingVertical: 6, borderBottomWidth: 0.5, borderBottomColor: ink.rule },
  time: { width: 48, color: ink.gold, fontWeight: 600 },
  num: { width: 20, color: ink.faint },
  trick: { flex: 1, paddingRight: 8 },
  dur: { width: 48, textAlign: 'right', color: ink.muted },
  note: { color: ink.muted, fontSize: 8.5, marginTop: 2 },
  props: { flexDirection: 'row', flexWrap: 'wrap' },
  prop: { width: '50%', flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4, paddingRight: 12 },
  box: { width: 9, height: 9, borderWidth: 0.8, borderColor: ink.text, borderRadius: 1.5 },
  boxChecked: { backgroundColor: ink.gold, borderColor: ink.gold },
  section: { marginTop: 18 },
})

/** One printable page for the day of the show: when, where, who, running order, what to pack. */
export function ShowSheetPdf({ data }: { data: ShowSheetData }) {
  const { gig, routines, checklist } = data
  // Start time of every trick, counted from the start of the gig
  const startTimes = new Map<string, number>()
  routines
    .flatMap((r) => r.tricks)
    .reduce((clock, trick) => {
      startTimes.set(trick.id, clock)
      return clock + (trick.duration_min ?? 0) * 60_000
    }, new Date(gig.starts_at).getTime())
  const totalMinutes = routines.reduce((sum, r) => sum + r.tricks.reduce((t, x) => t + (x.duration_min ?? 0), 0), 0)

  return (
    <Document title={`Show sheet — ${gig.title}`} creator="Magician Helper" producer="Magician Helper">
      <Page size="A4" style={base.page}>
        <Text style={base.eyebrow}>Show sheet</Text>
        <Text style={[base.display, s.title]}>{gig.title}</Text>
        <Text style={s.when}>{formatGigWhen(gig.starts_at, gig.ends_at)}</Text>

        <View style={s.facts}>
          <View style={s.fact}>
            <Text style={base.label}>Venue</Text>
            <Text>{gig.location || '—'}</Text>
            {gig.event_type && <Text style={base.muted}>{gig.event_type}</Text>}
          </View>
          <View style={s.fact}>
            <Text style={base.label}>Contact</Text>
            <Text>{gig.client ? [gig.client.name, gig.client.company].filter(Boolean).join(', ') : '—'}</Text>
            {gig.client?.phone && <Text style={base.muted}>{gig.client.phone}</Text>}
            {gig.client?.email && <Text style={base.muted}>{gig.client.email}</Text>}
          </View>
          <View style={s.fact}>
            <Text style={base.label}>Show time</Text>
            <Text>{totalMinutes ? formatDuration(totalMinutes) : '—'}</Text>
            <Text style={base.muted}>
              {routines.length} routine{routines.length === 1 ? '' : 's'} · {routines.reduce((n, r) => n + r.tricks.length, 0)} tricks
            </Text>
          </View>
        </View>

        <Text style={[base.display, s.sectionTitle]}>Running order</Text>
        {routines.length === 0 && <Text style={base.muted}>No routines linked to this gig.</Text>}
        {routines.map((routine) => (
          <View key={routine.id} style={s.routine}>
            <View style={s.routineName} wrap={false}>
              <Text style={base.bold}>{routine.name}</Text>
              <Text style={base.muted}>{formatDuration(routine.tricks.reduce((t, x) => t + (x.duration_min ?? 0), 0))}</Text>
            </View>
            {routine.tricks.map((trick, i) => (
                <View key={trick.id} style={s.row} wrap={false}>
                  <Text style={s.time}>{formatTime(new Date(startTimes.get(trick.id)!))}</Text>
                  <Text style={s.num}>{i + 1}</Text>
                  <View style={s.trick}>
                    <Text>{trick.name}</Text>
                    {trick.transition_notes && <Text style={s.note}>{trick.transition_notes}</Text>}
                  </View>
                  <Text style={s.dur}>{trick.duration_min ? `${trick.duration_min} min` : '—'}</Text>
                </View>
            ))}
          </View>
        ))}

        <View style={s.section}>
          <Text style={[base.display, s.sectionTitle]}>To pack</Text>
          {checklist.length === 0 ? (
            <Text style={base.muted}>Nothing on the checklist.</Text>
          ) : (
            <View style={s.props}>
              {checklist.map((item) => (
                <View key={item.id} style={s.prop} wrap={false}>
                  <View style={item.is_checked ? [s.box, s.boxChecked] : s.box} />
                  <Text>
                    {item.label}
                    {item.quantity_needed > 1 ? `  × ${item.quantity_needed}` : ''}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {gig.notes && (
          <View style={s.section} wrap={false}>
            <Text style={[base.display, s.sectionTitle]}>Notes</Text>
            <Text>{gig.notes}</Text>
          </View>
        )}

        <View style={base.footer} fixed>
          <Text>{gig.title}</Text>
          <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  )
}
