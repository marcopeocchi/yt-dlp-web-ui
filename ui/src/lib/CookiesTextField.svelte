<script lang="ts">
  import { toast } from '@zerodevx/svelte-toast';
  import * as A from 'fp-ts/Array';
  import * as E from 'fp-ts/Either';
  import * as O from 'fp-ts/Option';
  import { pipe } from 'fp-ts/lib/function';
  import { get } from 'svelte/store';
  import { ffetch } from './ffetch';
  import { cookiesTemplate, serverApiEndpoint } from './store';
  import { debounce } from './utils';

  const flag = '--cookies=cookies.txt';

  let cookies = localStorage.getItem('cookies') ?? '';

  const validateCookie = (cookie: string) =>
    pipe(
      cookie,
      (cookie) => cookie.replace(/\s\s+/g, ' '),
      (cookie) => cookie.replaceAll('\t', ' '),
      (cookie) => cookie.split(' '),
      E.of,
      E.flatMap(
        E.fromPredicate(
          (f) => f.length === 7,
          () => `missing parts`,
        ),
      ),
      E.flatMap(
        E.fromPredicate(
          (f) => f[0].length > 0,
          () => 'missing domain',
        ),
      ),
      E.flatMap(
        E.fromPredicate(
          (f) => f[1] === 'TRUE' || f[1] === 'FALSE',
          () => `invalid include subdomains`,
        ),
      ),
      E.flatMap(
        E.fromPredicate(
          (f) => f[2].length > 0,
          () => 'invalid path',
        ),
      ),
      E.flatMap(
        E.fromPredicate(
          (f) => f[3] === 'TRUE' || f[3] === 'FALSE',
          () => 'invalid secure flag',
        ),
      ),
      E.flatMap(
        E.fromPredicate(
          (f) => isFinite(Number(f[4])),
          () => 'invalid expiration',
        ),
      ),
      E.flatMap(
        E.fromPredicate(
          (f) => f[5].length > 0,
          () => 'invalid name',
        ),
      ),
      E.flatMap(
        E.fromPredicate(
          (f) => f[6].length > 0,
          () => 'invalid value',
        ),
      ),
    );

  const validateNetscapeCookies = (cookies: string) =>
    pipe(
      cookies,
      (cookies) => cookies.split('\n'),
      (cookies) => cookies.filter((f) => !f.startsWith('\n')), // empty lines
      (cookies) => cookies.filter((f) => !f.startsWith('# ')), // comments
      (cookies) => cookies.filter(Boolean), // empty lines
      A.map(validateCookie),
      A.mapWithIndex((i, either) =>
        pipe(
          either,
          E.matchW(
            (l) => toast.push(`Error in line ${i + 1}: ${l}`),
            () => E.isRight(either),
          ),
        ),
      ),
      A.filter(Boolean),
      A.match(
        () => false,
        (c) => {
          toast.push(`Valid ${c.length} Netscape cookies`);
          return true;
        },
      ),
    );

  const submitCookies = (cookies: string) =>
    ffetch(`${get(serverApiEndpoint)}/api/v1/cookies`, {
      method: 'POST',
      body: JSON.stringify({
        cookies,
      }),
    })();

  const execute = (cookies: KeyboardEvent) =>
    pipe(
      cookies.target as HTMLTextAreaElement,
      (cookies) => cookies.value,
      O.fromPredicate(validateNetscapeCookies),
      O.match(
        () => cookiesTemplate.set(''),
        async (cookies) => {
          pipe(
            await submitCookies(cookies),
            E.match(
              (l) => toast.push(l),
              () => {
                toast.push(`Saved Netscape cookies`);
                cookiesTemplate.set(flag);
                localStorage.setItem('cookies', cookies);
              },
            ),
          );
        },
      ),
    );
</script>

<textarea
  cols="80"
  rows="8"
  value={cookies}
  on:keyup={debounce(execute, 500)}
/>
