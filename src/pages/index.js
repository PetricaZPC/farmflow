import { useState, useEffect } from 'react';
import { getCookie } from 'cookies-next';
import { useRouter } from 'next/router';

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
    <div>
      <div className="w-full lg:h-screen h-full m-auto flex items-center justify-cetner py-20 bg-gray-50 dark:bg-gray-900">
        <div className="w-full h-full flex flex-col justify-center items-center sm:px-4 px-2">
          <div className="lg:w-[90%] w-full mx-auto flex flex-col lg:gap-6 lg:flex-row items-center justify-center ">
            <div className="relative">
              <img className="absolute z-20 lg:left-[2rem] -top-4 left-[1rem] lg:w-[8rem] lg:h-[8rem] sm:w-[6rem] sm:h-[6rem] w-[3rem] h-[3rem] rounded-full" 
                   src="https://images.unsplash.com/photo-1499529112087-3cb3b73cec95?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w0NzEyNjZ8MHwxfHNlYXJjaHwxfHxmYXJtfGVufDB8MHx8fDE3MjA5NDk0NjB8MA&ixlib=rb-4.0.3&q=80&w=1080" 
                   alt="Side Image" />
              <img className="absolute z-20 lg:top-[12rem] sm:top-[11rem] top-[5rem] sm:-left-[3rem] -left-[2rem] lg:w-[8rem] lg:h-[8rem] sm:w-[6rem] sm:h-[6rem] w-[3rem] h-[3rem] rounded-full" 
                   src="https://images.unsplash.com/photo-1500651230702-0e2d8a49d4ad?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w0NzEyNjZ8MHwxfHNlYXJjaHwxMHx8Y3JvcHN8ZW58MHwwfHx8MTcyMDk0OTQ2MHww&ixlib=rb-4.0.3&q=80&w=1080" 
                   alt="Side Image 2" />
              <img className="absolute z-20 lg:top-[23rem] sm:top-[20.5rem] top-[10.5rem] left-[2rem] lg:w-[8rem] lg:h-[8rem] sm:w-[6rem] sm:h-[6rem] w-[3rem] h-[3rem] rounded-full" 
                   src="https://images.unsplash.com/photo-1492496913980-501348b61469?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w0NzEyNjZ8MHwxfHNlYXJjaHwxfHxmYXJtZXJ8ZW58MHwwfHx8MTcyMDk0OTQ2MHww&ixlib=rb-4.0.3&q=80&w=1080" 
                   alt="Side Image 3" />
              <img className="rounded-full relative object-cover right-0 lg:w-[35rem] lg:h-[35rem] sm:w-[28rem] sm:h-[28rem] w-[14rem] h-[14rem] outline sm:outline-offset-[.77em] outline-offset-[.37em] outline-green-500"
                   src="https://images.unsplash.com/photo-1625246333195-78d9c38ad449?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w0NzEyNjZ8MHwxfHNlYXJjaHwxM3x8ZmFybXxlbnwwfDB8fHwxNzIwOTQ5NDYwfDA&ixlib=rb-4.0.3&q=80&w=1080" 
                   alt="About us" />
            </div>
            <div className="lg:w-[60%] p-4 w-full h-full shadow-xl shadow-green-300/40 flex flex-col justify-center items-center sm:px-6 px-4 rounded-xl">
              <h2 className="text-4xl text-center text-green-600 dark:text-green-400 font-bold px-4 py-1 md:mt-0 mt-10">
                About Us
              </h2>
              <p className="md:text-3xl text-2xl text-center text-gray-800 dark:text-gray-200 font-bold my-5">Welcome to FarmFlow</p>
              <p className="md:text-xl sm:text-lg text-base mt-2 text-justify sm:px-2 dark:text-gray-300">
                At FarmFlow, we're revolutionizing agriculture through technology and community. Our platform empowers farmers to maximize their productivity, sustainability, and profitability through intelligent crop management solutions. We combine advanced mapping tools, intuitive crop tracking, and community knowledge-sharing to create a comprehensive farming ecosystem.
              </p>
              <p className="md:text-xl sm:text-lg text-base mt-4 text-justify sm:px-2 dark:text-gray-300">
                Whether you're managing a small family farm or large agricultural operations, FarmFlow provides the digital tools you need to make informed decisions, monitor crop health, and connect with fellow farmers. Our mission is to bring next-level farming practices to everyone, making sustainable agriculture accessible and profitable for all.
              </p>
              <p className="md:text-xl sm:text-lg text-base mt-4 text-justify sm:px-2 dark:text-gray-300">
                Our innovative platform helps you visualize your farmland, plan crop rotations, track growth cycles, and analyze soil conditions—all in one intuitive interface. Connect with fellow farmers to share knowledge, best practices, and support for sustainable agriculture.
              </p>
              <button 
                onClick={() => userEmail ? router.push('/map') : router.push('/signin')}
                className="lg:mt-10 mt-6 lg:px-6 px-4 lg:py-4 py-2 bg-green-600 hover:bg-green-700 transition-colors rounded-md lg:text-xl text-lg text-white font-semibold"
              >
                {userEmail ? 'Go to Dashboard' : 'Join Now'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}