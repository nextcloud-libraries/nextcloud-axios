/**
 * @jest-environment jsdom
 */

import axios from '../lib/index'
import { emit } from '@nextcloud/event-bus'

import { onError as nliOnError } from '../lib/interceptors/not-logged-in'
import { onError as maintenanceOnError } from '../lib/interceptors/maintenance-mode'
import { onError as csrfOnError } from '../lib/interceptors/csrf-token'

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
    expect(axios.CancelToken).not.toBe(undefined)
})

it('creates a new cancel token', () => {
    const token = axios.CancelToken.source()

    expect(token).not.toBe(undefined)
    expect(token.token).not.toBe(undefined)
})

it('intercepts a cancellation error', () => {
    const cancelError = {
        code: 'ERR_CANCELED',
        message: 'canceled',
        name: 'CanceledError',
        stack: '',
    }
    const axiosMock = jest.fn()

    const interceptors = [
        nliOnError,
        maintenanceOnError(axiosMock),
        csrfOnError(axiosMock)
    ]

    interceptors.forEach(interceptor => {
        interceptor(cancelError).catch(error => {
            Object.keys(cancelError).forEach(key => {
                expect(error[key]).toBe(cancelError[key])
            })
        })
    })
})
