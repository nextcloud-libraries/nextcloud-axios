import axios from '../lib/client'
import { setToken } from '@nextcloud/auth'

it('has garbled token in test by default', () => {
    expect(axios.defaults.headers.requesttoken).toStrictEqual({})
})

it('has the latest request token', () => {
    setToken('ABC123')

    expect(axios.defaults.headers.requesttoken).toBe('ABC123')
})
