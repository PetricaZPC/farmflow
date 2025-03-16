import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import logo from '../../../public/Flow.png';
import { deleteCookie, getCookie } from 'cookies-next';

export default function Navbar({ userEmail, profileData }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [localUserEmail, setLocalUserEmail] = useState(userEmail);
  const dropdownRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      if (!userEmail) {
        const sessionId = getCookie('sessionId');
        if (sessionId) {
          try {
            const response = await fetch('/api/auth/checkAuth', {
              credentials: 'include'
            });
            
            if (response.ok) {
              const data = await response.json();
              if (data.email) {
                setLocalUserEmail(data.email);
                console.log("Found user email from session:", data.email);
              }
            }
          } catch (error) {
            console.error("Error checking session:", error);
          }
        }
      } else {
        setLocalUserEmail(userEmail);
      }
    };
    
    checkSession();
  }, [userEmail]);

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!localUserEmail) return;
      
      try {
        const response = await fetch('/api/profile/userProfile');
        if (response.ok) {
          const data = await response.json();
          setUsername(data.username || localUserEmail.split('@')[0]);
          setProfileImage(data.profileImageUrl);
        }
      } catch (error) {
        console.error('Error fetching profile data:', error);
      }
    };
    
    if (!profileData && localUserEmail) {
      fetchProfileData();
    } else if (profileData && localUserEmail) {
      setUsername(profileData.username || localUserEmail.split('@')[0]);
      setProfileImage(profileData.profileImageUrl);
    }
  }, [localUserEmail, profileData]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownRef]);

  const handleSignOut = async () => {
    try {
      setIsDropdownOpen(false);
      
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
 
      deleteCookie('sessionId', { path: '/' });
      

      setUsername('');
      setProfileImage(null);
      setLocalUserEmail(null);
 
      router.push('/signin');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="bg-white shadow fixed top-0 left-0 right-0 z-10000">
      <div className="px-4 mx-auto max-w-7xl sm:px-6">
        <div className="flex items-center justify-between h-16">

          <div className="flex-shrink-0">
            <Link href="/map" className="flex-shrink-0">
              <Image className="w-auto h-8 sm:h-9" src={logo} alt="FarmFlow" />
            </Link>
          </div>
          
          <div className="flex-grow flex justify-center">
            <div className="hidden md:flex items-baseline space-x-4">
              <Link href="/map" className={`px-3 py-2 text-base font-medium ${router.pathname === '/map' ? 'text-green-600' : 'text-gray-600'} rounded-md hover:text-gray-900 hover:bg-gray-100`}>
                Map
              </Link>
              <Link href="/community" className={`px-3 py-2 text-base font-medium ${router.pathname === '/community' ? 'text-green-600' : 'text-gray-600'} rounded-md hover:text-gray-900 hover:bg-gray-100`}>
                Community
              </Link>
              
            </div>
          </div>
          
          <div className="flex items-center">
            {localUserEmail ? (
              <div className="relative" ref={dropdownRef}>
                <button 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center max-w-xs text-sm bg-white rounded-full focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <span className="sr-only">Open user menu</span>
                  <div className="flex items-center space-x-3"> 
                    <div className="flex-shrink-0 h-8 w-8 overflow-hidden rounded-full bg-gray-200">
                      {profileImage ? (
                        <Image 
                          src={profileImage} 
                          alt={username} 
                          width={32}
                          height={32}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center bg-green-100 text-green-600">
                          <span className="text-sm font-medium">
                            {(username || 'U').charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                    <span className="text-sm font-medium text-gray-700">{username}</span>
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                  </div>
                </button>
                {isDropdownOpen && (
                  <div className="absolute right-0 w-48 py-1 mt-2 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                    <Link href="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      Your Profile
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="block w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/signin" className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700">
                Sign in
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}