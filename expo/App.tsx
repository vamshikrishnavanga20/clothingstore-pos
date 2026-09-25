import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { NotificationProvider } from './src/context/NotificationContext';
import ErrorBoundary from './src/components/ErrorBoundary';
import AppNavigator from './src/navigation/AppNavigator';

/**
 * Production-grade QueryClient configuration matching expo.zip architecture.
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      gcTime: 1000 * 60 * 30,
      staleTime: 1000 * 60 * 5,
      refetchOnReconnect: 'always',
    },
    mutations: {
      retry: 1,
    },
  },
});

import { useNotification } from './src/context/NotificationContext';
import { safeStorage } from './src/utils/storage';
import { checkForAppUpdates } from './src/services/updateService';

function MainContent() {
  const { showNotification } = useNotification();

  React.useEffect(() => {
    async function checkStartupUpdate() {
      try {
        const autoUp = await safeStorage.getItem('roman_pos_auto_update');
        if (autoUp === 'false') return;

        // Wait 3 seconds so the app completes initial load before checking
        const timer = setTimeout(async () => {
          try {
            const res = await checkForAppUpdates();
            if (res.hasUpdate) {
              showNotification(
                'Terminal Update Ready 🚀',
                `Version ${res.latestVersion} is available. Visit Settings to upgrade.`,
                'info'
              );
            }
          } catch {}
        }, 3000);

        return () => clearTimeout(timer);
      } catch {}
    }

    checkStartupUpdate();
  }, []);

  return <AppNavigator />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <AuthProvider>
            <NotificationProvider>
              <MainContent />
            </NotificationProvider>
          </AuthProvider>
        </SafeAreaProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
