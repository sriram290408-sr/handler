import { useNavigate } from "react-router-dom";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-gray-900">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <section className="mb-20 grid grid-cols-1 items-center gap-10 md:grid-cols-2">
          <div>
            <p className="mb-3 inline-block rounded-full bg-indigo-50 px-3 py-1 text-xs text-indigo-700">
              Student Management Platform
            </p>
            <h1 className="mb-3 text-5xl font-bold leading-tight">
              Handler<span className="text-indigo-600">.</span>
            </h1>
            <p className="mb-6 max-w-md text-gray-500">
              Easily manage student records, academics, attendance, and insights in one modern, clean dashboard.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/login")}
                className="rounded-lg bg-indigo-600 px-5 py-3 text-sm font-medium text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700"
              >
                Login to Dashboard
              </button>
              <span className="text-xs text-gray-400">Secure login for admin</span>
            </div>
          </div>
          <div className="rounded-2xl bg-white p-6 shadow-xl shadow-gray-200">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-medium text-gray-500">Analytics Preview</p>
              <span className="text-xs text-green-600">Live</span>
            </div>
            <div className="h-44 rounded-xl bg-gradient-to-b from-gray-50 to-gray-100 p-4">
              <div className="mb-8 h-20 rounded border border-dashed border-gray-200 bg-white" />
              <div className="grid grid-cols-6 gap-2">
                {[32, 48, 40, 55, 44, 60].map((h) => (
                  <div key={h} className="rounded bg-indigo-100">
                    <div className="rounded bg-indigo-400" style={{ height: `${h}px` }} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mb-14 text-center">
          <h2 className="text-2xl font-semibold">Powerful Core Capabilities</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-gray-500">
            Built to solve daily student administration with minimal effort and maximum clarity.
          </p>
        </section>

        <section className="mb-16 grid grid-cols-1 gap-4 md:grid-cols-3">
          {[
            { title: "Students", desc: "Centralized records with easy add, edit, and delete actions." },
            { title: "Metrics", desc: "Track counts and standard-wise performance distribution." },
            { title: "Attendance", desc: "Maintain discipline with complete student activity view." },
          ].map((item) => (
            <div key={item.title} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="mb-2 font-semibold">{item.title}</h3>
              <p className="text-sm text-gray-500">{item.desc}</p>
            </div>
          ))}
        </section>

        <section className="mb-16 grid grid-cols-1 overflow-hidden rounded-2xl bg-white shadow-xl shadow-gray-200 md:grid-cols-2">
          <div className="border-b border-gray-100 p-6 md:border-b-0 md:border-r">
            <h3 className="mb-4 text-sm font-semibold text-gray-700">Academic Performance Trends</h3>
            <div className="h-52 rounded-xl bg-gradient-to-b from-indigo-50 to-cyan-50 p-4">
              <svg viewBox="0 0 300 160" className="h-full w-full">
                <polyline fill="none" stroke="#4f46e5" strokeWidth="3" points="10,110 60,100 110,95 160,105 210,90 260,96 290,92" />
                <polyline fill="none" stroke="#06b6d4" strokeWidth="3" points="10,120 60,118 110,110 160,102 210,98 260,102 290,96" />
              </svg>
            </div>
          </div>
          <div className="p-6">
            <h3 className="mb-4 text-sm font-semibold text-gray-700">Data-Driven Insights</h3>
            <ul className="space-y-3 text-sm text-gray-600">
              <li>- Real-time class summaries</li>
              <li>- Early trend detection for improvement</li>
              <li>- Cleaner reporting for school management</li>
            </ul>
            <button
              onClick={() => navigate("/login")}
              className="mt-6 rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Explore Analytics
            </button>
          </div>
        </section>

        <footer className="flex flex-col items-center justify-between gap-3 border-t border-gray-200 py-6 text-sm text-gray-400 md:flex-row">
          <p>Handler - Student data, simplified.</p>
          <div className="flex gap-4">
            <span>Privacy</span>
            <span>Terms</span>
            <span>Support</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
