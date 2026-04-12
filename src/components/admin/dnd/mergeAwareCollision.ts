import {
  CollisionDetection,
  closestCenter,
  pointerWithin,
} from '@dnd-kit/core';

/**
 * Custom collision detection that prioritises merge droppable zones.
 *
 * 1. Check `pointerWithin` — returns droppables whose bounding rect contains the pointer.
 * 2. If any of them has an id starting with "merge-", return that one (merge intent).
 * 3. Otherwise fall back to `closestCenter` (reorder intent).
 */
export const mergeAwareCollision: CollisionDetection = (args) => {
  // First check which droppables the pointer is within
  const pointerCollisions = pointerWithin(args);

  // Look for a merge zone among pointer collisions
  const mergeHit = pointerCollisions.find((c) =>
    String(c.id).startsWith('merge-'),
  );

  if (mergeHit) {
    return [mergeHit];
  }

  // No merge zone hit — fall back to closestCenter for sortable reorder
  return closestCenter(args);
};
