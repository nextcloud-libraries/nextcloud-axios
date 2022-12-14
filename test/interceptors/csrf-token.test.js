import { onError } from '../../lib/interceptors/csrf-token'

describe('CSRF token', () => {

    let axiosMock
    let interceptor

    beforeEach(() => {
        axiosMock = jest.fn()
        axiosMock.get = jest.fn()
        axiosMock.defaults = {
            headers: {
                requesttoken: 'old',
            },
        },
        interceptor = onError(axiosMock)
    })

    it('does not retry successful requests', async () => {
        try {
            await interceptor({
                config: {},
                response: {
                    status: 200,
                    headers: {},
                },
                request: {
                    responseURL: '/some/url',
                },
            })
        } catch (e) {
            expect(e.response.status).toBe(200)
            expect(axiosMock).not.toHaveBeenCalled()
            return
        }
        fail('Should not be reached')
    })

    it('does not retry if header missing', async () => {
        try {
            await interceptor({
                config: {
                    retryIfMaintenanceMode: true,
                },
                response: {
                    status: 412,
                    headers: {},
                },
                request: {
                    responseURL: '/some/url',
                },
            })
        } catch (e) {
            expect(e.response.status).toBe(412)
            expect(axiosMock).not.toHaveBeenCalled()
            return
        }
        fail('Should not be reached')
    })

    it('does retry', async () => {
        axiosMock.mockReturnValue({
            status: 200,
        })
        axiosMock.get.mockReturnValue(Promise.resolve({
            data: {
                token: '123',
            },
            headers: {},
        }))
        const response = await interceptor({
            config: {},
            response: {
                status: 412,
                data: {
                    message: 'CSRF check failed',
                },
            },
            request: {
                responseURL: '/some/url',
            },
        })
        expect(axiosMock).toHaveBeenCalled()
        expect(axiosMock.get).toHaveBeenCalled()
        expect(axiosMock.defaults.headers.requesttoken).toBe('123')
        expect(response?.status).toBe(200)
    })

    it('intercepts a cancellation error', async () => {
        const cancelError = {
            code: 'ERR_CANCELED',
            message: 'canceled',
            name: 'CanceledError',
            stack: '',
        }
        try {
            await interceptor(cancelError)
        } catch (error) {
            expect(error).toEqual(cancelError)
            return
        }
        fail('Should not be reached')
    })
})
