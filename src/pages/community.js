import { useState, useEffect, useRef } from 'react';
import Navbar from './components/navbar';
import withAuth from './api/auth/withAuth';
import io from 'socket.io-client';
import 'leaflet/dist/leaflet.css';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';

const MapContainer = dynamic(() => import('react-leaflet').then((mod) => mod.MapContainer), {
    ssr: false,
});

const TileLayer = dynamic(() => import('react-leaflet').then((mod) => mod.TileLayer), {
    ssr: false,
});

const Marker = dynamic(() => import('react-leaflet').then((mod) => mod.Marker), {
    ssr: false,
});

const Popup = dynamic(() => import('react-leaflet').then((mod) => mod.Popup), {
    ssr: false,
});

const LeafletCSS = dynamic(() => import('leaflet/dist/leaflet.css'), { ssr: false });

function Community({ userEmail }) {
    const router = useRouter();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [friends, setFriends] = useState([]);
    const [selectedImage, setSelectedImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const messagesEndRef = useRef(null);
    const chatContainerRef = useRef(null); 
    const fileInputRef = useRef(null); 
    const [socket, setSocket] = useState(null);
    const [messageReactions, setMessageReactions] = useState({});
    const [replyingTo, setReplyingTo] = useState(null);
    const [replies, setReplies] = useState({});
    const [mapLocation, setMapLocation] = useState(null);
    const [showMapPreview, setShowMapPreview] = useState(false);
    const [userLikedMessages, setUserLikedMessages] = useState(new Set());
    const [showScrollButton, setShowScrollButton] = useState(false);
    const [newMessageAlert, setNewMessageAlert] = useState(false);

    const fetchMessages = async (showLoading = true) => {
        if (showLoading) {
            setLoading(true);
        }
        
        try {
            const response = await fetch('/api/messages/getMessages', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            
            if (data && Array.isArray(data.messages)) {
                setMessages(data.messages);
                const likedMessageIds = new Set();
                data.messages.forEach(message => {
                    if (message.reactedUsers && 
                        message.reactedUsers.like && 
                        message.reactedUsers.like.includes(userEmail)) {
                        likedMessageIds.add(message._id);
                    }
                });
                setUserLikedMessages(likedMessageIds);
            } else {
                console.warn("Unexpected response format:", data);
                setMessages([]);
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
            setMessages([]); 
        } finally {
            if (showLoading) {
                setLoading(false);
            }
        }
    };

    const fetchFriends = async () => {
        try {
            const response = await fetch('/api/profile/getFriends', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            setFriends(data.friends || []);
        } catch (error) {
            console.error('Error fetching friends:', error);
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        if (file.size > 5 * 1024 * 1024) {
            alert('Image size should be less than 5MB');
            return;
        }
        
        setSelectedImage(file);
        
        const reader = new FileReader();
        reader.onload = () => {
            setImagePreview(reader.result);
        };
        reader.readAsDataURL(file);
    };

    const postMessage = async (e) => {
        e.preventDefault();
        
        if (!newMessage.trim() && !selectedImage) return;

        try {
            const formData = new FormData();
            formData.append('content', newMessage);
            formData.append('userEmail', userEmail);
            
            if (selectedImage) {
                formData.append('image', selectedImage);
            }

            if (mapLocation) {
                formData.append('locationData', JSON.stringify(mapLocation));
            }

            const response = await fetch('/api/messages/postMessage', {
                method: 'POST',
                body: formData, 
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            socket.emit('postMessage', data.message);

            setNewMessage('');
            setSelectedImage(null);
            setImagePreview(null);
            setMapLocation(null);
            setShowMapPreview(false);
            
            fetchMessages(false);
        } catch (error) {
            console.error('Error posting message:', error);
            alert('Failed to post message. Please try again.');
        }
    };
    
    const scrollToBottom = (behavior = 'smooth') => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
            setNewMessageAlert(false);
        }
    };
    
    const handleScroll = () => {
        if (chatContainerRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
            const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
            setShowScrollButton(!isNearBottom);
            
            if (isNearBottom) {
                setNewMessageAlert(false);
            }
        }
    };

    useEffect(() => {
        if (chatContainerRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
            const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
            
            if (isAtBottom) {
                scrollToBottom();
            } else {
                setNewMessageAlert(true);
            }
        }
    }, [messages]);
        
    useEffect(() => {
        fetchFriends(); 
        fetchMessages();
        
        const intervalId = setInterval(() => {
            fetchMessages(false); 
        }, 3000);
        
        return () => clearInterval(intervalId);
    }, []);

    useEffect(() => {
        const newSocket = io({
            path: '/api/socketio',
        });
        setSocket(newSocket);

        newSocket.on('newMessage', (message) => {
            setMessages(prevMessages => [...prevMessages, message]);
            
            if (chatContainerRef.current) {
                const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
                if (scrollHeight - scrollTop - clientHeight > 100) {
                    setNewMessageAlert(true);
                }
            }
        });

        return () => {
            newSocket.off('newMessage');
            newSocket.disconnect();
        };
    }, []);

    useEffect(() => {
        const chatContainer = chatContainerRef.current;
        if (chatContainer) {
            chatContainer.addEventListener('scroll', handleScroll);
            
            handleScroll();
        }
        
        return () => {
            if (chatContainer) {
                chatContainer.removeEventListener('scroll', handleScroll);
            }
        };
    }, []);

    const attachMapLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const locationData = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                    };
                    setMapLocation(locationData);
                    setShowMapPreview(true);
                    setNewMessage(prevMessage => {
                        const locationText = `Location: ${locationData.latitude}, ${locationData.longitude}`;
                        return prevMessage ? `${prevMessage}\n${locationText}` : locationText;
                    });
                },
                (error) => {
                    console.error("Error getting location:", error);
                    alert("Could not get location. Please ensure location services are enabled.");
                }
            );
        } else {
            alert("Geolocation is not supported by this browser.");
        }
    };

    const handleReaction = async (messageId, reaction) => {
        try {
            const isLiked = userLikedMessages.has(messageId);
            
            
            setUserLikedMessages(prevLiked => {
                const newLiked = new Set([...prevLiked]);
                if (isLiked) {
                    newLiked.delete(messageId);
                } else {
                    newLiked.add(messageId);
                }
                return newLiked;
            });
            
            setMessageReactions(prevReactions => {
                const currentLikes = (prevReactions[messageId]?.like || 0);
                const updatedLikes = isLiked ? Math.max(0, currentLikes - 1) : currentLikes + 1;
                
                return {
                    ...prevReactions,
                    [messageId]: { 
                        ...prevReactions[messageId],
                        like: updatedLikes 
                    }
                };
            });

            console.log("Sending reaction:", { messageId, reaction, action: isLiked ? 'unlike' : 'like', userEmail });

            const response = await fetch('/api/messages/react', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    messageId, 
                    reaction,
                    action: isLiked ? 'unlike' : 'like', 
                    userEmail 
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`API error (${response.status}):`, errorText);
                throw new Error(`HTTP error! Status: ${response.status}, Details: ${errorText}`);
            }

            const data = await response.json();
            console.log("API response:", data);
            
            setMessageReactions(prevReactions => ({
                ...prevReactions,
                [messageId]: data.reactions,
            }));
        } catch (error) {
            console.error('Error toggling reaction:', error);
            alert(`Failed to update reaction: ${error.message}`);
            
            setUserLikedMessages(prevLiked => {
                const newLiked = new Set([...prevLiked]);
                if (newLiked.has(messageId)) {
                    newLiked.delete(messageId);
                } else {
                    newLiked.add(messageId);
                }
                return newLiked;
            });
            
            
            setMessageReactions(prevReactions => {
                const currentLikes = (prevReactions[messageId]?.like || 0);
                const updatedLikes = !isLiked ? Math.max(0, currentLikes - 1) : currentLikes + 1;
                
                return {
                    ...prevReactions,
                    [messageId]: { 
                        ...prevReactions[messageId],
                        like: updatedLikes 
                    }
                };
            });
        }
    };

    const postReply = async (messageId, replyText) => {
        try {
            const response = await fetch('/api/messages/postReply', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ messageId, content: replyText, userEmail }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            setReplies(prevReplies => ({
                ...prevReplies,
                [messageId]: [...(prevReplies[messageId] || []), data.reply],
            }));
            setReplyingTo(null); 
        } catch (error) {
            console.error('Error posting reply:', error);
            alert('Failed to post reply. Please try again.');
        }
    };

    const linkify = (text) => {
        const hashtagRegex = /(#\w+)/g;
        const mentionRegex = /(@\w+)/g;

        const hashtagReplacedText = text.replace(hashtagRegex, (match) => {
            const hashtag = match.slice(1);
            return `<a href="/search?q=${hashtag}" class="text-blue-500">${match}</a>`;
        });

        const mentionReplacedText = hashtagReplacedText.replace(mentionRegex, (match) => {
            const username = match.slice(1);
            return `<a href="/profile/${username}" class="text-green-500">${match}</a>`;
        });

        return mentionReplacedText;
    };

    return (
        <div className="flex flex-col h-screen">
            <Navbar userEmail={userEmail} />
            
            <div className="flex-grow flex justify-center overflow-hidden">
                <div className="w-full max-w-2xl border-x bg-gray-50 flex flex-col">
                    <nav className="flex py-4 px-4 border-b bg-white items-center justify-between z-10">
                        <h1 className="font-extrabold tracking-wide text-lg">Farmers' Chat</h1>
                        <div className="text-green-600">
                            <i className="fa fa-leaf"></i>
                        </div>
                    </nav>
                    
                    {friends.length === 0 && (
                        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4">
                            <p className="font-bold">You don't have any friends yet!</p>
                            <p>Add friends in your profile to start chatting.</p>
                            <button 
                                onClick={() => router.push('/profile')}
                                className="mt-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
                            >
                                <i className="fa fa-user-plus mr-2"></i>
                                Go to Profile
                            </button>
                        </div>
                    )}
                    
                    <div 
                        ref={chatContainerRef}
                        className="flex-grow overflow-y-auto relative"
                        style={{ scrollBehavior: 'smooth' }}
                        onScroll={handleScroll}
                    >
                        {loading ? (
                            <div className="flex justify-center items-center h-32">
                                <p>Loading conversation...</p>
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="flex justify-center items-center h-32">
                                <p className="text-gray-500">No messages yet. Start the conversation!</p>
                            </div>
                        ) : (
                            <div className="pb-4">
                                {messages.map((message, index) => (
                                    <div key={message._id || index} className="mt-4">
                                        <div className="py-2 px-5 bg-white">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-3">
                                                    <div className="rounded-full h-12 w-12 overflow-hidden bg-green-100">
                                                        {message.authorDetails?.profileImageUrl ? (
                                                            <img 
                                                                src={message.authorDetails.profileImageUrl}
                                                                alt={message.authorDetails?.username || message.authorEmail}
                                                                className="h-full w-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="h-full w-full flex items-center justify-center text-green-600">
                                                                <i className="fa fa-user"></i>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <h1 className="font-bold">
                                                            {message.authorDetails?.username || message.authorEmail}
                                                        </h1>
                                                        <p className="text-gray-500 text-sm">
                                                            {new Date(message.timestamp).toLocaleString()}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="mt-2 ml-14">
                                                {message.imageUrl && (
                                                    <div className="mb-3">
                                                        <img 
                                                            src={message.imageUrl} 
                                                            alt="Crop image" 
                                                            className="rounded-lg max-h-64 object-contain"
                                                        />
                                                    </div>
                                                )}
                                                <p className="text-gray-800" dangerouslySetInnerHTML={{ __html: linkify(message.content) }} />
                                                
                                                
                                                {message.location && (
                                                    <div className="mt-2">
                                                        <MapContainer center={[message.location.latitude, message.location.longitude]} zoom={13} style={{ height: '200px', width: '100%' }}>
                                                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                                            <Marker position={[message.location.latitude, message.location.longitude]}>
                                                                <Popup>Shared Location</Popup>
                                                            </Marker>
                                                        </MapContainer>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex mt-2 space-x-10 text-gray-500 justify-start ml-14">
                                                <button 
                                                    onClick={() => handleReaction(message._id, 'like')} 
                                                    className={`flex items-center ${userLikedMessages.has(message._id) ? 'text-blue-500' : 'text-gray-500'}`}
                                                >
                                                    <svg 
                                                        xmlns="http://www.w3.org/2000/svg" 
                                                        className="h-5 w-5 mr-1" 
                                                        fill={userLikedMessages.has(message._id) ? "currentColor" : "none"}
                                                        viewBox="0 0 24 24" 
                                                        stroke="currentColor"
                                                    >
                                                        <path 
                                                            strokeLinecap="round" 
                                                            strokeLinejoin="round" 
                                                            strokeWidth={2} 
                                                            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" 
                                                        />
                                                    </svg>
                                                    <span>Like</span>
                                                </button>
                                                <button onClick={() => setReplyingTo(message._id)} className="flex items-center">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                                                    </svg>
                                                    <span>Reply</span>
                                                </button>
                                                
                                                {messageReactions[message._id] && messageReactions[message._id].like > 0 && (
                                                    <div className="flex items-center">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 text-blue-500" fill="currentColor" viewBox="0 0 24 24" stroke="none">
                                                            <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                                        </svg>
                                                        <span>{messageReactions[message._id].like}</span>
                                                    </div>
                                                )}
                                            </div>
                                            {replyingTo === message._id && (
                                                <div className="mt-2 ml-14">
                                                    <input
                                                        type="text"
                                                        placeholder="Write a reply..."
                                                        className="w-full p-2 border rounded"
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                postReply(message._id, e.target.value);
                                                                e.target.value = ''; 
                                                            }
                                                        }}
                                                    />
                                                </div>
                                            )}
                                            {replies[message._id] && (
                                                <div className="ml-14 mt-2">
                                                    {replies[message._id].map((reply, i) => (
                                                        <div key={i} className="py-1 px-3 bg-gray-100 rounded mt-1">
                                                            <p className="text-sm">{reply.content}</p>
                                                            <p className="text-xs text-gray-500">
                                                                By: {reply.authorEmail} - {new Date(reply.timestamp).toLocaleString()}
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        
                        {(showScrollButton || newMessageAlert) && (
                            <button
                                onClick={() => scrollToBottom()}
                                className={`fixed bottom-20 left-1/2 transform -translate-x-1/2 rounded-full p-2 w-10 h-10 shadow-lg flex items-center justify-center ${
                                    newMessageAlert ? 'bg-blue-500 text-white' : 'bg-white text-gray-600'
                                } transition-all hover:bg-blue-600 hover:text-white z-50`}
                                aria-label="Scroll to bottom"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L10 15.586l5.293-5.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                {newMessageAlert && (
                                    <span className="absolute -top-1 -right-1 bg-red-500 rounded-full w-3 h-3"></span>
                                )}
                            </button>
                        )}
                    </div>
                    
                    <div className="py-4 px-4 bg-white border-t">
                        <form onSubmit={postMessage} className="space-y-3">
                            {imagePreview && (
                                <div className="relative inline-block">
                                    <img 
                                        src={imagePreview} 
                                        alt="Preview" 
                                        className="h-24 object-cover rounded-lg mr-2" 
                                    />
                                    <button 
                                        type="button"
                                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                                        onClick={() => {
                                            setSelectedImage(null);
                                            setImagePreview(null);
                                        }}
                                    >
                                        &times;
                                    </button>
                                </div>
                            )}
                            
                            {showMapPreview && mapLocation && (
                                <div className="mb-3 relative">
                                    <div className="flex justify-between items-center mb-1">
                                        <p className="font-medium">Location Preview:</p>
                                        <button 
                                            type="button"
                                            className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                                            onClick={() => {
                                                setMapLocation(null);
                                                setShowMapPreview(false);
                                                setNewMessage(prev => prev.replace(/Location: .*?, .*?(\n|$)/g, ''));
                                            }}
                                        >
                                            &times;
                                        </button>
                                    </div>
                                    <MapContainer center={[mapLocation.latitude, mapLocation.longitude]} zoom={13} style={{ height: '200px', width: '100%' }}>
                                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                        <Marker position={[mapLocation.latitude, mapLocation.longitude]}>
                                            <Popup>Your Location</Popup>
                                        </Marker>
                                    </MapContainer>
                                </div>
                            )}
                            
                            <div className="flex">
                                <div className="flex-1 flex">
                                    <button 
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-l-lg flex items-center justify-center"
                                        title="Add Image"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleImageChange}
                                            className="hidden"
                                            accept="image/*"
                                        />
                                    </button>
                                    
                                    <button
                                        type="button"
                                        onClick={attachMapLocation}
                                        className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 flex items-center justify-center"
                                        title="Share Location"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                    </button>
                                    
                                    <textarea
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        className="flex-1 p-3 border rounded"
                                        placeholder="Share farming tips or ask questions..."
                                    />
                                </div>
                                
                                <button 
                                    type="submit"
                                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-r-lg flex items-center justify-center"
                                    disabled={friends.length === 0}
                                    title="Send Message"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                    </svg>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default withAuth(Community);