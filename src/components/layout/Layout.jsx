import Header from "./Header";
import Footer from "./Footer";

function Layout({ children }) {
  return (
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
  );
}

export default Layout;