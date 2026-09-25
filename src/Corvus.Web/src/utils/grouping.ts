import { useState, useMemo, useCallback } from 'react';

/**
 * Konteyner veya servis isminden akıllı kategori/grup türetici
 */
export function deriveSmartGroup(
  name: string,
  composeProject?: string | null,
  customCategory?: string | null
): string {
  if (customCategory && customCategory.trim()) {
    return customCategory.trim();
  }

  if (composeProject && composeProject.trim()) {
    const p = composeProject.trim();
    return p.charAt(0).toUpperCase() + p.slice(1);
  }

  if (!name) return 'General';
  const lower = name.toLowerCase().trim();

  if (lower.startsWith('internal-') || lower.startsWith('internal_')) return 'Internal';
  if (lower.startsWith('core-') || lower.startsWith('core_')) return 'Core';
  if (lower.endsWith('_web') || lower.endsWith('-web') || lower.startsWith('web-') || lower.startsWith('web_')) return 'Web';
  if (lower.includes('postgres') || lower.includes('mysql') || lower.includes('mariadb') || 
      lower.includes('redis') || lower.includes('mongo') || lower.includes('-db') || lower.includes('_db')) {
    return 'Database';
  }
  if (lower.includes('mail') || lower.includes('stalwart') || lower.includes('postfix')) return 'Mail';

  return 'General';
}

export interface UseEntityGroupingOptions<T> {
  items: T[];
  getId: (item: T) => string;
  getName: (item: T) => string;
  getCategory: (item: T) => string;
  storageKey?: string;
  onUpdateCategory?: (itemId: string, newCategory: string) => Promise<void>;
  onBatchUpdateCategory?: (itemIds: string[], newCategory: string) => Promise<void>;
}

export interface EntityGroup<T> {
  name: string;
  items: T[];
}

export function useEntityGrouping<T>({
  items,
  getId,
  getCategory,
  storageKey,
  onUpdateCategory,
  onBatchUpdateCategory
}: UseEntityGroupingOptions<T>) {
  // 1. Kapalı/Açık grup durumları (LocalStorage destekli)
  const collapseStorageKey = storageKey ? `${storageKey}_collapsed` : null;
  const overridesStorageKey = storageKey ? `${storageKey}_overrides` : null;

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(() => {
    if (collapseStorageKey) {
      try {
        const saved = localStorage.getItem(collapseStorageKey);
        if (saved) return JSON.parse(saved);
      } catch {
        // ignore
      }
    }
    return {};
  });

  // 2. Özel kategori atamaları (LocalStorage destekli)
  const [customOverrides, setCustomOverrides] = useState<Record<string, string>>(() => {
    if (overridesStorageKey) {
      try {
        const saved = localStorage.getItem(overridesStorageKey);
        if (saved) return JSON.parse(saved);
      } catch {
        // ignore
      }
    }
    return {};
  });

  // 3. Sürükle-Bırak Durumu
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverGroup, setDragOverGroup] = useState<string | null>(null);

  // Grupları hesapla
  const groups = useMemo<EntityGroup<T>[]>(() => {
    const map = new Map<string, T[]>();

    for (const item of items) {
      const id = getId(item);
      const category = customOverrides[id] || getCategory(item) || 'General';

      if (!map.has(category)) {
        map.set(category, []);
      }
      map.get(category)!.push(item);
    }

    return Array.from(map.entries()).map(([name, groupItems]) => ({
      name,
      items: groupItems
    }));
  }, [items, getId, getCategory, customOverrides]);

  const groupNames = useMemo(() => groups.map(g => g.name), [groups]);

  // Akordeon Aç / Kapat
  const toggleCollapse = useCallback((groupName: string) => {
    setCollapsed(prev => {
      const next = { ...prev, [groupName]: !prev[groupName] };
      if (collapseStorageKey) {
        try {
          localStorage.setItem(collapseStorageKey, JSON.stringify(next));
        } catch {
          // ignore
        }
      }
      return next;
    });
  }, [collapseStorageKey]);

  // Elemanı başka bir gruba taşı
  const moveItem = useCallback(async (itemId: string, targetCategory: string) => {
    const cleanTarget = targetCategory.trim();
    if (!cleanTarget) return;

    setCustomOverrides(prev => {
      const next = { ...prev, [itemId]: cleanTarget };
      if (overridesStorageKey) {
        try {
          localStorage.setItem(overridesStorageKey, JSON.stringify(next));
        } catch {
          // ignore
        }
      }
      return next;
    });

    if (onUpdateCategory) {
      await onUpdateCategory(itemId, cleanTarget);
    }
  }, [overridesStorageKey, onUpdateCategory]);

  // Grubu Yeniden Adlandır (O gruptaki tüm elemanların kategorisini topluca güncelle)
  const renameGroup = useCallback(async (oldCategory: string, newCategory: string) => {
    const cleanNew = newCategory.trim();
    if (!cleanNew || cleanNew === oldCategory) return;

    // Gruptaki elemanları bul
    const currentGroup = groups.find(g => g.name === oldCategory);
    if (!currentGroup) return;

    const itemIds = currentGroup.items.map(item => getId(item));

    setCustomOverrides(prev => {
      const next = { ...prev };
      for (const id of itemIds) {
        next[id] = cleanNew;
      }
      if (overridesStorageKey) {
        try {
          localStorage.setItem(overridesStorageKey, JSON.stringify(next));
        } catch {
          // ignore
        }
      }
      return next;
    });

    // Açık/kapalı durumunu yeni isme taşı
    setCollapsed(prev => {
      const wasCollapsed = !!prev[oldCategory];
      const next = { ...prev };
      delete next[oldCategory];
      next[cleanNew] = wasCollapsed;
      if (collapseStorageKey) {
        try {
          localStorage.setItem(collapseStorageKey, JSON.stringify(next));
        } catch {
          // ignore
        }
      }
      return next;
    });

    if (onBatchUpdateCategory) {
      await onBatchUpdateCategory(itemIds, cleanNew);
    } else if (onUpdateCategory) {
      await Promise.allSettled(itemIds.map(id => onUpdateCategory(id, cleanNew)));
    }
  }, [groups, getId, overridesStorageKey, collapseStorageKey, onBatchUpdateCategory, onUpdateCategory]);

  // Drag & Drop Eylemleri
  const handleDragStart = useCallback((_e: React.DragEvent, itemId: string) => {
    setDraggingId(itemId);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggingId(null);
    setDragOverGroup(null);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, groupName: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverGroup !== groupName) {
      setDragOverGroup(groupName);
    }
  }, [dragOverGroup]);

  const handleDragLeave = useCallback((groupName: string) => {
    if (dragOverGroup === groupName) {
      setDragOverGroup(null);
    }
  }, [dragOverGroup]);

  const handleDrop = useCallback(async (e: React.DragEvent, targetGroup: string) => {
    e.preventDefault();
    setDragOverGroup(null);
    if (!draggingId) return;

    await moveItem(draggingId, targetGroup);
    setDraggingId(null);
  }, [draggingId, moveItem]);

  return {
    groups,
    groupNames,
    collapsed,
    toggleCollapse,
    moveItem,
    renameGroup,
    draggingId,
    dragOverGroup,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragLeave,
    handleDrop
  };
}
