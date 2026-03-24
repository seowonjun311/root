import { base44 } from '@/api/base44Client';
import guestDataPersistence from '@/lib/GuestDataPersistence';

function uniqueTitleIds(list) {
  if (!Array.isArray(list)) return [];
  return [...new Set(list.filter(Boolean).map(String))];
}

export function getOwnedTitleIds({ isGuest, user, guestData }) {
  if (isGuest) {
    return uniqueTitleIds(guestData?.titles);
  }
  return uniqueTitleIds(user?.titles);
}

export function resolveEquippedTitleId({ isGuest, user, guestData, ownedTitleIds }) {
  const fallbackId = ownedTitleIds[0] || '';
  const rawEquipped = isGuest
    ? (typeof guestData?.equipped_title === 'string' ? guestData.equipped_title : '')
    : (typeof user?.equipped_title === 'string' ? user.equipped_title : '');

  if (rawEquipped && ownedTitleIds.includes(rawEquipped)) {
    return rawEquipped;
  }

  return fallbackId;
}

export async function ensureValidEquippedTitle({
  isGuest,
  user,
  guestData,
  ownedTitleIds,
  queryClient,
}) {
  if (!ownedTitleIds.length) return null;

  const resolved = resolveEquippedTitleId({ isGuest, user, guestData, ownedTitleIds });
  const current = isGuest ? guestData?.equipped_title || '' : user?.equipped_title || '';
  if (resolved === current) return null;

  if (isGuest) {
    return guestDataPersistence.ensureEquippedTitle(resolved);
  }

  await base44.auth.updateMe({ equipped_title: resolved });
  if (queryClient) {
    await queryClient.invalidateQueries({ queryKey: ['me'] });
  }
  return resolved;
}

export async function addOwnedTitle({ titleId, isGuest, user, queryClient }) {
  if (!titleId) return [];

  if (isGuest) {
    const next = guestDataPersistence.addTitle(titleId, { autoEquipIfEmpty: true });
    return uniqueTitleIds(next?.titles);
  }

  const currentTitles = uniqueTitleIds(user?.titles);
  if (currentTitles.includes(titleId)) {
    return currentTitles;
  }

  const nextTitles = uniqueTitleIds([...currentTitles, titleId]);
  const payload = { titles: nextTitles };

  if (!user?.equipped_title) {
    payload.equipped_title = titleId;
  }

  await base44.auth.updateMe(payload);
  if (queryClient) {
    await queryClient.invalidateQueries({ queryKey: ['me'] });
  }
  return nextTitles;
}

export async function setEquippedTitle({ titleId, isGuest, user, guestData, queryClient }) {
  if (!titleId) return null;

  const ownedTitleIds = getOwnedTitleIds({ isGuest, user, guestData });
  if (!ownedTitleIds.includes(titleId)) {
    return resolveEquippedTitleId({ isGuest, user, guestData, ownedTitleIds });
  }

  if (isGuest) {
    const next = guestDataPersistence.equipTitle(titleId);
    return next?.equipped_title || '';
  }

  await base44.auth.updateMe({ equipped_title: titleId });
  if (queryClient) {
    await queryClient.invalidateQueries({ queryKey: ['me'] });
  }
  return titleId;
}
