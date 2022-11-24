/**
 * @jest-environment jsdom
 */

import { onError } from '../../lib/interceptors/not-logged-in'

describe('not logged in interceptor', () => {
    const original = window.location;

    beforeEach(() => {
        Object.defineProperty(window, 'location', {
            configurable: true,
            value: { reload: jest.fn() },
        });
    })

    afterEach(() => {
        Object.defineProperty(window, 'location', {
            configurable: true,
            value: original,
        });
    })

    it('does not reload arbitrary 401s', async () => {
        try {
            await onError({
                config: {},
                response: {
                    status: 401,
                    headers: {},
                },
                request: {
                    responseURL: '/some/url',
                },
            })
        } catch (e) {
            expect(e.response.status).toBe(401)
            expect(window.location.reload).not.toHaveBeenCalled()
            return
        }
        fail('Should not be reached')
    })

    it('does not reload if not asked to', async () => {
        try {
            await onError({
                config: {},
                response: {
                    status: 401,
                    data: {
                        message: 'Current user is not logged in',
                    },
                    headers: {},
                },
                request: {
                    responseURL: '/some/url',
                },
            })
        } catch (e) {
            expect(e.response.status).toBe(401)
            expect(window.location.reload).not.toHaveBeenCalled()
            return
        }
        fail('Should not be reached')
    })

    it('does reload when it should', async () => {
        try {
            await onError({
                config: {
                    reloadExpiredSession: true,
                },
                response: {
                    status: 401,
                    data: {
                        message: 'Current user is not logged in',
                    },
                    headers: {},
                },
                request: {
                    responseURL: '/some/url',
                },
            })
        } catch (e) {
            expect(e.response.status).toBe(401)
            expect(window.location.reload).toHaveBeenCalled()
            return
        }

        fail('Should not be reached because the original error shall bubble up')
    })
})
