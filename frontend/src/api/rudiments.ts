import type { Rudiment } from '@/types'
import { apiRequest } from './client'

// GET /api/rudiments → alle Rudimente mit Pattern
export function getRudiments(): Promise<Rudiment[]> {
  return apiRequest<Rudiment[]>('GET', '/rudiments')
}
