// Every ts-reset rule except fetch and dom: those type Response.json() as unknown,
// which needs response validation across ~90 call sites (see PR notes).
import '@total-typescript/ts-reset/array-includes'
import '@total-typescript/ts-reset/array-index-of'
import '@total-typescript/ts-reset/filter-boolean'
import '@total-typescript/ts-reset/is-array'
import '@total-typescript/ts-reset/json-parse'
import '@total-typescript/ts-reset/map-constructor'
import '@total-typescript/ts-reset/map-has'
import '@total-typescript/ts-reset/promise-catch'
import '@total-typescript/ts-reset/set-has'
import '@total-typescript/ts-reset/storage'
