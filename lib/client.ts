import Axios, { AxiosInstance } from 'axios'
import { getRequestToken, onRequestTokenUpdate } from '@nextcloud/auth'

const client: AxiosInstance = Axios.create({
	headers: {
		requesttoken: getRequestToken()
	}
})

onRequestTokenUpdate(token => client.defaults.headers.requesttoken = token)

export default client
