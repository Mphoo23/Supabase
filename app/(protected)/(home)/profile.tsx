import { Button, Text, View } from 'react-native';
import { useAuthStore } from '../../../store/useAuthStore';
export default function ProfileScreen() {
const { signOut } = useAuthStore();
return (
<View style={{ flex: 1, padding: 20, justifyContent: 'center', alignItems: 'center' }}>
<Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>ProfileScreen </Text>
<Button title="Log Out" onPress={signOut} color="#EF4444" />
</View>
);
}