import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { Navigate, useLocation } from "react-router-dom";
import PageLoader from "./PageLoader";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <PageLoader />;

  if (!user) return <Navigate to="/login" />;

  return children;
};

export default ProtectedRoute;
