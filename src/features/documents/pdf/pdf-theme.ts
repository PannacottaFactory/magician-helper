// Shared look of the generated PDFs (loaded on demand with @react-pdf/renderer).
// PDFs are printed on white paper: colors are fixed print colors, not the app theme.
import { Font, StyleSheet } from '@react-pdf/renderer'

const font = (file: string) => `${import.meta.env.BASE_URL}fonts/${file}`

let registered = false
export function registerFonts() {
  if (registered) return
  registered = true
  Font.register({
    family: 'Inter',
    fonts: [
      { src: font('inter-400.ttf'), fontWeight: 400 },
      { src: font('inter-600.ttf'), fontWeight: 600 },
    ],
  })
  Font.register({
    family: 'Cormorant',
    fonts: [
      { src: font('cormorant-600.ttf'), fontWeight: 600 },
      { src: font('cormorant-600-italic.ttf'), fontWeight: 600, fontStyle: 'italic' },
    ],
  })
  // Long words (emails, URLs) may break anywhere instead of overflowing
  Font.registerHyphenationCallback((word) => [word])
}

export const ink = {
  text: '#161616',
  muted: '#5c5a55',
  faint: '#8f8b83',
  rule: '#e4e1da',
  gold: '#8a6420',
  tint: '#f6f2e9',
}

export const base = StyleSheet.create({
  page: {
    fontFamily: 'Inter',
    fontSize: 9.5,
    lineHeight: 1.45,
    color: ink.text,
    paddingTop: 48,
    paddingBottom: 64,
    paddingHorizontal: 48,
  },
  display: { fontFamily: 'Cormorant', fontWeight: 600 },
  eyebrow: { fontSize: 8, fontWeight: 600, letterSpacing: 2.2, color: ink.gold, textTransform: 'uppercase' },
  label: { fontSize: 7.5, fontWeight: 600, letterSpacing: 1.2, color: ink.faint, textTransform: 'uppercase', marginBottom: 4 },
  muted: { color: ink.muted },
  bold: { fontWeight: 600 },
  footer: {
    position: 'absolute',
    left: 48,
    right: 48,
    bottom: 28,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 7.5,
    color: ink.faint,
    borderTopWidth: 0.5,
    borderTopColor: ink.rule,
    paddingTop: 8,
  },
})
