import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { register, reset } from "../features/auth/authSlice";
import { useAppDispatch, useAppSelector } from "../app/hooks";

const Register = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    password2: "",
  });
  const { name, email, password, password2 } = formData;
  const [localError, setLocalError] = useState("");

  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { user, isLoading, isError, isSuccess, message } = useAppSelector(
    (state) => state.auth
  );

  useEffect(() => {
    if (isSuccess) {
      navigate("/login");
    }
    if (user) {
      navigate("/dashboard");
    }
  }, [isSuccess, user, navigate]);

  useEffect(() => {
    return () => {
      dispatch(reset());
    };
  }, [dispatch]);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setLocalError("");
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== password2) {
      setLocalError("Passwords do not match");
      return;
    }

    dispatch(register({ name, email, password }));
  };

  const displayError = localError || (isError ? message : "");

  return (
    <div className="auth-wrapper">
      <div className="animated-bg" />
      <div className="grid-overlay" />
      <div className="auth-card">
        <div className="auth-header">
          <div className="logo-icon">◆</div>
          <h1>Create account</h1>
          <p>Get started with your free account</p>
        </div>

        {displayError && (
          <div className="error-message">
            <span>!</span>
            <span>{displayError}</span>
          </div>
        )}

        {isSuccess && (
          <div className="success-message">
            Registration successful! Redirecting to login...
          </div>
        )}

        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label>Name</label>
            <div className="input-wrapper">
              <span className="input-icon">P</span>
              <input
                type="text"
                name="name"
                value={name}
                onChange={onChange}
                placeholder="John Doe"
                required
              />
            </div>
          </div>

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
                placeholder="Min. 8 characters"
                required
                minLength={8}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Confirm Password</label>
            <div className="input-wrapper">
              <span className="input-icon">*</span>
              <input
                type="password"
                name="password2"
                value={password2}
                onChange={onChange}
                placeholder="Repeat your password"
                required
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={isLoading}>
            {isLoading ? <span className="spinner" /> : "Create Account"}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
