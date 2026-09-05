import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AuthModal, Footer, Nav, Toasts } from "./components/chrome";
import { parseRoute, useRoute } from "./lib/hooks";
import { useStore } from "./store";
import Admin from "./pages/Admin";
import ChannelPage from "./pages/Channel";
import Dashboard from "./pages/Dashboard";
import Home from "./pages/Home";

export default function App() {
  const route = useRoute();
  const { page, param } = parseRoute(route);
  const tick = useStore((s) => s.tick);
  const boot = useStore((s) => s.boot);

  useEffect(() => {
    boot();
    // Realtime engine: in production these deltas arrive over socket.io
    // (viewer-count broadcasts, go-live events). Here a 2s tick drives them.
    const iv = setInterval(() => tick(), 2000);
    return () => clearInterval(iv);
  }, [boot, tick]);

  return (
    <div className="flex min-h-screen flex-col">
      <div className="airtime-bg" aria-hidden="true" />
      <Nav />
      <main className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={route}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          >
            {page === "channel" && param ? (
              <ChannelPage slug={param} />
            ) : page === "dashboard" ? (
              <Dashboard />
            ) : page === "admin" ? (
              <Admin />
            ) : (
              <Home />
            )}
          </motion.div>
        </AnimatePresence>
      </main>
      <Footer />
      <AuthModal />
      <Toasts />
    </div>
  );
}
