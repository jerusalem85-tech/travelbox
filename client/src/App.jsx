import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Bookings from './pages/Bookings';
import CreateBooking from './pages/CreateBooking';
import ShowBooking from './pages/ShowBooking';
import EditBooking from './pages/EditBooking';
import Customers from './pages/Customers';
import CreateCustomer from './pages/CreateCustomer';
import ShowCustomer from './pages/ShowCustomer';
import EditCustomer from './pages/EditCustomer';
import Suppliers from './pages/Suppliers';
import CreateSupplier from './pages/CreateSupplier';
import ShowSupplier from './pages/ShowSupplier';
import EditSupplier from './pages/EditSupplier';
import Invoices from './pages/Invoices';
import CreateInvoice from './pages/CreateInvoice';
import ShowInvoice from './pages/ShowInvoice';
import Payments from './pages/Payments';
import Expenses from './pages/Expenses';
import Settings from './pages/Settings';
import Reports from './pages/Reports';
import Quotations from './pages/Quotations';
import Users from './pages/Users';
import Notifications from './pages/Notifications';
import Hotels from './pages/Hotels';
import Packages from './pages/Packages';
import Insurance from './pages/Insurance';
import Contracts from './pages/Contracts';
import Commissions from './pages/Commissions';
import ActivityLog from './pages/ActivityLog';
import Currencies from './pages/Currencies';
import Communications from './pages/Communications';
import Visas from './pages/Visas';
import Documents from './pages/Documents';
import Tasks from './pages/Tasks';
import CalendarView from './pages/CalendarView';
import PriceLists from './pages/PriceLists';
import Checklist from './pages/Checklist';
import Inventory from './pages/Inventory';
import Leads from './pages/Leads';
import Employees from './pages/Employees';
import Vehicles from './pages/Vehicles';
import Guides from './pages/Guides';
import Discounts from './pages/Discounts';
import TaxRates from './pages/TaxRates';
import Reviews from './pages/Reviews';
import Brokers from './pages/Brokers';
import Transfers from './pages/Transfers';
import ServicesCatalog from './pages/ServicesCatalog';
import RestaurantBookings from './pages/RestaurantBookings';
import Properties from './pages/Properties';
import Referrals from './pages/Referrals';
import Trash from './pages/Trash';
import LoginLog from './pages/LoginLog';
import Templates from './pages/Templates';
import AdvancedSettings from './pages/AdvancedSettings';
import Installments from './pages/Installments';
import Airports from './pages/Airports';
import Destinations from './pages/Destinations';
import FlightSchedules from './pages/FlightSchedules';
import CustomerTimeline from './pages/CustomerTimeline';
import FollowUps from './pages/FollowUps';
import PriceCalculator from './pages/PriceCalculator';
import Surveys from './pages/Surveys';
import KnowledgeBase from './pages/KnowledgeBase';
import Complaints from './pages/Complaints';
import GiftVouchers from './pages/GiftVouchers';
import Campaigns from './pages/Campaigns';
import LoyaltyPoints from './pages/LoyaltyPoints';
import Gallery from './pages/Gallery';
import Compare from './pages/Compare';
import ContractTemplates from './pages/ContractTemplates';
import SignedContracts from './pages/SignedContracts';
import ExecutiveDashboard from './pages/ExecutiveDashboard';
import Appointments from './pages/Appointments';
import Approvals from './pages/Approvals';
import PhoneDirectory from './pages/PhoneDirectory';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="d-flex justify-content-center align-items-center vh-100"><div className="spinner-border text-primary"></div></div>;
  if (!user) return <Navigate to="/login" />;
  return children;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="bookings" element={<Bookings />} />
            <Route path="bookings/create" element={<CreateBooking />} />
            <Route path="bookings/:id" element={<ShowBooking />} />
            <Route path="bookings/:id/edit" element={<EditBooking />} />
            <Route path="customers" element={<Customers />} />
            <Route path="customers/create" element={<CreateCustomer />} />
            <Route path="customers/:id" element={<ShowCustomer />} />
            <Route path="customers/:id/edit" element={<EditCustomer />} />
            <Route path="suppliers" element={<Suppliers />} />
            <Route path="suppliers/create" element={<CreateSupplier />} />
            <Route path="suppliers/:id" element={<ShowSupplier />} />
            <Route path="suppliers/:id/edit" element={<EditSupplier />} />
            <Route path="invoices" element={<Invoices />} />
            <Route path="invoices/create" element={<CreateInvoice />} />
            <Route path="invoices/:id" element={<ShowInvoice />} />
            <Route path="payments" element={<Payments />} />
            <Route path="expenses" element={<Expenses />} />
            <Route path="reports" element={<Reports />} />
            <Route path="quotations" element={<Quotations />} />
            <Route path="users" element={<Users />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="settings" element={<Settings />} />
            <Route path="hotels" element={<Hotels />} />
            <Route path="packages" element={<Packages />} />
            <Route path="insurance" element={<Insurance />} />
            <Route path="contracts" element={<Contracts />} />
            <Route path="commissions" element={<Commissions />} />
            <Route path="activity-log" element={<ActivityLog />} />
            <Route path="currencies" element={<Currencies />} />
            <Route path="communications" element={<Communications />} />
            <Route path="visas" element={<Visas />} />
            <Route path="documents" element={<Documents />} />
            <Route path="tasks" element={<Tasks />} />
            <Route path="calendar" element={<CalendarView />} />
            <Route path="price-lists" element={<PriceLists />} />
            <Route path="checklist" element={<Checklist />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="leads" element={<Leads />} />
            <Route path="employees" element={<Employees />} />
            <Route path="vehicles" element={<Vehicles />} />
            <Route path="airports" element={<Airports />} />
            <Route path="destinations" element={<Destinations />} />
            <Route path="flight-schedules" element={<FlightSchedules />} />
            <Route path="customer-timeline" element={<CustomerTimeline />} />
            <Route path="follow-ups" element={<FollowUps />} />
            <Route path="surveys" element={<Surveys />} />
            <Route path="complaints" element={<Complaints />} />
            <Route path="gift-vouchers" element={<GiftVouchers />} />
            <Route path="campaigns" element={<Campaigns />} />
            <Route path="loyalty-points" element={<LoyaltyPoints />} />
            <Route path="gallery" element={<Gallery />} />
            <Route path="compare" element={<Compare />} />
            <Route path="contract-templates" element={<ContractTemplates />} />
            <Route path="signed-contracts" element={<SignedContracts />} />
            <Route path="exec-dashboard" element={<ExecutiveDashboard />} />
            <Route path="price-calculator" element={<PriceCalculator />} />
            <Route path="knowledge" element={<KnowledgeBase />} />
            <Route path="guides" element={<Guides />} />
            <Route path="discounts" element={<Discounts />} />
            <Route path="tax-rates" element={<TaxRates />} />
            <Route path="reviews" element={<Reviews />} />
            <Route path="brokers" element={<Brokers />} />
            <Route path="transfers" element={<Transfers />} />
            <Route path="services-catalog" element={<ServicesCatalog />} />
            <Route path="restaurant-bookings" element={<RestaurantBookings />} />
            <Route path="properties" element={<Properties />} />
            <Route path="referrals" element={<Referrals />} />
            <Route path="trash" element={<Trash />} />
            <Route path="login-log" element={<LoginLog />} />
            <Route path="templates" element={<Templates />} />
            <Route path="advanced-settings" element={<AdvancedSettings />} />
            <Route path="installments" element={<Installments />} />
            <Route path="appointments" element={<Appointments />} />
            <Route path="approvals" element={<Approvals />} />
            <Route path="phone-directory" element={<PhoneDirectory />} />
          </Route>
        </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
