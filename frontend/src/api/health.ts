import { apiRequest } from './client'

export interface HealthResponse {
  status: string
  timestamp: string
}

// GET /api/health
export function getHealth(): Promise<HealthResponse> {
  return apiRequest<HealthResponse>('GET', '/health')
}
