import { ApiStatusResponse } from "./types";

// Point this at the Flask backend URL.
// In production, this will be the Railway URL.
// For local dev, use mock data (see mock-data.ts).
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.API_URL ||
  "https://web-production-be47b.up.railway.app";

export async function fetchLeaderboard(): Promise<ApiStatusResponse> {
  const res = await fetch(`${API_BASE_URL}/api/status`, {
    next: { revalidate: 300 }, // ISR: 5 minute revalidation
  });

  if (!res.ok) {
    throw new Error(`API returned ${res.status}`);
  }

  return res.json();
}
