import axios from 'axios';
import type { SummaryResponse, DriversResponse, RiskFactor, Recommendation } from '../types';

const apiBase = import.meta.env?.VITE_API_URL;
const baseURL = apiBase != null && apiBase !== '' ? `${apiBase}/api` : '/api';

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json'
  }
});

export async function fetchSummary(): Promise<SummaryResponse> {
  const response = await api.get<SummaryResponse>('/summary');
  return response.data;
}

export async function fetchDrivers(): Promise<DriversResponse> {
  const response = await api.get<DriversResponse>('/drivers');
  return response.data;
}

export async function fetchRiskFactors(): Promise<RiskFactor[]> {
  const response = await api.get<RiskFactor[]>('/risk-factors');
  return response.data;
}

export async function fetchRecommendations(): Promise<Recommendation[]> {
  const response = await api.get<Recommendation[]>('/recommendations');
  return response.data;
}

export async function fetchAllData() {
  const [summary, drivers, riskFactors, recommendations] = await Promise.all([
    fetchSummary(),
    fetchDrivers(),
    fetchRiskFactors(),
    fetchRecommendations()
  ]);

  return { summary, drivers, riskFactors, recommendations };
}

export default api;
