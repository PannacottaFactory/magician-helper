// Built-in catalog of classic props. Users add the ones they own to their
// inventory in one click (nothing is added automatically).

export type CatalogGroup = 'Cards' | 'Coins' | 'Close-up' | 'Mentalism' | 'Stage' | 'Consumables'

export type CatalogItem = {
  key: string
  name: string
  group: CatalogGroup
  quantity: number
  lowStockThreshold: number
  notes: string
}

export const CATALOG_GROUPS: CatalogGroup[] = ['Cards', 'Coins', 'Close-up', 'Mentalism', 'Stage', 'Consumables']

export const PROP_CATALOG: CatalogItem[] = [
  // Cards
  { key: 'bicycle-red', name: 'Bicycle Standard deck (red)', group: 'Cards', quantity: 2, lowStockThreshold: 1, notes: 'Poker size, air-cushion finish. Replace when the cards stop fanning cleanly.' },
  { key: 'bicycle-blue', name: 'Bicycle Standard deck (blue)', group: 'Cards', quantity: 2, lowStockThreshold: 1, notes: 'Poker size, air-cushion finish. Replace when the cards stop fanning cleanly.' },
  { key: 'double-backer', name: 'Double-backer deck', group: 'Cards', quantity: 1, lowStockThreshold: 0, notes: 'Gaff cards with a back on both sides.' },
  { key: 'blank-face-deck', name: 'Blank-face deck', group: 'Cards', quantity: 1, lowStockThreshold: 0, notes: 'Normal backs, blank faces.' },
  { key: 'svengali-deck', name: 'Svengali deck', group: 'Cards', quantity: 1, lowStockThreshold: 0, notes: 'Self-working force deck — great for beginners and walkaround.' },
  { key: 'stripper-deck', name: 'Stripper deck', group: 'Cards', quantity: 1, lowStockThreshold: 0, notes: 'Tapered deck: reversed cards can be stripped out.' },
  { key: 'invisible-deck', name: 'Invisible deck', group: 'Cards', quantity: 1, lowStockThreshold: 0, notes: 'Any named card is the only one reversed.' },
  { key: 'jumbo-cards', name: 'Jumbo cards', group: 'Cards', quantity: 1, lowStockThreshold: 0, notes: 'Large cards for stage and parlor visibility.' },
  // Coins
  { key: 'half-dollars', name: 'Half dollars', group: 'Coins', quantity: 4, lowStockThreshold: 0, notes: 'The classic coin-magic size.' },
  { key: 'expanded-shell', name: 'Expanded shell', group: 'Coins', quantity: 1, lowStockThreshold: 0, notes: 'Shell that nests over a matching coin.' },
  { key: 'copper-silver', name: 'Copper/silver coin', group: 'Coins', quantity: 1, lowStockThreshold: 0, notes: 'Gaffed coin for transpositions.' },
  // Close-up
  { key: 'sponge-balls', name: 'Sponge balls', group: 'Close-up', quantity: 4, lowStockThreshold: 2, notes: 'Usually 1.5" or 2". They wear out — keep spares.' },
  { key: 'cups-and-balls', name: 'Cups and balls set', group: 'Close-up', quantity: 1, lowStockThreshold: 0, notes: 'Three cups, balls and final loads.' },
  { key: 'thumb-tip', name: 'Thumb tip', group: 'Close-up', quantity: 1, lowStockThreshold: 0, notes: 'Vanish, production and switch utility.' },
  { key: 'close-up-pad', name: 'Close-up pad', group: 'Close-up', quantity: 1, lowStockThreshold: 0, notes: 'Soft working surface for cards and coins.' },
  { key: 'peek-wallet', name: 'Peek wallet', group: 'Close-up', quantity: 1, lowStockThreshold: 0, notes: 'For secretly reading information or card switches.' },
  { key: 'rubber-bands', name: 'Rubber bands', group: 'Close-up', quantity: 20, lowStockThreshold: 5, notes: 'For band routines — they snap, keep plenty.' },
  // Mentalism
  { key: 'nail-writer', name: 'Nail writer', group: 'Mentalism', quantity: 1, lowStockThreshold: 0, notes: 'Swami gimmick for secret writing.' },
  { key: 'billets', name: 'Billets', group: 'Mentalism', quantity: 30, lowStockThreshold: 10, notes: 'Small paper slips for drawing and thought readings.' },
  { key: 'impression-pad', name: 'Impression pad', group: 'Mentalism', quantity: 1, lowStockThreshold: 0, notes: 'Notepad that secretly records what is written.' },
  // Stage
  { key: 'silks', name: 'Silk handkerchiefs', group: 'Stage', quantity: 6, lowStockThreshold: 0, notes: 'Productions, vanishes and color changes.' },
  { key: 'linking-rings', name: 'Linking rings', group: 'Stage', quantity: 1, lowStockThreshold: 0, notes: 'Set of rings, including the key ring.' },
  { key: 'rope', name: "Magician's rope", group: 'Stage', quantity: 1, lowStockThreshold: 0, notes: 'Soft coreless rope — cut pieces are consumed.' },
  { key: 'magic-wand', name: 'Magic wand', group: 'Stage', quantity: 1, lowStockThreshold: 0, notes: 'The classic. Also a great misdirection tool.' },
  { key: 'change-bag', name: 'Change bag', group: 'Stage', quantity: 1, lowStockThreshold: 0, notes: 'Switches, vanishes and productions — ideal for kids shows.' },
  // Consumables
  { key: 'sharpie', name: 'Sharpie marker', group: 'Consumables', quantity: 2, lowStockThreshold: 1, notes: 'For signed cards and predictions. Check it before every show.' },
  { key: 'flash-paper', name: 'Flash paper', group: 'Consumables', quantity: 10, lowStockThreshold: 3, notes: 'Burns instantly without ash. Store away from heat.' },
]

export function getCatalogItem(key: string | null | undefined) {
  return PROP_CATALOG.find((item) => item.key === key)
}
