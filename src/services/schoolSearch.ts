import type { School, SchoolType } from '../types'
import { distanceMiles } from '../utils/geo'

type OverpassElement = {
  type: 'node' | 'way' | 'relation'
  id: number
  lat?: number
  lon?: number
  center?: { lat: number; lon: number }
  tags?: Record<string, string>
}

type OverpassResponse = { elements?: OverpassElement[] }

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.nchc.org.tw/api/interpreter',
]

function classify(tags: Record<string, string>): SchoolType | undefined {
  const combined = `${tags.amenity ?? ''} ${tags['school:type'] ?? ''} ${tags.name ?? ''}`.toLowerCase()
  if (tags.amenity === 'university' || tags.amenity === 'college' || /university|college|institute|polytechnic/.test(combined)) return 'College / University'
  if (tags.amenity !== 'school' && !tags.education) return undefined
  if (/elementary|primary|infant|junior/.test(combined)) return 'Elementary'
  if (/middle|secondary|intermediate/.test(combined)) return 'Middle'
  if (/high|senior/.test(combined)) return 'High School'
  return 'High School'
}

function toSchool(element: OverpassElement): School | undefined {
  const tags = element.tags ?? {}
  const type = classify(tags)
  const lat = element.lat ?? element.center?.lat
  const lng = element.lon ?? element.center?.lon
  if (!type || lat === undefined || lng === undefined || !tags.name) return undefined
  const email = tags.email ?? tags['contact:email']
  const website = tags.website ?? tags['contact:website'] ?? ''
  const address = [tags['addr:housenumber'], tags['addr:street']].filter(Boolean).join(' ') || 'Address not listed'
  return {
    id: `osm-${element.type}-${element.id}`,
    name: tags.name,
    type,
    lat,
    lng,
    address,
    city: tags['addr:city'] ?? tags['addr:suburb'] ?? '',
    state: tags['addr:state'] ?? '',
    zip: tags['addr:postcode'] ?? '',
    email: email?.trim().toLowerCase(),
    website,
    country: tags['addr:country'] ?? '',
    source: 'OpenStreetMap',
  }
}

function buildQuery(lat: number, lng: number, radiusMiles: number, emailOnly: boolean) {
  const radiusMeters = Math.round(radiusMiles * 1609.344)
  const emailFilter = emailOnly ? '["email"]' : ''
  return `[out:json][timeout:8];nwr["amenity"~"school|college|university"]${emailFilter}(around:${radiusMeters},${lat},${lng});out center tags;`
}

export async function searchWorldwideSchools(
  center: { lat: number; lng: number },
  radius: number,
  emailOnly = false,
  onProgress?: (message: string) => void,
) {
  const query = buildQuery(center.lat, center.lng, radius, emailOnly)
  onProgress?.(`Searching ${OVERPASS_ENDPOINTS.length} worldwide data providers…`)
  const requests = OVERPASS_ENDPOINTS.map((endpoint, index) =>
    fetch(endpoint, {
      method: 'POST',
      body: query,
      headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
    }).then(async (response) => {
      if (!response.ok) throw new Error(`OpenStreetMap search returned HTTP ${response.status}`)
      const payload = await response.json() as OverpassResponse
      onProgress?.(`Received ${payload.elements?.length ?? 0} mapped records from provider ${index + 1}…`)
      return payload
    }),
  )
  const payload = await new Promise<OverpassResponse>((resolve, reject) => {
    let failures = 0
    let lastError: unknown
    requests.forEach((request) => request.then(resolve).catch((error: unknown) => {
      failures += 1
      lastError = error
      onProgress?.(`Provider ${failures} of ${requests.length} is unavailable; continuing…`)
      if (failures === requests.length) reject(lastError)
    }))
  }).catch(() => {
    throw new Error('The worldwide data providers are still unavailable. Please try the search again.')
  })
  const unique = new Map<string, { school: School; distance: number }>()
  for (const element of payload.elements ?? []) {
    const school = toSchool(element)
    if (!school) continue
    const distance = distanceMiles(center.lat, center.lng, school.lat, school.lng)
    if (distance <= radius && !unique.has(school.name.toLowerCase())) unique.set(school.name.toLowerCase(), { school, distance })
  }
  onProgress?.(`Search complete — ${unique.size} schools found`)
  return [...unique.values()].sort((a, b) => a.distance - b.distance)
}
