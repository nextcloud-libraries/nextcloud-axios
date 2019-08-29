import Axios, { AxiosInstance } from 'axios'
import {getRequestToken} from 'nextcloud-auth'

const client: AxiosInstance = Axios.create({
	headers: {
		requesttoken: getRequestToken()
	}
})

export default client
