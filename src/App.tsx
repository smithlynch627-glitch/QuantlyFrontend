import { lazy, Suspense, useEffect } from 'react';
import { Route, Routes, useLocation, useNavigationType } from 'react-router-dom';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { useRouteDirection } from './lib/motion';
import { Skeleton } from './components/ui';
import { ErrorBoundary } from './components/ErrorBoundary';
import Home from './pages/Home';

// The pages people open most are fetched in the background once the first page is idle, so moving between
// them never waits on the network. Everything else loads the first time it is opened.
const pages = {
  explore: () => import('./pages/Explore'),
  collection: () => import('./pages/Collection'),
  item: () => import('./pages/Item'),
  launchpad: () => import('./pages/Launchpad'),
  drop: () => import('./pages/Drop'),
  activity: () => import('./pages/Activity'),
};
const Explore = lazy(pages.explore);
const CollectionPage = lazy(pages.collection);
const ItemPage = lazy(pages.item);
const Launchpad = lazy(pages.launchpad);
const DropPage = lazy(pages.drop);
const Create = lazy(() => import('./pages/Create'));
const Profile = lazy(() => import('./pages/Profile'));
const ActivityPage = lazy(pages.activity);
const NotFound = lazy(() => import('./pages/NotFound'));
const Official = lazy(() => import('./pages/Official'));
const Studio = lazy(() => import('./pages/Studio'));
const Support = lazy(() => import('./pages/Support'));
const Security = lazy(() => import('./pages/Security'));
const Legal = lazy(() => import('./pages/Legal'));
const FaqPage = lazy(() => import('./pages/Faq'));
const XConnected = lazy(() => import('./pages/XConnected'));

/** A new page starts at the top; going back leaves the scroll position to the browser. */
function ScrollTop() {
  const { pathname } = useLocation();
  const type = useNavigationType();
  useEffect(() => {
    if (type !== 'POP') window.scrollTo(0, 0);
  }, [pathname, type]);
  return null;
}

function usePrefetchPages() {
  useEffect(() => {
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
    if (saveData) return;
    const run = () => { for (const load of Object.values(pages)) load().catch(() => {}); };
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number; cancelIdleCallback?: (n: number) => void };
    if (w.requestIdleCallback) {
      const id = w.requestIdleCallback(run, { timeout: 4000 });
      return () => w.cancelIdleCallback?.(id);
    }
    const id = window.setTimeout(run, 2500);
    return () => window.clearTimeout(id);
  }, []);
}

export default function App() {
  const { pathname } = useLocation();
  const route = useRouteDirection();
  usePrefetchPages();
  return (
    <>
      <ScrollTop />
      <Header />
      <main>
        <ErrorBoundary resetKey={pathname}>
        <Suspense fallback={<div className="page container"><Skeleton h={320} r={14} /></div>}>
          {/* Each page fades and slides in: from the right going forward, from the left going back. */}
          <div key={route.key} className={`route route--${route.direction}`}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/official" element={<Official />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/collection/:slug" element={<CollectionPage />} />
            <Route path="/item/:slug/:id" element={<ItemPage />} />
            <Route path="/launchpad" element={<Launchpad />} />
            <Route path="/launchpad/:slug" element={<DropPage />} />
            <Route path="/create" element={<Create />} />
            <Route path="/profile/:address" element={<Profile />} />
            <Route path="/activity" element={<ActivityPage />} />
            <Route path="/studio/:slug" element={<Studio />} />
            <Route path="/support" element={<Support />} />
            <Route path="/security" element={<Security />} />
            <Route path="/faq" element={<FaqPage />} />
            <Route path="/x/connected" element={<XConnected />} />
            <Route path="/terms" element={<Legal kind="terms" />} />
            <Route path="/privacy" element={<Legal kind="privacy" />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          </div>
        </Suspense>
        </ErrorBoundary>
      </main>
      <Footer />
    </>
  );
}
