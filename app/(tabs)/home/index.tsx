import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, View } from 'react-native';
import { colors, SIZES } from '@/styles/styles';
import { HomeHeader } from './components/HomeHeader';
import { FloatingButton } from './components/FloatingButton';
import StatsTab from './components/StatsTab';
import ForYouTab from './components/ForYouTab';
import RecommendationsTab from './components/RecommendationsTab';
import FAQTab from './components/FAQTab';

const Tab = createMaterialTopTabNavigator();

export default function HomeScreen() {
  const handleFABPress = () => {
    console.log('FAB pressed - TODO: Add action');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <HomeHeader />

      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: colors.text,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarLabelStyle: {
            fontSize: 15,
            fontWeight: '700',
            textTransform: 'none',
            letterSpacing: 0.2,
          },
          tabBarStyle: {
            backgroundColor: colors.white,
            elevation: 2,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 4,
            borderBottomWidth: 0,
          },
          tabBarIndicatorStyle: {
            backgroundColor: colors.primary,
            height: 4,
            borderRadius: 2,
          },
          tabBarPressColor: colors.primaryLight,
          tabBarScrollEnabled: true,
          tabBarItemStyle: {
            width: 'auto',
            minWidth: 100,
            paddingHorizontal: 20,
          },
        }}
        initialRouteName="Stats"
      >
        <Tab.Screen name="Stats" component={StatsTab} />
        <Tab.Screen name="For You" component={ForYouTab} />
        <Tab.Screen name="Recommendations" component={RecommendationsTab} />
        <Tab.Screen name="FAQ" component={FAQTab} />
      </Tab.Navigator>

      <FloatingButton onPress={handleFABPress} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
});
