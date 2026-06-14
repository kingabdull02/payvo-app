import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { PhoneContainer } from './components/PhoneContainer';
import { LoginView } from './views/LoginView';
import { RegisterView } from './views/RegisterView';
import { ForgotView } from './views/ForgotView';
import { DashboardView } from './views/DashboardView';
import { AddBillView } from './views/AddBillView';
import { SettingsView } from './views/SettingsView';
import { dbAPI } from './db/dbClient';
import type { Invoice } from './db/dbClient';
import type { ViewState } from './types';

export default function App() {
  const [activeView, setActiveView] = useState<ViewState>('login');
  const [userId, setUserId] = useState<string | null>(null);
  const [editInvoice, setEditInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);

  // Load current session
  useEffect(() => {
    const checkUser = async () => {
      try {
        const currentUser = await dbAPI.auth.getCurrentUser();
        if (currentUser) {
          setUserId(currentUser.id);
          setActiveView('dashboard');
        } else {
          setActiveView('login');
        }
      } catch (err) {
        console.error('Failed to authenticate session', err);
      } finally {
        setLoading(false);
      }
    };
    checkUser();
  }, []);

  const handleLoginSuccess = (uid: string) => {
    setUserId(uid);
  };

  const handleLogout = () => {
    setUserId(null);
    setEditInvoice(null);
    setActiveView('login');
  };

  const handleSelectEditInvoice = (invoice: Invoice) => {
    setEditInvoice(invoice);
    setActiveView('add-bill');
  };

  // Safe navigation wrapper that resets edit mode when not entering add-bill
  const navigateTo = (view: ViewState) => {
    if (view !== 'add-bill') {
      setEditInvoice(null);
    }
    setActiveView(view);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-iceWhite flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-electricTeal border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs text-deepNavy/50 font-bold uppercase tracking-wider">Laddar Payvo...</span>
        </div>
      </div>
    );
  }

  // Animation motion configuration variants
  const pageVariants = {
    initial: { opacity: 0, x: 15 },
    animate: { opacity: 1, x: 0, transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] as const } },
    exit: { opacity: 0, x: -15, transition: { duration: 0.2, ease: [0.64, 0, 0.78, 0] as const } }
  };

  return (
    <PhoneContainer>
      <div className="flex-1 flex flex-col min-h-full h-full relative overflow-hidden bg-iceWhite">
        <AnimatePresence mode="wait">
          {activeView === 'login' && (
            <motion.div 
              key="login" 
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="flex-1 flex flex-col min-h-full h-full"
            >
              <LoginView onNavigate={navigateTo} onLoginSuccess={handleLoginSuccess} />
            </motion.div>
          )}

          {activeView === 'register' && (
            <motion.div 
              key="register" 
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="flex-1 flex flex-col min-h-full h-full"
            >
              <RegisterView onNavigate={navigateTo} onLoginSuccess={handleLoginSuccess} />
            </motion.div>
          )}

          {activeView === 'forgot' && (
            <motion.div 
              key="forgot" 
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="flex-1 flex flex-col min-h-full h-full"
            >
              <ForgotView onNavigate={navigateTo} />
            </motion.div>
          )}

          {activeView === 'dashboard' && userId && (
            <motion.div 
              key="dashboard" 
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="flex-1 flex flex-col min-h-full h-full"
            >
              <DashboardView 
                userId={userId} 
                onNavigate={navigateTo} 
                onSelectEditInvoice={handleSelectEditInvoice} 
              />
            </motion.div>
          )}

          {activeView === 'add-bill' && userId && (
            <motion.div 
              key="add-bill" 
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="flex-1 flex flex-col min-h-full h-full"
            >
              <AddBillView 
                userId={userId} 
                editInvoice={editInvoice} 
                onNavigate={navigateTo} 
                onSuccess={() => setEditInvoice(null)} 
              />
            </motion.div>
          )}

          {activeView === 'settings' && userId && (
            <motion.div 
              key="settings" 
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="flex-1 flex flex-col min-h-full h-full"
            >
              <SettingsView userId={userId} onNavigate={navigateTo} onLogout={handleLogout} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PhoneContainer>
  );
}
