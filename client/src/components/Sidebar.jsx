import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  CreditCard, 
  PieChart, 
  Settings,
  LogOut,
  ChevronLeft,
  Menu
} from 'lucide-react';

const Sidebar = ({ collapsed, setCollapsed }) => {
  const menuItems = [
    { name: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/' },
    { name: 'Clients', icon: <Users size={20} />, path: '/clients' },
    { name: 'Agreements', icon: <FileText size={20} />, path: '/agreements' },
    { name: 'Invoices', icon: <FileText size={20} />, path: '/invoices' },
    { name: 'Payments', icon: <CreditCard size={20} />, path: '/payments' },
    { name: 'Finance', icon: <PieChart size={20} />, path: '/finance' },
    { name: 'Settings', icon: <Settings size={20} />, path: '/settings' },
  ];

  const handleLogout = () => {
    localStorage.clear();
    window.location.reload();
  };

  return (
    <div className={`${collapsed ? 'w-20' : 'w-64'} h-screen bg-white border-r border-slate-100 flex flex-col fixed left-0 top-0 transition-all duration-300 z-[100]`}>
      <div className={`p-6 flex items-center ${collapsed ? 'justify-center' : 'justify-between'}`}>
        {!collapsed && <h1 className="text-2xl font-black tracking-tight text-indigo-600">FREEOS</h1>}
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors"
        >
          {collapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>
      
      <nav className="flex-1 px-3 space-y-1">
        {menuItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            title={collapsed ? item.name : ''}
            className={({ isActive }) => `
              flex items-center ${collapsed ? 'justify-center' : 'space-x-3'} px-4 py-3 rounded-xl transition-all
              ${isActive 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}
            `}
          >
            {item.icon}
            {!collapsed && <span className="font-bold text-sm">{item.name}</span>}
          </NavLink>
        ))}
      </nav>
      
      <div className="p-4 border-t border-slate-50">
        <button 
          onClick={handleLogout}
          title={collapsed ? "Logout" : ""}
          className={`flex items-center ${collapsed ? 'justify-center' : 'space-x-3'} px-4 py-3 w-full text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all`}
        >
          <LogOut size={20} />
          {!collapsed && <span className="font-bold text-sm">Logout</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
