import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { getCookie } from 'cookies-next';

const withAuth = (WrappedComponent) => {
    return (props) => {
        const router = useRouter();
        const [isAuthenticated, setIsAuthenticated] = useState(false);
        const [loading, setLoading] = useState(true);
        const [userEmail, setUserEmail] = useState('');
        const [userCrops, setUserCrops] = useState([]);

        useEffect(() => {
            const checkAuthentication = async () => {
                const sessionId = getCookie('sessionId');
                if (sessionId) {
                    router.replace('/signin');
                    return;
                }

                try {
                    const response = await fetch('/api/auth/checkAuth', {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        credentials: 'include',
                    });

                    if (response.ok) {
                        const data = await response.json();
                        setUserEmail(data.email);
                        setUserCrops(data.crops || {});
                        setIsAuthenticated(true);
                    } else {
                        router.replace('/signin');
                    }
                } catch (error) {
                    console.error('Error checking authentication:', error);
                    router.replace('/signin');
                } finally {
                    setLoading(false);
                }
            };

            checkAuthentication();
        }, [router]);

        if (loading) {
           return;
        }

        if (!isAuthenticated) {
            return null;
        }

        return <WrappedComponent {...props} userEmail={userEmail} userCrops={userCrops} />;
    };
};

export default withAuth;
