// GDPR: deletes the user's account and all their data.
// 1. Stripe: deletes the customer (cancels any subscription immediately)
// 2. Storage: removes every file in the user's folder
// 3. Auth: deletes the user → every table row is removed by ON DELETE CASCADE
import { corsHeaders, json } from '../_shared/cors.ts'
import { admin, getProfile, getUser, stripe } from '../_shared/clients.ts'

const BUCKET = 'inventory'

async function removeStorageFolder(userId: string) {
  // layout: {userId}/{itemId}/{file}
  const { data: folders, error } = await admin.storage.from(BUCKET).list(userId, { limit: 1000 })
  if (error) throw error
  for (const folder of folders ?? []) {
    const prefix = `${userId}/${folder.name}`
    const { data: files, error: listError } = await admin.storage.from(BUCKET).list(prefix, { limit: 1000 })
    if (listError) throw listError
    const paths = (files ?? []).map((f) => `${prefix}/${f.name}`)
    if (paths.length) {
      const { error: removeError } = await admin.storage.from(BUCKET).remove(paths)
      if (removeError) throw removeError
    }
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(req) })
  if (req.method !== 'POST') return json(req, { error: 'Method not allowed' }, 405)

  try {
    const user = await getUser(req)
    if (!user) return json(req, { error: 'Not signed in' }, 401)

    const { confirm } = (await req.json().catch(() => ({}))) as { confirm?: string }
    if (confirm !== 'DELETE') return json(req, { error: 'Type DELETE to confirm' }, 400)

    const profile = await getProfile(user.id)
    if (profile.stripe_customer_id) {
      try {
        await stripe.customers.del(profile.stripe_customer_id)
      } catch (error) {
        // already deleted on Stripe's side: continue
        console.warn('Stripe customer deletion failed', error)
      }
    }

    await removeStorageFolder(user.id)

    const { error } = await admin.auth.admin.deleteUser(user.id)
    if (error) throw error

    return json(req, { ok: true })
  } catch (error) {
    console.error(error)
    return json(req, { error: error instanceof Error ? error.message : 'Unexpected error' }, 500)
  }
})
