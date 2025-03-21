import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import Navbar from './components/navbar';
import withAuth from './api/auth/withAuth';
import Footer from './components/footer';

function Profile({ userEmail }) {
  const router = useRouter();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [username, setUsername] = useState('');
  const [friendRequests, setFriendRequests] = useState([]);
  const [friends, setFriends] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [cropsCount, setCropsCount] = useState(0);
  const [error, setError] = useState('');
  const [friendEmail, setFriendEmail] = useState('');
  const [sendingRequest, setSendingRequest] = useState(false);
  const [friendMessage, setFriendMessage] = useState(null);
  
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const response = await fetch('/api/profile/userProfile');
        
        if (!response.ok) {
          throw new Error('Failed to fetch profile data');
        }
        
        const data = await response.json();
        setProfileData(data);
        setUsername(data.username || '');
        setCropsCount(Object.keys(data.crops || {}).length);
        setFriendRequests(data.friendRequests || []);
        setFriends(data.friends || []);
      } catch (error) {
        console.error('Error fetching profile:', error);
        setError('Could not load profile data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfileData();
  }, []);
  
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB');
      return;
    }
    
    setError('');
    
    const formData = new FormData();
    formData.append('profileImage', file);
    
    setUploading(true);
    
    try {
      const response = await fetch('/api/profile/uploadImage', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload image');
      }
      
      const data = await response.json();
      
      if (!data || !data.imageUrl) {
        throw new Error('Invalid response from server');
      }
      
      setProfileData(prevData => ({
        ...prevData,
        profileImageUrl: data.imageUrl
      }));
      
      alert('Profile image updated successfully!');
      
    } catch (error) {
      console.error('Error uploading image:', error);
      setError('Failed to upload image: ' + error.message);
    } finally {
      setUploading(false);
    }
  };
  
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/profile/updateProfile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update profile');
      }
      
      setProfileData({
        ...profileData,
        username
      });
      
      setEditMode(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile. Please try again.');
    }
  };
  

  const handleFriendRequest = async (requestId, accepted) => {
    try {
      const requestToRespond = friendRequests.find(req => 
        (req._id && req._id.toString() === requestId.toString()) || 
        req.id === requestId
      );
      
      if (!requestToRespond) {
        console.error('Request not found:', requestId);
        setFriendMessage({
          type: 'error',
          text: 'Could not find the friend request'
        });
        return;
      }
      
      const response = await fetch('/api/profile/acceptRequest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fromEmail: requestToRespond.fromEmail,
          accepted: !!accepted
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to respond to friend request');
      }
      
      const data = await response.json();
      
      setFriendRequests(prevRequests => 
        prevRequests.filter(req => 
          (req._id && req._id.toString() !== requestId.toString()) && 
          req.id !== requestId
        )
      );
      
      if (accepted) {
        const newFriend = {
          _id: requestToRespond.fromUserId || requestId,
          email: requestToRespond.fromEmail,
          username: requestToRespond.fromUsername || requestToRespond.fromEmail.split('@')[0],
          profileImageUrl: requestToRespond.fromProfileImageUrl
        };
        
        setFriends(prevFriends => [...prevFriends, newFriend]);
        setFriendMessage({
          type: 'success',
          text: 'Friend request accepted!'
        });
      } else {
        setFriendMessage({
          type: 'info',
          text: 'Friend request declined'
        });
      }
      
    } catch (error) {
      console.error('Error responding to friend request:', error);
      setFriendMessage({
        type: 'error',
        text: 'Failed to respond to request: ' + error.message
      });
    }
    
    setTimeout(() => {
      setFriendMessage(null);
    }, 3000);
  };

  const handleSendFriendRequest = async (e) => {
    e.preventDefault();
    
    if (!friendEmail) {
      setFriendMessage({
        type: 'error',
        text: 'Please enter an email address'
      });
      return;
    }
    
    if (friendEmail === userEmail) {
      setFriendMessage({
        type: 'error',
        text: 'You cannot send a friend request to yourself'
      });
      return;
    }
    
    const isAlreadyFriend = friends.some(friend => 
      friend.email && friend.email.toLowerCase() === friendEmail.toLowerCase()
    );
    
    if (isAlreadyFriend) {
      setFriendMessage({
        type: 'info',
        text: 'You are already friends with this user'
      });
      return;
    }
    
    setSendingRequest(true);
    
    try {
      const response = await fetch('/api/profile/sendRequest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipientEmail: friendEmail
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        if (data.error) {
          if (data.error.includes('pending') || data.error.includes('already sent')) {
            setFriendMessage({
              type: 'info',
              text: 'Friend request already sent'
            });
          } else {
            setFriendMessage({
              type: 'error',
              text: data.error
            });
          }
        } else {
          setFriendMessage({
            type: 'error',
            text: 'Failed to send friend request'
          });
        }
        setSendingRequest(false);
        return;
      }
      
      setError('');
      
      setFriendMessage({
        type: 'success',
        text: 'Friend request sent successfully!'
      });
      
      setFriendEmail('');
      
    } catch (error) {
      console.error('Error sending friend request:', error);
      
      setFriendMessage({
        type: 'error',
        text: 'An error occurred while sending the request'
      });
    } finally {
      setSendingRequest(false);
      
      setTimeout(() => {
        setFriendMessage(null);
      }, 3000);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col h-screen">
        <Navbar userEmail={userEmail} />
        <div className="flex-grow flex justify-center items-center">
          <div className="text-xl text-gray-600">Loading profile...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-screen">
        <Navbar userEmail={userEmail} />
        <div className="flex-grow flex justify-center items-center">
          <div className="text-xl text-red-600">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar userEmail={userEmail} />
      
      <div className="flex-grow w-full px-4 py-4 md:py-8 md:container md:mx-auto">
        {/* Profile Header Card */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="h-32 md:h-64 bg-gradient-to-r from-green-400 to-blue-500 relative">
            <div className="absolute -bottom-16 left-4 md:left-10">
              <div className="relative h-24 w-24 md:h-32 md:w-32 rounded-full border-4 border-white overflow-hidden bg-gray-200">
                {profileData.profileImageUrl ? (
                  <img
                    src={profileData.profileImageUrl}
                    alt={profileData.username || userEmail}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-green-100 text-green-600">
                    <i className="fa fa-user text-5xl"></i>
                  </div>
                )}
                
                <label className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                  <span className="text-white text-sm">
                    <i className="fa fa-camera mr-1"></i> 
                    {uploading ? 'Uploading...' : 'Change'}
                  </span>
                  <input 
                    type="file" 
                    className="sr-only" 
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploading}
                  />
                </label>
              </div>
            </div>
          </div>
          
          <div className="pt-20 px-4 md:px-6 pb-6">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
              <div className="space-y-2">
                {editMode ? (
                  <form onSubmit={handleUpdateProfile} className="flex flex-col md:flex-row items-start md:items-center gap-2">
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="text-xl md:text-2xl font-bold border-b border-green-500 pb-1 focus:outline-none w-full md:w-auto"
                      placeholder="Your username"
                      maxLength={30}
                    />
                    <div className="flex gap-2 w-full md:w-auto">
                      <button 
                        type="submit" 
                        className="flex-1 md:flex-none bg-green-600 text-white py-2 px-4 rounded-lg text-sm hover:bg-green-700"
                      >
                        Save
                      </button>
                      <button 
                        type="button" 
                        className="flex-1 md:flex-none bg-gray-300 text-gray-700 py-2 px-4 rounded-lg text-sm hover:bg-gray-400"
                        onClick={() => {
                          setEditMode(false);
                          setUsername(profileData.username || '');
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex flex-col md:flex-row items-start md:items-center gap-2">
                    <h1 className="text-xl md:text-2xl font-bold">
                      {profileData.username || 'Unnamed Farmer'}
                    </h1>
                    <button 
                      onClick={() => setEditMode(true)}
                      className="bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded-lg text-sm"
                    >
                      <i className="fa fa-pencil mr-1"></i> Edit
                    </button>
                  </div>
                )}
                <p className="text-gray-600">{userEmail}</p>
                <p className="text-gray-500 text-sm">
                  <i className="fa fa-calendar mr-2"></i>
                  Joined {new Date(profileData.createdAt).toLocaleDateString()}
                </p>
              </div>
              
              <div className="flex gap-6 mt-4 md:mt-0">
                <div className="text-center flex-1 md:flex-none">
                  <div className="text-xl md:text-2xl font-bold">{cropsCount}</div>
                  <div className="text-green-600 text-sm">Crops</div>
                </div>
                <div className="text-center flex-1 md:flex-none">
                  <div className="text-xl md:text-2xl font-bold">{friends.length}</div>
                  <div className="text-blue-600 text-sm">Friends</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Content Grid */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Friends Section */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <div className="bg-white rounded-lg shadow-md p-4">
              <h2 className="text-lg font-bold mb-4 flex items-center">
                <i className="fa fa-users text-green-500 mr-2"></i>
                Friends ({friends.length})
              </h2>
              
              {friendMessage && (
                <div className={`mb-3 p-2 rounded text-sm ${
                  friendMessage.type === 'success' ? 'bg-green-100 text-green-800' : 
                  friendMessage.type === 'error' ? 'bg-red-100 text-red-800' : 
                  'bg-blue-100 text-blue-800'
                }`}>
                  <div className="flex items-center">
                    <i className={`mr-1 ${
                      friendMessage.type === 'success' ? 'fa fa-check-circle' : 
                      friendMessage.type === 'error' ? 'fa fa-exclamation-circle' : 
                      'fa fa-info-circle'
                    }`}></i>
                    {friendMessage.text}
                  </div>
                </div>
              )}
              
              <form onSubmit={handleSendFriendRequest} className="mb-4">
                <div className="flex items-center">
                  <input
                    type="email"
                    value={friendEmail}
                    onChange={(e) => setFriendEmail(e.target.value)}
                    placeholder="Enter friend's email"
                    className="flex-grow p-2 border rounded-l focus:outline-none focus:ring-1 focus:ring-green-500"
                    required
                  />
                  <button
                    type="submit"
                    disabled={sendingRequest}
                    className={`bg-green-500 hover:bg-green-600 text-white p-2 rounded-r ${sendingRequest ? 'opacity-75' : ''}`}
                  >
                    {sendingRequest ? (
                      <span><i className="fa fa-spinner fa-spin mr-1"></i> Sending</span>
                    ) : (
                      <span><i className="fa fa-user-plus mr-1"></i> Add</span>
                    )}
                  </button>
                </div>
                {error && (
                  <p className={`text-sm mt-1 ${error.includes('successfully') ? 'text-green-600' : 'text-red-500'}`}>
                    {error}
                  </p>
                )}
              </form>
              
              {friendRequests.length > 0 && (
                <>
                  <h3 className="font-medium text-gray-700 mb-2 flex items-center">
                    <i className="fa fa-user-plus text-blue-500 mr-2"></i>
                    Pending Requests 
                    <span className="ml-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {friendRequests.length}
                    </span>
                  </h3>
                  <div className="space-y-3 mb-4">
                    {friendRequests.map(request => (
                      <div key={request._id ? request._id.toString() : Math.random()} className="flex items-center justify-between border-b pb-3">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full mr-3 overflow-hidden bg-gray-200">
                            {request.fromProfileImageUrl ? (
                              <img
                                src={request.fromProfileImageUrl}
                                alt={request.fromUsername || request.fromEmail}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center bg-blue-100 text-blue-600">
                                <i className="fa fa-user"></i>
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="font-medium">
                              {request.fromUsername || 
                               (request.fromEmail && request.fromEmail.includes('@') ? request.fromEmail.split('@')[0] : request.fromEmail) || 
                               'Unknown User'}
                            </div>
                            <div className="text-xs text-gray-500">{request.fromEmail}</div>
                          </div>
                        </div>
                        <div className=" flex space-x-2">
                          <button 
                            onClick={() => handleFriendRequest(
                              request._id ? request._id.toString() : request.id,
                              true
                            )}
                            className="bg-green-500 text-white py-1 px-3 rounded-lg text-sm hover:bg-green-600"
                          >
                            ✔
                          </button>
                          <button 
                            onClick={() => handleFriendRequest(
                              request._id ? request._id.toString() : request.id,
                              false
                            )}
                            className="bg-gray-300 text-gray-700 py-1 px-3 rounded-lg text-sm hover:bg-gray-400"
                          >
                            ✖
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
              
              {friends.length > 0 && <div className="border-b mb-4"></div>}
              
              <h3 className="font-medium text-gray-700 mb-2">
                <i className="fa fa-address-book text-green-500 mr-2"></i>
                Your Friends
              </h3>
              
              {friends.length === 0 ? (
                <p className="text-gray-500 text-sm">You haven't added any friends yet</p>
              ) : (
                <div className="space-y-3">
                  {friends.map(friend => (
                    <div key={friend._id} className="flex items-center">
                      <div className="h-10 w-10 rounded-full mr-3 overflow-hidden bg-gray-200">
                        {friend.profileImageUrl ? (
                          <img
                            src={friend.profileImageUrl}
                            alt={friend.username || friend.email}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center bg-green-100 text-green-600">
                            <i className="fa fa-user"></i>
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="font-medium">
                          {friend.username || (friend.email ? friend.email.split('@')[0] : 'User')}
                        </div>
                        <div className="text-xs text-gray-500">{friend.email}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Crops Section */}
          <div className="lg:col-span-2 order-1 lg:order-2">
            <div className="bg-white rounded-lg shadow-md p-4">
              <h2 className="text-lg font-bold mb-4 flex items-center">
                <i className="fa fa-leaf text-green-500 mr-2"></i>
                My Crops
              </h2>
              
              {Object.keys(profileData.crops || {}).length === 0 ? (
                <div className="text-center py-6">
                  <div className="text-gray-400 text-4xl mb-3">
                    <i className="fa fa-seedling"></i>
                  </div>
                  <p className="text-gray-500">You haven't added any crops yet</p>
                  <button 
                    onClick={() => router.push('/map')}
                    className="mt-4 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700"
                  >
                    Add Crops on Map
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(profileData.crops || {}).map(([id, crop]) => (
                    <div key={id} className="border rounded-lg p-3 hover:shadow-md transition-shadow">
                      <div className="font-medium text-green-800">
                        {crop.cropName || 'Unnamed Crop'}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        <i className="fa fa-calendar-o mr-1"></i>
                        Planted: {crop.plantingDate ? new Date(crop.plantingDate).toLocaleDateString() : 'Not set'}
                      </div>
                      <button 
                        onClick={() => router.push('/map')}
                        className="mt-3 text-blue-600 text-sm hover:text-blue-800"
                      >
                        View on Map <i className="fa fa-arrow-right ml-1"></i>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer - moved outside the main content area */}
      <Footer />
    </div>
  );
}

export default withAuth(Profile);
