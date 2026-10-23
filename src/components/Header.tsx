import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { BackArrowIcon } from './SvgIcons';
interface HeaderProps {
  title: string;
  onBackPress: () => void;
  onMenuPress: () => void;
  showBackButton?: boolean;
  showMenuButton?: boolean;
  rightButton?: {
    icon: string;
    onPress: () => void;
    title: string;
  };
}
const Header: React.FC<HeaderProps> = ({
  title,
  onBackPress,
  onMenuPress,
  showBackButton = true,
  showMenuButton = true,
  rightButton,
}) => {
  return (
    <View style={styles.header}>
      {showBackButton ? (
        <TouchableOpacity style={styles.backButton} onPress={onBackPress}>
          <BackArrowIcon width={20} height={20} color="#ffffff" />
        </TouchableOpacity>
      ) : (
        <View style={styles.backButton} />
      )}
      <Text style={styles.title}>{title}</Text>
      <View style={styles.rightButtons}>
        {rightButton ? (
          <TouchableOpacity style={styles.rightButton} onPress={rightButton.onPress}>
            <Text style={styles.rightButtonText}>🔄</Text>
          </TouchableOpacity>
        ) : null}
        {showMenuButton ? (
          <TouchableOpacity style={styles.menuButton} onPress={onMenuPress}>
            <Text style={styles.menuIcon}>☰</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.menuButton} />
        )}
      </View>
    </View>
  );
};
const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 30,
    backgroundColor: '#101018',
    borderBottomWidth: 1,
    borderBottomColor: '#342640',
    marginBottom: 0,
    marginTop: 0,
  },
  backButton: {
    padding: 12,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 18,
    color: '#ffffff',
    fontWeight: '900',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    flex: 1,
    textAlign: 'center',
  },
  menuButton: {
    padding: 12,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuIcon: {
    fontSize: 20,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  rightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rightButton: {
    padding: 12,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  rightButtonText: {
    fontSize: 18,
    color: '#ffffff',
    fontWeight: 'bold',
  },
});
export default Header;
