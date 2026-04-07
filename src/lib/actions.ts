import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db } from './firebase';
import type { Conversation, ActionItem } from './types';
import { safeSegments, safeStructured, displayTitle } from './types';

export async function toggleStar(uid: string, conversationId: string, currentStarred: boolean) {
  const ref = doc(db, 'users', uid, 'conversations', conversationId);
  await updateDoc(ref, { starred: !currentStarred });
}

export async function softDelete(uid: string, conversationId: string) {
  const ref = doc(db, 'users', uid, 'conversations', conversationId);
  await updateDoc(ref, { deleted: true });
}

export async function undoDelete(uid: string, conversationId: string) {
  const ref = doc(db, 'users', uid, 'conversations', conversationId);
  await updateDoc(ref, { deleted: false });
}

export function exportAsText(conv: Conversation): string {
  const structured = safeStructured(conv);
  const segments = safeSegments(conv);
  const lines: string[] = [];

  lines.push(`# ${displayTitle(conv)}`);
  if (structured.emoji) lines[0] = `${structured.emoji} ${lines[0]}`;
  lines.push(`Date: ${new Date(conv.createdAt).toLocaleString()}`);
  lines.push(`Status: ${conv.status}`);
  lines.push('');

  if (structured.overview) {
    lines.push('## Overview');
    lines.push(structured.overview);
    lines.push('');
  }

  if (segments.length > 0) {
    lines.push('## Transcript');
    for (const seg of segments) {
      const min = Math.floor(seg.start / 60);
      const sec = Math.floor(seg.start % 60);
      const ts = `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
      lines.push(`[${ts}] ${seg.speaker}: ${seg.text}`);
    }
    lines.push('');
  }

  if (structured.actionItems.length > 0) {
    lines.push('## Action Items');
    for (const item of structured.actionItems) {
      lines.push(`- [${item.completed ? 'x' : ' '}] ${item.description}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

export async function toggleTaskCompleted(uid: string, conversationId: string, taskId: string, completed: boolean) {
  const ref = doc(db, 'users', uid, 'conversations', conversationId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const data = snap.data();
  const items: ActionItem[] = data.structured?.actionItems || [];
  const updated = items.map(item => item.id === taskId ? { ...item, completed } : item);
  await updateDoc(ref, { 'structured.actionItems': updated });
}

export async function deleteTask(uid: string, conversationId: string, taskId: string) {
  const ref = doc(db, 'users', uid, 'conversations', conversationId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const data = snap.data();
  const items: ActionItem[] = data.structured?.actionItems || [];
  const updated = items.filter(item => item.id !== taskId);
  await updateDoc(ref, { 'structured.actionItems': updated });
}

export async function reprocessConversation(conversationId: string): Promise<{ success: boolean; title?: string }> {
  const functions = getFunctions();
  const reprocess = httpsCallable<{ conversationId: string }, { success: boolean; title?: string }>(functions, 'reprocessConversation');
  const result = await reprocess({ conversationId });
  return result.data;
}

export function downloadText(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
