import { useState } from 'react';
import { fetchApi } from '../../api/client';
import styles from './CreatePollForm.module.css';

export default function CreatePollForm({ onPollCreated }) {
  const [question, setQuestion] = useState('');
  const [creatorName, setCreatorName] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const addOption = () => {
    if (options.length < 10) {
      setOptions([...options, '']);
    }
  };

  const removeOption = (index) => {
    if (options.length > 2) {
      const newOptions = options.filter((_, i) => i !== index);
      setOptions(newOptions);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const validOptions = options.filter(o => o.trim() !== '');

    if (validOptions.length < 2) {
      setError('A enquete deve ter pelo menos 2 opções válidas.');
      setLoading(false);
      return;
    }

    try {
      const payload = {
        question,
        creator_name: creatorName,
        options: validOptions,
      };

      if (expiresAt) {
        payload.expires_at = new Date(expiresAt).toISOString();
      }

      const poll = await fetchApi('/polls', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      onPollCreated(poll);
    } catch (err) {
      setError(err.message || 'Erro ao criar enquete.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h2>Criar Nova Enquete</h2>
      {error && <div className={styles.error}>{error}</div>}
      
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label>Sua Pergunta</label>
          <input
            type="text"
            required
            maxLength={500}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Qual a sua linguagem favorita?"
          />
        </div>

        <div className={styles.formGroup}>
          <label>Seu Nome</label>
          <input
            type="text"
            required
            maxLength={100}
            value={creatorName}
            onChange={(e) => setCreatorName(e.target.value)}
            placeholder="João Silva"
          />
        </div>

        <div className={styles.formGroup}>
          <label>Data/Hora de Encerramento (Opcional)</label>
          <input
            type="datetime-local"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            min={new Date().toISOString().slice(0, 16)}
          />
        </div>

        <div className={styles.optionsContainer}>
          <label>Opções</label>
          {options.map((opt, index) => (
            <div key={index} className={styles.optionRow}>
              <input
                type="text"
                required
                maxLength={200}
                value={opt}
                onChange={(e) => handleOptionChange(index, e.target.value)}
                placeholder={`Opção ${index + 1}`}
              />
              {options.length > 2 && (
                <button
                  type="button"
                  className={styles.removeBtn}
                  onClick={() => removeOption(index)}
                  title="Remover opção"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          {options.length < 10 && (
            <button type="button" className={styles.addBtn} onClick={addOption}>
              + Adicionar Opção
            </button>
          )}
        </div>

        <button type="submit" className={styles.submitBtn} disabled={loading}>
          {loading ? 'Criando...' : 'Criar Enquete'}
        </button>
      </form>
    </div>
  );
}
