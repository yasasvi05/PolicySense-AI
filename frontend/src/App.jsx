import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import AppLayout from './components/layout/AppLayout'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/customer/Dashboard'
import Assistant from './pages/customer/Assistant'
import PolicyDetails from './pages/customer/PolicyDetails'
import Payments from './pages/customer/Payments'
import Renewals from './pages/customer/Renewals'
import Claims from './pages/customer/Claims'
import Notifications from './pages/customer/Notifications'
import Profile from './pages/customer/Profile'
import AdminDashboard from './pages/admin/AdminDashboard'
import Documents from './pages/admin/Documents'
import Customers from './pages/admin/Customers'
import CustomerDetail from './pages/admin/CustomerDetail'
import Analytics from './pages/admin/Analytics'

function Guard({ role, children }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== role) return <Navigate to={user.role === 'admin' ? '/admin' : '/app'} replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/app" element={<Guard role="customer"><AppLayout role="customer" /></Guard>}>
        <Route index element={<Dashboard />} />
        <Route path="assistant" element={<Assistant />} />
        <Route path="policy" element={<PolicyDetails />} />
        <Route path="payments" element={<Payments />} />
        <Route path="renewals" element={<Renewals />} />
        <Route path="claims" element={<Claims />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="profile" element={<Profile />} />
      </Route>
      <Route path="/admin" element={<Guard role="admin"><AppLayout role="admin" /></Guard>}>
        <Route index element={<AdminDashboard />} />
        <Route path="documents" element={<Documents />} />
        <Route path="customers" element={<Customers />} />
        <Route path="customers/:id" element={<CustomerDetail />} />
        <Route path="analytics" element={<Analytics />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
