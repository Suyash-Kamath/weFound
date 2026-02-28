import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { QrCode } from "lucide-react";

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav className="navbar">
      <div className="container nav-content">
        <Link to="/" className="nav-logo">
          <div className="nav-logo-icon">
            <QrCode />
          </div>
          <span>we<span className="text-gradient">Found</span></span>
        </Link>

        <div className="nav-links">
          <Link to="/how-it-works" className="nav-link">How It Works</Link>
          <Link to="/pricing" className="nav-link">Pricing</Link>
          <Link to="/enterprise" className="nav-link">Enterprise</Link>
        </div>

        <div className="flex-center" style={{ gap: '1rem' }}>
          {isAuthenticated ? (
            <>
              <Link to="/dashboard" className="nav-link">Dashboard</Link>

              <div className="dropdown-menu">
                <div className="avatar-button">
                  <div className="avatar-fallback">{user?.name?.charAt(0).toUpperCase() || 'U'}</div>
                </div>
                
                <div className="dropdown-content">
                  <div className="dropdown-user">
                    <p className="user-name">{user?.name}</p>
                    <p className="user-email">{user?.email}</p>
                  </div>
                  <Link to="/profile" className="dropdown-item">Profile</Link>
                  <Link to="/dashboard" className="dropdown-item">Dashboard</Link>
                  <button onClick={handleLogout} className="dropdown-item destructive">Log out</button>
                </div>
              </div>
            </>
          ) : (
            <>
              <Link to="/auth" className="nav-link">Sign In</Link>
              <Link to="/auth?mode=register" className="btn btn-primary">Get Started</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
