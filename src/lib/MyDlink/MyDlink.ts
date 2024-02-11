import { createHash } from 'crypto';
import { UrlUtils } from '$lib/MyDlink/Url';

export class MyDlink {
	private api_url = 'https://api.auto.mydlink.com';
	private client_id = 'mydlinkuapandroid';
	private android_id = 'bd36a6c011f1287e';
	private oauth_secret = '5259311fa8cab90f09f2dc1e09d2d8ee';
	private name: string;
	private email: string;
	private password: string;
	private url_utils: UrlUtils;
	private login_params = new URLSearchParams();

	constructor(email: string, password: string, proxy = null, disable_unverified_https_warn = true) {
		this.name = 'PythonApi';
		this.email = email;
		this.password = this.md5Hashing(password);
		this.url_utils = new UrlUtils(proxy, disable_unverified_https_warn);
		this.login();
	}

	async login() {
		const oauth_sub_url = '/oauth/authorize2';
		const login_url = `${oauth_sub_url}?client_id=${this.client_id}&redirect_uri=${encodeURIComponent('https://mydlink.com')}&user_name=${encodeURIComponent(this.email)}&password=${this.password}&response_type=token&timestamp=${Math.floor(Date.now() / 1000)}&uc_id=${this.android_id}&uc_name=${this.name}`;
		const signature = this.md5Hashing(login_url + this.oauth_secret);
		const request_url = `${this.api_url}${login_url}&sig=${signature}`;
		const response = await this.url_utils.request(request_url, this.url_utils.TYPE_GET);
		this.login_params = this.url_utils.getParams(response);
	}

	async get_device_list() {
		const device_list_url = `https://${this.login_params.get('api_site')}/me/device/list?access_token=${this.login_params.get('access_token')}`;
		const response = await this.url_utils.request(device_list_url, this.url_utils.TYPE_GET);
		const device_list_json = response?.data;
		return device_list_json?.['data'] ?? [];
	}

	async get_device_details(mydlink_id: string, mac: string) {
		const device_detail_url = `https://${this.login_params.get('api_site')}/me/device/info?access_token=${this.login_params.get('access_token')}`;
		const json_object = { mac: mac, mydlink_id: mydlink_id };
		const json_object_list = [json_object];
		const json_object_final = { data: json_object_list };
		const response = await this.url_utils.request(
			device_detail_url,
			this.url_utils.TYPE_POST,
			json_object_final
		);
		const device_detail_json = response?.data;
		return device_detail_json['data'][0];
	}

	async get_mydlink_cloud_recordings_urls(year: number, month: number, day: number) {
		const event_list_meta_json = this.get_event_list_meta_infos(year, month, day);
		let all_events_details_json;
		if ('path' in event_list_meta_json['data'][0]) {
			const response_all_events_details = await this.url_utils.request(
				event_list_meta_json['data'][0]['path'],
				this.url_utils.TYPE_GET
			);
			all_events_details_json = response_all_events_details?.data;
			all_events_details_json = all_events_details_json['data'][0]['data'];
		} else {
			all_events_details_json = event_list_meta_json['data'][0]['data'];
		}
		return this.__get_mydlink_cloud_recordings_file(all_events_details_json);
	}

	async get_event_list_meta_infos(year: number, month: number, day: number) {
		const device_detail_url = `https://${this.login_params.get('api_site')}/me/nvr/event/list?access_token=${this.login_params.get('access_token')}`;
		const recording_date_start = new Date(year, month, day, 2, 0, 0);
		const recording_date_end = new Date(year, month, day, 23, 59, 59, 999999);
		const json_object = {
			end_ts: recording_date_end.getTime(),
			start_ts: recording_date_start.getTime()
		};
		const json_object_final = { data: json_object };
		const response = await this.url_utils.request(
			device_detail_url,
			this.url_utils.TYPE_POST,
			json_object_final
		);
		return response?.data;
	}

	async __get_mydlink_cloud_recordings_file(datas) {
		const list_initiate_url = `https://${this.login_params.get('api_site')}/me/nvr/list/initiate?access_token=${this.login_params.get('access_token')}`;
		if (datas.length === 0) {
			return [];
		}
		const data = datas[0];
		const json_object = {
			favorite: false,
			timestamp: data['timestamp'],
			subs_uid: data['act'][0]['subs_uid'],
			mydlink_id: data['mydlink_id']
		};
		const json_object_final = { data: json_object };
		const response_list_initiate = await this.url_utils.request(
			list_initiate_url,
			this.url_utils.TYPE_POST,
			json_object_final
		);
		const response_list_initiate_json = response_list_initiate?.data;
		const cloud_video_url = `https://${this.login_params.get('api_site')}/me/nvr/list/video.m3u8?session=${response_list_initiate_json['data']['session_id']}&model=1`;
		const aws_recording_data = this.url_utils.streamFile(cloud_video_url).toString().splitlines();

		function check_list(aws_recording_data: string) {
			return aws_recording_data.includes('https');
		}

		return aws_recording_data.filter(check_list);
	}

	async get_mydlink_cloud_img_url(mydlink_id: string, event_timestamp: string) {
		let imagepath = null;
		const json_object = { mydlink_id: mydlink_id, timestamp: event_timestamp };
		const json_object_final = { data: json_object };
		const storyboard_img_url = `https://${this.login_params.get('api_site')}/me/nvr/storyboard/info?access_token=${this.login_params.get('access_token')}`;
		const response = await this.url_utils.request(
			storyboard_img_url,
			this.url_utils.TYPE_POST,
			json_object_final
		);
		if (response?.status === this.url_utils.STATUS_CODE_SUCCESS) {
			const response_content = response.data;
			imagepath = null;
			if (
				'data' in response_content &&
				'list' in response_content['data'] &&
				response_content['data']['list'].length > 0
			) {
				imagepath = response_content['data']['list'][0]['path'];
			}
		}
		return imagepath;
	}

	md5Hashing(str: string) {
		return createHash('md5').update(str).digest('hex');
	}
}
