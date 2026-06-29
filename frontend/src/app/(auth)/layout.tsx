import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In",
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Left — decorative panel */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-dark-900 overflow-hidden">
        {/* Animated gradient orbs */}
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-primary-600/20 blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-secondary-600/20 blur-3xl animate-pulse-slow" style={{ animationDelay: "1.5s" }} />
        <div className="absolute top-[40%] left-[30%] w-[300px] h-[300px] rounded-full bg-accent-600/10 blur-3xl animate-pulse-slow" style={{ animationDelay: "3s" }} />

        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center text-white font-bold text-lg">
              IF
            </div>
            <span className="text-white font-semibold text-xl">InterviewForge AI</span>
          </div>

          {/* Hero text */}
          <div className="space-y-6">
            <h1 className="text-5xl font-bold text-white leading-tight">
              Crack your
              <br />
              <span className="text-gradient">dream interview</span>
              <br />
              with AI.
            </h1>
            <p className="text-dark-400 text-lg max-w-sm leading-relaxed">
              AI-powered practice, real-time feedback, and adaptive learning paths — all in one platform.
            </p>

            {/* Stats row */}
            <div className="flex gap-8 pt-4">
              {[
                { value: "12+", label: "Subjects" },
                { value: "1000+", label: "Questions" },
                { value: "AI", label: "Feedback" },
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                  <div className="text-xs text-dark-400 mt-0.5">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Testimonial */}
          <div className="glass rounded-2xl p-5 space-y-2">
            <p className="text-dark-300 text-sm italic">
              "Went from 0 to Data Analyst in 3 months. The mock interviews were exactly what I needed."
            </p>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-400 to-secondary-400" />
              <span className="text-dark-400 text-xs">Priya S. — Data Analyst at Infosys</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right — auth form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-[var(--bg-primary)]">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
