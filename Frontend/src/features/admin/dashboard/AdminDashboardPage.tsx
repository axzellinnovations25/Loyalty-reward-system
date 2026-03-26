import { useAdminAuth } from '../../../hooks/useAuth';

export default function AdminDashboardPage() {
  const { admin } = useAdminAuth();

  return (
    <div>
      <h1>Admin Dashboard</h1>
      <p>Welcome, {admin?.name}</p>
      {/* TODO: total shops, active plans breakdown, recent billing */}
    </div>
  );
}
