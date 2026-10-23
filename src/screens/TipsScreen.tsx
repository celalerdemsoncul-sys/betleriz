import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  Dimensions,
  Image,
  Animated,
  RefreshControl,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {RouteProp} from '@react-navigation/native';
import {RootStackParamList} from '../navigation/AppNavigator';
import { ScoreTimeIcon, LostIcon, WonIcon, LiveIcon } from '../components/SvgIcons';
import Header from '../components/Header';
import HamburgerMenu from '../components/HamburgerMenu';
import { useMobileApi } from '../hooks/useMobileApi';
import { CARD_TYPE_MAPPING, PREMIUM_CARD_TYPES } from '../constants/endpoints';
import { usePremiumAccess } from '../hooks/usePremiumAccess';
import { useResponsive } from '../hooks/useResponsive';
import { useSupport } from '../hooks/useSupport';
import { TipMatch, TipsApiResponse } from '../types/TipsTypes';
import AnalyticsService from '../services/AnalyticsService';
type TipsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Tips'>;
type TipsScreenRouteProp = RouteProp<RootStackParamList, 'Tips'>;
const LiveIndicator: React.FC<{ styles: any }> = ({ styles }) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const pulse = () => {
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.5,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start(() => pulse());
    };
    pulse();
  }, [pulseAnim]);
  return (
    <View style={styles.liveIndicator}>
      <Animated.View 
        style={[
          styles.liveIndicatorDot,
          {
            transform: [{ scale: pulseAnim }],
            opacity: pulseAnim.interpolate({
              inputRange: [1, 1.5],
              outputRange: [1, 0.3],
            }),
          }
        ]} 
      />
    </View>
  );
};
const TipsScreen: React.FC = () => {
  const navigation = useNavigation<TipsScreenNavigationProp>();
  const route = useRoute<TipsScreenRouteProp>();
  const { getTips: getTipsFromApi } = useMobileApi();
  const { checkPremiumAccess } = usePremiumAccess();
  const { isTablet, isLargeTablet, getResponsiveValue } = useResponsive();
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [tipsData, setTipsData] = useState<TipMatch[]>([]);
  const [displayedTips, setDisplayedTips] = useState<TipMatch[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [selectedDate, setSelectedDate] = useState<'yesterday' | 'today' | 'tomorrow' | 'after-tomorrow'>('today');
  const [selectedCardType, setSelectedCardType] = useState<string | null>(null);
  const [isDateChanging, setIsDateChanging] = useState(false);
  const autoRefreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const loadTipsDataRef = useRef<
    (cardType: string, date: string, forceRefresh?: boolean, isAutoRefresh?: boolean) => Promise<void>
  >(() => Promise.resolve());
  const isInitialLoadRef = useRef(isInitialLoad);
  isInitialLoadRef.current = isInitialLoad;
  const tipsDataRef = useRef<TipMatch[]>([]);
  tipsDataRef.current = tipsData;
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);
  const supportPage = selectedCardType || 'tips';
  const { supportInfo } = useSupport(supportPage);
  const onRefresh = useCallback(async () => {
    if (!selectedCardType) return;
    setIsManualRefreshing(true);
    try {
      const apiResult = await getTipsFromApi(selectedCardType, selectedDate) as TipsApiResponse;
      let data: TipMatch[] = [];
      if (apiResult && apiResult.success && apiResult.data && Array.isArray(apiResult.data.data)) {
        data = apiResult.data.data;
      }
      const filteredData = data.filter(item => {
        if (!item.predictions || Object.keys(item.predictions).length === 0) {
          return false;
        }
        for (const [, predictionData] of Object.entries(item.predictions)) {
          if (predictionData && predictionData.cardType && Array.isArray(predictionData.cardType)) {
            if (predictionData.cardType.includes(selectedCardType!)) {
              return true;
            }
          }
        }
        return false;
      });
      setTipsData(prev => {
        const isChanged = JSON.stringify(prev) !== JSON.stringify(filteredData);
        return isChanged ? filteredData : prev;
      });
      setDisplayedTips(prev => {
        const updatedTips = [...prev];
        filteredData.forEach(newItem => {
          const existingIndex = updatedTips.findIndex(item => item.matchId === newItem.matchId);
          if (existingIndex !== -1) {
            updatedTips[existingIndex] = newItem;
          }
        });
        return updatedTips;
      });
    } catch (error) {
    } finally {
      setIsManualRefreshing(false);
    }
  }, [selectedCardType, selectedDate]);
  const getDateString = (dateType: 'yesterday' | 'today' | 'tomorrow' | 'after-tomorrow') => {
    const today = new Date();
    let targetDate = new Date(today);
    switch (dateType) {
      case 'yesterday':
        targetDate.setDate(today.getDate() - 1);
        break;
      case 'today':
        targetDate = today;
        break;
      case 'tomorrow':
        targetDate.setDate(today.getDate() + 1);
        break;
      case 'after-tomorrow':
        targetDate.setDate(today.getDate() + 2);
        break;
    }
    return targetDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const loadTipsData = async (cardType: string, date: string, forceRefresh: boolean = false, isAutoRefresh: boolean = false) => {
    try {
      if (!cardType) {
        return;
      }
      const hasAccess = checkPremiumAccess(cardType, PREMIUM_CARD_TYPES);
      if (!hasAccess) {
        navigation.navigate('VipPurchase', {
          returnTo: 'Home',
        });
        return;
      }
      if (isAutoRefresh) {
        setIsRefreshing(true);
      }
      const apiResult = await getTipsFromApi(cardType, date) as TipsApiResponse;
      let data: TipMatch[] = [];
      if (apiResult && apiResult.success && apiResult.data && Array.isArray(apiResult.data.data)) {
        data = apiResult.data.data;
      }
      const filteredData = data.filter(item => {
        if (!item.predictions || Object.keys(item.predictions).length === 0) {
          return false;
        }
        for (const [, predictionData] of Object.entries(item.predictions)) {
          if (predictionData && predictionData.cardType && Array.isArray(predictionData.cardType)) {
            if (predictionData.cardType.includes(cardType)) {
              return true;
            }
          }
        }
        return false;
      });

      if (isAutoRefresh && filteredData.length === 0) {
        setIsRefreshing(false);
        return;
      }

      const initialLoad = isInitialLoadRef.current;
      const prevTips = tipsDataRef.current;
      const isDataChanged =
        JSON.stringify(prevTips) !== JSON.stringify(filteredData);
      if (!(isDataChanged || initialLoad)) {
        setIsRefreshing(false);
        return;
      }

      setTipsData(filteredData);
      if (initialLoad) {
        setDisplayedTips(filteredData.slice(0, 3));
        setCurrentIndex(3);
      } else if (forceRefresh) {
        setDisplayedTips(filteredData.slice(0, 3));
        setCurrentIndex(3);
      } else {
        setDisplayedTips(prev => {
          const updatedTips = [...prev];
          filteredData.forEach(newItem => {
            const existingIndex = updatedTips.findIndex(
              item => item.matchId === newItem.matchId,
            );
            if (existingIndex !== -1) {
              updatedTips[existingIndex] = newItem;
            }
          });
          return updatedTips;
        });
      }
      setIsInitialLoad(false);
      setIsRefreshing(false);
    } catch (error) {
      if (!isAutoRefresh) {
        setTipsData([]);
        setDisplayedTips([]);
        setCurrentIndex(0);
      }
      setIsInitialLoad(false);
      setIsRefreshing(false);
    }
  };

  loadTipsDataRef.current = loadTipsData;

  const handleDateSelection = async (dateType: 'yesterday' | 'today' | 'tomorrow' | 'after-tomorrow') => {
    setSelectedDate(dateType);
    setIsDateChanging(true);
    if (selectedCardType) {
      await loadTipsData(selectedCardType, dateType, true);
    }
    setIsDateChanging(false);
  };
  const hasLiveMatches = (matches: TipMatch[]) => {
    return matches.some(match => 
      match.liveScore?.status === 'LIVE' || 
      match.liveScore?.status === 'HT' ||
      (match.liveScore?.status === 'FT' && match.liveScore?.minute === 0) 
    );
  };
  const refreshSingleCard = async (matchId: string | number) => {
    if (!selectedCardType) return;
    try {
      const apiResult = await getTipsFromApi(selectedCardType, selectedDate) as TipsApiResponse;
      if (apiResult && apiResult.success && apiResult.data && Array.isArray(apiResult.data.data)) {
        const newData = apiResult.data.data;
        setDisplayedTips(prev => 
          prev.map(item => {
            if (String(item.matchId) === String(matchId)) {
              const updatedItem = newData.find(newItem => String(newItem.matchId) === String(matchId));
              if (updatedItem) {
                return {
                  ...item,
                  liveScore: {
                    ...item.liveScore,
                    ...updatedItem.liveScore,
                  },
                  predictions: {
                    ...item.predictions,
                    ...updatedItem.predictions,
                  },
                };
              }
              return item;
            }
            return item;
          })
        );
      } else {
      }
    } catch (error) {
    }
  };
  useEffect(() => {
    AnalyticsService.logScreenView('TipsScreen', 'TipsScreen');
  }, []);
  useEffect(() => {
    if (route.params?.cardType) {
      const cardTypeMapping: { [key: string]: string } = {
        'Daily Sure Tips': 'daily-sure',
        'Football Tips': 'football',
        'Over-Under': 'over-under',
        'Single Tips': 'single',
        'Daily 20+ Odds': 'daily-odds',
        'Bonus-Surprise': 'bonus',
        'Basketball': 'basketball',
        'Tennis': 'tennis',
        'Special VIP': 'special',
        'Fixed VIP': 'fixed',
        'Correct Score': 'correct-score',
        'HT-FT': 'ht-ft',
        'Multi 50+ Odds': 'multi-50',
        'Multi 10+ Odds': 'multi-10',
        'Single VIP': 'single-vip',
        'Mixed VIP': 'mixed',
      };
      const mappedCardType = cardTypeMapping[route.params.cardType];
      if (mappedCardType) {
        setSelectedCardType(mappedCardType);
        loadTipsData(mappedCardType, 'today');
      }
    }
  }, [route.params?.cardType]);
  useEffect(() => {
    if (tipsData.length > 0 && isInitialLoad) {
      setDisplayedTips(tipsData.slice(0, 3));
      setCurrentIndex(3);
      if (tipsData.length > 3) {
        let currentIndex = 3;
        const batchSize = 3;
        const loadNextBatch = () => {
          if (currentIndex < tipsData.length) {
            setImmediate(() => {
              requestAnimationFrame(() => {
                const nextBatch = tipsData.slice(currentIndex, currentIndex + batchSize);
                setDisplayedTips(prev => [...prev, ...nextBatch]);
                setCurrentIndex(currentIndex + batchSize);
                currentIndex += batchSize;
                if (currentIndex < tipsData.length) {
                  loadNextBatch();
                } else {
                  setIsInitialLoad(false);
                }
              });
            });
          }
        };
        loadNextBatch();
      } else {
        setIsInitialLoad(false);
      }
    }
  }, [tipsData, isInitialLoad]);
  useEffect(() => {
    if (autoRefreshIntervalRef.current) {
      clearInterval(autoRefreshIntervalRef.current);
      autoRefreshIntervalRef.current = null;
    }
    if (!selectedCardType) {
      return;
    }
    autoRefreshIntervalRef.current = setInterval(() => {
      const fn = loadTipsDataRef.current;
      if (fn) {
        void fn(selectedCardType, selectedDate, true, true);
      }
    }, 60000);
    return () => {
      if (autoRefreshIntervalRef.current) {
        clearInterval(autoRefreshIntervalRef.current);
        autoRefreshIntervalRef.current = null;
      }
    };
  }, [selectedCardType, selectedDate]);
  const getPredictionType = (item: TipMatch, cardType: string | null): string => {
    if (!cardType || !item.predictions) return 'Prediction';
    for (const [, predictionData] of Object.entries(item.predictions)) {
      if (predictionData && predictionData.cardType && Array.isArray(predictionData.cardType)) {
        if (predictionData.cardType.includes(cardType)) {
          return predictionData.type || 'Prediction';
        }
      }
    }
    switch (cardType) {
      case 'over-under':
        return item.predictions.totalgoals?.type || 'Total Goals';
      case 'ht-ft':
        return item.predictions.htft?.type || 'HT/FT';
      case 'correct-score':
        return item.predictions.correctscore?.type || 'Correct Score';
      case 'mixed':
        return item.predictions.btts?.type || 'Both Teams To Score';
      case 'special':
        return item.predictions.btts?.type || 'Both Teams To Score';
      case 'daily-sure':
      case 'football':
      case 'single':
      case 'daily-odds':
      case 'bonus':
      case 'basketball':
      case 'tennis':
      case 'fixed':
      case 'multi-50':
      case 'multi-10':
      case 'single-vip':
      default:
        return item.predictions.winner?.type || 'Winner';
    }
  };
  const getPredictionValue = (item: TipMatch, cardType: string | null): string => {
    if (!cardType || !item.predictions) return 'N/A';
    for (const [, predictionData] of Object.entries(item.predictions)) {
      if (predictionData && predictionData.cardType && Array.isArray(predictionData.cardType)) {
        if (predictionData.cardType.includes(cardType)) {
          return predictionData.prediction || 'N/A';
        }
      }
    }
    switch (cardType) {
      case 'over-under':
        return item.predictions.totalgoals?.prediction || 'N/A';
      case 'ht-ft':
        return item.predictions.htft?.prediction || 'N/A';
      case 'correct-score':
        return item.predictions.correctscore?.prediction || 'N/A';
      case 'mixed':
        return item.predictions.btts?.prediction || 'N/A';
      case 'special':
        return item.predictions.btts?.prediction || 'N/A';
      case 'daily-sure':
      case 'football':
      case 'single':
      case 'daily-odds':
      case 'bonus':
      case 'basketball':
      case 'tennis':
      case 'fixed':
      case 'multi-50':
      case 'multi-10':
      case 'single-vip':
      default:
        return item.predictions.winner?.prediction || 'N/A';
    }
  };
  const getPredictionResult = (item: TipMatch, cardType: string | null): 'WON' | 'LOST' | 'PENDING' | null => {
    if (!cardType || !item.predictions) return null;
    for (const [, predictionData] of Object.entries(item.predictions)) {
      if (predictionData && predictionData.cardType && Array.isArray(predictionData.cardType)) {
        if (predictionData.cardType.includes(cardType)) {
          return predictionData.result || null;
        }
      }
    }
    switch (cardType) {
      case 'over-under':
        return item.predictions.totalgoals?.result || null;
      case 'ht-ft':
        return item.predictions.htft?.result || null;
      case 'correct-score':
        return item.predictions.correctscore?.result || null;
      case 'mixed':
        return item.predictions.btts?.result || null;
      case 'special':
        return item.predictions.btts?.result || null;
      case 'daily-sure':
      case 'football':
      case 'single':
      case 'daily-odds':
      case 'bonus':
      case 'basketball':
      case 'tennis':
      case 'fixed':
      case 'multi-50':
      case 'multi-10':
      case 'single-vip':
      default:
        return item.predictions.winner?.result || null;
    }
  };
  const getTeamFlag = (teamFlags: { [key: string]: string }, teamName: string, teamId?: string, matchId?: string): string => {
    if (!teamFlags || !teamName) return '';
    if (teamId && teamFlags[teamId]) {
      return teamFlags[teamId];
    }
    if (matchId) {
      const matchIdKey = `${matchId}_${teamName}`;
      if (teamFlags[matchIdKey]) {
        return teamFlags[matchIdKey];
      }
      const firstWord = teamName.split(/[\s\-_]+/)[0];
      const matchIdFirstWordKey = `${matchId}_${firstWord}`;
      if (teamFlags[matchIdFirstWordKey]) {
        return teamFlags[matchIdFirstWordKey];
      }
    }
    if (teamFlags[teamName]) {
      return teamFlags[teamName];
    }
    const lowerTeamName = teamName.toLowerCase();
    for (const [key, value] of Object.entries(teamFlags)) {
      if (key.toLowerCase() === lowerTeamName) {
        return value;
      }
    }
    for (const [key, value] of Object.entries(teamFlags)) {
      const keyWords = key.toLowerCase().split(/[\s\-_]+/);
      const teamWords = lowerTeamName.split(/[\s\-_]+/);
      let matchCount = 0;
      for (const teamWord of teamWords) {
        if (teamWord.length > 2 && keyWords.some(keyWord => keyWord.includes(teamWord) || teamWord.includes(keyWord))) {
          matchCount++;
        }
      }
      if (matchCount >= Math.min(2, teamWords.length)) {
        return value;
      }
    }
    const firstWord = teamName.split(/[\s\-_]+/)[0].toLowerCase();
    if (firstWord.length > 3) {
      for (const [key, value] of Object.entries(teamFlags)) {
        if (key.toLowerCase().includes(firstWord) || firstWord.includes(key.toLowerCase().split(/[\s\-_]+/)[0])) {
          return value;
        }
      }
    }
    return '';
  };
  const styles = createStyles(isTablet, isLargeTablet);
  const getCategoryTitle = () => {
    const cardType = route.params?.cardType;
    if (cardType) {
      return cardType;
    }
    return 'Betting Tips';
  };
  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground 
        source={{uri: 'background'}} 
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <Header 
          title={getCategoryTitle()}
          onBackPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.navigate('Home');
            }
          }}
          onMenuPress={() => setIsMenuVisible(true)}
        />
        {/* Refresh Indicator - sadece manuel refresh için göster */}
        {isManualRefreshing && (
          <View style={styles.refreshIndicator}>
            <Text style={styles.refreshText}>Refreshing data...</Text>
          </View>
        )}
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={isManualRefreshing}
              onRefresh={onRefresh}
              tintColor="#A855F7"
              colors={["#A855F7"]}
              title="Pull to refresh"
              titleColor="#A855F7"
            />
          }
        >
        {(supportInfo?.title || supportInfo?.email || supportInfo?.description) && (
          <View style={styles.supportSection}>
            {supportInfo?.title && (
              <Text style={styles.supportText}>
                {supportInfo.title}
              </Text>
            )}
            {supportInfo?.description && (
              <Text style={styles.supportDescription}>
                {supportInfo.description}
              </Text>
            )}
            {supportInfo?.email && (
              <Text style={styles.supportEmail}>
                {supportInfo.email}
              </Text>
            )}
          </View>
        )}
        {/* Date Selector Buttons */}
        <View style={styles.dateSelectorContainer}>
          <View style={styles.dateButtonsContainer}>
            <TouchableOpacity
              style={[
                styles.dateButton,
                selectedDate === 'yesterday' && styles.selectedDateButton
              ]}
              onPress={() => handleDateSelection('yesterday')}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.dateButtonText,
                selectedDate === 'yesterday' && styles.selectedDateButtonText
              ]}>
                {getDateString('yesterday')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.dateButton,
                selectedDate === 'today' && styles.selectedDateButton
              ]}
              onPress={() => handleDateSelection('today')}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.dateButtonText,
                selectedDate === 'today' && styles.selectedDateButtonText
              ]}>
                {getDateString('today')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.dateButton,
                selectedDate === 'tomorrow' && styles.selectedDateButton
              ]}
              onPress={() => handleDateSelection('tomorrow')}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.dateButtonText,
                selectedDate === 'tomorrow' && styles.selectedDateButtonText
              ]}>
                {getDateString('tomorrow')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.dateButton,
                selectedDate === 'after-tomorrow' && styles.selectedDateButton
              ]}
              onPress={() => handleDateSelection('after-tomorrow')}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.dateButtonText,
                selectedDate === 'after-tomorrow' && styles.selectedDateButtonText
              ]}>
                {getDateString('after-tomorrow')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        {/* Tips Cards */}
        <ScrollView 
          style={styles.tipsContainer}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={false}
          scrollEventThrottle={1}
          decelerationRate="fast"
          bounces={false}
          overScrollMode="never"
        >
          {isDateChanging ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading data...</Text>
            </View>
          ) : displayedTips.length > 0 ? (
            displayedTips.map((item, index) => (
            <View key={`${index}-${item.homeTeam}-${item.awayTeam}`} style={styles.tipCard}>
              {/* Card Header */}
              <View style={styles.tipHeader}>
                <View style={styles.leagueContainer}>
                  <Image 
                    source={{ uri: item.leagueFlag }} 
                    style={styles.leagueFlag}
                    onError={() => {}}
                  />
                  <Text style={styles.league}>
                    {item.competitionName}
                  </Text>
                </View>
                <View style={styles.timeContainer}>
                  {item.liveScore?.status === 'LIVE' && <LiveIndicator styles={styles} />}
                  <Text style={[
                    styles.time, 
                    styles.matchTimeBackground,
                    item.liveScore?.status === 'LIVE' && styles.liveTimeBackground,
                    item.liveScore?.status === 'HT' && styles.htTimeBackground,
                    item.liveScore?.status === 'FT' && styles.ftTimeBackground
                  ]}>
                    {item.liveScore?.status === 'LIVE' ? `${item.liveScore.minute}'` :
                     item.liveScore?.status === 'HT' ? 'HT' :
                     item.liveScore?.status === 'FT' ? 'FT' :
                     item.matchTime}
                  </Text>
                </View>
              </View>
              <View style={styles.matchContainer}>
                <View style={styles.teamLeftContainer}>
                  <View style={styles.flagContainer}>
                    {getTeamFlag(item.teamFlags, item.homeTeam, item.homeTeamId, String(item.matchId)) ? (
                      <Image 
                        source={{ uri: getTeamFlag(item.teamFlags, item.homeTeam, item.homeTeamId, String(item.matchId)) }} 
                        style={styles.teamFlag}
                        onError={() => {}}
                        resizeMode="contain"
                      />
                    ) : (
                      <View style={[styles.teamFlag, styles.placeholderFlag]}>
                        <Text style={styles.placeholderText}>
                          {item.homeTeam.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.teamLeft} numberOfLines={2}>
                    {item.homeTeam}
                  </Text>
                </View>
                {/* Score Area */}
                <View style={styles.scoreArea}>
                  {item.liveScore?.status === 'FT' ? (
                    <View style={styles.scoreWithoutFrame}>
                      <Text style={styles.scoreText}>
                        {item.liveScore.homeScore}
                      </Text>
                      {getPredictionResult(item, selectedCardType) === 'WON' ? (
                        <WonIcon 
                          width={getResponsiveValue(20, 24, 28)} 
                          height={getResponsiveValue(20, 24, 28)} 
                          color="#d1ff04" 
                        />
                      ) : getPredictionResult(item, selectedCardType) === 'LOST' ? (
                        <LostIcon 
                          width={getResponsiveValue(20, 24, 28)} 
                          height={getResponsiveValue(20, 24, 28)} 
                          color="#ff0404" 
                        />
                      ) : (
                        <Text style={styles.scoreSeparator}>:</Text>
                      )}
                      <Text style={styles.scoreText}>
                        {item.liveScore.awayScore}
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.scoreWithoutFrame}>
                      <Text style={styles.scoreText}>
                        {item.liveScore?.homeScore || 0}
                      </Text>
                      {(item.liveScore?.status as any) === 'LIVE' || (item.liveScore?.status as any) === 'HT' ? (
                        <LiveIcon 
                          width={getResponsiveValue(20, 24, 28)} 
                          height={getResponsiveValue(20, 24, 28)} 
                          color="#888888"
                        />
                      ) : (
                        <ScoreTimeIcon 
                          width={getResponsiveValue(20, 24, 28)} 
                          height={getResponsiveValue(20, 24, 28)} 
                          color={
                            (item.liveScore?.status as any) === 'FT' ? '#FF5722' :
                            (item.liveScore?.status as any) === 'not_started' ? '#cccccc' : '#888888'
                          } 
                        />
                      )}
                      <Text style={styles.scoreText}>
                        {item.liveScore?.awayScore || 0}
                      </Text>
                    </View>
                  )}
                </View>
                <View style={styles.teamRightContainer}>
                  <Text style={styles.teamRight} numberOfLines={2}>
                    {item.awayTeam}
                  </Text>
                  <View style={styles.flagContainer}>
                    {getTeamFlag(item.teamFlags, item.awayTeam, item.awayTeamId, String(item.matchId)) ? (
                      <Image 
                        source={{ uri: getTeamFlag(item.teamFlags, item.awayTeam, item.awayTeamId, String(item.matchId)) }} 
                        style={styles.teamFlag}
                        onError={() => {}}
                        resizeMode="contain"
                      />
                    ) : (
                      <View style={[styles.teamFlag, styles.placeholderFlag]}>
                        <Text style={styles.placeholderText}>
                          {item.awayTeam.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
              <View style={styles.predictionOddsContainer}>
                <Text style={styles.predictionTypeText}>
                  {getPredictionType(item, selectedCardType)}
                </Text>
                <Text style={styles.predictionText}>
                  {getPredictionValue(item, selectedCardType)}
                </Text>
              </View>
            </View>
            ))
                 ) : (
                   <View style={styles.emptyContainer}>
                     <Text style={styles.emptyText}>Results for today will be loaded soon</Text>
                   </View>
                 )}
        </ScrollView>
        </ScrollView>
        <HamburgerMenu 
          visible={isMenuVisible}
          onClose={() => setIsMenuVisible(false)}
        />
      </ImageBackground>
    </SafeAreaView>
  );
};
const createStyles = (isTablet: boolean, isLargeTablet: boolean) => {
  const getResponsiveValue = (phone: number, tablet: number, largeTablet?: number) => {
    if (isLargeTablet && largeTablet !== undefined) return largeTablet;
    return isTablet ? tablet : phone;
  };
  const cardPadding = getResponsiveValue(10, 16, 20);
  const cardMargin = getResponsiveValue(20, 30, 40);
  const supportFontSize = getResponsiveValue(16, 18, 20);
  const supportEmailFontSize = getResponsiveValue(14, 16, 18);
  const dateFontSize = getResponsiveValue(14, 16, 18);
  const teamFontSize = getResponsiveValue(13, 15, 17);
  const scoreFontSize = getResponsiveValue(16, 18, 20);
  const predictionFontSize = getResponsiveValue(14, 16, 18);
  const leagueFontSize = getResponsiveValue(11, 13, 15);
  const timeFontSize = getResponsiveValue(11, 13, 15);
  const statusFontSize = getResponsiveValue(12, 14, 16);
  const borderRadius = getResponsiveValue(8, 12, 16);
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#101018',
    },
    backgroundImage: {
      flex: 1,
      width: '100%',
      height: '100%',
    },
    scrollContent: {
      paddingTop: 15,
      paddingBottom: 20,
    },
    supportSection: {
      backgroundColor: 'rgba(26, 26, 26, 0.8)',
      marginHorizontal: cardMargin,
      marginBottom: 8,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: borderRadius,
      alignItems: 'center',
    },
    supportText: {
      fontSize: supportFontSize,
      fontWeight: '600',
      color: '#ffffff',
      marginBottom: 4,
    },
    supportDescription: {
      fontSize: supportEmailFontSize,
      fontWeight: '500',
      color: '#A855F7',
      marginTop: 4,
      textAlign: 'center',
    },
    supportEmail: {
      fontSize: supportEmailFontSize - 2,
      fontWeight: '400',
      color: '#cccccc',
      marginTop: 4,
      textAlign: 'center',
      fontStyle: 'normal',
      lineHeight: supportEmailFontSize,
    },
    dateSelectorContainer: {
      backgroundColor: 'rgba(26, 26, 26, 0.9)',
      marginHorizontal: cardMargin,
      marginBottom: 12,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: borderRadius,
    },
    dateButtonsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 8,
    },
    dateButton: {
      flex: 1,
      height: getResponsiveValue(32, 36, 40),
      backgroundColor: 'rgba(85, 85, 85, 0.8)',
      borderRadius: 8,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.3,
      shadowRadius: 3,
      elevation: 3,
    },
    selectedDateButton: {
      backgroundColor: '#A855F7',
      borderColor: '#A855F7',
      shadowColor: '#A855F7',
      shadowOpacity: 0.4,
    },
    dateButtonText: {
      fontSize: getResponsiveValue(12, 14, 16),
      fontWeight: '600',
      color: '#ffffff',
    },
    selectedDateButtonText: {
      color: '#101018',
    },
    tipsContainer: {
      marginHorizontal: 10,
      marginTop: 8,
    },
    tipCard: {
      backgroundColor: '#555555',
      borderRadius: borderRadius,
      padding: cardPadding,
      marginBottom: 10,
      borderWidth: 0,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.3,
      shadowRadius: 3,
      elevation: 3,
    },
    tipHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 6,
    },
    leagueContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#666666',
      paddingVertical: 1,
      paddingHorizontal: 4,
      borderRadius: 3,
    },
    league: {
      fontSize: getResponsiveValue(11, 13, 15),
      fontWeight: '600',
      color: '#ffffff',
      marginLeft: 4,
    },
    leagueFlag: {
      width: getResponsiveValue(16, 18, 20),
      height: getResponsiveValue(12, 14, 16),
      borderRadius: 2,
    },
    time: {
      fontSize: getResponsiveValue(11, 13, 15),
      fontWeight: 'bold',
      color: '#ffffff',
      backgroundColor: '#666666',
      paddingVertical: 1,
      paddingHorizontal: 4,
      borderRadius: 3,
    },
    matchTimeBackground: {
      backgroundColor: '#666666',
      color: '#ffffff',
      paddingVertical: 1,
      paddingHorizontal: 4,
      borderRadius: 3,
    },
    liveTimeBackground: {
      backgroundColor: '#2196F3', 
    },
    htTimeBackground: {
      backgroundColor: '#607D8B', 
    },
    ftTimeBackground: {
      backgroundColor: '#FF5722', 
    },
    matchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 6,
      paddingVertical: 3,
      backgroundColor: '#666666',
      borderRadius: 6,
      paddingHorizontal: 4,
    },
    teamLeftContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-start',
    },
    teamLeft: {
      fontSize: getResponsiveValue(13, 15, 17),
      fontWeight: '600',
      color: '#ffffff',
      flex: 1,
      textAlign: 'left',
      marginLeft: 6,
    },
    flagContainer: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    teamRightContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
    },
    teamRight: {
      fontSize: getResponsiveValue(13, 15, 17),
      fontWeight: '600',
      color: '#ffffff',
      flex: 1,
      textAlign: 'right',
      marginRight: 6,
    },
    predictionOddsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 6,
      backgroundColor: '#666666',
      paddingVertical: 4,
      paddingHorizontal: 6,
      borderRadius: 6,
    },
    predictionText: {
      fontSize: getResponsiveValue(14, 16, 18),
      fontWeight: '600',
      color: '#ffffff',
      backgroundColor: '#f97316',
      paddingVertical: 3,
      paddingHorizontal: 6,
      borderRadius: 4,
      textAlign: 'center',
      borderWidth: 0,
      alignSelf: 'flex-start',
    },
    predictionTypeText: {
      fontSize: getResponsiveValue(12, 14, 16),
      fontWeight: '600',
      color: '#101018',
      backgroundColor: '#A855F7',
      paddingVertical: 3,
      paddingHorizontal: 8,
      borderRadius: 4,
      minWidth: 45,
      textAlign: 'center',
      borderWidth: 0,
    },
    teamFlag: {
      width: getResponsiveValue(24, 28, 32),
      height: getResponsiveValue(24, 28, 32),
      borderRadius: getResponsiveValue(12, 14, 16),
    },
    placeholderFlag: {
      backgroundColor: '#666666',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: '#888888',
    },
    placeholderText: {
      fontSize: getResponsiveValue(12, 14, 16),
      fontWeight: 'bold',
      color: '#ffffff',
    },
    scoreArea: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 8,
      alignSelf: 'center',
    },
    scoreContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(224, 255, 85, 0.2)',
      paddingVertical: 4,
      paddingHorizontal: 8,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: '#A855F7',
    },
    scoreText: {
      fontSize: getResponsiveValue(16, 18, 20),
      fontWeight: 'bold',
      color: '#ffffff',
      minWidth: getResponsiveValue(20, 24, 28),
      textAlign: 'center',
    },
    scoreSeparator: {
      fontSize: getResponsiveValue(16, 18, 20),
      fontWeight: 'bold',
      color: '#A855F7',
      marginHorizontal: 2,
    },
    scoreLabel: {
      fontSize: getResponsiveValue(8, 10, 12),
      fontWeight: '500',
      color: '#cccccc',
      marginTop: 2,
      textAlign: 'center',
    },
    finalScoreContainer: {
      backgroundColor: 'rgba(34, 197, 94, 0.2)',
      borderColor: '#22c55e',
    },
    wonScoreContainer: {
      backgroundColor: 'rgba(34, 197, 94, 0.3)',
      borderColor: '#22c55e',
      borderWidth: 2,
    },
    lostScoreContainer: {
      backgroundColor: 'rgba(239, 68, 68, 0.3)',
      borderColor: '#ef4444',
      borderWidth: 2,
    },
    wonScoreText: {
      color: '#22c55e',
      fontWeight: '900',
    },
    lostScoreText: {
      color: '#ef4444',
      fontWeight: '900',
    },
    wonLabel: {
      color: '#22c55e',
      fontWeight: '600',
    },
    lostLabel: {
      color: '#ef4444',
      fontWeight: '600',
    },
    resultContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 4,
    },
    wonIcon: {
      fontSize: getResponsiveValue(12, 14, 16),
      color: '#22c55e',
      fontWeight: 'bold',
      marginLeft: 4,
    },
    scoreWithoutFrame: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 8,
    },
    upcomingScoreText: {
      color: '#cccccc',
    },
    liveScoreText: {
      color: '#888888',
    },
    scoreIconLabel: {
      fontSize: getResponsiveValue(8, 10, 12),
      fontWeight: '500',
      color: '#cccccc',
      marginTop: 4,
      textAlign: 'center',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 50,
      marginHorizontal: cardMargin,
    },
    emptyText: {
      fontSize: getResponsiveValue(16, 18, 20),
      color: '#A855F7',
      fontWeight: '600',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 50,
      marginHorizontal: cardMargin,
    },
    loadingText: {
      fontSize: getResponsiveValue(16, 18, 20),
      color: '#A855F7',
      fontWeight: '600',
    },
    refreshIndicator: {
      backgroundColor: 'rgba(224, 255, 85, 0.9)',
      paddingVertical: 8,
      paddingHorizontal: 16,
      alignItems: 'center',
      justifyContent: 'center',
      marginHorizontal: cardMargin,
      marginTop: 8,
      borderRadius: borderRadius,
    },
    refreshText: {
      fontSize: getResponsiveValue(12, 14, 16),
      color: '#101018',
      fontWeight: '600',
    },
    timeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    liveIndicator: {
      position: 'relative',
      width: 8,
      height: 8,
    },
    liveIndicatorDot: {
      width: 8,
      height: 8,
      backgroundColor: '#2196F3',
      borderRadius: 4,
      position: 'absolute',
      top: 0,
      left: 0,
    },
  });
};
export default TipsScreen;
