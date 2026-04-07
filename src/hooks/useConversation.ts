import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Conversation } from '../lib/types';

export function useConversation(uid: string | undefined, conversationId: string | undefined) {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uid || !conversationId) {
      setConversation(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const ref = doc(db, 'users', uid, 'conversations', conversationId);

    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setConversation({ ...data, id: snap.id } as Conversation);
        } else {
          setConversation(null);
        }
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return unsub;
  }, [uid, conversationId]);

  return { conversation, loading, error };
}
