import { Outlet } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <Outlet />
    </div>
  );
}
