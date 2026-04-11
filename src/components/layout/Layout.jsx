import { useEffect } from "react";
import { useLocation } from "react-router";
import { ReactLenis } from "lenis/react";
import "lenis/dist/lenis.css";

import Header from "./Header";
import Footer from "./Footer";

function Layout({ children }) {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);

  return (
    <ReactLenis
      root
      options={{
        duration: 1.05,
        smoothWheel: true,
        smoothTouch: false,
        wheelMultiplier: 0.95,
        touchMultiplier: 1,
      }}
    >
      <div className="page">
        <div className="page__ambient" aria-hidden="true">
          <span className="page__glow page__glow--1"></span>
          <span className="page__glow page__glow--2"></span>
          <span className="page__glow page__glow--3"></span>
          <span className="page__grid"></span>
        </div>

        <Header />

        <main className="page__content">
          <div className="page__inner">{children}</div>
        </main>

        <Footer />
      </div>
    </ReactLenis>
  );
}

export default Layout;