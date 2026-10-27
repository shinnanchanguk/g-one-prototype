import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import GrowthDesign from './pages/GrowthDesign.jsx';
import GrowthJourney from './pages/GrowthJourney.jsx';
import Home from './pages/Home.jsx';
import { About, Faq, NotFound, Notices, Search } from './pages/Info.jsx';
import { MaterialDetail, Materials, Modules, Rooms, Trainings } from './pages/Learn.jsx';
import { Communities, CommunityDetail, OpenClasses, Outcomes } from './pages/Share.jsx';
import { Mentoring, Mentors, Worries, WorryDetail } from './pages/Together.jsx';
import { StoreProvider } from './store.jsx';
import './styles.css';

class Guard extends React.Component {
  state = { err: null };
  static getDerivedStateFromError(err) { return { err }; }
  render() {
    if (!this.state.err) return this.props.children;
    return (
      <div className="container"><div className="empty">
        <p>화면을 그리다 문제가 생겼어요. 체험 기록을 지우면 다시 볼 수 있어요.</p>
        <button className="btn btn--dark" onClick={() => { localStorage.removeItem('g-one-prototype-v1'); location.reload(); }}>처음 상태로 되돌리기</button>
      </div></div>
    );
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Guard>
    <StoreProvider>
      <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="growth/design" element={<GrowthDesign />} />
            <Route path="growth/journey" element={<GrowthJourney />} />
            <Route path="learn/trainings" element={<Trainings />} />
            <Route path="learn/modules" element={<Modules />} />
            <Route path="learn/materials" element={<Materials />} />
            <Route path="learn/materials/:id" element={<MaterialDetail />} />
            <Route path="learn/rooms" element={<Rooms />} />
            <Route path="share/classes" element={<OpenClasses />} />
            <Route path="share/communities" element={<Communities />} />
            <Route path="share/communities/:id" element={<CommunityDetail />} />
            <Route path="share/outcomes" element={<Outcomes />} />
            <Route path="together/worries" element={<Worries />} />
            <Route path="together/worries/:id" element={<WorryDetail />} />
            <Route path="together/mentors" element={<Mentors />} />
            <Route path="together/mentoring" element={<Mentoring />} />
            <Route path="info/about" element={<About />} />
            <Route path="info/notices" element={<Notices />} />
            <Route path="info/faq" element={<Faq />} />
            <Route path="search" element={<Search />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </HashRouter>
    </StoreProvider>
    </Guard>
  </React.StrictMode>,
);
