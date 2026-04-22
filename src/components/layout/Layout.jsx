import { lazy, Suspense, useEffect, useState } from "react";
import { useLocation } from "react-router";
import { ReactLenis } from "lenis/react";
import "lenis/dist/lenis.css";

import { initAnalytics, trackPageView } from "../../lib/analytics";
import CookieBanner from "../common/CookieBanner";
import Header from "./Header";
import Footer from "./Footer";

const GlobalSceneBackground = lazy(() => import("./GlobalSceneBackground"));

function Layout({ children }) {
  const { pathname, search } = useLocation();
  const [isPageReady, setIsPageReady] = useState(false);

  useEffect(() => {
    initAnalytics();
  }, []);

  useEffect(() => {
    let frameId = 0;
    let timeoutId = 0;

    frameId = window.requestAnimationFrame(() => {
      timeoutId = window.setTimeout(() => {
        setIsPageReady(true);
      }, 120);
    });

    return () => {
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  useEffect(() => {
    trackPageView({
      page_title: document.title,
      page_location: window.location.href,
      page_path: `${pathname}${search}`,
    });
  }, [pathname, search]);

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
          <Suspense
            fallback={
              <div className="global-scene-background global-scene-background--fallback" />
            }
          >
            <GlobalSceneBackground />
          </Suspense>

          <span className="page__glow page__glow--1"></span>
          <span className="page__glow page__glow--2"></span>
          <span className="page__glow page__glow--3"></span>
          <span className="page__grid"></span>
        </div>

        <div
          className={`page__shell ${isPageReady ? "page__shell--ready" : ""}`}
        >
          <Header />

          <main className="page__content">
            <div className="page__inner">{children}</div>
          </main>

          <Footer />
          <CookieBanner />
        </div>
      </div>
    </ReactLenis>
  );
}

export default Layout;