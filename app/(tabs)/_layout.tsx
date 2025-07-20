import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from "expo-router";

export default function TabLayout(){
    return(
        <Tabs
          screenOptions={{
            tabBarActiveTintColor: '#54ab41',
            headerStyle: {
                backgroundColor: '#fff',
            },
            headerShadowVisible: false,
            headerShown: false,
            headerTintColor: '#fff',
            tabBarStyle: {
                backgroundColor: '#fff',
            },
          }}
        >
            <Tabs.Screen 
              name="about" 
              options={{ 
                title: 'About',
                tabBarIcon:({color, focused}) => (
                    <Ionicons name={focused ? 'information-circle' : 'information-circle-outline'} color={color} size= {24} />
                ),
              }} 
            />
            <Tabs.Screen 
              name="home" 
              options={{ 
                title: 'Home',
                tabBarIcon:({color, focused}) => (
                    <Ionicons name={focused ? 'home' : 'home-outline'} color={color} size= {24} />
                ),
              }} 
            />
            <Tabs.Screen 
              name="discover" 
              options={{ 
                title: 'Discover',
                tabBarIcon:({color, focused}) => (
                    <Ionicons name={focused ? 'compass' : 'compass'} color={color} size= {24} />
                ),
              }} 
            />
            <Tabs.Screen 
              name="calendar" 
              options={{ 
                title: 'Calendar',
                tabBarIcon:({color, focused}) => (
                    <Ionicons name={focused ? 'calendar' : 'calendar'} color={color} size= {24} />
                ),
              }} 
            />
            <Tabs.Screen 
              name="network" 
              options={{ 
                title: 'Network',
                tabBarIcon:({color, focused}) => (
                    <Ionicons name={focused ? 'git-network-sharp' : 'git-network-sharp'} color={color} size= {24} />
                ),
              }} 
            />
            <Tabs.Screen 
              name="profile" 
              options={{ 
                tabBarIcon:({color, focused}) => (
                    <Ionicons name={focused ? 'person' : 'person-outline'} color={color} size= {24} />
                ),
              }} 
            />
        </Tabs>
    );
}

