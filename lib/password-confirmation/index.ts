/*!
 * SPDX-FileCopyrightText: 2020 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: MIT
 */
import Vue from 'vue'
import type { ComponentInstance } from 'vue'

import type { AxiosInstance } from '../'
import { getCurrentUser } from '@nextcloud/auth'

import PasswordDialogVue from './components/PasswordDialog.vue'
import { DIALOG_ID, MODAL_CLASS } from './globals'

interface AuthenticatedRequestState {
	promise: Promise<unknown>,
	resolve: (value: unknown) => void,
	reject: (reason?: any) => void,
}

/**
 *
 * @param mode
 * @param callback
 * @return
 */
function getPasswordDialog(callback?: (password: string) => Promise<any>): Promise<void> {
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
 * Add interceptors to an axios instance that for every request
 * will prompt for password confirmation and add it as Basic Auth.
 * @param axios
 */
export function addPasswordConfirmationInterceptors(axios: AxiosInstance): void {
	const requestState: Record<symbol, AuthenticatedRequestState> = {}
	let configResolve: any = (value: unknown) => {}

	axios.interceptors.request.use(
		async (config) => {

			return new Promise((resolve) => {
				configResolve = resolve
				if (config.confirmPasswordId !== undefined) {
					return
				}

				getPasswordDialog((password: string) => {
					const confirmPasswordId = Symbol('authenticated-request')

					configResolve({
						...config,
						confirmPasswordId,
						auth: {
							username: getCurrentUser()?.uid ?? '',
							password,
						},
					})

					requestState[confirmPasswordId] = Promise.withResolvers()

					return requestState[confirmPasswordId].promise
				})
			})
		},
		null,
		{
			runWhen(config) {
				return config.confirmPassword === true
			},
		},
	)

	axios.interceptors.response.use(
		(response) => {
			if (response.config.confirmPasswordId !== undefined) {
				requestState[response.config.confirmPasswordId].resolve(undefined)
			}

			return response
		},
		(error) => {
			if (error.config.confirmPasswordId !== undefined) {
				requestState[error.config.confirmPasswordId].reject(undefined)
			}

			return axios.request(error.config)
		},
		{
			runWhen(config) {
				return config.confirmPasswordId !== undefined
			},
		},
	)
}
