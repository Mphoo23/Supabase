import { supabase } from '@/lib/supabase';
import { create } from 'zustand';
interface Message {
id: string;
sender_id: string;
receiver_id: string;
content: string;
is_read: boolean;
created_at: string;
}
interface Conversation {
partner_id: string;
partner_name: string;
partner_avatar: string | null;
last_message: string;
last_message_at: string;
unread_count: number;
}
interface ChatState {
conversations: Conversation[];
messages: Message[];
isLoadingConversations: boolean;
isLoadingMessages: boolean;
fetchConversations: (userId: string) => Promise<void>;
fetchMessages: (userId: string, partnerId: string) => Promise<void>;
sendMessage: (senderId: string, receiverId: string, content: string) => Promise<
void>;
markAsRead: (userId: string, partnerId: string) => Promise<void>;
subscribeToMessages: (userId: string) => () => void;
addIncomingMessage: (message: Message) => void;
}
export const useChatStore = create<ChatState>((set, get) => ({
conversations: [],
messages: [],
isLoadingConversations: false,
isLoadingMessages: false,
fetchConversations: async (userId: string) => {
set({ isLoadingConversations: true });
const { data: allMessages, error } = await supabase
.from('messages')
.select('*')
.or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
.order('created_at', { ascending: false });
if (error || !allMessages) {
set({ isLoadingConversations: false });
return;
}
const conversationMap = new Map<string, { lastMsg: Message; unreadCount: number }>();
for (const msg of allMessages) {
const partnerId = msg.sender_id = userId ? msg.receiver_id : msg.sender_id;
if (!conversationMap.has(partnerId)) {
conversationMap.set(partnerId, { lastMsg: msg, unreadCount: 0 });
}
if (msg.sender_id = partnerId && !msg.is_read) {
conversationMap.get(partnerId)!.unreadCount ++;
}
}
const partnerIds = Array.from(conversationMap.keys());
const { data: profiles } = await supabase
.from('profiles')
.select('id, full_name, avatar_url')
.in('id', partnerIds);
const profileMap = new Map((profiles || []).map(p => [p.id, p]));
const conversations: Conversation[] = partnerIds.map(partnerId => {
const entry = conversationMap.get(partnerId)!;
const profile = profileMap.get(partnerId);
return {
partner_id: partnerId,
partner_name: profile?.full_name || 'Unknown User',
partner_avatar: profile?.avatar_url || null,
last_message: entry.lastMsg.content,
last_message_at: entry.lastMsg.created_at,
unread_count: entry.unreadCount,
};
});
set({ conversations, isLoadingConversations: false });
},
fetchMessages: async (userId: string, partnerId: string) => {
set({ isLoadingMessages: true });
const { data } = await supabase
.from('messages')
.select('*')
.or(`and(sender_id.eq.${userId},receiver_id.eq.${partnerId}),and(sender_id.e
q.${partnerId},receiver_id.eq.${userId})`)
.order('created_at', { ascending: true });
set({ messages: data || [], isLoadingMessages: false });
},
sendMessage: async (senderId: string, receiverId: string, content: string) => {
const { data } = await supabase
.from('messages')
.insert({ sender_id: senderId, receiver_id: receiverId, content })
.select()
.single();
if (data) set(state => ({ messages: [ ...state.messages, data] }));
},
markAsRead: async (userId: string, partnerId: string) => {
await supabase.from('messages').update({ is_read: true })
.eq('sender_id', partnerId).eq('receiver_id', userId).eq('is_read', false);
},
subscribeToMessages: (userId: string) => {
const channel = supabase.channel('messages-realtime')
.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `receiver_id=eq.${userId}` },
(payload) => get().addIncomingMessage(payload.new as Message)).subscribe();
return () => supabase.removeChannel(channel);
},
addIncomingMessage: (message: Message) => {
set(state => {
const cur = state.messages;
const inCurrent = cur.length > 0 && (cur[0].sender_id === message.sender_id
|| cur[0].receiver_id === message.sender_id);
return { messages: inCurrent ? [ ...cur, message] : cur };
});
},
}));