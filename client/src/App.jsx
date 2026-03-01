import { useState } from 'react';
import Header from './components/Header';
import Landing from './components/Landing';
import Upload from './components/Upload';
import Dashboard from './components/Dashboard';
import './index.css';

function App() {
    const [view, setView] = useState('landing'); // landing | upload | dashboard
    const [analysisResult, setAnalysisResult] = useState(null);

    const handleStartAnalysis = () => {
        setView('upload');
    };

    const handleAnalysisComplete = (result) => {
        setAnalysisResult(result);
        setView('dashboard');
    };

    const handleBackToHome = () => {
        setView('landing');
        setAnalysisResult(null);
    };

    const handleNewAnalysis = () => {
        setView('upload');
        setAnalysisResult(null);
    };

    return (
        <>
            <Header
                onLogoClick={handleBackToHome}
                onAnalyze={handleStartAnalysis}
                showAnalyzeBtn={view === 'landing'}
            />

            {view === 'landing' && (
                <Landing onStart={handleStartAnalysis} />
            )}

            {view === 'upload' && (
                <Upload onAnalysisComplete={handleAnalysisComplete} />
            )}

            {view === 'dashboard' && analysisResult && (
                <Dashboard
                    data={analysisResult}
                    onNewAnalysis={handleNewAnalysis}
                />
            )}

            <footer className="footer">
                <p>© 2024 GoOptimize AI — 囲碁学習最適化エンジン</p>
            </footer>
        </>
    );
}

export default App;
