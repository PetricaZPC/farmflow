import { useState, useEffect } from 'react';
import { getCookie } from 'cookies-next';
import { useRouter } from 'next/router';
// import Footer from '../../components/footer';
import Footer from './components/footer';
import ADR from "../../public/ADR.png";
import MADR from "../../public/MADR.png";
import APIA from "../../public/APIA.png";
import Image from 'next/image';


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
    <section className="bg-gray-900">
      <div className="py-8 px-4 mx-auto max-w-screen-xl text-center lg:py-16 lg:px-12">
        <div className="inline-flex justify-between items-center py-1 px-1 pr-4 mb-7 text-sm text-white bg-gray-800 rounded-full hover:bg-gray-700">
          <span className="text-xs bg-primary-600 rounded-full text-white px-4 py-1.5 mr-3">New</span>
          <span onClick={() => userEmail ? router.push('/map') : router.push('/signin')} className="text-sm font-medium">
            FarmFlow is out! See what's new
          </span>
          <svg className="ml-2 w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
          </svg>
        </div>
        
        <h1 className="mb-4 text-4xl font-extrabold tracking-tight leading-none text-white md:text-5xl lg:text-6xl">
          Welcome to FarmFlow
        </h1>
        
        <p className="mb-8 text-lg font-normal text-gray-400 lg:text-xl sm:px-16 xl:px-48">
          Connect with fellow farmers to share knowledge, best practices, and support for sustainable agriculture.
        </p>
        
        <div className="flex flex-col mb-8 lg:mb-16 space-y-4 sm:flex-row sm:justify-center sm:space-y-0 sm:space-x-4">
          <button 
            onClick={() => userEmail ? router.push('/map') : router.push('/signin')} 
            className="inline-flex justify-center items-center py-3 px-5 text-base font-medium text-center text-white rounded-lg bg-primary-700 hover:bg-primary-800 focus:ring-4 focus:ring-primary-300"
          >
            {userEmail ? 'Go to Dashboard' : 'Join Now'}
            <svg className="ml-2 -mr-1 w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd"></path>
            </svg>
          </button>   
        </div>
        
        <div className="px-4 mx-auto text-center md:max-w-screen-md lg:max-w-screen-lg lg:px-36">
          <span className="font-semibold text-gray-400 uppercase">Our Partners</span>
          <div className="flex flex-wrap justify-center items-center mt-8 text-gray-400 sm:justify-between">
            {/* Partner images remain the same */}
            <div className="flex items-center">
              <a href="https://apia.org.ro">
                <Image 
                  src={APIA} 
                  alt="APIA Logo"
                  className="mr-5 mb-5 lg:mb-0 grayscale hover:grayscale-0 transition-all duration-300"
                  width={100}
                  height={50}
                />
              </a>
            </div>
            <div className="flex items-center">
              <a href="https://www.adr.gov.ro">
            <Image 
                src={ADR}  
                alt="ADR Logo"
                className=" mr-5 mb-5 lg:mb-0 grayscale hover:grayscale-0 transition-all duration-300"
                width={150}
              />
              </a>
            </div>
           
            <div className="flex items-center">
               <a href="https://madr.ro/organizare/institutii-in-subordine.html">
            <Image 
                src={MADR} 
                alt="MADR Logo"
                className=" mr-5 mb-5 lg:mb-0 grayscale hover:grayscale-0 transition-all duration-300"
                width={75}
              /> 
              </a>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </section>
  );
}