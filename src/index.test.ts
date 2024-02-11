import { describe, expect } from 'vitest';
import { MyDlink } from '$lib/MyDlink/MyDlink';
import { env } from '$env/dynamic/private';

describe('lists events', async () => {
	const mydlink = new MyDlink(env.PRIVATE_EMAIL, env.PRIVATE_PASSWORD);
	await mydlink.login();

	// test promise mydlink.get_device_list()
	const device_list = await mydlink.get_device_list();
	const today = new Date();
	await mydlink.get_event_list_meta_infos(today.getFullYear(), today.getMonth(), today.getDate());
	expect(device_list).toBeDefined();
});
