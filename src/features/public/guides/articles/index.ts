import type { ComponentType } from 'react'
import { AppsGuide } from './apps'
import { ChecklistGuide } from './checklist'
import { InvoiceGuide } from './invoice'
import { PracticeGuide } from './practice'
import { PricingGuide } from './pricing'
import { RepertoireGuide } from './repertoire'
import { SetlistGuide } from './setlist'
import { TemplateGuide } from './template'

/** Article body for each guide slug (metadata in ../guides-meta.ts). */
export const GUIDE_BODIES: Record<string, ComponentType> = {
  'how-to-invoice-a-magic-show': InvoiceGuide,
  'how-much-to-charge-for-a-magic-show': PricingGuide,
  'organize-your-magic-repertoire': RepertoireGuide,
  'how-to-practice-magic': PracticeGuide,
  'magic-show-checklist': ChecklistGuide,
  'how-to-build-a-magic-setlist': SetlistGuide,
  'magic-trick-list-template': TemplateGuide,
  'apps-for-magicians': AppsGuide,
}
