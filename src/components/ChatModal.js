import { useState, useEffect, useRef } from 'react';
import { db } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';

export default function ChatModal({ rideId, currentUserId, otherUserName, onClose }) {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef(null);

    // Listen for messages
    useEffect(() => {
        if (!rideId) return;

        const messagesRef = collection(db, 'rides', rideId, 'messages');
        const q = query(messagesRef, orderBy('createdAt', 'asc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setMessages(msgs);
            scrollToBottom();
        }, (error) => {
            console.error('Chat snapshot error:', error);
        });

        return () => unsubscribe();
    }, [rideId]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        try {
            await addDoc(collection(db, 'rides', rideId, 'messages'), {
                text: newMessage,
                senderId: currentUserId,
                createdAt: serverTimestamp(),
            });
            setNewMessage('');
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-end sm:items-center justify-center sm:p-4">
            <div className="bg-white w-full sm:max-w-md h-[80vh] sm:h-[600px] sm:rounded-2xl rounded-t-2xl flex flex-col shadow-2xl animate-slide-up">
                {/* Header */}
                <div className="bg-white border-b p-4 flex items-center justify-between rounded-t-2xl">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                            👤
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900">{otherUserName}</h3>
                            <p className="text-xs text-green-600 flex items-center gap-1">
                                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                Driver
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        ✕
                    </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                    {messages.length === 0 && (
                        <div className="text-center mt-10 space-y-2">
                            <p className="text-4xl">👋</p>
                            <p className="text-gray-500">Ask your driver about your ride</p>
                        </div>
                    )}
                    {messages.map((msg) => {
                        const isMe = msg.senderId === currentUserId;
                        return (
                            <div
                                key={msg.id}
                                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${isMe
                                        ? 'bg-blue-600 text-white rounded-tr-none'
                                        : 'bg-white text-gray-900 shadow-sm border border-gray-100 rounded-tl-none'
                                        }`}
                                >
                                    <p>{msg.text}</p>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <form onSubmit={handleSend} className="p-4 bg-white border-t border-gray-100 pb-8 sm:pb-4">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Message driver..."
                            className="flex-1 px-4 py-3 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                        <button
                            type="submit"
                            disabled={!newMessage.trim()}
                            className="bg-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:hover:bg-blue-600"
                        >
                            ➤
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
