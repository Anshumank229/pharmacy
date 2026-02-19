import { useState, useEffect } from "react";
import { Link, Outlet } from "react-router-dom";
import api from "../api/axiosClient";

const AdminLayout = () => {
  const [open, setOpen] = useState(false);
  const [supportCount, setSupportCount] = useState(0);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await api.get("/support/admin/count");
        setSupportCount(res.data.count || 0);
      } catch (err) {
        console.error("Failed to fetch support count");
      }
    };
    fetchCount();
  }, []);

  const links = [
    { name: "Dashboard", path: "/admin/dashboard" },
    { name: "Orders", path: "/admin/orders" },
    { name: "Medicines", path: "/admin/medicines" },
    { name: "Users", path: "/admin/users" },
    { name: "Prescriptions", path: "/admin/prescriptions" },
    { name: "Support Tickets", path: "/admin/support", badge: supportCount },
    { name: "Add Medicine", path: "/admin/add-medicine" },
  ];

  return (
    <div className="min-h-screen flex bg-gray-50">

      {/* Sidebar Overlay (Mobile) */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-30"
          onClick={() => setOpen(false)}
        ></div>
      )}

      {/* Sidebar Drawer */}
      <aside
        className={`fixed z-40 top-0 left-0 h-full w-64 bg-white border-r border-gray-200 shadow-lg transform 
          ${open ? "translate-x-0" : "-translate-x-full"} 
          transition-transform duration-300`}
      >
        <div className="p-6 border-b">
          <h1 className="text-xl font-bold text-blue-700">Admin Panel</h1>
        </div>

        <nav className="p-4 space-y-2">
          {links.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className="flex items-center justify-between p-3 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-700 font-medium"
              onClick={() => setOpen(false)}
            >
              {link.name}
              {link.badge > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {link.badge}
                </span>
              )}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 p-6 ml-0 md:ml-0 w-full">

        {/* Top Bar */}
        <header className="flex items-center mb-6">
          <button
            onClick={() => setOpen(true)}
            className="p-2 bg-white rounded-lg shadow border border-gray-200 md:hidden"
          >
            ☰
          </button>
        </header>

        {/* Admin Page Content - Use Outlet for nested routes */}
        <Outlet />
      </div>
    </div>
  );
};

export default AdminLayout;
