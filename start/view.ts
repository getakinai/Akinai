/*
|--------------------------------------------------------------------------
| View globals
|--------------------------------------------------------------------------
|
| Globals shared with every Edge template.
|
*/

import edge from 'edge.js'
import type { HttpContext } from '@adonisjs/core/http'
import { appName } from '#config/brand'
import { absoluteUrl } from '#utils/app_url'

edge.global('appName', appName)

/**
 * Canonical URL of the current page: `APP_URL` plus the path, without the
 * query string, so filtered and tracked variants point to one URL.
 */
edge.global('canonicalUrl', (request: HttpContext['request']) => absoluteUrl(request.url()))
