import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { login, reset } from "../features/auth/authSlice";

const Login = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const { email, password } = formData;

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { user, isLoading, isError, isSuccess, message } = useSelector((state) => state.auth);

  useEffect(() => {
    if (isSuccess) {
      navigate("/dashboard");
    }
  }, [isSuccess, navigate]);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (user && token) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  useEffect(() => {
    return () => {
      dispatch(reset());
    };
  }, [dispatch]);

  const onChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const onSubmit = (e) => {
    e.preventDefault();
    dispatch(login({ email, password }));
  };

  const fillTestCredentials = () => {
    setFormData({ email: "test@example.com", password: "password123" });
  };

  return (
    <div className="auth-wrapper">
      <div className="animated-bg" />
      <div className="grid-overlay" />
      <div className="auth-card">
        <div className="auth-header">
          <div className="logo-icon">◆</div>
          <h1>Welcome back</h1>
          <p>Sign in to your account to continue</p>
        </div>

        {isError && (
          <div className="error-message">
            <span>!</span>
            <span>{message}</span>
          </div>
        )}

        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label>Email</label>
            <div className="input-wrapper">
              <span className="input-icon">@</span>
              <input
                type="email"
                name="email"
                value={email}
                onChange={onChange}
                placeholder="you@example.com"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Password</label>
            <div className="input-wrapper">
              <span className="input-icon">*</span>
              <input
                type="password"
                name="password"
                value={password}
                onChange={onChange}
                placeholder="Enter your password"
                required
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={isLoading}>
            {isLoading ? <span className="spinner" /> : "Sign In"}
          </button>
        </form>

        <div className="divider">or</div>

        <button type="button" className="btn btn-outline" onClick={fillTestCredentials}>
          Fill Test Credentials
        </button>

        <div className="auth-footer">
          Don&apos;t have an account? <Link to="/register">Create one</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
