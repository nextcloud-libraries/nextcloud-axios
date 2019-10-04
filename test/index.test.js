import axios from '../lib/client'
import { emit } from '@nextcloud/event-bus'

it('has garbled token in test by default', () => {
    expect(axios.defaults.headers.requesttoken).toStrictEqual({})
})

it('has the latest request token', () => {
    emit('csrf-token-update', {
        token: 'ABC123',
    })

    expect(axios.defaults.headers.requesttoken).toBe('ABC123')
})
