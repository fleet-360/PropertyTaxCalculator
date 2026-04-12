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
import type { MergeDialogState } from '@/hooks/useDndTariffTypes';

// ── ID helpers ────────────────────────────────────────────────────
function parseExemptionId(id: string): { kind: 'exemption'; index: number } | null {
  const m = id.match(/^exemption-(\d+)$/);
  return m ? { kind: 'exemption', index: Number(m[1]) } : null;
}

function parseExSubId(id: string): { kind: 'exsub'; secIndex: number; subIndex: number } | null {
  const m = id.match(/^exsub-(\d+)-(\d+)$/);
  return m ? { kind: 'exsub', secIndex: Number(m[1]), subIndex: Number(m[2]) } : null;
}

function parseMergeExemptionId(id: string): { kind: 'merge-exemption'; index: number } | null {
  const m = id.match(/^merge-exemption-(\d+)$/);
  return m ? { kind: 'merge-exemption', index: Number(m[1]) } : null;
}

// ── Selection adjustment ──────────────────────────────────────────
function adjustAfterReorder(selected: number | null, oldIdx: number, newIdx: number): number | null {
  if (selected === null) return null;
  if (selected === oldIdx) return newIdx;
  if (oldIdx < selected && newIdx >= selected) return selected - 1;
  if (oldIdx > selected && newIdx <= selected) return selected + 1;
  return selected;
}

