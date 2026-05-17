import { useNavigate } from "react-router-dom";
import {
  GraduationCap,
  ArrowRight,
  CheckCircle2,
  Users,
  CalendarCheck,
  ShieldCheck,
  MessageCircle,
  ClipboardList,
  BellRing,
} from "lucide-react";

export default function Landing() {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Users size={22} />,
      title: "Student Records",
      desc: "Manage student details, class information, and parent contact records easily.",
    },
    {
      icon: <CalendarCheck size={22} />,
      title: "Attendance Management",
      desc: "Teachers can mark and maintain attendance records in a simple workflow.",
    },
    {
      icon: <MessageCircle size={22} />,
      title: "Parent Communication",
      desc: "Send important updates and attendance alerts to parents when needed.",
    },
    {
      icon: <ClipboardList size={22} />,
      title: "Organized Data",
      desc: "Keep school records clean, structured, and easy to access.",
    },
    {
      icon: <BellRing size={22} />,
      title: "Notifications",
      desc: "Notify parents and staff about absentees, announcements, and updates.",
    },
    {
      icon: <ShieldCheck size={22} />,
      title: "Secure Access",
      desc: "Role-based access for admins and teachers to protect school data.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#f8faf7] text-slate-900">
      <div className="mx-auto max-w-7xl px-6 py-6">
        {/* Navbar */}
        <nav className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-6 py-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-white">
              <GraduationCap size={23} />
            </div>

            <div>
              <h1 className="text-xl font-bold tracking-tight">Handler</h1>
              <p className="text-xs text-slate-500">
                Student Management System
              </p>
            </div>
          </div>

          <div className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
            <a href="#features" className="hover:text-emerald-700">
              Features
            </a>
            <a href="#workflow" className="hover:text-emerald-700">
              Workflow
            </a>
            <a href="#contact" className="hover:text-emerald-700">
              Contact
            </a>
          </div>

          <button
            onClick={() => navigate("/login")}
            className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            Login
          </button>
        </nav>

        {/* Hero */}
        <section className="grid items-center gap-12 py-20 lg:grid-cols-2">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
              <CheckCircle2 size={16} />
              Simple school management platform
            </div>

            <h2 className="max-w-2xl text-4xl font-bold leading-tight tracking-tight text-slate-950 md:text-5xl">
              Manage students, attendance, and parent communication in one
              system.
            </h2>

            <p className="mt-5 max-w-xl text-base leading-7 text-slate-600 md:text-lg">
              Handler helps schools maintain student records, track attendance,
              and communicate with parents using a clean and easy-to-use
              platform.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button
                onClick={() => navigate("/login")}
                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
              >
                Access Dashboard
                <ArrowRight size={17} />
              </button>

              <button
                onClick={() => {
                  const section = document.getElementById("features");
                  section?.scrollIntoView({ behavior: "smooth" });
                }}
                className="rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-emerald-500 hover:text-emerald-700"
              >
                View Features
              </button>
            </div>

            <div className="mt-8 grid max-w-xl gap-3 sm:grid-cols-3">
              {["Easy to use", "Secure login", "School focused"].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-600"
                >
                  <CheckCircle2 size={17} className="text-emerald-600" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          {/* Right Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6">
              <p className="text-sm font-semibold text-emerald-700">
                Dashboard Preview
              </p>
              <h3 className="mt-2 text-2xl font-bold text-slate-950">
                School Operations Made Simple
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                A clean dashboard experience for admins and teachers to manage
                everyday school activities.
              </p>
            </div>

            <div className="space-y-4">
              <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-600 text-white">
                    <CalendarCheck size={22} />
                  </div>

                  <div>
                    <h4 className="font-semibold text-slate-950">
                      Attendance Tracking
                    </h4>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      Mark daily attendance and maintain records efficiently.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-amber-100 bg-amber-50 p-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-amber-500 text-white">
                    <MessageCircle size={22} />
                  </div>

                  <div>
                    <h4 className="font-semibold text-slate-950">
                      Parent Updates
                    </h4>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      Keep parents informed about attendance and school updates.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-800 text-white">
                    <ShieldCheck size={22} />
                  </div>

                  <div>
                    <h4 className="font-semibold text-slate-950">
                      Secure Management
                    </h4>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      Protect data with separate access for admins and teachers.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-14">
          <div className="mb-10 max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
              Features
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 md:text-4xl">
              Essential tools for school management
            </h2>

            <p className="mt-4 text-base leading-7 text-slate-600">
              Handler focuses on the important parts of school administration
              without making the system complicated.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {features.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-emerald-200 hover:shadow-md"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                  {item.icon}
                </div>

                <h3 className="text-lg font-semibold text-slate-950">
                  {item.title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Workflow */}
        <section id="workflow" className="py-14">
          <div className="rounded-2xl bg-slate-900 p-8 text-white md:p-10">
            <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-emerald-300">
                  Workflow
                </p>

                <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
                  Designed for daily school operations
                </h2>

                <p className="mt-4 text-base leading-7 text-slate-300">
                  Teachers mark attendance, admins manage records, and parents
                  receive important updates when required.
                </p>

                <button
                  onClick={() => navigate("/login")}
                  className="mt-7 flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600"
                >
                  Login to Continue
                  <ArrowRight size={17} />
                </button>
              </div>

              <div className="space-y-3">
                {[
                  "Teacher marks attendance",
                  "System stores the records",
                  "Admin manages student details",
                  "Parents receive updates",
                ].map((step, index) => (
                  <div
                    key={step}
                    className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-4"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500 text-sm font-bold text-white">
                      {index + 1}
                    </div>

                    <p className="text-sm font-medium text-slate-100">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section id="contact" className="py-14">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm md:p-10">
            <h2 className="text-3xl font-bold tracking-tight text-slate-950 md:text-4xl">
              Start managing your school more efficiently
            </h2>

            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-600">
              Login to access your dashboard and manage students, attendance,
              and communication from one place.
            </p>

            <button
              onClick={() => navigate("/login")}
              className="mt-7 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-7 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              Access Dashboard
              <ArrowRight size={17} />
            </button>
          </div>
        </section>

        {/* Footer */}
        <footer className="flex flex-col items-center justify-between gap-4 border-t border-slate-200 py-8 text-sm text-slate-500 md:flex-row">
          <p>© 2026 Handler. All rights reserved.</p>

          <div className="flex gap-6">
            <span>Privacy</span>
            <span>Terms</span>
            <span>Support</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
