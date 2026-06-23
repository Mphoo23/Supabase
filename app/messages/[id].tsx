import { Box } from '@/components/ui/box';
import { Button, ButtonIcon } from '@/components/ui/button';
import { Center } from '@/components/ui/center';
import { Heading } from '@/components/ui/heading';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Input, InputField } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { useChatStore } from '@/store/useChatStore';
import { useHeaderHeight } from '@react-navigation/elements';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowUp, ChevronLeft } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
export default function ChatScreen() {
const router = useRouter();
const { id: otherUserId } = useLocalSearchParams<{ id: string }>();
const { session } = useAuthStore();
const { messages, isLoadingMessages, fetchMessages, sendMessage, markAsRead, subscribeToMessages } = useChatStore();
const [inputText, setInputText] = useState('');
const [partnerName, setPartnerName] = useState('Chat');
const flatListRef = useRef<FlatList>(null);
const headerHeight = useHeaderHeight();
useEffect(() => {
if (!otherUserId) return;
const getPartner = async () => {
const { data } = await supabase.from('profiles').select('full_name').eq('id', otherUserId).single();
if (data?.full_name) setPartnerName(data.full_name);
};
getPartner();
}, [otherUserId]);
useEffect(() => {
if (session?.user?.id && otherUserId) {
fetchMessages(session.user.id, otherUserId);
markAsRead(session.user.id, otherUserId);
const unsubscribe = subscribeToMessages(session.user.id);
return unsubscribe;
}
}, [session?.user?.id, otherUserId]);
useEffect(() => {
if (messages.length > 0) {
setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
}
}, [messages.length]);
const handleSend = async () => {
if (!inputText.trim() || !session?.user?.id || !otherUserId) return;
const content = inputText.trim();
setInputText('');
await sendMessage(session.user.id, otherUserId, content);
};
return (
<SafeAreaView className="flex-1 bg-white dark:bg-black" edges={['top']}>
<KeyboardAvoidingView
style={{ flex: 1 }}
behavior={Platform.OS === 'ios' ? 'padding' : undefined}
keyboardVerticalOffset={Platform.OS === 'ios' ? headerHeight : 0}
>
<HStack space="md" className="p-4 items-center border-b border-outline-50
bg-white dark:bg-black">
<Pressable onPress={() => router.back()}>
<Icon as={ChevronLeft} size="xl" />
</Pressable>
<Heading size="md">{partnerName} </Heading>
</HStack>
<Box className="flex-1">
{isLoadingMessages && messages.length === 0 ? (
<Center className="flex-1"><Spinner/> </Center>
) : (
<FlatList
ref={flatListRef}
data={messages}
keyExtractor={(item) => item.id}
contentContainerStyle={{ padding: 16 }}
renderItem={({ item }) => {
const isMine = item.sender_id === session?.user?.id;
return (
<VStack className={`mb-4 max-w-[80%] ${isMine ? 'self-end' : 'self-start'}`}>
<Box className={`p-3 rounded-2xl ${isMine ? 'bg-primary-600 rounded-br-sm' : 'bg-background-100 rounded-bl-sm'}`}>
<Text className={isMine ? 'text-white' : 'text-typography-900'}>{item.content} </Text>
</Box>
<Text size="xs" className={`mt-1 text-typography-500 ${isMine ? 'text-right' : 'text-left'}`}>
{new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
</Text>
</VStack>
);
}}
onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}/>
)}
</Box>
<Box className="p-4 border-t border-outline-50 bg-white dark:bg-black">
<HStack space="md" className="items-center">
<Input className="flex-1 rounded-full bg-background-50 px-2" size="md">
<InputField
placeholder="Type a message ."
value={inputText}
onChangeText={setInputText}
multiline
/>
</Input>
<Button size="md" variant="solid" action="primary" className="roundedfull w-10 h-10 p-0" onPress={handleSend} disabled={!inputText.trim()}>
<ButtonIcon as={ArrowUp} />
</Button>
</HStack>
</Box>
</KeyboardAvoidingView>
</SafeAreaView>
);
}