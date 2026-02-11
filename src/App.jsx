import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import Inventory from "./pages/Inventory/Inventory";
import AddItem from "@/pages/Inventory/AddItem";
import Delivery from "@/pages/Inventory/Delivery";
import Checkout from "@/pages/Inventory/Checkout";
import Returns from "@/pages/Inventory/Returns";
import Reports from "@/pages/Inventory/Reports";
import BulkImportItems from "@/pages/Inventory/BulkImportItems";
import PropertyTagging from "@/pages/PropertyTagging";
import ReportsPage from "@/pages/ReportsPage";
import Settings from "@/pages/Settings";
import Visitors from "@/pages/Visitors";
import PrintBarcodes from "@/pages/Inventory/PrintBarcodes";

import { useWarmupServer } from "@/hooks/useWarmupServer";
import useAutoLogout from "@/hooks/useAutoLogout";

import AppLayout from "@/layouts/AppLayout"; // 🆕 layout with Sidebar + Topbar

// ✅ Protected Route Wrapper
function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/" replace />;
}

// ✅ Public Route Wrapper (for login)
function PublicRoute({ children }) {
  const token = localStorage.getItem("token");
  return token ? <Navigate to="/dashboard" replace /> : children;
}

function App() {
  const token = localStorage.getItem("token");
  const { isWarmingUp } = useWarmupServer(token);

  // 🆕 enable idle logout only when logged in (15 minutes)
  useAutoLogout(15);

  return (
    <Router>
      <main className="relative min-h-screen">
        {/* 💤 Waking up server overlay (only when logged in) */}
        {token && isWarmingUp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/70 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3 p-6 rounded-2xl shadow-lg bg-white">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
              <p className="text-sm font-medium text-gray-800">
                Waking up the server…
              </p>
              <p className="text-xs text-gray-500 text-center max-w-xs">
                EduTrack backend is hosted on free Render, so the first request
                after being idle may take a few seconds.
              </p>
            </div>
          </div>
        )}

        <Routes>
          {/* 🟢 Public Route */}
          <Route
            path="/"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />

          {/* 🔐 All protected routes share the same layout */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            {/* Dashboard / core */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/users" element={<Users />} />
            <Route path="/property-tagging" element={<PropertyTagging />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/visitors" element={<Visitors />} />
            <Route path="/reports-page" element={<ReportsPage />} />

            {/* Inventory System Routes */}
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/inventory/add-item" element={<AddItem />} />
            <Route
              path="/inventory/bulk-import"
              element={<BulkImportItems />}
            />
            <Route path="/inventory/delivery" element={<Delivery />} />
            <Route path="/inventory/checkout" element={<Checkout />} />
            <Route path="/inventory/returns" element={<Returns />} />
            <Route path="/inventory/reports" element={<Reports />} />
          </Route>
          {/* 🖨️ Print Barcodes (NO layout) */}
          <Route
            path="/inventory/print-barcodes"
            element={
              <ProtectedRoute>
                <PrintBarcodes />
              </ProtectedRoute>
            }
          />

          {/* 🚧 Fallback Route (404 → login) */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </Router>
  );
}

export default App;
