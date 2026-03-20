import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

const withAuth = (WrappedComponent) => {
    const WithAuth = (props) => {
        const router = useRouter();
        const [isAuthenticated, setIsAuthenticated] = useState(false);
        const [loading, setLoading] = useState(true);
        const [userEmail, setUserEmail] = useState('');
        const [userCrops, setUserCrops] = useState([]);

        useEffect(() => {
            const checkAuthentication = async () => {
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
            return null;
        }

        if (!isAuthenticated) {
            return null;
        }

        return <WrappedComponent {...props} userEmail={userEmail} userCrops={userCrops} />;
    };

    WithAuth.displayName = `WithAuth(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

    return WithAuth;
};

export default withAuth;
