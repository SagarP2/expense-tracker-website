import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';

export default function Layout() {
  const [isSidebarOpen,setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-background text-text font-sans">
      {/* Sidebar / Drawer */}
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative w-full">
        <Navbar onMenuClick={() => setIsSidebarOpen(true)} />

        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8 scroll-smooth custom-scrollbar">
          <div className="container max-w-7xl mx-auto animate-fade-in space-y-6 lg:space-y-8 pb-24 lg:pb-8">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
