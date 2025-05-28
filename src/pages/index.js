import { useState, useEffect } from 'react';
import { getCookie } from 'cookies-next';
import { useRouter } from 'next/router';
import Image from 'next/image';
import ADR from "../../public/ADR.png";
import MADR from "../../public/MADR.png";
import APIA from "../../public/APIA.png";


export default function Home() {
  const [userEmail, setUserEmail] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const router = useRouter();
  
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const sessionId = getCookie('sessionId');
        if (!sessionId) {
          return;
        }
        
        const sessionResponse = await fetch('/api/auth/checkAuth', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
        });
        
        if (sessionResponse.ok) {
          const sessionData = await sessionResponse.json();
          setUserEmail(sessionData.email);
          
          const profileResponse = await fetch('/api/profile/userProfile');
          if (profileResponse.ok) {
            const profileData = await profileResponse.json();
            setProfileData(profileData);
          }
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
      }
    };
    
    checkAuth();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-green-900">
      <section className="relative">
        <div className="py-12 px-4 mx-auto max-w-screen-xl text-center lg:py-24 lg:px-12 relative z-10">
          {/* Announcement Banner */}
          <div className="inline-flex justify-between items-center py-1 px-1 pr-4 mb-7 text-sm bg-green-600/10 backdrop-blur-sm border border-green-500/20 rounded-full hover:bg-green-600/20 transition-all duration-300 cursor-pointer"
               onClick={() => userEmail ? router.push('/map') : router.push('/signin')}>
            <span className="text-xs bg-green-500 rounded-full text-white px-4 py-1.5 mr-3">New</span>
            <span className="text-sm font-medium text-green-100">
              FarmFlow is out! See what's new
            </span>
            <svg className="ml-2 w-5 h-5 text-green-300" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
            </svg>
          </div>

          {/* Main Heading */}
          <h1 className="mb-8 text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-300 to-green-600 md:text-5xl lg:text-6xl">
            Welcome to FarmFlow
          </h1>

          {/* Description */}
          <p className="mb-12 text-lg font-normal text-green-100/80 lg:text-xl max-w-3xl mx-auto">
            Connect with fellow farmers to share knowledge, best practices, and support for sustainable agriculture.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-16">
            <button 
              onClick={() => userEmail ? router.push('/map') : router.push('/signin')} 
              className="inline-flex items-center px-8 py-3 text-base font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 focus:ring-4 focus:ring-green-500/50 transition-all duration-300 transform hover:scale-105"
            >
              {userEmail ? 'Go to Dashboard' : 'Join Now'}
              <svg className="ml-2 -mr-1 w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd"></path>
              </svg>
            </button>
          </div>

          {/* Partners Section */}
          <div className="px-4 mx-auto text-center md:max-w-screen-md lg:max-w-screen-lg lg:px-36">
            <span className="font-semibold text-green-400 uppercase tracking-wider">Our Partners</span>
            <div className="flex flex-wrap justify-center items-center mt-8 gap-12 sm:justify-between">
              {/* Partner Links */}
              <a href="https://apia.org.ro" className="transform hover:scale-105 transition-all duration-300">
                <Image 
                  src={APIA} 
                  alt="APIA Logo"
                  className="brightness-0 invert opacity-75 hover:opacity-100 transition-all duration-300"
                  width={100}
                  height={50}
                />
              </a>
              <a href="https://www.adr.gov.ro" className="transform hover:scale-105 transition-all duration-300">
                <Image 
                  src={ADR}  
                  alt="ADR Logo"
                  className="brightness-0 invert opacity-75 hover:opacity-100 transition-all duration-300"
                  width={150}
                  height={75}
                />
              </a>
              <a href="https://madr.ro/organizare/institutii-in-subordine.html" className="transform hover:scale-105 transition-all duration-300">
                <Image 
                  src={MADR} 
                  alt="MADR Logo"
                  className="brightness-0 invert opacity-75 hover:opacity-100 transition-all duration-300"
                  width={75}
                  height={37}
                />
              </a>
            </div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(34,197,94,0.1),transparent_50%)] z-0"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(34,197,94,0.15),transparent_50%)] z-0"></div>
      </section>
    </div>
  );
}