// ── Hook ──────────────────────────────────────────────────────────
export function useDndExemptions(
  data: ICityTariffData,
  setData: React.Dispatch<React.SetStateAction<ICityTariffData>>,
  selectedSectionIndex: number | null,
  setSelectedSectionIndex: (i: number | null) => void,
  selectedSubIndex: number | null,
  setSelectedSubIndex: (i: number | null) => void,
) {
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [pendingMerge, setPendingMerge] = React.useState<{
    sourceIndex: number;
    targetIndex: number;
  } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const activeLabel = React.useMemo(() => {
    if (!activeId) return null;
    const secP = parseExemptionId(activeId);
    if (secP) {
      const s = data.exemptions[secP.index];
      return s ? `${s.sectionCode || '—'} · ${s.sectionLabel || 'ללא שם'}` : null;
    }
    const subP = parseExSubId(activeId);
    if (subP) {
      const sec = data.exemptions[subP.secIndex];
      const sub = sec?.subSections[subP.subIndex];
      return sub ? `${sub.code || '—'} · ${sub.discountPercent}%` : null;
    }
    return null;
  }, [activeId, data.exemptions]);

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

      // ── Case 1: Exemption section reorder ────────────────────────
      const activeEx = parseExemptionId(activeStr);
      const overEx = parseExemptionId(overStr);
      if (activeEx && overEx) {
        const oldIdx = activeEx.index;
        const newIdx = overEx.index;
        if (oldIdx !== newIdx) {
          setData((prev) => ({
            ...prev,
            exemptions: arrayMove(prev.exemptions, oldIdx, newIdx),
          }));
          setSelectedSectionIndex(adjustAfterReorder(selectedSectionIndex, oldIdx, newIdx));
        }
        return;
      }

      // ── Case 2: Section dropped on merge zone → merge ────────────
      const overMerge = parseMergeExemptionId(overStr);
      if (activeEx && overMerge && activeEx.index !== overMerge.index) {
        setPendingMerge({ sourceIndex: activeEx.index, targetIndex: overMerge.index });
        return;
      }

      // ── Case 3: SubSection reorder within same section ───────────
      const activeSub = parseExSubId(activeStr);
      const overSub = parseExSubId(overStr);
      if (activeSub && overSub && activeSub.secIndex === overSub.secIndex) {
        const ei = activeSub.secIndex;
        const oldIdx = activeSub.subIndex;
        const newIdx = overSub.subIndex;
        if (oldIdx !== newIdx) {
          setData((prev) => {
            const exemptions = [...prev.exemptions];
            exemptions[ei] = {
              ...exemptions[ei],
              subSections: arrayMove(exemptions[ei].subSections, oldIdx, newIdx),
            };
            return { ...prev, exemptions };
          });
          if (selectedSectionIndex === ei) {
            setSelectedSubIndex(adjustAfterReorder(selectedSubIndex, oldIdx, newIdx));
          }
        }
        return;
      }

      // ── Case 4: SubSection dropped on different section → move ───
      if (activeSub && overEx && activeSub.secIndex !== overEx.index) {
        const srcEi = activeSub.secIndex;
        const srcSi = activeSub.subIndex;
        const targetEi = overEx.index;
        setData((prev) => {
          const exemptions = [...prev.exemptions];
          const srcSec = { ...exemptions[srcEi], subSections: [...exemptions[srcEi].subSections] };
          const targetSec = { ...exemptions[targetEi], subSections: [...exemptions[targetEi].subSections] };
          const [moved] = srcSec.subSections.splice(srcSi, 1);
          targetSec.subSections.push(moved);
          exemptions[srcEi] = srcSec;
          exemptions[targetEi] = targetSec;
          return { ...prev, exemptions };
        });
        setSelectedSectionIndex(targetEi);
        setSelectedSubIndex(data.exemptions[targetEi].subSections.length);
        return;
      }

      // Case 4b: SubSection dropped on merge zone of different section → move
      if (activeSub && overMerge && activeSub.secIndex !== overMerge.index) {
        const srcEi = activeSub.secIndex;
        const srcSi = activeSub.subIndex;
        const targetEi = overMerge.index;
        setData((prev) => {
          const exemptions = [...prev.exemptions];
          const srcSec = { ...exemptions[srcEi], subSections: [...exemptions[srcEi].subSections] };
          const targetSec = { ...exemptions[targetEi], subSections: [...exemptions[targetEi].subSections] };
          const [moved] = srcSec.subSections.splice(srcSi, 1);
          targetSec.subSections.push(moved);
          exemptions[srcEi] = srcSec;
          exemptions[targetEi] = targetSec;
          return { ...prev, exemptions };
        });
        setSelectedSectionIndex(targetEi);
        setSelectedSubIndex(data.exemptions[targetEi].subSections.length);
        return;
      }
    },
    [data.exemptions, selectedSectionIndex, selectedSubIndex, setData, setSelectedSectionIndex, setSelectedSubIndex],
  );

  const confirmMerge = React.useCallback(() => {
    if (!pendingMerge) return;
    const { sourceIndex, targetIndex } = pendingMerge;
    setData((prev) => {
      const exemptions = [...prev.exemptions];
      const source = exemptions[sourceIndex];
      const target = exemptions[targetIndex];
      const existingCodes = new Set(target.subSections.map((s) => s.code));
      const merged = [
        ...target.subSections,
        ...source.subSections.filter((s) => !existingCodes.has(s.code)),
      ];
      exemptions[targetIndex] = { ...target, subSections: merged };
      exemptions.splice(sourceIndex, 1);
      return { ...prev, exemptions };
    });
    const adjustedTarget =
      pendingMerge.sourceIndex < pendingMerge.targetIndex
        ? pendingMerge.targetIndex - 1
        : pendingMerge.targetIndex;
    setSelectedSectionIndex(adjustedTarget);
    setSelectedSubIndex(0);
    setPendingMerge(null);
  }, [pendingMerge, setData, setSelectedSectionIndex, setSelectedSubIndex]);

  const cancelMerge = React.useCallback(() => {
    setPendingMerge(null);
  }, []);

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
    const source = data.exemptions[pendingMerge.sourceIndex];
    const target = data.exemptions[pendingMerge.targetIndex];
    const targetCodes = new Set(target?.subSections.map((s) => s.code) ?? []);
    const dupes = source?.subSections.filter((s) => targetCodes.has(s.code)).map((s) => s.code) ?? [];
    return {
      open: true,
      sourceLabel: source ? `${source.sectionCode} · ${source.sectionLabel}` : '',
      targetLabel: target ? `${target.sectionCode} · ${target.sectionLabel}` : '',
      sourceChildCount: source?.subSections.length ?? 0,
      duplicateCodes: dupes,
      onConfirm: confirmMerge,
      onCancel: cancelMerge,
    };
  }, [pendingMerge, data.exemptions, confirmMerge, cancelMerge]);

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
