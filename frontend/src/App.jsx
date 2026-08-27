import { useState, useEffect } from 'react';
import CreatePollForm from './components/CreatePollForm/CreatePollForm';
import PollView from './components/PollView/PollView';
import { fetchApi } from './api/client';
import './App.css';

function App() {
  const [currentView, setCurrentView] = useState('home');
  const [selectedPollId, setSelectedPollId] = useState(null);
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadPolls = async () => {
    setLoading(true);
    try {
      const data = await fetchApi('/polls');
      setPolls(data);
    } catch (err) {
      console.error('Failed to load polls', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentView === 'home') {
      loadPolls();
    }
  }, [currentView]);

  const handleCreatePoll = (poll) => {
    setSelectedPollId(poll.id);
    setCurrentView('poll');
  };

  const goToPoll = (id) => {
    setSelectedPollId(id);
    setCurrentView('poll');
  };

  const goHome = () => {
    setSelectedPollId(null);
    setCurrentView('home');
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1 onClick={goHome} className="logo">Enquetes ao Vivo</h1>
      </header>

      <main className="app-main">
        {currentView === 'home' && (
          <div className="home-view">
            <div className="home-header">
              <h2>Enquetes Recentes</h2>
              <button className="primary-btn" onClick={() => setCurrentView('create')}>
                + Nova Enquete
              </button>
            </div>

            {loading ? (
              <p>Carregando enquetes...</p>
            ) : polls.length === 0 ? (
              <div className="empty-state">
                <p>Nenhuma enquete encontrada.</p>
              </div>
            ) : (
              <div className="polls-grid">
                {polls.map(poll => (
                  <div key={poll.id} className="poll-card" onClick={() => goToPoll(poll.id)}>
                    <h3>{poll.question}</h3>
                    <p>Criado por: {poll.creator_name}</p>
                    <span className="votes-count">{poll.total_votes} votos</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {currentView === 'create' && (
          <div>
            <button className="back-link" onClick={goHome}>← Voltar</button>
            <CreatePollForm onPollCreated={handleCreatePoll} />
          </div>
        )}

        {currentView === 'poll' && selectedPollId && (
          <PollView pollId={selectedPollId} onBack={goHome} />
        )}
      </main>
    </div>
  );
}

export default App;
