import { generateUrl } from '@nextcloud/router'

const RETRY_KEY = Symbol('csrf-retry')

export const onError = axios => async (error) => {
	const { config, response, request: { responseURL } } = error
	const { status } = response

	if (status === 412
		&& response?.data?.message === 'CSRF check failed'
		&& config[RETRY_KEY] === undefined) {
		console.warn(`Request to ${responseURL} failed because of a CSRF mismatch. Fetching a new token`)

		const { data: { token } } = await axios.get(generateUrl('/csrftoken'))
		console.debug(`New request token ${token} fetched`)
		axios.defaults.headers.requesttoken = token

		return axios({
			...config,
			headers: {
				...config.headers,
				requesttoken: token,
			},
			[RETRY_KEY]: true,
		})
	}

	return Promise.reject(error)
}
