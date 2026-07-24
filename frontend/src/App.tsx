import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";
import PerturbationLab from "./pages/PerturbationLab";
import IndexNotationLab from "./pages/IndexNotationLab";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  // Ping the backend on app load so Render wakes up before the user
  // tries to solve anything. Free tier spins down after 15min inactivity.
  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/`)
      .catch(() => {
        // Silently ignore — this is just a wake-up ping
      });
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/lab/perturbation"
          element={
            <ProtectedRoute>
              <PerturbationLab />
            </ProtectedRoute>
          }
        />
        <Route
          path="/lab/index-notation"
          element={
            <ProtectedRoute>
              <IndexNotationLab />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;