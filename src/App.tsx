import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/login" element={<AuthPage />} />
                <Route path="/home" element={<HomePage />} />
                <Route path="*" element={<Navigate to="/login" />} />
            </Routes>
        </Router>
    );
}

export default App;