// Runs every migration, then every test file in supabase/tests, inside PGlite
// (an in-memory Postgres). Supabase's auth/storage schemas are mocked in
// supabase-mock.sql. No Docker needed.
//
// Test file format: blocks starting with "-- @ <title>". Add EXPECT_FAIL to the
// title when the block must be refused (RLS / permissions).
// Usage: npm run test:sql
import { PGlite } from '@electric-sql/pglite'
import { pg_trgm } from '@electric-sql/pglite/contrib/pg_trgm'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const db = new PGlite({ extensions: { pg_trgm } })
let failures = 0

async function exec(label, sql) {
  try {
    await db.exec(sql)
    console.log('ok   ', label)
  } catch (e) {
    console.log('FAIL ', label, '→', e.message)
    process.exit(1)
  }
}

await exec('supabase mock', fs.readFileSync(new URL('./supabase-mock.sql', import.meta.url), 'utf8'))

const migrations = path.join(root, 'supabase/migrations')
for (const file of fs.readdirSync(migrations).sort()) {
  await exec(`migration ${file}`, fs.readFileSync(path.join(migrations, file), 'utf8'))
}

const testsDir = path.join(root, 'supabase/tests')
for (const file of fs.readdirSync(testsDir).filter((f) => f.endsWith('.sql')).sort()) {
  console.log(`\n# ${file}`)
  const blocks = fs.readFileSync(path.join(testsDir, file), 'utf8').split(/^-- @/m).filter((b) => b.trim())
  for (const block of blocks) {
    const [title, ...body] = block.split('\n')
    const expectFail = title.includes('EXPECT_FAIL')
    try {
      const results = await db.exec(body.join('\n'))
      const last = results[results.length - 1]
      if (expectFail) {
        failures++
        console.log('FAIL ', title.trim(), '→ should have been refused')
      } else {
        console.log('ok   ', title.trim(), last?.rows?.length ? JSON.stringify(last.rows) : '')
      }
    } catch (e) {
      if (expectFail) console.log('ok   ', title.trim(), `(refused: ${e.message})`)
      else {
        failures++
        console.log('FAIL ', title.trim(), '→', e.message)
      }
    }
    await db.exec('reset role; reset request.jwt.claim.sub;').catch(() => {})
  }
}

console.log(failures ? `\n${failures} failure(s)` : '\nAll SQL tests passed')
process.exit(failures ? 1 : 0)
