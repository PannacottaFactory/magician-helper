import Papa from 'papaparse'
import { DEFAULT_TRICK_TAGS, TRICK_CATEGORIES, TRICK_STATUSES } from '@/lib/constants'
import { safeUrl } from '@/lib/format'
import type { TablesInsert } from '@/types/database'

export type ParsedRow = {
  line: number
  values: TablesInsert<'tricks'> | null
  errors: string[]
  warnings: string[]
}

// Accepted column names (case/spacing-insensitive) → database column
const ALIASES: Record<string, keyof TablesInsert<'tricks'>> = {
  name: 'name',
  title: 'name',
  trick: 'name',
  effect: 'effect',
  description: 'effect',
  secret: 'secret_and_setup',
  secretandsetup: 'secret_and_setup',
  method: 'secret_and_setup',
  setup: 'secret_and_setup',
  categories: 'categories',
  category: 'categories',
  difficulty: 'difficulty',
  duration: 'duration_min',
  durationmin: 'duration_min',
  minutes: 'duration_min',
  status: 'status',
  tags: 'tags',
  video: 'video_url',
  videourl: 'video_url',
  references: 'references_text',
  referencestext: 'references_text',
  credits: 'references_text',
  props: 'other_props',
  otherprops: 'other_props',
  notes: 'notes',
}

const normalize = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '')
const splitList = (s: string) =>
  s
    .split(/[;|,]/)
    .map((x) => x.trim())
    .filter(Boolean)

export const TEMPLATE_HEADERS = [
  'name',
  'effect',
  'secret_and_setup',
  'categories',
  'difficulty',
  'duration_min',
  'status',
  'tags',
  'video_url',
  'references',
  'other_props',
  'notes',
]

export function templateCsv() {
  const example = [
    'Ambitious Card',
    'A signed card keeps rising to the top of the deck.',
    'Double lift, tilt, side steal.',
    'Card; Close-up',
    '2',
    '5',
    'Performance-ready',
    'Opener; Walkaround',
    'https://www.youtube.com/watch?v=…',
    'Royal Road to Card Magic',
    'Sharpie',
    '',
  ]
  return '﻿' + Papa.unparse({ fields: TEMPLATE_HEADERS, data: [example] })
}

function parseRow(raw: Record<string, string>, line: number): ParsedRow {
  const errors: string[] = []
  const warnings: string[] = []
  const get = (key: keyof TablesInsert<'tricks'>) => {
    const entry = Object.entries(raw).find(([header]) => ALIASES[normalize(header)] === key)
    return entry?.[1]?.trim() ?? ''
  }

  const name = get('name')
  if (!name) errors.push('Missing name')
  if (name.length > 200) errors.push('Name longer than 200 characters')

  const categories: string[] = []
  for (const c of splitList(get('categories'))) {
    const match = TRICK_CATEGORIES.find((x) => normalize(x.label) === normalize(c) || x.value === c.toLowerCase())
    if (match) categories.push(match.value)
    else warnings.push(`Unknown category “${c}” ignored`)
  }

  let difficulty: number | null = null
  const d = get('difficulty')
  if (d) {
    const n = Number(d)
    if (Number.isInteger(n) && n >= 1 && n <= 4) difficulty = n
    else warnings.push(`Difficulty “${d}” ignored (use 1 to 4)`)
  }

  let duration: number | null = null
  const m = get('duration_min')
  if (m) {
    const n = Number(m.replace(',', '.'))
    if (Number.isFinite(n) && n >= 0 && n <= 600) duration = Math.round(n)
    else warnings.push(`Duration “${m}” ignored`)
  }

  let status = 'to_learn'
  const s = get('status')
  if (s) {
    const match = TRICK_STATUSES.find((x) => normalize(x.label) === normalize(s) || x.value === s.toLowerCase())
    if (match) status = match.value
    else warnings.push(`Unknown status “${s}”, set to To learn`)
  }

  const tags = [...new Set(splitList(get('tags')).map((t) => DEFAULT_TRICK_TAGS.find((x) => x.toLowerCase() === t.toLowerCase()) ?? t.slice(0, 40)))]

  let video: string | null = null
  const v = get('video_url')
  if (v) {
    video = safeUrl(v)
    if (!video) warnings.push('Video link ignored (must start with https://)')
  }

  const text = (key: keyof TablesInsert<'tricks'>) => get(key) || null

  return {
    line,
    errors,
    warnings,
    values: errors.length
      ? null
      : {
          // every row has exactly the same keys (required for bulk inserts)
          name,
          effect: text('effect'),
          secret_and_setup: text('secret_and_setup'),
          categories,
          difficulty,
          duration_min: duration,
          status,
          tags,
          video_url: video,
          references_text: text('references_text'),
          other_props: text('other_props'),
          notes: text('notes'),
        },
  }
}

export async function parseTricksCsv(file: File): Promise<{ rows: ParsedRow[]; unknownColumns: string[] }> {
  // Read as text ourselves (works everywhere) and drop the Excel BOM if present
  const raw = await file.text()
  const text = raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw
  const result = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: 'greedy' })
  const headers = result.meta.fields ?? []
  if (!headers.some((h) => ALIASES[normalize(h)] === 'name')) {
    throw new Error('The file needs a "name" column. Download the template to see the expected format.')
  }
  return {
    rows: result.data.map((raw, i) => parseRow(raw, i + 2)),
    unknownColumns: headers.filter((h) => h && !ALIASES[normalize(h)]),
  }
}
