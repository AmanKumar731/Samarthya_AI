import { checkHealth } from "@/lib/api";

export default async function HomePage() {
  const health = await checkHealth();

  return (
    <div className="max-w-4xl mx-auto px-4 py-16 text-center">
      <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs mb-6 border border-sky-500/30 bg-sky-500/10 text-sky-300">
        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
        <span>Backend Status: {health.status}</span>
      </div>
      <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white mb-6">
        AI-Powered Welfare Delivery & Credit Readiness
      </h1>
      <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-10">
        Empowering unbanked citizens, artisans, and farmers with instant statutory eligibility checks across 28+ central welfare programs and transparent credit readiness.
      </p>
      <div className="flex justify-center gap-4">
        <a
          href="/#schemes"
          className="px-6 py-3 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold transition"
        >
          Explore Schemes
        </a>
        <a
          href="http://localhost:8000/docs"
          target="_blank"
          className="px-6 py-3 rounded-lg border border-slate-700 hover:border-slate-500 text-slate-200 transition"
        >
          FastAPI Swagger
        </a>
      </div>
    </div>
  );
}
