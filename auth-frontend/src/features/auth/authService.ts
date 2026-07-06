import axiosInstance from "../../api/axiosInstance";
import { RegisterBody, LoginBody } from "../../types/auth";

const register = async (userData: RegisterBody) => {
  const response = await axiosInstance.post("/auth/register", userData);
  return response.data;
};

const login = async (userData: LoginBody) => {
  const response = await axiosInstance.post("/auth/login", userData);

  if (response.data.accessToken) {
    localStorage.setItem("accessToken", response.data.accessToken);
  }

  if (response.data.refreshToken) {
    localStorage.setItem("refreshToken", response.data.refreshToken);
  }

  if (response.data.user) {
    localStorage.setItem("user", JSON.stringify(response.data.user));
  }

  return response.data;
};

const getMe = async () => {
  const response = await axiosInstance.get("/auth/me");
  return response.data;
};

const logout = async () => {
  const refreshToken = localStorage.getItem("refreshToken");

  try {
    if (refreshToken) {
      await axiosInstance.post("/auth/logout", { refreshToken });
    }
  } catch {
    // API call may fail, still clear local state
  }

  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
};

const authService = {
  register,
  login,
  getMe,
  logout,
};

export default authService;
