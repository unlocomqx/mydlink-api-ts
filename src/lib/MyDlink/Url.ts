import axios, { type AxiosResponse } from 'axios';
import https from 'https';

export class UrlUtils {
	public STATUS_CODE_SUCCESS = 200;
	public TYPE_GET = 'get';
	public TYPE_POST = 'post';
	private proxies: {
		http: string;
		https: string;
	} | null;
	private headersGet: Record<string, string>;
	private headersPost: Record<string, string>;
	private headersStream: Record<string, string>;

	constructor(proxy: string | null, disableUnverifiedHttpsWarn = true) {
		this.proxies = null;
		this.headersGet = {
			'User-Agent': 'Mozilla/5.0',
			Connection: 'Keep-Alive',
			Accept: '*/*',
			'x-md-lang': 'de',
			'x-md-app-ver': '02.00.01.75',
			'x-md-os-type': 'android',
			'x-md-os-version': '7.0'
		};
		this.headersPost = {
			'User-Agent': 'Mozilla/5.0',
			Connection: 'Keep-Alive',
			Accept: '*/*',
			'Content-Type': 'application/json',
			'x-md-lang': 'de',
			'x-md-app-ver': '02.00.01.75',
			'x-md-os-type': 'android',
			'x-md-os-version': '7.0'
		};
		this.headersStream = {
			'User-Agent': 'Mozilla/5.0',
			Connection: 'Keep-Alive',
			Accept: '*/*',
			'x-md-lang': 'de',
			'x-md-app-ver': '02.00.01.75',
			'x-md-os-type': 'android',
			'x-md-os-version': '7.0',
			'Content-Type': 'application/x-mpegURL; charset=utf-8'
		};
		if (proxy !== null) {
			this.proxies = {
				http: proxy,
				https: proxy
			};
		}
		if (disableUnverifiedHttpsWarn) {
			https.globalAgent.options.rejectUnauthorized = false;
		}
	}

	async request(url: string, requestType = 'post', inputJson: object | null = null) {
		let response = null;
		try {
			if (requestType === this.TYPE_POST) {
				response = await axios.post(url, inputJson, {
					headers: this.headersPost
				});
			} else if (requestType === this.TYPE_GET) {
				response = await axios.get(url, {
					headers: this.headersGet
				});
			}
		} catch (e) {
			console.error(e.toString());
		}
		return response;
	}

	async streamFile(url: string) {
		const response = await axios.get(url, {
			headers: this.headersStream,
			responseType: 'stream'
		});
		const chunks = [];
		for await (const chunk of response.data) {
			chunks.push(chunk);
		}
		return Buffer.concat(chunks);
	}

	public getParams(response: AxiosResponse | null): URLSearchParams {
		if (response === null) {
			return new URLSearchParams();
		}

		const locationUrl =
			response.request._redirectable && response.request._redirectable._redirectCount > 0
				? response.request._redirectable._currentUrl
				: response.config.url;
		return new URL(locationUrl).searchParams;
	}

	static parse(value: string) {
		try {
			return JSON.parse(value);
		} catch (e) {
			console.error(`invalid json: ${e}`);
			return null;
		}
	}
}
