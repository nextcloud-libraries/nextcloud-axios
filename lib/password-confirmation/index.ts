/*!
 * SPDX-FileCopyrightText: 2020 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: MIT
 */
import Vue from 'vue'
import type { ComponentInstance } from 'vue'

import type { AxiosInstance, InternalAxiosRequestConfig } from '../'
import { getCurrentUser } from '@nextcloud/auth'

import PasswordDialogVue from './components/PasswordDialog.vue'
import { DIALOG_ID, MODAL_CLASS } from './globals'
import { generateUrl } from '@nextcloud/router'

const PAGE_LOAD_TIME = Date.now()

interface AuthenticatedRequestState {
	promise: Promise<void>,
	resolve: () => void,
	reject: () => void,
}

/**
 * Check if password confirmation is required according to the last confirmation time.
 * Use as a replacement of deprecated `OC.PasswordConfirmation.requiresPasswordConfirmation()`.
 * Not needed if `confirmPassword()` can be used, because it checks requirements itself.
 *
 * @return {boolean} Whether password confirmation is required or was confirmed recently
 */
export const isPasswordConfirmationRequired = (): boolean => {
	const serverTimeDiff = PAGE_LOAD_TIME - (window.nc_pageLoad * 1000)
	const timeSinceLogin = Date.now() - (serverTimeDiff + (window.nc_lastLogin * 1000))

	// If timeSinceLogin > 30 minutes and user backend allows password confirmation
	return (window.backendAllowsPasswordConfirmation && timeSinceLogin > 30 * 60 * 1000)
}

/**
 *
 * @param mode
 * @param callback
 * @return
 */
function getPasswordDialog(callback: (password: string) => Promise<void>): Promise<void> {
	const isDialogMounted = Boolean(document.getElementById(DIALOG_ID))
	if (isDialogMounted) {
		return Promise.reject(new Error('Password confirmation dialog already mounted'))
	}

	const mountPoint = document.createElement('div')
	mountPoint.setAttribute('id', DIALOG_ID)

	const modals = Array.from(document.querySelectorAll(`.${MODAL_CLASS}`) as NodeListOf<HTMLElement>)
		// Filter out hidden modals
		.filter((modal) => modal.style.display !== 'none')

	const isModalMounted = Boolean(modals.length)

	if (isModalMounted) {
		const previousModal = modals[modals.length - 1]
		previousModal.prepend(mountPoint)
	} else {
		document.body.appendChild(mountPoint)
	}

	const DialogClass = Vue.extend(PasswordDialogVue)
	// Mount point element is replaced by the component
	const dialog = (new DialogClass({ propsData: { callback } }) as ComponentInstance).$mount(mountPoint)

	return new Promise((resolve, reject) => {
		dialog.$on('confirmed', () => {
			dialog.$destroy()
			resolve()
		})
		dialog.$on('close', () => {
			dialog.$destroy()
			reject(new Error('Dialog closed'))
		})
	})
}

/**
 * Add interceptors to an axios instance that will ask for
 * password confirmation to add it as Basic Auth for every requests.
 * @param axios
 */
export function addPasswordConfirmationInterceptors(axios: AxiosInstance): void {
	// We should never have more than one request waiting for password confirmation
	// but in doubt, we use a map to store the state of potential synchronous requests.
	const requestState: Record<symbol, AuthenticatedRequestState> = {}
	const resolveConfig: Record<symbol, (value: InternalAxiosRequestConfig) => void> = {}

	axios.interceptors.request.use(
		async (config) => {
			const confirmPasswordId = config.confirmPasswordId ?? Symbol('authenticated-request')

			return new Promise((resolve) => {
				resolveConfig[confirmPasswordId] = resolve

				if (config.confirmPasswordId !== undefined) {
					return
				}

				getPasswordDialog(async (password: string) => {
					if (config.confirmPassword === 'reminder') {
						if (isPasswordConfirmationRequired()) {
							const url = generateUrl('/login/confirm')
							const { data } = await axios.post(url, { password })
							window.nc_lastLogin = data.lastLogin
						}

						resolveConfig[confirmPasswordId](config)
					} else {
						// We store all the necessary information to resolve or reject
						// the password confirmation in the response interceptor.
						requestState[confirmPasswordId] = Promise.withResolvers()

						// Resolving the config will trigger the request.
						resolveConfig[confirmPasswordId]({
							...config,
							confirmPasswordId,
							auth: {
								username: getCurrentUser()?.uid ?? '',
								password,
							},
						})

						await requestState[confirmPasswordId].promise
						window.nc_lastLogin = Date.now() / 1000
					}
				})
			})
		},
		null,
		{
			runWhen(config) {
				return config.confirmPassword !== undefined
			},
		},
	)

	axios.interceptors.response.use(
		(response) => {
			if (response.config.confirmPasswordId !== undefined) {
				requestState[response.config.confirmPasswordId].resolve()
				delete requestState[response.config.confirmPasswordId]
			}

			return response
		},
		(error) => {
			if (error.config.confirmPasswordId === undefined) {
				return error
			}

			if (error.response?.status !== 403 || error.response.data.message !== 'Password confirmation is required') {
				return error
			}

			// If the password confirmation failed, we reject the promise and trigger another request.
			// That other request will go through the password confirmation flow again.
			requestState[error.config.confirmPasswordId].reject()
			delete requestState[error.config.confirmPasswordId]
			return axios.request(error.config)
		},
	)
}
