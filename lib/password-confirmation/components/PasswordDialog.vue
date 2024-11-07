<!--
 - SPDX-FileCopyrightText: 2022 Nextcloud GmbH and Nextcloud contributors
 - SPDX-License-Identifier: MIT
 -->

<template>
	<NcDialog :id="dialogId"
		:name="t('Confirm your password')"
		:container="null"
		content-classes="vue-password-confirmation"
		@update:open="close">
		<!-- Dialog content -->
		<p>{{ t('This action needs authentication') }}</p>
		<form class="vue-password-confirmation__form" @submit.prevent="confirm">
			<NcPasswordField ref="field"
				:value.sync="password"
				:label="t('Password')"
				:helper-text="helperText"
				:error="showError"
				required />
			<NcButton class="vue-password-confirmation__submit"
				type="primary"
				native-type="submit"
				:disabled="!password || loading">
				<template v-if="loading" #icon>
					<NcLoadingIcon :size="20" />
				</template>
				{{ t('Confirm') }}
			</NcButton>
		</form>
	</NcDialog>
</template>

<script lang="ts">
import axios from '../../'
import NcButton from '@nextcloud/vue/dist/Components/NcButton.js'
import NcDialog from '@nextcloud/vue/dist/Components/NcDialog.js'
import NcLoadingIcon from '@nextcloud/vue/dist/Components/NcLoadingIcon.js'
import NcPasswordField from '@nextcloud/vue/dist/Components/NcPasswordField.js'
import { generateUrl } from '@nextcloud/router'
import { defineComponent } from 'vue'
import { DIALOG_ID } from '../globals.js'
import { t } from '../utils/l10n.js'

import type { ComponentInstance } from 'vue'

type ICanFocus = ComponentInstance & {
	focus: () => void
	select: () => void
}

export default defineComponent({
	name: 'PasswordDialog',

	components: {
		NcButton,
		NcDialog,
		NcLoadingIcon,
		NcPasswordField,
	},

	props: {
		callback: {
			type: Function,
			required: true,
		},
	},

	setup() {
		// non reactive props
		return {
			dialogId: DIALOG_ID,
		}
	},

	data() {
		return {
			password: '',
			loading: false,
			showError: false,
		}
	},

	computed: {
		helperText() {
			if (this.showError) {
				return this.password === '' ? t('Please enter your password') : t('Wrong password')
			}
			if (this.loading) {
				return t('Checking password …') // TRANSLATORS: This is a status message, shown when the system is checking the users password
			}
			return ''
		},
	},

	mounted() {
		this.focusPasswordField()
	},

	methods: {
		t,

		async confirm(): Promise<void> {
			this.showError = false
			this.loading = true

			if (this.password === '') {
				this.showError = true
				return
			}

			try {
				await this.callback(this.password)
				this.$emit('confirmed')
			} catch (e) {
				this.showError = true
				this.selectPasswordField()
			} finally {
				this.loading = false
			}
		},

		close(open: boolean): void {
			if (!open) {
				this.$emit('close')
			}
		},

		focusPasswordField() {
			this.$nextTick(() => {
				(this.$refs.field as ICanFocus).focus()
			})
		},

		selectPasswordField() {
			this.$nextTick(() => {
				(this.$refs.field as ICanFocus).select()
			})
		},
	},
})
</script>

<style lang="scss">
.vue-password-confirmation {
	display: flex;
	flex-direction: column;
	margin-inline: 6px;
	margin-block-end: 6px;
	gap: 10px 0;

	&__form {
		display: flex;
		flex-direction: column;
		gap: 8px 0;
		// allow focus visible outlines
		padding: 2px;
	}

	&__submit {
		align-self: end;
	}
}
</style>
