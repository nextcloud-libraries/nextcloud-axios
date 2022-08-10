# @nextcloud/axios

[![Build Status](https://travis-ci.com/nextcloud/nextcloud-axios.svg?branch=master)](https://travis-ci.com/nextcloud/nextcloud-axios)
[![npm](https://img.shields.io/npm/v/@nextcloud/axios.svg)](https://www.npmjs.com/package/@nextcloud/axios)

Simple, typed wrapper of an Axios instance for Nextcloud that automatically sends authentication headers. [Cancellation](https://github.com/axios/axios#cancellation) is supported as well.

## Installation

```sh
npm install @nextcloud/axios --save
```

```sh
yarn add @nextcloud/axios
```

## Usage

```js
import axios from '@nextcloud/axios'

axios.get('nextcloud.com')
```

See https://github.com/axios/axios for details.

### Defining `baseURL`

You are able to define [`baseURL`](https://axios-http.com/docs/config_defaults) to simplify the usage of axios across your app.

```ts
import axios from '@nextcloud/axios'
import { generateUrl } from '@nextcloud/router'

const baseURL = generateUrl('/apps/your_app_id/api')

axios.defaults.baseURL = baseURL
```

References

- [@nextcloud/router](https://github.com/nextcloud/nextcloud-router)
- [Nextcloud App Routing](https://docs.nextcloud.com/server/latest/developer_manual/basics/routing.html)
