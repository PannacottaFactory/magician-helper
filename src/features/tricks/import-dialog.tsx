import { useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, CheckCircle2, Download, FileUp, Loader2, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { dbErrorMessage } from '@/lib/db'
import { pluralize } from '@/lib/format'
import { supabase } from '@/lib/supabase'
import { trickKeys, useTricks } from './api'
import { parseTricksCsv, templateCsv, type ParsedRow } from './import-csv'

export function ImportTricksDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const queryClient = useQueryClient()
  const { data: existing = [] } = useTricks()
  const inputRef = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [unknown, setUnknown] = useState<string[]>([])
  const [skipDuplicates, setSkipDuplicates] = useState(true)
  const [importing, setImporting] = useState(false)

  const existingNames = new Set(existing.map((t) => t.name.trim().toLowerCase()))
  const valid = rows.filter((r) => r.values)
  const duplicates = valid.filter((r) => existingNames.has(r.values!.name.trim().toLowerCase()))
  const toImport = skipDuplicates ? valid.filter((r) => !duplicates.includes(r)) : valid
  const invalid = rows.filter((r) => !r.values)
  const withWarnings = valid.filter((r) => r.warnings.length)

  function reset() {
    setFileName(null)
    setRows([])
    setUnknown([])
  }

  async function onFile(file: File) {
    reset()
    try {
      const result = await parseTricksCsv(file)
      setFileName(file.name)
      setRows(result.rows)
      setUnknown(result.unknownColumns)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not read this file.')
    }
  }

  function downloadTemplate() {
    const url = URL.createObjectURL(new Blob([templateCsv()], { type: 'text/csv' }))
    const a = document.createElement('a')
    a.href = url
    a.download = 'magician-helper-tricks-template.csv'
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  async function onImport() {
    setImporting(true)
    try {
      const values = toImport.map((r) => r.values!)
      for (let i = 0; i < values.length; i += 200) {
        const { error } = await supabase.from('tricks').insert(values.slice(i, i + 200))
        if (error) throw error
      }
      toast.success(`${pluralize(values.length, 'trick')} imported.`)
      void queryClient.invalidateQueries({ queryKey: trickKeys.all })
      reset()
      onOpenChange(false)
    } catch (error) {
      toast.error(dbErrorMessage(error))
    } finally {
      setImporting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset()
        onOpenChange(o)
      }}
    >
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import tricks from CSV</DialogTitle>
          <DialogDescription>
            One trick per row. Only <strong>name</strong> is required. Lists (categories, tags) are separated by semicolons.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={downloadTemplate}>
            <Download aria-hidden="true" /> Download template
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
            onChange={(e) => {
              const file = e.target.files?.[0]
              e.target.value = ''
              if (file) void onFile(file)
            }}
          />
          <Button onClick={() => inputRef.current?.click()}>
            <FileUp aria-hidden="true" /> {fileName ? 'Choose another file' : 'Choose a CSV file'}
          </Button>
        </div>

        {fileName && (
          <div className="space-y-3" aria-live="polite">
            <p className="text-sm">
              <span className="font-medium">{fileName}</span> — {pluralize(rows.length, 'row')}
            </p>
            <ul className="space-y-1 text-sm">
              <li className="flex items-center gap-2 text-success">
                <CheckCircle2 className="size-4" aria-hidden="true" /> {pluralize(valid.length, 'valid trick')}
              </li>
              {invalid.length > 0 && (
                <li className="flex items-center gap-2 text-danger">
                  <XCircle className="size-4" aria-hidden="true" /> {pluralize(invalid.length, 'row')} will be skipped (
                  {invalid
                    .slice(0, 3)
                    .map((r) => `line ${r.line}: ${r.errors.join(', ')}`)
                    .join('; ')}
                  {invalid.length > 3 ? '…' : ''})
                </li>
              )}
              {withWarnings.length > 0 && (
                <li className="flex items-start gap-2 text-warning">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  <span>
                    {pluralize(withWarnings.length, 'row')} with ignored values (
                    {withWarnings
                      .slice(0, 3)
                      .map((r) => `line ${r.line}: ${r.warnings.join(', ')}`)
                      .join('; ')}
                    {withWarnings.length > 3 ? '…' : ''})
                  </span>
                </li>
              )}
              {unknown.length > 0 && (
                <li className="flex items-center gap-2 text-muted-foreground">
                  <AlertTriangle className="size-4" aria-hidden="true" /> Unknown columns ignored: {unknown.join(', ')}
                </li>
              )}
            </ul>

            {duplicates.length > 0 && (
              <div className="flex items-center gap-2">
                <Checkbox id="skip-duplicates" checked={skipDuplicates} onCheckedChange={(c) => setSkipDuplicates(c === true)} />
                <Label htmlFor="skip-duplicates" className="font-normal">
                  Skip {pluralize(duplicates.length, 'trick')} already in your library (same name)
                </Label>
              </div>
            )}

            {valid.length > 0 && (
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-left text-xs">
                  <caption className="sr-only">Preview of the first rows</caption>
                  <thead className="bg-muted/50 text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2 font-medium">Name</th>
                      <th className="px-3 py-2 font-medium">Status</th>
                      <th className="px-3 py-2 font-medium">Categories</th>
                      <th className="px-3 py-2 font-medium">Tags</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {valid.slice(0, 6).map((r) => (
                      <tr key={r.line}>
                        <td className="max-w-48 truncate px-3 py-2 font-medium">{r.values!.name}</td>
                        <td className="px-3 py-2">{r.values!.status}</td>
                        <td className="px-3 py-2">{r.values!.categories?.join(', ')}</td>
                        <td className="max-w-40 truncate px-3 py-2">{r.values!.tags?.join(', ')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {valid.length > 6 && <p className="border-t px-3 py-2 text-xs text-muted-foreground">…and {valid.length - 6} more</p>}
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onImport} disabled={!toImport.length || importing}>
            {importing && <Loader2 className="animate-spin" aria-hidden="true" />}
            Import {toImport.length ? pluralize(toImport.length, 'trick') : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
