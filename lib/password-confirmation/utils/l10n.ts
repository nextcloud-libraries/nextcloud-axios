/*!
 * SPDX-FileCopyrightText: 2022 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: MIT
 */

import { getGettextBuilder } from '@nextcloud/l10n/gettext'

const gtBuilder = getGettextBuilder()
	.detectLocale()

__TRANSLATIONS__
	.map(({ locale, translations }) => gtBuilder.addTranslation(locale, {
		translations: {
			'': Object.fromEntries(translations.map((t) => [t.msgid, t])),
		},
	}))

const gt = gtBuilder.build()

export const n = gt.ngettext.bind(gt)
export const t = gt.gettext.bind(gt)
