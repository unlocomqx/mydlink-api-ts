import type { CloudImage } from '$lib/MyDlink/MyDlink';
import Jimp from 'jimp';

export type SnapshotList = CloudImage & {
	id: string;
	snapshots: string[];
};

function getSections(cloudImage: CloudImage) {
	const [cols, rows, col_width, row_height] = cloudImage.attribute.split(',').map(Number);
	const sections: Array<{
		left: number;
		top: number;
		width: number;
		height: number;
	}> = [];
	if (!cols || !rows || !col_width || !row_height) {
		console.log('Invalid metadata', {
			...cloudImage
		});
		return [];
	}

	for (let i = 0; i < rows; i++) {
		for (let j = 0; j < cols; j++) {
			if (cloudImage.blank_list.includes(i * cols + j)) continue;
			const section = {
				left: j * col_width,
				top: i * row_height,
				width: col_width,
				height: row_height
			};
			sections.push(section);
		}
	}
	return sections;
}

export async function getSnapshotList(cloudImage: CloudImage): Promise<SnapshotList> {
	const random_id = Math.random().toString(36).substring(7);
	const img = await Jimp.read(cloudImage.path);
	const sections = getSections(cloudImage);
	const snapshots: string[] = [];
	for (const section of sections) {
		img
			.clone()
			.crop(section.left, section.top, section.width, section.height)
			.getBuffer(Jimp.MIME_JPEG, (err, buffer) => {
				if (err) {
					console.log('Error extracting section', section, err);
				} else {
					// turn buffer to base64
					const uri = `data:image/jpeg;base64,${buffer.toString('base64')}`;
					snapshots.push(uri);
				}
				return buffer;
			});
	}

	return {
		id: random_id,
		...cloudImage,
		snapshots
	};
}
