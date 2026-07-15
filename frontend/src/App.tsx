import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";
import PerturbationLab from "./pages/PerturbationLab";
import IndexNotationLab from "./pages/IndexNotationLab";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
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