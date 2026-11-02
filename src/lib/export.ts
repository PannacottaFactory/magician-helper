import Papa from 'papaparse'
import { supabase } from './supabase'

/** Every user table, in an order that makes sense to read. */
export const EXPORT_TABLES = [
  'tricks',
  'inventory_items',
  'inventory_files',
  'trick_props',
  'ideas',
  'routines',
  'routine_tricks',
  'practice_logs',
  'clients',
  'gigs',
  'gig_routines',
  'gig_checklist_items',
] as const
type ExportTable = (typeof EXPORT_TABLES)[number]

const PAGE = 1000

/** Reads a whole table, page by page (the API returns at most 1000 rows per call). */
async function fetchAll(table: ExportTable): Promise<Record<string, unknown>[]> {
  const rows: Record<string, unknown>[] = []
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .order('created_at')
      .order('id')
      .range(from, from + PAGE - 1)
    if (error) throw error
    rows.push(...(data as Record<string, unknown>[]))
    if (data.length < PAGE) return rows
  }
}

async function fetchEverything() {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('display_name, currency, theme, stale_trick_days, trial_ends_at, subscription_status, created_at')
    .single()
  if (error) throw error
  const tables: Record<string, Record<string, unknown>[]> = {}
  for (const table of EXPORT_TABLES) tables[table] = await fetchAll(table)
  return { profile, tables }
}

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.append(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function stamp() {
  return new Date().toISOString().slice(0, 10)
}

export async function exportJson() {
  const { profile, tables } = await fetchEverything()
  const payload = {
    app: 'Magician Helper',
    format_version: 1,
    exported_at: new Date().toISOString(),
    profile,
    data: tables,
  }
  download(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }), `magician-helper-${stamp()}.json`)
  return Object.values(tables).reduce((n, rows) => n + rows.length, 0)
}

/** CSV cell values: arrays become "a; b", objects become JSON. */
function flatten(row: Record<string, unknown>) {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(row)) {
    out[key] = Array.isArray(value) ? value.join('; ') : value !== null && typeof value === 'object' ? JSON.stringify(value) : value
  }
  return out
}

export async function exportCsvZip() {
  const { default: JSZip } = await import('jszip')
  const { profile, tables } = await fetchEverything()
  const zip = new JSZip()
  zip.file('profile.csv', '﻿' + Papa.unparse([flatten(profile as Record<string, unknown>)]))
  for (const [table, rows] of Object.entries(tables)) {
    // BOM so Excel opens accents correctly; header row even when empty
    const csv = rows.length ? Papa.unparse(rows.map(flatten)) : ''
    zip.file(`${table}.csv`, '﻿' + csv)
  }
  zip.file(
    'README.txt',
    `Magician Helper export — ${new Date().toISOString()}\n\nOne CSV file per table. Lists (tags, categories…) are separated by "; ".\nPhotos and files are not included: download them from each inventory item.\n`,
  )
  download(await zip.generateAsync({ type: 'blob' }), `magician-helper-${stamp()}.zip`)
  return Object.values(tables).reduce((n, rows) => n + rows.length, 0)
}
