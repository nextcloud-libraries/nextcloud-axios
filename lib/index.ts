import Axios, { AxiosInstance, CancelTokenStatic } from 'axios'
import { getRequestToken, onRequestTokenUpdate } from '@nextcloud/auth'

import { onError as onCsrfTokenError } from './interceptors/csrf-token'
import { onError as onMaintenanceModeError } from './interceptors/maintenance-mode'
import { onError as onNotLoggedInError } from './interceptors/not-logged-in'

interface CancelableAxiosInstance extends AxiosInstance {
	CancelToken: CancelTokenStatic
	isCancel: typeof Axios.isCancel
}

const client = Axios.create({
	headers: {
		requesttoken: getRequestToken() ?? '',
		'X-Requested-With': 'XMLHttpRequest',
	},
})

const cancelableClient: CancelableAxiosInstance = Object.assign(client, {
	CancelToken: Axios.CancelToken,
	isCancel: Axios.isCancel,
})

cancelableClient.interceptors.response.use(r => r, onCsrfTokenError(cancelableClient))
cancelableClient.interceptors.response.use(r => r, onMaintenanceModeError(cancelableClient))
cancelableClient.interceptors.response.use(r => r, onNotLoggedInError)

onRequestTokenUpdate(token => { client.defaults.headers.requesttoken = token })

export default cancelableClient

export { isAxiosError, isCancel } from 'axios'

export type * from 'axios'
