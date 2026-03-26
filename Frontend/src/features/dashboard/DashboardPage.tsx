import { useAuth } from '../../hooks/useAuth';

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome, {user?.name}</p>
      {/* TODO: summary cards — active customers, today's purchases, points issued */}
    </div>
  );
}
