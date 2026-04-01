import CinematicReveal from "@/components/CinematicReveal";
import { MOCK_DATA } from "@/lib/mock-data";
import { fetchLeaderboard } from "@/lib/api";

// ISR: revalidate every 5 minutes
export const revalidate = 300;

export default async function Home() {
  let data;

  try {
    // In production, fetch from the Flask backend on Railway.
    // In development or when USE_MOCK_DATA is set, use mock data.
    const useMock =
      process.env.USE_MOCK_DATA === "true" ||
      process.env.NODE_ENV === "development";

    if (useMock) {
      data = MOCK_DATA;
    } else {
      data = await fetchLeaderboard();
    }
  } catch {
    // If the API is down, fall back to mock data.
    // In production with ISR, Vercel would serve the last cached version.
    data = MOCK_DATA;
  }

  return <CinematicReveal data={data} />;
}
