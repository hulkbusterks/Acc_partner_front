import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <Navbar />
      <main id="main-content" className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Outlet />
      </main>
      <footer className="border-t border-gray-200 bg-white py-6 text-center text-xs text-gray-400">
        <p>&copy; {new Date().getFullYear()} StudyAcc. Keep studying, stay accountable.</p>
      </footer>
    </div>
  );
}
