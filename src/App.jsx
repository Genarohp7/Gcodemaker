import { Route, Routes } from "react-router";
import Layout from "./components/layout/Layout";
import HomePage from "./pages/HomePage";
import GcBroadcastPage from "./pages/GcBroadcastPage";
import PackagesPage from "./pages/PackagesPage";
import LegalPage from "./pages/LegalPage";

function App() {
  return (
    <Routes>
      <Route path="/gc-broadcast" element={<GcBroadcastPage />} />
      <Route
        path="*"
        element={
          <Layout>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/promociones-paquetes" element={<PackagesPage />} />
              <Route path="/privacy" element={<LegalPage type="privacy" />} />
              <Route path="/terms" element={<LegalPage type="terms" />} />
              <Route path="*" element={<HomePage />} />
            </Routes>
          </Layout>
        }
      />
    </Routes>
  );
}

export default App;
