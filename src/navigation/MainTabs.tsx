import React from 'react';
import { Text, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DashboardScreen } from '../screens/DashboardScreen';
import { ExpenseListScreen } from '../screens/ExpenseListScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { colors } from '../constants/theme';
import { AddExpenseFab } from '../components/AddExpenseFab';
import { ExpenseFormModal } from '../components/ExpenseFormModal';
import { ShakeToAddListener } from '../components/ShakeToAddListener';
import { OfflineSyncListener } from '../components/OfflineSyncListener';

export type MainTabParamList = {
  Dashboard: undefined;
  Expenses: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const icons: Record<string, string> = {
    Dashboard: '⌂',
    Expenses: '≡',
    Settings: '⚙',
  };
  return (
    <Text
      style={{
        fontSize: 18,
        color: focused ? colors.primary : colors.textMuted,
      }}
    >
      {icons[label] ?? '•'}
    </Text>
  );
}

export function MainTabs() {
  return (
    <View style={{ flex: 1 }}>
      <ShakeToAddListener />
      <OfflineSyncListener />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            paddingTop: 4,
            height: 60,
          },
          tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
          tabBarIcon: ({ focused }) => (
            <TabIcon label={route.name} focused={focused} />
          ),
        })}
      >
        <Tab.Screen name="Dashboard" component={DashboardScreen} />
        <Tab.Screen name="Expenses" component={ExpenseListScreen} />
        <Tab.Screen name="Settings" component={SettingsScreen} />
      </Tab.Navigator>
      <AddExpenseFab />
      <ExpenseFormModal />
    </View>
  );
}
