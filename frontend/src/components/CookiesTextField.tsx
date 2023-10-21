import { TextField } from '@mui/material'
import * as A from 'fp-ts/Array'
import * as E from 'fp-ts/Either'
import * as O from 'fp-ts/Option'
import { pipe } from 'fp-ts/lib/function'
import { useMemo } from 'react'
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs'
import { useSubscription } from '../hooks/observable'
import { useToast } from '../hooks/toast'
import { ffetch } from '../lib/httpClient'
import { useRecoilValue } from 'recoil'
import { serverURL } from '../atoms/settings'

const validateCookie = (cookie: string) => pipe(
  cookie,
  cookie => cookie.replace(/\s\s+/g, ' '),
  cookie => cookie.replaceAll('\t', ' '),
  cookie => cookie.split(' '),
  E.of,
  E.chain(
    E.fromPredicate(
      f => f.length === 7,
      () => `missing parts`
    )
  ),
  E.chain(
    E.fromPredicate(
      f => f[0].length > 0,
      () => 'missing domain'
    )
  ),
  E.chain(
    E.fromPredicate(
      f => f[1] === 'TRUE' || f[1] === 'FALSE',
      () => `invalid include subdomains`
    )
  ),
  E.chain(
    E.fromPredicate(
      f => f[2].length > 0,
      () => 'invalid path'
    )
  ),
  E.chain(
    E.fromPredicate(
      f => f[3] === 'TRUE' || f[3] === 'FALSE',
      () => 'invalid secure flag'
    )
  ),
  E.chain(
    E.fromPredicate(
      f => isFinite(Number(f[4])),
      () => 'invalid expiration'
    )
  ),
  E.chain(
    E.fromPredicate(
      f => f[5].length > 0,
      () => 'invalid name'
    )
  ),
  E.chain(
    E.fromPredicate(
      f => f[6].length > 0,
      () => 'invalid value'
    )
  ),
)

const CookiesTextField: React.FC = () => {
  const serverAddr = useRecoilValue(serverURL)
  const { pushMessage } = useToast()

  const cookies$ = useMemo(() => new Subject<string>(), [])

  const submitCookies = (cookies: string) =>
    ffetch(`${serverAddr}/api/v1/cookies`, {
      method: 'POST',
      body: JSON.stringify({
        cookies
      })
    })()

  const validateNetscapeCookies = (cookies: string) => pipe(
    cookies,
    cookies => cookies.split('\n'),
    cookies => cookies.filter(f => !f.startsWith('\n')), // empty lines
    cookies => cookies.filter(f => !f.startsWith('# ')), // comments
    cookies => cookies.filter(Boolean), // empty lines
    A.map(validateCookie),
    A.mapWithIndex((i, either) => pipe(
      either,
      E.matchW(
        (l) => pushMessage(`Error in line ${i + 1}: ${l}`, 'warning'),
        () => E.isRight(either)
      ),
    )),
    A.filter(Boolean),
    A.match(
      () => false,
      (c) => {
        pushMessage(`Valid ${c.length} Netscape cookies`, 'info')
        return true
      }
    )
  )

  useSubscription(
    cookies$.pipe(
      debounceTime(650),
      distinctUntilChanged()
    ),
    (cookies) => pipe(
      cookies,
      validateNetscapeCookies,
      O.fromPredicate(f => f === true),
      O.match(
        () => { },
        () => submitCookies(cookies)
          .then(e => pipe(
            e,
            E.match(
              (l) => pushMessage(`${l}`, 'error'),
              () => pushMessage(`Saved Netscape cookies`, 'success')
            )
          ))
      )
    )
  )

  return (
    <TextField
      label="Netscape Cookies"
      multiline
      maxRows={20}
      minRows={8}
      fullWidth
      onChange={(e) => cookies$.next(e.currentTarget.value)}
    />
  )
}

export default CookiesTextField
