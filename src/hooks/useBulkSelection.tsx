import { useState, useCallback, useMemo } from "react";

interface UseBulkSelectionProps<T> {
  items: T[];
  getItemId: (item: T) => string;
}

interface UseBulkSelectionReturn<T> {
  selectedIds: Set<string>;
  selectedItems: T[];
  selectedCount: number;
  isSelected: (itemId: string) => boolean;
  isAllSelected: boolean;
  isIndeterminate: boolean;
  toggleItem: (itemId: string) => void;
  toggleAll: () => void;
  selectAll: () => void;
  clearSelection: () => void;
  setSelectedIds: (ids: Set<string>) => void;
}

export function useBulkSelection<T>({
  items,
  getItemId
}: UseBulkSelectionProps<T>): UseBulkSelectionReturn<T> {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const selectedItems = useMemo(() => 
    items.filter(item => selectedIds.has(getItemId(item))),
    [items, selectedIds, getItemId]
  );

  const selectedCount = selectedIds.size;
  const totalCount = items.length;
  const isAllSelected = totalCount > 0 && selectedCount === totalCount;
  const isIndeterminate = selectedCount > 0 && selectedCount < totalCount;

  const isSelected = useCallback((itemId: string) => {
    return selectedIds.has(itemId);
  }, [selectedIds]);

  const toggleItem = useCallback((itemId: string) => {
    setSelectedIds(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(itemId)) {
        newSelection.delete(itemId);
      } else {
        newSelection.add(itemId);
      }
      return newSelection;
    });
  }, []);

  const selectAll = useCallback(() => {
    const allIds = new Set(items.map(getItemId));
    setSelectedIds(allIds);
  }, [items, getItemId]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const toggleAll = useCallback(() => {
    if (isAllSelected) {
      clearSelection();
    } else {
      selectAll();
    }
  }, [isAllSelected, clearSelection, selectAll]);

  return {
    selectedIds,
    selectedItems,
    selectedCount,
    isSelected,
    isAllSelected,
    isIndeterminate,
    toggleItem,
    toggleAll,
    selectAll,
    clearSelection,
    setSelectedIds
  };
}