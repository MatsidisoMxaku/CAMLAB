import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

const topics = [
  {
    title: "Perturbation Methods",
    description: "Asymptotic expansions, boundary layers, and multiple scales.",
    icon: "waves",
    path: "/lab/perturbation",
    available: true,
  },
  {
    title: "Index Notation",
    description: "Einstein summation, Kronecker delta, Levi-Civita manipulations, and tensor identities.",
    icon: "functions",
    path: "/lab/index-notation",
    available: true,
  },
  {
    title: "PDE Visualizer",
    description: "Heat, wave, and advection equation simulations.",
    icon: "grid_view",
    path: "/lab/pde",
    available: false,
  },
  {
    title: "Buckingham Π Assistant",
    description: "Dimensional analysis and similarity variables.",
    icon: "calculate",
    path: "/lab/buckingham-pi",
    available: false,
  },
];

function Dashboard() {
  const navigate = useNavigate();

  const handleLogout = async () => {
  window.location.href = "/";
  await supabase.auth.signOut();
};

  return (
    <div className="min-h-screen bg-background scientific-grid px-margin-desktop py-xl">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-xl">
          <div>
            <div className="font-headline-md text-headline-md font-bold text-primary mb-sm">
              CAMLab
            </div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface mb-sm">
              Choose a topic to explore
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Pick an area below to start solving problems with guided steps and explanations.
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-sm font-label-md text-label-md text-on-surface-variant hover:text-error border border-outline-variant/30 hover:border-error/40 px-md py-sm rounded-lg transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            Sign out
          </button>
        </div>

        {/* Topic cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
          {topics.map((topic) => (
            <button
              key={topic.title}
              onClick={() => topic.available && navigate(topic.path)}
              disabled={!topic.available}
              className={`glass-panel text-left p-xl rounded-xl transition-all ${
                topic.available
                  ? "hover:brightness-110 cursor-pointer"
                  : "opacity-50 cursor-not-allowed"
              }`}
            >
              <div className="material-symbols-outlined text-primary text-[40px] mb-md">
                {topic.icon}
              </div>
              <h3 className="font-headline-md text-headline-md mb-sm text-on-surface">
                {topic.title}
              </h3>
              <p className="font-body-md text-body-md text-on-surface-variant">
                {topic.description}
              </p>
              {!topic.available && (
                <span className="inline-block mt-md font-label-md text-label-md text-secondary">
                  Coming soon
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
