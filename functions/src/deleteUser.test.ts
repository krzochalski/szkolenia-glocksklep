// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import { deleteUserAccount, deleteUserBodySchema, isAuthUserNotFound } from './deleteUser';

describe('deleteUserBodySchema', () => {
	it('requires uid', () => {
		expect(deleteUserBodySchema.safeParse({}).success).toBe(false);
		expect(deleteUserBodySchema.safeParse({ uid: '' }).success).toBe(false);
		expect(deleteUserBodySchema.safeParse({ uid: 'u1' }).success).toBe(true);
	});
});

describe('isAuthUserNotFound', () => {
	it('detects auth/user-not-found', () => {
		expect(isAuthUserNotFound({ code: 'auth/user-not-found' })).toBe(true);
		expect(isAuthUserNotFound({ code: 'auth/insufficient-permission' })).toBe(false);
		expect(isAuthUserNotFound(new Error('nope'))).toBe(false);
	});
});

describe('deleteUserAccount', () => {
	const auth = { deleteUser: vi.fn() };
	const db = {
		doc: vi.fn((path: string) => ({
			path,
			get: vi.fn(),
			delete: vi.fn(),
		})),
	};

	it('refuses self-delete', async () => {
		await expect(
			deleteUserAccount(auth as never, db as never, 'me', 'me')
		).rejects.toThrow('Nie możesz usunąć własnego konta.');
		expect(auth.deleteUser).not.toHaveBeenCalled();
	});

	it('refuses deleting an admin', async () => {
		const adminGet = vi.fn().mockResolvedValue({ exists: true });
		db.doc.mockImplementation((path: string) => ({
			path,
			get: path.startsWith('admins/') ? adminGet : vi.fn(),
			delete: vi.fn(),
		}));
		await expect(
			deleteUserAccount(auth as never, db as never, 'admin1', 'target')
		).rejects.toThrow('Nie można usunąć konta administratora.');
		expect(auth.deleteUser).not.toHaveBeenCalled();
	});

	it('deletes Auth then Firestore profile', async () => {
		const profileDelete = vi.fn().mockResolvedValue(undefined);
		const adminGet = vi.fn().mockResolvedValue({ exists: false });
		db.doc.mockImplementation((path: string) => ({
			path,
			get: adminGet,
			delete: profileDelete,
		}));
		auth.deleteUser.mockResolvedValue(undefined);

		await deleteUserAccount(auth as never, db as never, 'admin1', 'target');

		expect(auth.deleteUser).toHaveBeenCalledWith('target');
		expect(db.doc).toHaveBeenCalledWith('users/target');
		expect(profileDelete).toHaveBeenCalled();
	});

	it('continues when Auth user already missing', async () => {
		const profileDelete = vi.fn().mockResolvedValue(undefined);
		db.doc.mockImplementation(() => ({
			path: '',
			get: vi.fn().mockResolvedValue({ exists: false }),
			delete: profileDelete,
		}));
		auth.deleteUser.mockRejectedValue({ code: 'auth/user-not-found' });

		await deleteUserAccount(auth as never, db as never, 'admin1', 'target');

		expect(profileDelete).toHaveBeenCalled();
	});
});
