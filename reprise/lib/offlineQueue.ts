import { get, set, del, keys, createStore } from 'idb-keyval';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from './database.types';

const syncStore = createStore('fluxorep-sync', 'queue');

export interface QueueItem {
  syncId: string;
  table: keyof Database['public']['Tables'];
  operation: 'upsert' | 'delete';
  payload: any;
  createdAt: string;
  attempts: number;
  lastError: string | null;
}

/**
 * Adiciona item à fila (chamado offline)
 */
export async function enqueue(
  table: keyof Database['public']['Tables'], 
  operation: 'upsert' | 'delete', 
  payload: any
) {
  const syncId = crypto.randomUUID();
  const item: QueueItem = {
    syncId,
    table,
    operation,
    payload: { ...payload, sync_id: syncId },
    createdAt: new Date().toISOString(),
    attempts: 0,
    lastError: null,
  };

  await set(syncId, item, syncStore);

  // Solicita Background Sync ao Service Worker (quando disponível)
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'SyncManager' in window) {
    try {
      const reg = await navigator.serviceWorker.ready;
      // @ts-ignore - SyncManager is not always in types
      await reg.sync.register('fluxorep-sync-queue');
    } catch (e) {
      console.warn('Background sync not supported or failed:', e);
    }
  }

  return syncId;
}

/**
 * Processa a fila (chamado pelo SW ou ao retomar conexão)
 */
export async function processQueue(supabase: SupabaseClient<Database>) {
  const allKeys = await keys(syncStore);

  for (const key of allKeys) {
    const item = await get(key as string, syncStore) as QueueItem;
    if (!item) continue;

    try {
      if (item.operation === 'upsert') {
        const { error } = await supabase
          .from(item.table)
          .upsert(item.payload, { onConflict: 'sync_id' });

        if (error) throw error;
      }

      if (item.operation === 'delete') {
        const { error } = await supabase
          .from(item.table)
          .delete()
          .eq('id', item.payload.id);

        if (error) throw error;
      }

      // Sucesso: remove da fila
      await del(key as string, syncStore);

    } catch (err: any) {
      // Falhou: incrementa tentativas, guarda erro
      await set(key as string, {
        ...item,
        attempts: item.attempts + 1,
        lastError: err.message,
      }, syncStore);

      if (item.attempts >= 5) {
        console.error('[FluxoREP] Item abandonado após 5 tentativas:', item);
      }
    }
  }
}

/**
 * Retorna contagem de itens pendentes
 */
export async function getPendingCount() {
  return (await keys(syncStore)).length;
}
