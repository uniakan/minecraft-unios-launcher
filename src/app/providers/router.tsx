import { Routes, Route, Navigate } from "react-router-dom";
import { HomePage } from "@pages/home";
import { LoginPage } from "@pages/login";
import { SettingsPage } from "@pages/settings";
import { VersionsPage } from "@pages/versions";
import { ModsPage } from "@pages/mods";
import { useAuthStore } from "@features/auth/model/store";

export function AppRouter() {
  const { isAuthenticated } = useAuthStore();

  return (
    <Routes>
      <Route
        path="/"
        element={
          isAuthenticated ? <HomePage /> : <Navigate to="/login" replace />
        }
      />
      <Route
        path="/login"
        element={!isAuthenticated ? <LoginPage /> : <Navigate to="/" replace />}
      />
      <Route
        path="/settings"
        element={
          isAuthenticated ? <SettingsPage /> : <Navigate to="/login" replace />
        }
      />
      <Route
        path="/versions"
        element={
          isAuthenticated ? <VersionsPage /> : <Navigate to="/login" replace />
        }
      />
      <Route
        path="/mods"
        element={
          isAuthenticated ? <ModsPage /> : <Navigate to="/login" replace />
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
