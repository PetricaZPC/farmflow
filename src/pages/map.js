import { useState, useEffect } from "react";
import Map from "../../components/Map";
import Navbar from "./components/navbar";
import withAuth from "./api/auth/withAuth";

function MapPage({ userEmail }) {
  const [userCrops, setUserCrops] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCrops = async () => {
      try {
        if (typeof window === "undefined") {
          return;
        }

        const response = await fetch("/api/auth/getCrops", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log("Fetched crops:", data.crops);
        setUserCrops(data.crops);
      } catch (error) {
        console.error("Error fetching crops:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCrops();
  }, []);

  return (
    <div className="pt-16">
      <Navbar userEmail={userEmail} />
      {loading ? (
        <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] bg-gray-50">
          <div className="relative">
            <div className="w-16 h-16 relative">
              <div className="absolute top-0 left-0 w-full h-full">
                <div className="w-16 h-16 border-4 border-green-500 rounded-full animate-ping opacity-25"></div>
              </div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                <div className="w-4 h-4 absolute top-0 left-0 bg-green-500 rounded-full animate-ping opacity-75"></div>
              </div>
              <div className="absolute top-1/2 left-1/2 w-1 bg-green-500 h-6 transform -translate-x-1/2 translate-y-0 rounded-b-full"></div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              Loading Your Farm Map
            </h2>
            <p className="text-gray-500">Preparing your field data...</p>

            <div className="mt-4 flex justify-center space-x-2">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="w-3 h-3 bg-green-500 rounded-full animate-bounce"
                  style={{
                    animationDelay: `${i * 0.15}s`,
                    animationDuration: "0.8s",
                  }}
                ></div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="h-[calc(100vh-4rem)]">
          <Map userEmail={userEmail} userCrops={userCrops} />
        </div>
      )}
    </div>
  );
}

export default withAuth(MapPage);
