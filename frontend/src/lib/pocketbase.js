import PocketBase from 'pocketbase';

const pbUrl = "https://db-zahl.feichti.dev";
export const pb = new PocketBase(pbUrl);

// Enable auto-cancellation to prevent race conditions (standard PocketBase behavior)
pb.autoCancellation(false);
