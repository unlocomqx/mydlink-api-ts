import type { PageServerLoad } from './$types';
import type { Actions } from '@sveltejs/kit';
import { type CloudImage, MyDlink } from '$lib/MyDlink/MyDlink';
import { env } from '$env/dynamic/private';
import { detectPeople } from '$lib/detector/detector';

export const actions = {
	async default() {
		const mydlink = new MyDlink(env.PRIVATE_EMAIL, env.PRIVATE_PASSWORD);
		await mydlink.login();

		const handled_images = [];
		const end_date = new Date(2024, 1, 11, 7, 45);
		const start_date = new Date(end_date.getTime() - 1000 * 60 * 1); // 1 hour ago
		const events = await mydlink.get_event_list_meta_infos(start_date, end_date);
		// const recordings = await mydlink.get_mydlink_cloud_recordings_urls(start_date, end_date);
		const cloudImgsPromises: Promise<CloudImage>[] = [];
		if ('data' in events['data'][0]) {
			for (const event of events['data'][0]['data']) {
				cloudImgsPromises.push(
					mydlink.get_mydlink_cloud_img_url(event['mydlink_id'], event['timestamp'])
				);
			}
		}
		const cloudImgs = await Promise.all(cloudImgsPromises);

		const detection = await Promise.all(cloudImgs.map(detectPeople));
		console.log(events);

		return {
			images: cloudImgs.filter((img) => img.path)
		};
	}
} satisfies Actions;

export const load = (async (event) => {}) satisfies PageServerLoad;
