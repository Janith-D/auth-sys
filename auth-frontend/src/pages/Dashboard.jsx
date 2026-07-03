import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { getMe, logout, reset } from "../features/auth/authSlice";

const Dashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [initialLoad, setInitialLoad] = useState(true);

  const { user, isLoading, isError, message } = useSelector((state) => state.auth);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!user && token) {
      dispatch(getMe()).then(() => setInitialLoad(false));
    } else {
      setInitialLoad(false);
    }
  }, [dispatch, user]);

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    dispatch(logout());
    dispatch(reset());
    navigate("/login");
  };

  if (isLoading || initialLoad) {
    return (
      <div className="auth-wrapper">
        <div className="animated-bg" />
        <div className="grid-overlay" />
        <span className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="auth-wrapper">
        <div className="animated-bg" />
        <div className="grid-overlay" />
        <div className="auth-card" style={{ textAlign: "center" }}>
          <div className="logo-icon" style={{ margin: "0 auto 20px" }}>!</div>
          <h1 style={{ color: "#fca5a5", fontSize: 22, marginBottom: 8 }}>Something went wrong</h1>
          <p style={{ color: "rgba(255,255,255,0.5)", marginBottom: 24 }}>{message}</p>
          <button className="btn btn-primary" onClick={() => navigate("/login")}>
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="auth-wrapper">
        <div className="animated-bg" />
        <div className="grid-overlay" />
        <div className="auth-card" style={{ textAlign: "center" }}>
          <p style={{ marginBottom: 16 }}>Not authenticated</p>
          <button className="btn btn-primary" onClick={() => navigate("/login")}>
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const initials = user.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  return (
    <div className="dashboard-wrapper">
      <div className="animated-bg" />
      <div className="grid-overlay" />

      <nav className="dashboard-nav">
        <div className="brand">
          <div className="logo-small">◆</div>
          Auth System
        </div>
        <button className="btn btn-danger" style={{ width: "auto", padding: "10px 24px" }} onClick={handleLogout}>
          Sign Out
        </button>
      </nav>

      <div className="dashboard-content">
        <div className="dashboard-grid">
          <div className="dashboard-card">
            <div className="card-label">Profile</div>
            <div className="user-avatar">{initials}</div>
            <h2>{user.name}</h2>
            <p className="user-email">{user.email}</p>
            <div className="user-stats">
              <div className="stat-item">
                <span className="stat-icon">R</span>
                <div className="stat-info">
                  <span className="stat-value">{user.role || "user"}</span>
                  <span className="stat-label">Role</span>
                </div>
              </div>
              <div className="stat-item">
                <span className="stat-icon">S</span>
                <div className="stat-info">
                  <span className="stat-value">Active</span>
                  <span className="stat-label">Status</span>
                </div>
              </div>
            </div>
          </div>

          <div className="dashboard-card">
            <div className="card-label">Quick Actions</div>
            <div className="quick-actions">
              <button className="btn btn-outline" onClick={() => navigate("/login")}>
                Switch Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
