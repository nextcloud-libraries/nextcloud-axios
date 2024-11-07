/*!
 * SPDX-FileCopyrightText: 2022 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: MIT
 */

export const DIALOG_ID = 'password-confirmation-dialog'
export const MODAL_CLASS = 'modal-mask' // NcModal component root class https://github.com/nextcloud/nextcloud-vue/blob/v7.0.0-beta.2/src/components/NcModal/NcModal.vue

// theFileYouDeclaredTheCustomConfigIn.ts
declare module 'axios' {
	export interface AxiosRequestConfig {
		confirmPassword?: 'reminder'|'inRequest';
	}

	export interface InternalAxiosRequestConfig {
		confirmPasswordId?: symbol;
	}
}
