import React, { useContext } from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { AuthContext } from '../context/AuthContext';
import { PosContext, PosProvider } from '../context/PosContext';
import LoginScreen from '../screens/LoginScreen';
import POSScreen from '../screens/POSScreen';
import HistoryScreen from '../screens/HistoryScreen';
import StockScreen from '../screens/StockScreen';
import AdminRevenueScreen from '../screens/admin/AdminRevenueScreen';
import {
  Colors,
  FontWeights,
  TABLET_BREAKPOINT,
  TAB_BAR_HEIGHT_PHONE,
  TAB_BAR_HEIGHT_TABLET,
} from '../constants/theme';
import { hapticSelection } from '../utils/haptics';

const Tab = createBottomTabNavigator();

type TabIconType = 'order' | 'status' | 'stock' | 'revenue';

function TabIcon({ type, focused, isTablet }: { type: TabIconType; focused: boolean; isTablet: boolean }) {
  const color = focused ? Colors.gold : '#71717A';

  return (
    <View style={[tabStyles.iconContainer, isTablet && tabStyles.iconContainerTablet]}>
      {type === 'order' && (
        <View style={[tabStyles.orderPad, { borderColor: color }]}>
          <View style={[tabStyles.orderClip, { backgroundColor: color }]} />
          <View style={[tabStyles.orderLine1, { backgroundColor: color }]} />
          <View style={[tabStyles.orderLine2, { backgroundColor: color }]} />
        </View>
      )}

      {type === 'status' && (
        <View style={[tabStyles.clockCircle, { borderColor: color }]}>
          <View style={[tabStyles.clockNeedleV, { backgroundColor: color }]} />
          <View style={[tabStyles.clockNeedleH, { backgroundColor: color }]} />
        </View>
      )}

      {type === 'stock' && (
        <View style={tabStyles.stockWrap}>
          <View style={[tabStyles.stockBox, { borderColor: color }]}>
            <View style={[tabStyles.stockLine, { backgroundColor: color }]} />
          </View>
          <View style={[tabStyles.stockBase, { backgroundColor: color }]} />
        </View>
      )}

      {type === 'revenue' && (
        <View style={tabStyles.revenueWrap}>
          <View style={tabStyles.revenueBars}>
            <View style={[tabStyles.revenueBar1, { backgroundColor: color }]} />
            <View style={[tabStyles.revenueBar2, { backgroundColor: color }]} />
            <View style={[tabStyles.revenueBar3, { backgroundColor: color }]} />
          </View>
          <View style={[tabStyles.revenueBase, { backgroundColor: color }]} />
        </View>
      )}
    </View>
  );
}

const tabStyles = StyleSheet.create({
  iconContainer: {
    width: 28,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainerTablet: {
    width: 32,
    height: 26,
  },
  orderPad: {
    width: 17,
    height: 21,
    borderRadius: 3,
    borderWidth: 1.8,
    alignItems: 'center',
    paddingTop: 3,
  },
  orderClip: {
    width: 7,
    height: 2,
    borderRadius: 1,
    position: 'absolute',
    top: -1,
  },
  orderLine1: {
    width: 9,
    height: 1.6,
    borderRadius: 0.8,
    marginBottom: 3,
  },
  orderLine2: {
    width: 6,
    height: 1.6,
    borderRadius: 0.8,
  },
  clockCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clockNeedleV: {
    width: 1.8,
    height: 5,
    borderRadius: 0.9,
    position: 'absolute',
    top: 3.5,
  },
  clockNeedleH: {
    width: 4,
    height: 1.8,
    borderRadius: 0.9,
    position: 'absolute',
    left: 8.5,
  },
  stockWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 22,
    height: 20,
  },
  stockBox: {
    width: 18,
    height: 13,
    borderRadius: 2.5,
    borderWidth: 1.8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stockLine: {
    width: 10,
    height: 1.6,
    borderRadius: 0.8,
  },
  stockBase: {
    width: 14,
    height: 1.6,
    borderRadius: 0.8,
    marginTop: 1.5,
  },
  revenueWrap: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: 21,
    width: 22,
  },
  revenueBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2.5,
    marginBottom: 1.5,
  },
  revenueBar1: {
    width: 3.5,
    height: 7,
    borderRadius: 1,
    opacity: 0.6,
  },
  revenueBar2: {
    width: 3.5,
    height: 11,
    borderRadius: 1,
    opacity: 0.85,
  },
  revenueBar3: {
    width: 3.5,
    height: 16,
    borderRadius: 1,
  },
  revenueBase: {
    width: 19,
    height: 1.6,
    borderRadius: 0.8,
    opacity: 0.5,
  },
});

