import PocketBase from 'pocketbase';

const pbUrl = import.meta.env.VITE_POCKETBASE_URL || "";
export const pb = new PocketBase(pbUrl);

// Enable auto-cancellation to prevent race conditions (standard PocketBase behavior)
pb.autoCancellation(false);
