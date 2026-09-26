import type { School } from '../types'

const EARTH_RADIUS_MILES = 3958.8
const toRadians = (value: number) => value * Math.PI / 180

export function distanceMiles(lat1: number, lng1: number, lat2: number, lng2: number) {
  const dLat = toRadians(lat2 - lat1)
  const dLng = toRadians(lng2 - lng1)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) ** 2
  return EARTH_RADIUS_MILES * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function schoolsInRadius(source: School[], center: { lat: number; lng: number }, radius: number) {
  const latDelta = radius / 69
  const lngDelta = radius / (69 * Math.max(0.1, Math.cos(toRadians(center.lat))))
  return source
    .filter((school) => school.lat >= center.lat - latDelta && school.lat <= center.lat + latDelta && school.lng >= center.lng - lngDelta && school.lng <= center.lng + lngDelta)
    .map((school) => ({ school, distance: distanceMiles(center.lat, center.lng, school.lat, school.lng) }))
    .filter(({ distance }) => distance <= radius)
    .sort((a, b) => a.distance - b.distance)
}
