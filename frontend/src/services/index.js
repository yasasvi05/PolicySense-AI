import { USE_MOCK } from '../config'
import { mockApi } from '../mock/mockApi'
import { realApi } from './realApi'

// One switch decides the data source. UI code only ever imports `api` from here.
export const api = USE_MOCK ? mockApi : realApi
export { USE_MOCK }
