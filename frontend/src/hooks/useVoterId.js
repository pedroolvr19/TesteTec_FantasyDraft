import { useState, useEffect } from 'react';

function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function useVoterId() {
  const [voterId, setVoterId] = useState('');

  useEffect(() => {
    let storedId = localStorage.getItem('voterId');
    if (!storedId) {
      storedId = generateUUID();
      localStorage.setItem('voterId', storedId);
    }
    setVoterId(storedId);
  }, []);

  return voterId;
}
