import React from 'react';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {CreditsProvider} from './src/betleriz/Credits';
import {CreditPurchasesProvider} from './src/betleriz/CreditShop';
import FullAccessPage from './src/betleriz/FullAccessPage';
import Dashboard from './src/betleriz/Dashboard';
import {PreferencesProvider} from './src/betleriz/Preferences';
import ErrorBoundary from './src/components/ErrorBoundary';
// The independent Betleriz build does not initialize the previous app's billing,
// Firebase account, version gate or startup network requests.
export default function App(){return <ErrorBoundary><SafeAreaProvider><PreferencesProvider><CreditsProvider><CreditPurchasesProvider><Dashboard/><FullAccessPage/></CreditPurchasesProvider></CreditsProvider></PreferencesProvider></SafeAreaProvider></ErrorBoundary>;}
