import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  ImageBackground,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { usePages, PageContent } from '../hooks/usePages';
import { useResponsive } from '../hooks/useResponsive';
import { ArrowLeftIcon } from '../components/SvgIcons';
import Header from '../components/Header';
import HamburgerMenu from '../components/HamburgerMenu';
type PageContentScreenRouteProp = RouteProp<RootStackParamList, 'PageContent'>;
type PageContentScreenNavigationProp = StackNavigationProp<RootStackParamList, 'PageContent'>;
const PageContentScreen: React.FC = () => {
  const navigation = useNavigation<PageContentScreenNavigationProp>();
  const route = useRoute<PageContentScreenRouteProp>();
  const { pageId } = route.params;
  const { fetchPageContent } = usePages();
  const { isTablet, isLargeTablet, getResponsiveValue } = useResponsive();
  const [content, setContent] = useState<PageContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  useEffect(() => {
    loadPageContent();
  }, [pageId]);
  const loadPageContent = async () => {
    try {
      setLoading(true);
      setError(null);
      const pageContent = await fetchPageContent(pageId);
      if (pageContent) {
        setContent(pageContent);
      } else {
        setError('Failed to load page content');
      }
    } catch (err) {
      setError('Error loading page content');
    } finally {
      setLoading(false);
    }
  };
  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('Home');
    }
  };
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#101018',
    },
    backgroundImage: {
      flex: 1,
      width: '100%',
      height: '100%',
    },
    contentContainer: {
      flex: 1,
      paddingHorizontal: getResponsiveValue(16, 24, 32),
      paddingTop: getResponsiveValue(20, 30, 40),
      paddingBottom: getResponsiveValue(30, 40, 50),
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: getResponsiveValue(16, 24, 32),
      paddingVertical: getResponsiveValue(12, 16, 20),
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    },
    backButton: {
      padding: getResponsiveValue(8, 12, 16),
      marginRight: getResponsiveValue(12, 16, 20),
      borderRadius: getResponsiveValue(8, 12, 16),
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    headerTitle: {
      fontSize: getResponsiveValue(18, 22, 26),
      fontWeight: 'bold',
      color: '#ffffff',
      flex: 1,
    },
    content: {
      flex: 1,
    },
    contentText: {
      fontSize: getResponsiveValue(16, 18, 20),
      lineHeight: getResponsiveValue(24, 28, 32),
      color: '#ffffff',
      textAlign: 'left',
      marginBottom: getResponsiveValue(20, 30, 40),
    },
    footer: {
      marginTop: getResponsiveValue(30, 40, 50),
      paddingTop: getResponsiveValue(20, 30, 40),
      borderTopWidth: 1,
      borderTopColor: 'rgba(255, 255, 255, 0.2)',
    },
    lastUpdatedText: {
      fontSize: getResponsiveValue(12, 14, 16),
      color: '#cccccc',
      fontStyle: 'italic',
      textAlign: 'center',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: getResponsiveValue(20, 30, 40),
    },
    loadingText: {
      marginTop: getResponsiveValue(16, 20, 24),
      fontSize: getResponsiveValue(16, 18, 20),
      color: '#ffffff',
      textAlign: 'center',
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: getResponsiveValue(20, 30, 40),
    },
    errorText: {
      fontSize: getResponsiveValue(16, 18, 20),
      color: '#ff6b6b',
      textAlign: 'center',
      marginBottom: getResponsiveValue(20, 30, 40),
    },
    retryButton: {
      backgroundColor: '#A855F7',
      paddingHorizontal: getResponsiveValue(24, 32, 40),
      paddingVertical: getResponsiveValue(12, 16, 20),
      borderRadius: getResponsiveValue(8, 12, 16),
    },
    retryButtonText: {
      color: '#101018',
      fontWeight: 'bold',
      fontSize: getResponsiveValue(16, 18, 20),
    },
  });
  if (loading) {
    return (
      <ImageBackground
        source={{uri: 'background'}}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <SafeAreaView style={styles.container}>
          <Header 
            title="Loading..." 
            onMenuPress={() => setIsMenuVisible(true)}
            onBackPress={handleBack}
          />
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#A855F7" />
            <Text style={styles.loadingText}>Loading page content...</Text>
          </View>
        </SafeAreaView>
      </ImageBackground>
    );
  }
  if (error) {
    return (
      <ImageBackground
        source={{uri: 'background'}}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <SafeAreaView style={styles.container}>
          <Header 
            title="Error" 
            onMenuPress={() => setIsMenuVisible(true)}
            onBackPress={handleBack}
          />
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={loadPageContent} style={styles.retryButton}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </ImageBackground>
    );
  }
  return (
    <ImageBackground
      source={{uri: 'background'}}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.container}>
        <Header 
          title={content?.title || 'Page'} 
          onMenuPress={() => setIsMenuVisible(true)}
          onBackPress={handleBack}
        />
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.contentContainer}>
            <Text style={styles.contentText}>
              {content?.content || 'No content available.'}
            </Text>
            {content?.lastUpdated && (
              <View style={styles.footer}>
                <Text style={styles.lastUpdatedText}>
                  Last updated: {new Date(content.lastUpdated).toLocaleDateString()}
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
        <HamburgerMenu 
          visible={isMenuVisible} 
          onClose={() => setIsMenuVisible(false)} 
        />
      </SafeAreaView>
    </ImageBackground>
  );
};
export default PageContentScreen;
