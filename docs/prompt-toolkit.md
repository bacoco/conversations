# Prompt panel

The prompt panel is a side panel that helps users write better prompts. It is
front-end only: it adds no backend endpoint and no database table, and
everything it remembers (progress, favorites, "My prompts") stays in the
user's browser.

It has three spaces, reached from its home cards:

- **Coach**: grades the prompt being typed and suggests a better version
  (*Analysis*), writes versions and finds library prompts (*Prompt help*),
  offers the closest ready-made requests while typing (*As you type*) and
  reviews a whole conversation (*Session review*).
- **Course**: short lessons, review cards, quizzes and graded challenges.
- **Everyday tools**: forms that build a well-structured prompt (reply to an
  email, minutes, summary, translation…) and a library of ready-made prompts.

**Robin**, the round button at the bottom right, answers questions about the
panel and helps write any prompt.

## With or without Albert

The AI features (coach, Robin, suggestions, graded challenges, Robin's tools)
call [Albert](https://albert.sites.beta.gouv.fr/) through a small relay served
by the front-end container. The browser never sees the API key.

| Relay | What the panel offers |
| --- | --- |
| Not configured (default) | Course (lessons, cards, quizzes), tool forms, prompt library, "My prompts" |
| Configured | Everything above, plus the coach, Robin, "As you type", the graded challenges, the prompt generator, "Improve my text" and "Follow up on an answer" |

At start-up, the panel asks `/albert/status`: `204` means the relay is there,
`404` means it is not and the AI features are hidden.

## Enabling the relay

Set these environment variables on the **front-end** container:

| Variable | Required | Description |
| --- | --- | --- |
| `ALBERT_API_KEY` | yes | Albert API key. Keep it in a secret. |
| `ASSISTANT_BACKEND_URL` | yes | Backend URL reachable from the front-end container, used to check the user is logged in (`GET /api/v1.0/users/me/`). |
| `ALBERT_API_URL` | no | Default `https://albert.api.etalab.gouv.fr`. |
| `NGINX_RESOLVER` | no | DNS server used to reach the upstreams. Default: the container's own (`/etc/resolv.conf`). |

When both required variables are set, `/usr/local/bin/frontend-start` renders
`conf/templates/albert.conf.template` before starting nginx. The relay then
serves:

- `POST /albert/v1/chat/completions` (coach, Robin, generator…)
- `POST /albert/v1/embeddings` (suggestions and library search)
- `GET /albert/status`

Only logged-in users can use it (the session cookie is checked against the
backend), within a rate limit per client: 30 chat requests and 120 embedding
requests per minute, with a small burst (see `conf/default.conf`). Behind an
ingress, clients are identified by `X-Forwarded-For`.

### With Helm

The chart already passes environment variables to the front-end container:

```yaml
frontend:
  envVars:
    # The backend Service of this chart (port 80 by default).
    ASSISTANT_BACKEND_URL: http://<release>-conversations-backend:80
    ALBERT_API_KEY:
      secretKeyRef:
        name: conversations-albert
        key: apiKey
```

### Models

The front-end uses these models by default; they can be changed at build time:

| Variable (build time) | Default | Used for |
| --- | --- | --- |
| `VITE_PROMPT_COACH_MODEL` | `mistral-small-3-2-24b-instruct-2506` | analysis, rewrites, explanations |
| `VITE_PROMPT_COACH_CHAT_MODEL` | `mistral-medium-3-5` | Robin, guided completion, merge, follow-up |
| `VITE_PROMPT_COACH_EMBEDDING_MODEL` | `bge-m3` | suggestions and library search |
| `VITE_PROMPT_COACH_URL` | `/albert/v1/chat/completions` | relay address; set it to an empty value to hide the whole panel |

## Translations

The panel's texts go through `t('…')` like the rest of the interface, so
`yarn i18n:extract` picks them up for Crowdin. Their French translations were
added directly to `src/i18n/translations.json`: upload them to Crowdin before
running `yarn i18n:deploy`, which rebuilds that file from Crowdin and would
otherwise drop them.

The ready-made requests of *As you type* are not in the translation files:
they live in `src/features/prompt-toolkit/phrases/` (`fr.ts`, `en.ts`); other
languages fall back to English.
