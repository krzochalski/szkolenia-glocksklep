/**
 * Ensures Firestore-derived values are plain JSON for Server → Client Component props
 * (strips Timestamp / DocumentReference / undefined quirks).
 */
export const serializeForClient = <T>(value: T): T =>
	JSON.parse(JSON.stringify(value)) as T;
