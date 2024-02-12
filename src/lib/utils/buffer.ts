export function getUri(buffer: Buffer) {
	return `data:image/jpeg;base64,${buffer.toString('base64')}`;
}
