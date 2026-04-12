import * as React from 'react';
import {
  DragStartEvent,
  DragEndEvent,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { mergeAwareCollision } from '@/components/admin/dnd/mergeAwareCollision';
import type { ICityTariffData } from '@/lib/types/city-tariff';

// ── ID helpers ────────────────────────────────────────────────────
function parseTypeId(id: string): { kind: 'type'; index: number } | null {
  const m = id.match(/^type-(\d+)$/);
  return m ? { kind: 'type', index: Number(m[1]) } : null;
}

function parseSubtypeId(id: string): { kind: 'subtype'; typeIndex: number; subIndex: number } | null {
  const m = id.match(/^subtype-(\d+)-(\d+)$/);
  return m ? { kind: 'subtype', typeIndex: Number(m[1]), subIndex: Number(m[2]) } : null;
}

function parseMergeTypeId(id: string): { kind: 'merge-type'; index: number } | null {
  const m = id.match(/^merge-type-(\d+)$/);
  return m ? { kind: 'merge-type', index: Number(m[1]) } : null;
}

// ── Selection adjustment utilities ────────────────────────────────
function adjustAfterReorder(selected: number | null, oldIdx: number, newIdx: number): number | null {
  if (selected === null) return null;
  if (selected === oldIdx) return newIdx;
  if (oldIdx < selected && newIdx >= selected) return selected - 1;
  if (oldIdx > selected && newIdx <= selected) return selected + 1;
  return selected;
}

// ── Merge dialog props interface ──────────────────────────────────
export interface MergeDialogState {
  open: boolean;
  sourceLabel: string;
  targetLabel: string;
  sourceChildCount: number;
  duplicateCodes: string[];
  onConfirm: () => void;
  onCancel: () => void;
}

// ── Hook ──────────────────────────────────────────────────────────
export function useDndTariffTypes(
  data: ICityTariffData,
  setData: React.Dispatch<React.SetStateAction<ICityTariffData>>,
  selectedTypeIndex: number | null,
  setSelectedTypeIndex: (i: number | null) => void,
  selectedSubtypeIndex: number | null,
  setSelectedSubtypeIndex: (i: number | null) => void,
) {
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [pendingMerge, setPendingMerge] = React.useState<{
    sourceIndex: number;
    targetIndex: number;
  } | null>(null);

  // ── Sensors ──────────────────────────────────────────────────────
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // ── Active item label for overlay ────────────────────────────────
  const activeLabel = React.useMemo(() => {
    if (!activeId) return null;
    const typeP = parseTypeId(activeId);
    if (typeP) {
      const t = data.types[typeP.index];
      return t ? `${t.code || '—'} · ${t.label || 'ללא שם'}` : null;
    }
    const subP = parseSubtypeId(activeId);
    if (subP) {
      const t = data.types[subP.typeIndex];
      const s = t?.subtypes[subP.subIndex];
      return s ? `${s.code || '—'} · ${s.label || 'ללא שם'}` : null;
    }
    return null;
  }, [activeId, data.types]);

  // ── Drag handlers ────────────────────────────────────────────────
  const handleDragStart = React.useCallback((event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  }, []);

  const handleDragEnd = React.useCallback(
    (event: DragEndEvent) => {
      setActiveId(null);
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const activeStr = String(active.id);
      const overStr = String(over.id);

      // ── Case 1: Type reorder (type-X dropped on type-Y) ──────────
      const activeType = parseTypeId(activeStr);
      const overType = parseTypeId(overStr);
      if (activeType && overType) {
        const oldIdx = activeType.index;
        const newIdx = overType.index;
        if (oldIdx !== newIdx) {
          setData((prev) => ({
            ...prev,
            types: arrayMove(prev.types, oldIdx, newIdx),
          }));
          setSelectedTypeIndex(adjustAfterReorder(selectedTypeIndex, oldIdx, newIdx));
        }
        return;
      }

      // ── Case 2: Type dropped on merge zone → merge ───────────────
      const overMerge = parseMergeTypeId(overStr);
      if (activeType && overMerge && activeType.index !== overMerge.index) {
        setPendingMerge({ sourceIndex: activeType.index, targetIndex: overMerge.index });
        return;
      }

      // ── Case 3: Subtype reorder within same type ─────────────────
      const activeSub = parseSubtypeId(activeStr);
      const overSub = parseSubtypeId(overStr);
      if (activeSub && overSub && activeSub.typeIndex === overSub.typeIndex) {
        const ti = activeSub.typeIndex;
        const oldIdx = activeSub.subIndex;
        const newIdx = overSub.subIndex;
        if (oldIdx !== newIdx) {
          setData((prev) => {
            const types = [...prev.types];
            types[ti] = {
              ...types[ti],
              subtypes: arrayMove(types[ti].subtypes, oldIdx, newIdx),
            };
            return { ...prev, types };
          });
          if (selectedTypeIndex === ti) {
            setSelectedSubtypeIndex(adjustAfterReorder(selectedSubtypeIndex, oldIdx, newIdx));
          }
        }
        return;
      }

      // ── Case 4: Subtype dropped on a different type → move ───────
      if (activeSub && overType && activeSub.typeIndex !== overType.index) {
        const srcTi = activeSub.typeIndex;
        const srcSi = activeSub.subIndex;
        const targetTi = overType.index;
        setData((prev) => {
          const types = [...prev.types];
          const srcType = { ...types[srcTi], subtypes: [...types[srcTi].subtypes] };
          const targetType = { ...types[targetTi], subtypes: [...types[targetTi].subtypes] };
          const [moved] = srcType.subtypes.splice(srcSi, 1);
          targetType.subtypes.push(moved);
          types[srcTi] = srcType;
          types[targetTi] = targetType;
          return { ...prev, types };
        });
        setSelectedTypeIndex(targetTi);
        setSelectedSubtypeIndex(data.types[targetTi].subtypes.length); // will be last
        return;
      }

      // Case 4b: Subtype dropped on merge zone of a type → also move
      if (activeSub && overMerge && activeSub.typeIndex !== overMerge.index) {
        const srcTi = activeSub.typeIndex;
        const srcSi = activeSub.subIndex;
        const targetTi = overMerge.index;
        setData((prev) => {
          const types = [...prev.types];
          const srcType = { ...types[srcTi], subtypes: [...types[srcTi].subtypes] };
          const targetType = { ...types[targetTi], subtypes: [...types[targetTi].subtypes] };
          const [moved] = srcType.subtypes.splice(srcSi, 1);
          targetType.subtypes.push(moved);
          types[srcTi] = srcType;
          types[targetTi] = targetType;
          return { ...prev, types };
        });
        setSelectedTypeIndex(targetTi);
        setSelectedSubtypeIndex(data.types[targetTi].subtypes.length);
        return;
      }
    },
    [data.types, selectedTypeIndex, selectedSubtypeIndex, setData, setSelectedTypeIndex, setSelectedSubtypeIndex],
  );

  // ── Merge confirm / cancel ───────────────────────────────────────
  const confirmMerge = React.useCallback(() => {
    if (!pendingMerge) return;
    const { sourceIndex, targetIndex } = pendingMerge;
    setData((prev) => {
      const types = [...prev.types];
      const source = types[sourceIndex];
      const target = types[targetIndex];
      const existingCodes = new Set(target.subtypes.map((s) => s.code));
      const mergedSubtypes = [
        ...target.subtypes,
        ...source.subtypes.filter((s) => !existingCodes.has(s.code)),
      ];
      types[targetIndex] = { ...target, subtypes: mergedSubtypes };
      types.splice(sourceIndex, 1);
      return { ...prev, types };
    });

    // Adjust selection to point to merged target
    const adjustedTarget =
      pendingMerge.sourceIndex < pendingMerge.targetIndex
        ? pendingMerge.targetIndex - 1
        : pendingMerge.targetIndex;
    setSelectedTypeIndex(adjustedTarget);
    setSelectedSubtypeIndex(0);
    setPendingMerge(null);
  }, [pendingMerge, setData, setSelectedTypeIndex, setSelectedSubtypeIndex]);

  const cancelMerge = React.useCallback(() => {
    setPendingMerge(null);
  }, []);

  // ── Build merge dialog props ─────────────────────────────────────
  const mergeDialogProps: MergeDialogState = React.useMemo(() => {
    if (!pendingMerge) {
      return {
        open: false,
        sourceLabel: '',
        targetLabel: '',
        sourceChildCount: 0,
        duplicateCodes: [],
        onConfirm: () => {},
        onCancel: () => {},
      };
    }
    const source = data.types[pendingMerge.sourceIndex];
    const target = data.types[pendingMerge.targetIndex];
    const targetCodes = new Set(target?.subtypes.map((s) => s.code) ?? []);
    const dupes = source?.subtypes.filter((s) => targetCodes.has(s.code)).map((s) => s.code) ?? [];
    return {
      open: true,
      sourceLabel: source ? `${source.code} · ${source.label}` : '',
      targetLabel: target ? `${target.code} · ${target.label}` : '',
      sourceChildCount: source?.subtypes.length ?? 0,
      duplicateCodes: dupes,
      onConfirm: confirmMerge,
      onCancel: cancelMerge,
    };
  }, [pendingMerge, data.types, confirmMerge, cancelMerge]);

  return {
    sensors,
    collisionDetection: mergeAwareCollision,
    handleDragStart,
    handleDragEnd,
    mergeDialogProps,
    activeLabel,
    activeId,
  };
}
