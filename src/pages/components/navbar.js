import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import logo from '../../../public/Field.png';
import { deleteCookie, getCookie } from 'cookies-next';

export default function Navbar({ userEmail, profileData }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setIsDropdownOpen(false);
        setIsMobileMenuOpen(false);
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
      setIsMobileMenuOpen(false);
      
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
    <nav className="bg-white shadow fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/map" className="flex items-center">
              <Image src={logo} alt="FarmFlow" className="h-8 w-auto sm:h-9" />
            </Link>
          </div>

          {/* Desktop nav links */}
          <div className="hidden md:flex space-x-6 items-center">
            <Link href="/map" className={`px-3 py-2 rounded-md text-base font-medium ${router.pathname === '/map' ? 'text-green-600' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}>
              Map
            </Link>
            <Link href="/community" className={`px-3 py-2 rounded-md text-base font-medium ${router.pathname === '/community' ? 'text-green-600' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}>
              Community
            </Link>
            {/* User Profile on desktop */}
            {localUserEmail ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center text-sm bg-white rounded-full focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <span className="sr-only">Open user menu</span>
                  <div className="flex items-center space-x-3 px-3 py-1 border border-gray-300 rounded-full hover:bg-gray-100">
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
                    <span className="text-gray-700 font-medium">{username}</span>
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

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle menu"
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-green-500"
            >
              {!isMobileMenuOpen ? (
                <svg className="block h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown with all options */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white shadow-md border-t border-gray-200">
          <div className="px-4 py-3 space-y-1">
            <Link
              href="/map"
              className={`block px-3 py-2 rounded-md text-base font-medium ${router.pathname === '/map' ? 'text-green-600' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Map
            </Link>
            <Link
              href="/community"
              className={`block px-3 py-2 rounded-md text-base font-medium ${router.pathname === '/community' ? 'text-green-600' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Community
            </Link>
            <hr className="my-2 border-gray-300" />
            {localUserEmail ? (
              <>
                <Link
                  href="/profile"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Your Profile
                </Link>
                <button
                  onClick={handleSignOut}
                  className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                >
                  Sign out
                </button>
              </>
            ) : (
              <Link
                href="/signin"
                className="block px-3 py-2 rounded-md text-base font-medium text-white bg-green-600 hover:bg-green-700"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
