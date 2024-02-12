export async function loadScript(url: string) {
	const script = document.createElement('script');
	script.src = url;
	document.head.appendChild(script);
	return new Promise((resolve, reject) => {
		script.onload = resolve;
		script.onerror = reject;
	});
}
