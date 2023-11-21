import { TextField } from '@mui/material'
import * as A from 'fp-ts/Array'
import * as E from 'fp-ts/Either'
import * as O from 'fp-ts/Option'
import { pipe } from 'fp-ts/lib/function'
import { useMemo } from 'react'
import { useRecoilState, useRecoilValue } from 'recoil'
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs'
import { cookiesTemplateState } from '../atoms/downloadTemplate'
import { cookiesState, serverURL } from '../atoms/settings'
import { useSubscription } from '../hooks/observable'
import { useToast } from '../hooks/toast'
import { ffetch } from '../lib/httpClient'

const validateCookie = (cookie: string) => pipe(
  cookie,
  cookie => cookie.replace(/\s\s+/g, ' '),
  cookie => cookie.replaceAll('\t', ' '),
  cookie => cookie.split(' '),
  E.of,
  E.flatMap(
    E.fromPredicate(
      f => f.length === 7,
      () => `missing parts`
    )
  ),
  E.flatMap(
    E.fromPredicate(
      f => f[0].length > 0,
      () => 'missing domain'
    )
  ),
  E.flatMap(
    E.fromPredicate(
      f => f[1] === 'TRUE' || f[1] === 'FALSE',
      () => `invalid include subdomains`
    )
  ),
  E.flatMap(
    E.fromPredicate(
      f => f[2].length > 0,
      () => 'invalid path'
    )
  ),
  E.flatMap(
    E.fromPredicate(
      f => f[3] === 'TRUE' || f[3] === 'FALSE',
      () => 'invalid secure flag'
    )
  ),
  E.flatMap(
    E.fromPredicate(
      f => isFinite(Number(f[4])),
      () => 'invalid expiration'
    )
  ),
  E.flatMap(
    E.fromPredicate(
      f => f[5].length > 0,
      () => 'invalid name'
    )
  ),
  E.flatMap(
    E.fromPredicate(
      f => f[6].length > 0,
      () => 'invalid value'
    )
  ),
)

const CookiesTextField: React.FC = () => {
  const serverAddr = useRecoilValue(serverURL)
  const [, setCookies] = useRecoilState(cookiesTemplateState)
  const [savedCookies, setSavedCookies] = useRecoilState(cookiesState)

  const { pushMessage } = useToast()
  const flag = '--cookies=cookies.txt'

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
      cookies => {
        setSavedCookies(cookies)
        return cookies
      },
      validateNetscapeCookies,
      O.fromPredicate(f => f === true),
      O.match(
        () => setCookies(''),
        async () => {
          pipe(
            await submitCookies(cookies),
            E.match(
              (l) => pushMessage(`${l}`, 'error'),
              () => {
                pushMessage(`Saved Netscape cookies`, 'success')
                setCookies(flag)
              }
            )
          )
        }
      )
    )
  )

  return (
    <TextField
      label="Netscape Cookies"
      multiline
      maxRows={20}
      minRows={4}
      fullWidth
      defaultValue={savedCookies}
      onChange={(e) => cookies$.next(e.currentTarget.value)}
    />
  )
}

export default CookiesTextField
