import { useState, useEffect, useCallback } from 'react';
import { collection, onSnapshot, doc, setDoc, deleteDoc, orderBy, query } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { SmartNote } from '../lib/types';

export function useNotes(uid: string | undefined) {
  const [notes, setNotes] = useState<SmartNote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) { setNotes([]); setLoading(false); return; }

    const ref = collection(db, 'users', uid, 'notes');
    const q = query(ref, orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setNotes(snap.docs.map(d => ({ ...d.data(), id: d.id }) as SmartNote));
      setLoading(false);
    });
    return unsub;
  }, [uid]);

  const saveNote = useCallback(async (note: Omit<SmartNote, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => {
    if (!uid) return;
    const ref = collection(db, 'users', uid, 'notes');
    const now = new Date().toISOString();
    const id = note.id || crypto.randomUUID();
    await setDoc(doc(ref, id), {
      ...note,
      id,
      createdAt: note.id ? undefined : now, // don't overwrite on update
      updatedAt: now,
    }, { merge: true });
    return id;
  }, [uid]);

  const deleteNote = useCallback(async (id: string) => {
    if (!uid) return;
    await deleteDoc(doc(db, 'users', uid, 'notes', id));
  }, [uid]);

  return { notes, loading, saveNote, deleteNote };
}
