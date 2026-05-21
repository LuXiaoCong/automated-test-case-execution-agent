import { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Home from './pages/Home';
import Requirements from './pages/Requirements';
import TestCases from './pages/TestCases';
import TestExecution from './pages/TestExecution';
import TestResults from './pages/TestResults';
import ModelLibrary from './pages/ModelLibrary';

function App() {
  const [activeMenu, setActiveMenu] = useState('home');

  const renderContent = () => {
    switch (activeMenu) {
      case 'home':
        return <Home />;
      case 'requirements':
        return <Requirements />;
      case 'test-cases':
        return <TestCases />;
      case 'test-execution':
        return <TestExecution />;
      case 'test-results':
        return <TestResults />;
      case 'model-library':
        return <ModelLibrary />;
      default:
        return <Home />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-100">
      <Sidebar activeMenu={activeMenu} onMenuChange={setActiveMenu} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

export default App;