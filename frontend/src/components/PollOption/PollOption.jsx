import styles from './PollOption.module.css';

export default function PollOption({ option, onVote, isVoting, disabled }) {
  return (
    <button 
      className={`${styles.optionBtn} ${disabled ? styles.disabled : ''}`}
      onClick={onVote}
      disabled={disabled}
    >
      <span className={styles.text}>{option.text}</span>
      {isVoting && <span className={styles.spinner}>Votando...</span>}
    </button>
  );
}
