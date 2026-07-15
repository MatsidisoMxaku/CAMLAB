import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
    // On success, Supabase redirects the browser to Google, then back to
    // redirectTo above — no further action needed here.
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-margin-desktop">
      <div className="glass-panel rounded-xl p-xl text-center">
        <div className="text-headline-md font-headline-md font-bold text-primary mb-lg">
          CAMLab
        </div>
        <h1 className="font-headline-lg text-headline-lg text-on-surface mb-sm">
          Sign in to continue
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant mb-xl">
          Use your Gmail account to access the workspace.
        </p>

        {error && (
          <p className="font-label-md text-label-md text-error mb-md">
            {error}
          </p>
        )}

        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full bg-primary-container text-on-primary-container px-xl py-md rounded-lg font-headline-md text-headline-md hover:brightness-110 transition-all flex items-center justify-center gap-sm disabled:opacity-60"
        >
          <span className="material-symbols-outlined">login</span>
          {loading ? "Redirecting..." : "Continue with Google"}
        </button>
      </div>
    </div>
  );
}

export default LoginPage;