function CashierNavigator({ isTablet, tabBarHeight }: { isTablet: boolean; tabBarHeight: number }) {
  const { tickets } = useContext(PosContext);
  const completedTicketsCount = (tickets || []).length;

  return (
    <Tab.Navigator
      id="CashierTabNav"
      detachInactiveScreens={true}
      screenListeners={{
        tabPress: () => {
          hapticSelection();
        },
      }}
      screenOptions={{
        headerShown: false,
        freezeOnBlur: true,
        tabBarStyle: {
          backgroundColor: Colors.bg,
          borderTopColor: Colors.borderLight,
          borderTopWidth: 1,
          paddingBottom: isTablet ? 14 : 10,
          paddingTop: isTablet ? 12 : 8,
          height: tabBarHeight,
        },
        tabBarActiveTintColor: Colors.gold,
        tabBarInactiveTintColor: '#71717A',
        tabBarLabelStyle: {
          fontSize: isTablet ? 12 : 10,
          fontWeight: FontWeights.bold,
          marginTop: 3,
          letterSpacing: 0.2,
        },
        tabBarBadgeStyle: {
          backgroundColor: Colors.gold,
          color: Colors.bg,
          fontSize: 9,
          fontWeight: FontWeights.black,
        },
      }}
    >
      <Tab.Screen
        name="Menu"
        component={POSScreen}
        options={{
          tabBarLabel: 'Take Order',
          tabBarIcon: ({ focused }) => <TabIcon type="order" focused={focused} isTablet={isTablet} />,
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          tabBarLabel: 'Invoices',
          tabBarBadge: completedTicketsCount > 0 ? completedTicketsCount : undefined,
          tabBarIcon: ({ focused }) => <TabIcon type="status" focused={focused} isTablet={isTablet} />,
        }}
      />
      <Tab.Screen
        name="Stock"
        component={StockScreen}
        options={{
          tabBarLabel: 'Stock Matrix',
          tabBarIcon: ({ focused }) => <TabIcon type="stock" focused={focused} isTablet={isTablet} />,
        }}
      />
    </Tab.Navigator>
  );
}

function AdminNavigator({ isTablet, tabBarHeight }: { isTablet: boolean; tabBarHeight: number }) {
  const { tickets } = useContext(PosContext);
  const completedTicketsCount = (tickets || []).length;

  return (
    <Tab.Navigator
      id="AdminTabNav"
      detachInactiveScreens={true}
      screenListeners={{
        tabPress: () => {
          hapticSelection();
        },
      }}
      screenOptions={{
        headerShown: false,
        freezeOnBlur: true,
        tabBarStyle: {
          backgroundColor: Colors.bg,
          borderTopColor: Colors.borderLight,
          borderTopWidth: 1,
          paddingBottom: isTablet ? 14 : 10,
          paddingTop: isTablet ? 12 : 8,
          height: tabBarHeight,
        },
        tabBarActiveTintColor: Colors.gold,
        tabBarInactiveTintColor: '#71717A',
        tabBarLabelStyle: {
          fontSize: isTablet ? 12 : 10,
          fontWeight: FontWeights.bold,
          marginTop: 3,
          letterSpacing: 0.2,
        },
        tabBarBadgeStyle: {
          backgroundColor: Colors.gold,
          color: Colors.bg,
          fontSize: 9,
          fontWeight: FontWeights.black,
        },
      }}
    >
      <Tab.Screen
        name="AdminRevenue"
        component={AdminRevenueScreen}
        options={{
          tabBarLabel: 'Revenue',
          tabBarIcon: ({ focused }) => <TabIcon type="revenue" focused={focused} isTablet={isTablet} />,
        }}
      />
      <Tab.Screen
        name="AdminOrder"
        component={POSScreen}
        options={{
          tabBarLabel: 'Take Order',
          tabBarIcon: ({ focused }) => <TabIcon type="order" focused={focused} isTablet={isTablet} />,
        }}
      />
      <Tab.Screen
        name="AdminHistory"
        component={HistoryScreen}
        options={{
          tabBarLabel: 'Invoices',
          tabBarBadge: completedTicketsCount > 0 ? completedTicketsCount : undefined,
          tabBarIcon: ({ focused }) => <TabIcon type="status" focused={focused} isTablet={isTablet} />,
        }}
      />
      <Tab.Screen
        name="AdminStock"
        component={StockScreen}
        options={{
          tabBarLabel: 'Stock Matrix',
          tabBarIcon: ({ focused }) => <TabIcon type="stock" focused={focused} isTablet={isTablet} />,
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { isAuthenticated, userRole } = useContext(AuthContext);
  const { width } = useWindowDimensions();
  const isTablet = width >= TABLET_BREAKPOINT;
  const tabBarHeight = isTablet ? TAB_BAR_HEIGHT_TABLET : TAB_BAR_HEIGHT_PHONE;

  return (
    <NavigationContainer>
      {!isAuthenticated ? (
        <LoginScreen />
      ) : (
        <PosProvider>
          {userRole === 'admin' ? (
            <AdminNavigator isTablet={isTablet} tabBarHeight={tabBarHeight} />
          ) : (
            <CashierNavigator isTablet={isTablet} tabBarHeight={tabBarHeight} />
          )}
        </PosProvider>
      )}
    </NavigationContainer>
  );
}
