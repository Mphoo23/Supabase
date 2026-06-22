import { Avatar, AvatarFallbackText, AvatarImage } from '@/components/ui/avatar';
import { Box } from '@/components/ui/box';
import { Card } from '@/components/ui/card';
import { Center } from '@/components/ui/center';
import { Heading } from '@/components/ui/heading';
import { HStack } from '@/components/ui/hstack';
import { ScrollView } from '@/components/ui/scroll-view';
import { Spinner } from '@/components/ui/spinner';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { useAuthStore } from '@/store/useAuthStore';
import { useChatStore } from '@/store/useChatStore';
import { useRouter } from 'expo-router';
import { MessageSquareOff } from 'lucide-react-native';
import React, { useCallback, useEffect } from 'react';
import { Pressable, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
export default function MessagesScreen() {
const router = useRouter();
const { session } = useAuthStore();
const { conversations, isLoadingConversations, fetchConversations, subscribeToMessages } = useChatStore();
useEffect(() => {
if (!session?.user?.id) return;
fetchConversations(session.user.id);
const unsubscribe = subscribeToMessages(session.user.id);
return unsubscribe;
}, [session?.user?.id]);
const onRefresh = useCallback(() => {
if (session?.user?.id) fetchConversations(session.user.id);
}, [session?.user?.id]);
const formatTime = (dateString: string) => {
const date = new Date(dateString);
const now = new Date();
const diffMs = now.getTime() - date.getTime();
if (diffMs < 60000) return 'Just now';
if (diffMs < 3600000) return `${Math.floor(diffMs / 60000)}m`;
if (diffMs < 86400000) return `${Math.floor(diffMs / 3600000)}h`;
return date.toLocaleDateString();
};
return (
<SafeAreaView className="flex-1 bg-white dark:bg-black">
<Box className="flex-1">
<VStack space="md" className="p-4 flex-1">
<Heading size="xl">Messages </Heading>
{isLoadingConversations && conversations.length === 0 ? (
<Center className="flex-1"><Spinner size="large" /> </Center>
) : (
<ScrollView
showsVerticalScrollIndicator={false}
refreshControl={<RefreshControl refreshing={isLoadingConversations}
onRefresh={onRefresh}/>}
>
<VStack space="md">
{conversations.map((chat) => (
<Pressable key={chat.partner_id} onPress={() => router.push(`../messages/${chat.partner_id}`)}>
<Card className="p-4 bg-white dark:bg-background-900 shadow-soft-1" variant="elevated">
<HStack space="md" className="items-center">
<Avatar size="md">
<AvatarFallbackText>{chat.partner_name} </AvatarFallbackText>
{chat.partner_avatar && <AvatarImage source={{ uri: chat.partner_avatar }} />}
</Avatar>
<VStack className="flex-1">
<HStack className="justify-between">
<Heading size="sm">{chat.partner_name} </Heading>
<Text size="xs" className="text-typography-500">{formatTime(chat.last_message_at)} </Text>
</HStack>
<HStack className="justify-between items-center">
<Text size="xs" className={`${chat.unread_count > 0 ?
'text-typography-900 font-bold' : 'text-typography-500'} flex-1`} numberOfLines=
{1}>
{chat.last_message}
</Text>
{chat.unread_count > 0 && (
<Box className="bg-primary-600 rounded-full px-2 py-0.5 ml-2">
<Text size="xs" className="text-white font-bold">
{chat.unread_count} </Text>
</Box>
)}
</HStack>
</VStack>
</HStack>
</Card>
</Pressable>
))}
{conversations.length === 0 && (
<Center className="mt-20">
<MessageSquareOff size={48} color="#d1d5db" />
<Text className="text-typography-500 mt-4">No messages yet </Text>
</Center>
)}
</VStack>
</ScrollView>
)}
</VStack>
</Box>
</SafeAreaView>
);
}