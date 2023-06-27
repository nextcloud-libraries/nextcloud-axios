import axios from '../lib/index'
import { emit } from '@nextcloud/event-bus'

it('has garbled token in test by default', () => {
	expect(axios.defaults.headers.requesttoken).toBe('')
})

it('has the latest request token', () => {
	emit('csrf-token-update', {
		token: 'ABC123',
	})

	expect(axios.defaults.headers.requesttoken).toBe('ABC123')
})

it('has a cancel token prop', () => {
	expect(axios.CancelToken !== undefined).toBe(true)
})

it('creates a new cancel token', () => {
	const token = axios.CancelToken.source()

	expect(token !== undefined).toBe(true)
	expect(token.token !== undefined).toBe(true)
})
