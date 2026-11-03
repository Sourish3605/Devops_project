import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';

// Screens
import { LoginScreen } from './components/screens/LoginScreen';
import { DashboardScreen } from './components/screens/DashboardScreen';
import { EventsScreen } from './components/screens/EventsScreen';
import { RegistrationsScreen } from './components/screens/RegistrationsScreen';
import { DutyAllocationScreen } from './components/screens/DutyAllocationScreen';
import { AttendanceScreen } from './components/screens/AttendanceScreen';
import { CertificatesScreen } from './components/screens/CertificatesScreen';
import { ReportsScreen } from './components/screens/ReportsScreen';
import { ProfileScreen } from './components/screens/ProfileScreen';
import { UsersManagementScreen } from './components/screens/UsersManagementScreen';
import { BrandedLoadingScreen } from './components/common/BrandedLoadingScreen';

const MainApp: React.FC = () => {
  const { user, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  if (loading) {
    return <BrandedLoadingScreen />;
  }

  if (!user) {
    return <LoginScreen />;
  }

  const titles: Record<string, string> = {
    dashboard: `${user.role.toUpperCase()} Analytics Dashboard`,
    users: 'Institutional User Governance & Permissions',
    events: 'Community Events Catalog & Management',
    registrations: 'Volunteer Registrations & Statuses',
    allocations: 'Duty Allocation & Task Station Assignments',
    attendance: 'Live Attendance & Check-in Desk',
    certificates: 'Merit & Participation Certificates',
    reports: 'Institutional Analytics & Reports',
    profile: 'Volunteer Profile & Account Settings'
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex transition-colors">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar currentTab={currentTab} setCurrentTab={setCurrentTab} />
      </div>

      {/* Mobile Drawer */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden bg-black/60 backdrop-blur-sm">
          <div className="w-64 h-full bg-white dark:bg-slate-900">
            <Sidebar
              currentTab={currentTab}
              setCurrentTab={tab => {
                setCurrentTab(tab);
                setMobileSidebarOpen(false);
              }}
            />
          </div>
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title={titles[currentTab] || 'CommunityConnect'}
          onToggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
        />

        <main className="flex-1 overflow-y-auto">
          {currentTab === 'dashboard' && <DashboardScreen onNavigate={tab => setCurrentTab(tab)} />}
          {currentTab === 'users' && <UsersManagementScreen />}
          {currentTab === 'events' && <EventsScreen />}
          {currentTab === 'registrations' && <RegistrationsScreen />}
          {currentTab === 'allocations' && <DutyAllocationScreen />}
          {currentTab === 'attendance' && <AttendanceScreen />}
          {currentTab === 'certificates' && <CertificatesScreen />}
          {currentTab === 'reports' && <ReportsScreen />}
          {currentTab === 'profile' && <ProfileScreen />}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
