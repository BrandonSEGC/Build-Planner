/** Upserts a HubSpot contact when HUBSPOT_TOKEN is set; otherwise logs (dev stub).
 *  The internal DB remains the source of truth — HubSpot is enrichment. */
export async function upsertHubspotContact(input: {
  email: string
  name: string
  phone: string
  toolId: string
  headline: string
  timeline: string
}): Promise<{ delivered: boolean; hubspotId?: string }> {
  const token = process.env.HUBSPOT_TOKEN
  if (!token) {
    console.info(`[hubspot:stub] upsert ${input.email} (${input.toolId}: ${input.headline})`)
    return { delivered: false }
  }
  const [firstname, ...rest] = input.name.split(" ")
  const properties: Record<string, string> = {
    email: input.email,
    firstname,
    lastname: rest.join(" "),
    phone: input.phone,
    // Custom properties — create these in HubSpot: build_planner_source, build_planner_result, build_planner_timeline
    build_planner_source: input.toolId,
    build_planner_result: input.headline,
    build_planner_timeline: input.timeline,
  }
  // Upsert by email via the v3 contacts API
  const response = await fetch(
    `https://api.hubapi.com/crm/v3/objects/contacts/${encodeURIComponent(input.email)}?idProperty=email`,
    {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ properties }),
    },
  )
  if (response.status === 404) {
    const created = await fetch("https://api.hubapi.com/crm/v3/objects/contacts", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ properties }),
    })
    if (!created.ok) throw new Error(`HubSpot create failed: ${created.status}`)
    const body = (await created.json()) as { id: string }
    return { delivered: true, hubspotId: body.id }
  }
  if (!response.ok) throw new Error(`HubSpot upsert failed: ${response.status}`)
  const body = (await response.json()) as { id: string }
  return { delivered: true, hubspotId: body.id }
}
