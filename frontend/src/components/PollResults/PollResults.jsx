import styles from './PollResults.module.css';

export default function PollResults({ options, totalVotes }) {
  const sortedOptions = [...options].sort((a, b) => b.votes_count - a.votes_count);
  
  const maxPercentage = sortedOptions.length > 0 ? sortedOptions[0].percentage : 0;

  return (
    <div className={styles.resultsContainer}>
      {sortedOptions.map((option) => (
        <div key={option.id} className={styles.resultItem}>
          <div className={styles.resultHeader}>
            <span className={styles.optionText}>{option.text}</span>
            <span className={styles.optionStats}>
              {option.percentage}% ({option.votes_count} votos)
            </span>
          </div>
          <div className={styles.progressBarBg}>
            <div 
              className={`${styles.progressBarFill} ${option.percentage === maxPercentage && maxPercentage > 0 ? styles.winner : ''}`}
              style={{ width: `${option.percentage}%` }}
            ></div>
          </div>
        </div>
      ))}
    </div>
  );
}
