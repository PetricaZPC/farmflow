import "@/styles/globals.css";
import { installDemoFetch } from "@/lib/demoClient";

// Must run before any page effect fetches data, so it is done at module load (browser only).
installDemoFetch();

export default function App({ Component, pageProps }) {
  return <Component {...pageProps} />;
}
