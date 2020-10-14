import { useLocation } from 'react-router-dom'
import firebase from 'firebase/app'

export const encodeQueryParams = (obj: Record<string, any>): string => {
  const q = Object.entries(obj).map(([key, value]) => {
    if (typeof value === 'string') {
      return key + '=' + `s(${encodeURIComponent(value)})`
    } else if (typeof value === 'number') {
      return key + '=' + `n(${value})`
    } else if (value instanceof firebase.firestore.Timestamp) {
      return key + '=' + `t(${value.seconds},${value.nanoseconds})`
    } else {
      throw new Error(`unable to encode value: ${key} ${value}`)
    }
  })
  return '?' + q.join('&')
}

export const decodeQueryParams = (s: string): Record<string, any> => {
  const a = s.slice(1).split('&')
  const result = Object.fromEntries(
    a.map((comp) => {
      const [key, value] = comp.split('=')
      if (value.startsWith('n(') && value.endsWith(')')) {
        return [key, parseInt(value.slice(2, -1))]
      } else if (value.startsWith('s(') && value.endsWith(')')) {
        return [key, decodeURIComponent(value.slice(2, -1))]
      } else if (value.startsWith('t(') && value.endsWith(')')) {
        const [seconds, nanoseconds] = value.slice(2, -1).split(',')
        return [
          key,
          new firebase.firestore.Timestamp(
            parseInt(seconds),
            parseInt(nanoseconds)
          )
        ]
      } else {
        throw new Error()
      }
    })
  )
  return result
}

export const useQueryParams = () => {
  const location = useLocation()
  // console.log('useQueryParams: ', location.search)
  const params = decodeQueryParams(location.search)
  return params
}
