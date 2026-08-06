export interface GuestUser {
  guestId: string;
  nickname: string;
}

const GUEST_KEY = "playground_v2_guest_user";

export function getStoredGuestUser(): GuestUser {
  if (typeof window === "undefined") {
    return { guestId: "guest_server", nickname: "Liquid Blob" };
  }

  try {
    const raw = localStorage.getItem(GUEST_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.guestId && parsed.nickname) {
        return parsed;
      }
    }
  } catch {
    // Ignore JSON parse errors
  }

  // Generate new guest profile if none exists
  const newGuestId = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const newNickname = `Blob_${Math.floor(1000 + Math.random() * 9000)}`;
  const guest: GuestUser = { guestId: newGuestId, nickname: newNickname };

  try {
    localStorage.setItem(GUEST_KEY, JSON.stringify(guest));
  } catch {
    // Ignore localStorage block
  }

  return guest;
}

export function updateGuestNickname(nickname: string): GuestUser {
  const current = getStoredGuestUser();
  const updated = { ...current, nickname };
  try {
    localStorage.setItem(GUEST_KEY, JSON.stringify(updated));
  } catch {
    // Ignore
  }
  return updated;
}
