import Header from "./Header";
import Footer from "./Footer";

function Layout({ children }) {
  return (
    <div className="page">
      <Header />
      <main className="page__content">{children}</main>
      <Footer />
    </div>
  );
}

export default Layout;