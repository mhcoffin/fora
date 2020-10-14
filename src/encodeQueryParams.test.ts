import { decodeQueryParams, encodeQueryParams } from './encodeQueryParams'
import firebase from 'firebase/app'
import 'firebase/firestore'

describe('encodeQueryParams', () => {
  it('encodes strings', () => {
    const a = { k1: 'value1', k2: 'value2' }
    expect(decodeQueryParams(encodeQueryParams(a))).toEqual(a)
  })
  it('encodes numbers', () => {
    const a = { k1: 17, k2: 'value2' }
    expect(decodeQueryParams(encodeQueryParams(a))).toEqual(a)
  })
  it('encodes timestamps', () => {
    const a = { tm: firebase.firestore.Timestamp.now() }
    expect(decodeQueryParams(encodeQueryParams(a))).toEqual(a)
  })
  it('encodes and decodes multiple fields', () => {
    const a = {
      a: 'here is a string',
      b: 'another string',
      c: 13,
      d: firebase.firestore.Timestamp.now(),
      e: -2
    }
    expect(decodeQueryParams(encodeQueryParams(a))).toEqual(a)
  })
})
