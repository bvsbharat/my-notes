import { useState, useEffect, useCallback } from 'react';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { NoteTemplate } from '../lib/types';
import { DEFAULT_TEMPLATES } from '../lib/types';

export function useTemplates(uid: string | undefined) {
  const [templates, setTemplates] = useState<NoteTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) { setTemplates([]); setLoading(false); return; }

    const ref = collection(db, 'users', uid, 'templates');
    const unsub = onSnapshot(ref, (snap) => {
      const list = snap.docs.map(d => ({ ...d.data(), id: d.id }) as NoteTemplate);

      // Seed defaults if empty
      if (list.length === 0) {
        const now = new Date().toISOString();
        DEFAULT_TEMPLATES.forEach((t, i) => {
          const id = `default-${i}`;
          setDoc(doc(ref, id), { ...t, id, createdAt: now, updatedAt: now });
        });
      }

      setTemplates(list);
      setLoading(false);
    });
    return unsub;
  }, [uid]);

  const saveTemplate = useCallback(async (template: Partial<NoteTemplate> & { name: string; content: string }) => {
    if (!uid) return;
    const ref = collection(db, 'users', uid, 'templates');
    const now = new Date().toISOString();
    const id = template.id || crypto.randomUUID();
    await setDoc(doc(ref, id), {
      id,
      name: template.name,
      content: template.content,
      isDefault: template.isDefault ?? false,
      createdAt: template.createdAt || now,
      updatedAt: now,
    });
  }, [uid]);

  const deleteTemplate = useCallback(async (id: string) => {
    if (!uid) return;
    await deleteDoc(doc(db, 'users', uid, 'templates', id));
  }, [uid]);

  return { templates, loading, saveTemplate, deleteTemplate };
}
