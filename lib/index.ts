import Axios, { AxiosInstance, CancelTokenStatic, AxiosResponse, AxiosError } from 'axios'
import { getRequestToken, onRequestTokenUpdate } from '@nextcloud/auth'

interface CancelableAxiosInstance extends AxiosInstance {
	CancelToken: CancelTokenStatic
	isCancel(value: any): boolean
}

const client: any = Axios.create({
	headers: {
		requesttoken: getRequestToken() ?? ''
	}
})
const cancelableClient: CancelableAxiosInstance = Object.assign(client, {
	CancelToken: Axios.CancelToken,
	isCancel: Axios.isCancel,
})

// Add a 401 response interceptor
cancelableClient.interceptors.response.use((response: AxiosResponse): AxiosResponse     => {
	if (response.status === 401) {
		location.reload()
	}
	return response
}, (error: AxiosError): Promise<AxiosError> => {
	if (error.response?.status === 401) {
		location.reload()
	}
	return Promise.reject(error)
})

onRequestTokenUpdate(token => client.defaults.headers.requesttoken = token)

export default cancelableClient
