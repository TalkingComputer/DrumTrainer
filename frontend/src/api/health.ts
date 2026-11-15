const API_URL = 'http://localhost:8000/api'

export interface HealthResponse {
  status: string
  timestamp: string
}

export async function getHealth(): Promise<HealthResponse> {
  const res = await fetch(`${API_URL}/health`)
  if (!res.ok) throw new Error(`Backend antwortet mit ${res.status}`)
  return res.json()
}
