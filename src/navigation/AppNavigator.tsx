import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import HomeScreen from '../screens/HomeScreen';
import TipsScreen from '../screens/TipsScreen';
import VipPurchaseScreen from '../screens/VipPurchaseScreen';
import PageContentScreen from '../screens/PageContentScreen';
export type RootStackParamList = {
  Home: undefined;
  Tips: {
    tipsData?: any[];
    endpoint?: string;
    cardType?: string;
  };
  VipPurchase: {
    returnTo?: string;
  } | undefined;
  PageContent: {
    pageId: string;
  };
};
const Stack = createStackNavigator<RootStackParamList>();
const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerShown: false,
        }}>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Tips" component={TipsScreen} />
        <Stack.Screen name="VipPurchase" component={VipPurchaseScreen} />
        <Stack.Screen name="PageContent" component={PageContentScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
export default AppNavigator;
