import { Routes, Route, NavLink, useLocation, Navigate } from "react-router-dom";
import CustomerView from "./pages/CustomerView.jsx";
import AdminView from "./pages/AdminView.jsx";
import LandingPage from "./pages/LandingPage.jsx";
import CustomerLogin from "./pages/CustomerLogin.jsx";
import AdminLogin from "./pages/AdminLogin.jsx";
import ThreeBackground from "./components/ThreeBackground.jsx";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import { LogOut } from "lucide-react";

function ProtectedRoute({ children, role }) {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to={role === "admin" ? "/admin/login" : "/chat/login"} replace />;
  }
  if (role && user.role !== role) {
    return <Navigate to={role === "admin" ? "/admin/login" : "/chat/login"} replace />;
  }
  return children;
}

function AppContent() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const isLanding = location.pathname === "/";
  const isLogin = location.pathname.includes("/login");
  const hideHeader = isLanding || isLogin;

  return (
    <div className="app-shell">
      {!hideHeader && <ThreeBackground />}
      
      {!hideHeader && (
        <header className="top-nav">
          <div className="brand">
            Orbiq<span className="dot">●</span>Support
            <span className="brand-sub">AI Refund Agent</span>
          </div>
          <nav className="nav-links">
            <NavLink to="/chat" className={({ isActive }) => (isActive ? "active" : "")}>
              Customer Chat
            </NavLink>
            <NavLink to="/admin" className={({ isActive }) => (isActive ? "active" : "")}>
              Admin Dashboard
            </NavLink>
            {user && (
              <button onClick={logout} className="logout-button" style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '10px' }}>
                <LogOut size={18} /> Logout
              </button>
            )}
          </nav>
        </header>
      )}
      <main className="app-main" style={{ display: isLanding ? "block" : "flex" }}>
        <Routes>
          <Route path="/" element={<LandingPage />} />

          <Route path="/chat" element={
            <ProtectedRoute role="customer">
              <CustomerView />
            </ProtectedRoute>
          } />

          <Route path="/admin" element={
            <ProtectedRoute role="admin">
              <AdminView />
            </ProtectedRoute>
          } />
        </Routes>
      </main>

      {/* Login pages render outside main to take full viewport */}
      <Routes>
        <Route path="/chat/login" element={<CustomerLogin />} />
        <Route path="/admin/login" element={<AdminLogin />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
