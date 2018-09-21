import Axios, { AxiosInstance } from 'axios'

// TODO: properly abstract
declare var OC: any

const client: AxiosInstance = Axios.create({
	headers: {
		requesttoken: OC.requestToken
	}
})

export default client
