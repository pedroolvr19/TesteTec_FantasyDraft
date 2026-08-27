import { useState, useEffect } from 'react';
import { fetchApi } from '../../api/client';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useVoterId } from '../../hooks/useVoterId';
import PollOption from '../PollOption/PollOption';
import PollResults from '../PollResults/PollResults';
import styles from './PollView.module.css';

export default function PollView({ pollId, onBack }) {
  const [poll, setPoll] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [votingOptionId, setVotingOptionId] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);
  
  const voterId = useVoterId();

  const handleVoteUpdate = (data) => {
    if (data.poll_id === pollId) {
      setPoll(prev => {
        if (!prev) return prev;
        
        const newTotalVotes = data.options.reduce((sum, opt) => sum + opt.votes_count, 0);
        
        return {
          ...prev,
          options: data.options,
          total_votes: newTotalVotes
        };
      });
    }
  };

  const { isConnected } = useWebSocket(pollId, handleVoteUpdate);

  useEffect(() => {
    async function loadPoll() {
      try {
        const data = await fetchApi(`/polls/${pollId}`);
        setPoll(data);
        
        const votedInPolls = JSON.parse(localStorage.getItem('votedPolls') || '{}');
        if (votedInPolls[pollId]) {
          setHasVoted(true);
        }
      } catch (err) {
        setError('Não foi possível carregar a enquete.');
      } finally {
        setLoading(false);
      }
    }
    
    loadPoll();
  }, [pollId]);

  const handleVote = async (optionId) => {
    if (hasVoted || votingOptionId) return;
    
    setVotingOptionId(optionId);
    setError('');

    try {
      const response = await fetchApi(`/polls/${pollId}/vote`, {
        method: 'POST',
        body: JSON.stringify({
          option_id: optionId,
          voter_id: voterId
        }),
      });
      
      const votedInPolls = JSON.parse(localStorage.getItem('votedPolls') || '{}');
      votedInPolls[pollId] = optionId;
      localStorage.setItem('votedPolls', JSON.stringify(votedInPolls));
      
      setHasVoted(true);
      
      setPoll(prev => ({
        ...prev,
        options: response.options,
        total_votes: response.total_votes
      }));
      
    } catch (err) {
      setError(err.message || Object.values(err.errors || {}).flat()[0] || 'Erro ao registrar voto.');
    } finally {
      setVotingOptionId(null);
    }
  };

  if (loading) return <div className={styles.loading}>Carregando enquete...</div>;
  if (error && !poll) return <div className={styles.error}>{error} <button onClick={onBack}>Voltar</button></div>;
  if (!poll) return null;

  return (
    <div className={styles.container}>
      <button className={styles.backBtn} onClick={onBack}>← Voltar</button>
      
      <div className={styles.header}>
        <div className={styles.badges}>
          <span className={isConnected ? styles.badgeLive : styles.badgeOffline}>
            {isConnected ? '● Ao Vivo' : '○ Reconectando...'}
          </span>
          {poll.is_expired && <span className={styles.badgeExpired}>Encerrada</span>}
        </div>
        <h2 className={styles.question}>{poll.question}</h2>
        <p className={styles.meta}>Criada por <strong>{poll.creator_name}</strong> • {poll.total_votes} votos no total</p>
      </div>

      {error && <div className={styles.errorMsg}>{error}</div>}

      <div className={styles.content}>
        {!hasVoted && !poll.is_expired ? (
          <div className={styles.votingArea}>
            <h3 className={styles.sectionTitle}>Escolha uma opção:</h3>
            <div className={styles.optionsList}>
              {poll.options.map(option => (
                <PollOption
                  key={option.id}
                  option={option}
                  onVote={() => handleVote(option.id)}
                  isVoting={votingOptionId === option.id}
                  disabled={votingOptionId !== null}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className={styles.resultsArea}>
            <h3 className={styles.sectionTitle}>
              {hasVoted ? 'Você já votou. Resultados em tempo real:' : 'Resultados:'}
            </h3>
            <PollResults options={poll.options} totalVotes={poll.total_votes} />
          </div>
        )}
      </div>
    </div>
  );
}
