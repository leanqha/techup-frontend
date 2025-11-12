import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';
import SchedulePage from "./pages/SchedulePage";
import MapPage from "./pages/MapPage";
import ProfilePage from "./pages/ProfilePage";

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/login" element={<AuthPage />} />
                <Route path="/home" element={<HomePage />} />
                <Route path="/schedule" element={<SchedulePage />} />
                <Route path="/map" element={<MapPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="*" element={<Navigate to="/login" />} />
            </Routes>
        </Router>
    );
}

export default App;