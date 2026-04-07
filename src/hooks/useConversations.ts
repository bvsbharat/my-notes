import { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Conversation } from '../lib/types';

export function useConversations(uid: string | undefined) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uid) {
      setConversations([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const ref = collection(db, 'users', uid, 'conversations');
    const q = query(ref, orderBy('createdAt', 'desc'), limit(100));

    const unsub = onSnapshot(
      q,
      (snap) => {
        const convs = snap.docs.map((doc) => {
          const data = doc.data();
          return { ...data, id: doc.id } as Conversation;
        });
        setConversations(convs);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return unsub;
  }, [uid]);

  return { conversations, loading, error };
}
