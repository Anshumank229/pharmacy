import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import PageLoader from "./PageLoader";

const AdminRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <PageLoader />;

  // If not logged in → redirect to Admin Login page
  if (!user) {
    return <Navigate to="/admin-login" replace />;
  }

  // If logged in but not admin → redirect to homepage
  if (user.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  // If admin → allow access
  return children;
};

export default AdminRoute;
