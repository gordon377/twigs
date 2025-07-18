import { StyleSheet, Text, View, ScrollView, Button } from 'react-native';
import { useRouter } from 'expo-router';
import { settingStyles } from '@/styles/styles';
import { DrawerHeader } from '@/components/Drawer';
import { useState } from 'react';
import CustomInput from '@/components/TextInput';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProfile } from '@/contexts/ProfileContext';

export default function EditPersonalInfoScreen() {
    const router = useRouter();
    const { profileData } = useProfile();
    const [editProfileFields, setEditProfileFields] = useState({
        phoneNum: '',
    });
    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#25292e' }}>
            <View style={settingStyles.settingsDrawer}>
                <DrawerHeader title="Edit Profile" onBack={() => router.back()} />
                <ScrollView style={settingStyles.settingsContent} contentContainerStyle={{ padding: 20 }}>
                    <Text style={styles.infoLabel}>Phone Number:</Text>
                    <CustomInput
                        value={editProfileFields.phoneNum}
                        onChangeText={phoneNum => {
                            // Only update if the value is numeric or empty
                            if (!isNaN(Number(phoneNum)) || phoneNum === "") {
                                setEditProfileFields(prev => ({ ...prev, phoneNum }));
                            }
                        }}
                        keyboardType="phone-pad"
                        placeholder={profileData?.data?.phoneNumber || 'Enter new phone number'}
                    />
                    <Button
                        title="Save Changes"
                        onPress={() => {
                            alert('Save changes pressed');
                        }}
                        color="#ffd33d"
                    />
                </ScrollView>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    infoLabel: {
        color: '#fff',
        fontWeight: 'bold',
        marginBottom: 4,
    },
    infoText: {
        color: '#fff',
    },
});