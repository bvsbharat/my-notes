import { useState, useEffect, useCallback } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { AIPreferences } from '../lib/types';
import { DEFAULT_AI_PREFERENCES } from '../lib/types';

export function useSettings(uid: string | undefined) {
  const [preferences, setPreferences] = useState<AIPreferences>(DEFAULT_AI_PREFERENCES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) { setLoading(false); return; }

    const ref = doc(db, 'users', uid, 'settings', 'preferences');
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        setPreferences({ ...DEFAULT_AI_PREFERENCES, ...snap.data() as Partial<AIPreferences> });
      }
      setLoading(false);
    });
    return unsub;
  }, [uid]);

  const updatePreferences = useCallback(async (prefs: Partial<AIPreferences>) => {
    if (!uid) return;
    const ref = doc(db, 'users', uid, 'settings', 'preferences');
    await setDoc(ref, { ...preferences, ...prefs }, { merge: true });
  }, [uid, preferences]);

  return { preferences, loading, updatePreferences };
}
