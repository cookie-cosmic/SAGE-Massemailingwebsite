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

function buildQuery(lat: number, lng: number, radiusMiles: number) {
  const radiusMeters = Math.round(radiusMiles * 1609.344)
  return `[out:json][timeout:30];(nwr["amenity"~"school|college|university"](around:${radiusMeters},${lat},${lng});nwr["education"](around:${radiusMeters},${lat},${lng}););out center tags;`
}

export async function searchWorldwideSchools(center: { lat: number; lng: number }, radius: number) {
  const query = buildQuery(center.lat, center.lng, radius)
  let lastError: unknown
  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const response = await fetch(`${endpoint}?data=${encodeURIComponent(query)}`)
      if (!response.ok) throw new Error(`OpenStreetMap search returned HTTP ${response.status}`)
      const payload = await response.json() as OverpassResponse
      const unique = new Map<string, { school: School; distance: number }>()
      for (const element of payload.elements ?? []) {
        const school = toSchool(element)
        if (!school) continue
        const distance = distanceMiles(center.lat, center.lng, school.lat, school.lng)
        if (distance <= radius && !unique.has(school.name.toLowerCase())) unique.set(school.name.toLowerCase(), { school, distance })
      }
      return [...unique.values()].sort((a, b) => a.distance - b.distance)
    } catch (error) {
      lastError = error
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Worldwide school search is unavailable')
}
