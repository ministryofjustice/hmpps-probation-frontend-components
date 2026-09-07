# Using the library

## Starting from scratch

For any service starting from scratch, they can fork from this project: [hmpps-probation-typescript](https://github.com/ministryofjustice/hmpps-probation-typescript/) which is a fork of the original [hmpps-template-typescript](https://github.com/ministryofjustice/hmpps-template-typescript) project.

So it has all requirements HMPPS services buth with the header and footer components already configured in.

[Learn more about how to obtain a Client ID](#how-to-obtain-client-id)

## Adapting an existing project

paragraph about the different type of installation:

1) project based on existing typescript template
2) project based on old javascript architecture


### How to implement it for TypeScript-based projects

#### Prerequisites

The package assumes adherance to the standard [hmpps-template-typescript](https://github.com/ministryofjustice/hmpps-template-typescript) project.
It requires:
- a user object to be available on `res.locals` containing a token and displayName.
- nunjucks to be setup
- the environment variable `COMPONENT_API_URL` to be set for each environment
- the environment variables `AUTH_CODE_CLIENT_ID` and `AUTH_CODE_CLIENT_SECRET` to be set to allow authenticating with the dev environment locally
- the environment variable `HMPPS_AUTH_URL` to be set to `https://sign-in-dev.hmpps.service.justice.gov.uk/auth` to authenticate with the dev environment locally
- to be run AFTER helmet middleware

### Installation

To install the package, run the following command:

```bash
npm install @ministryofjustice/hmpps-probation-frontend-components
```

### Usage

Add environment variables to the `helm_deploy/values-{env}.yaml` files for `COMPONENT_API_URL`. Populate with the following values:

local - http://localhost:3001 - Only if you have an instance of the HMPPS Probation frontend API running on the same machine, otherwise favour the dev environment locally

dev - https://probation-frontend-components-dev.hmpps.service.justice.gov.uk

preprod - https://probation-frontend-components-preprod.hmpps.service.justice.gov.uk

prod - https://probation-frontend-components.hmpps.service.justice.gov.uk

You can also add this to your `.env` or `docker-compose` files with the dev url, as follows:

```
- COMPONENT_API_URL=https://probation-frontend-components-dev.hmpps.service.justice.gov.uk
```

Add a block for the component library in the `apis` section of `server/config.ts`, for example:

```javascript
  apis: {
    [...]
    probationApi: {
      url: get('COMPONENT_API_URL', 'https://probation-frontend-components-dev.hmpps.service.justice.gov.uk', requiredInProduction),
      healthPath: '/health/ping'
    }
    [...]
}
```

Currently, the package provides the header and the footer component.

To incorporate use the middleware for appropriate routes within your Express application (after the `setUpCurrentUser` middleware):

```javascript
    import pdsComponents from '@ministryofjustice/hmpps-probation-frontend-components'

    ...

    app.use(pdsComponents.getPageComponents({
      pdsUrl: config.apis.probationApi.url,
      logger,
    }))
```

**However, please 🙏 consider carefully whether you need the components for EVERY request.**

It may be sufficient for you app to only request components for GET requests for example, in which case

```javascript
    app.get('*', pdsComponents.getPageComponents({
      pdsUrl: config.apis.probationApi.url,
      logger,
    })
  )
```

Add the `hmpps-probation-frontend-components` path to the nunjucksSetup.ts file to enable css to be loaded:

```javascript
    const njkEnv = nunjucks.configure(
  [
    path.join(__dirname, '../../server/views'),
    'node_modules/govuk-frontend/dist/',
    'node_modules/govuk-frontend/dist/components/',
    'node_modules/@ministryofjustice/frontend/',
    'node_modules/@ministryofjustice/frontend/moj/components/',
    'node_modules/@ministryofjustice/hmpps-probation-frontend-components/dist/assets/',
  ],
  {
    autoescape: true,
    express: app,
  },
)
```

Include the package scss within the `index.scss` file
```scss
  @import 'node_modules/@ministryofjustice/hmpps-probation-frontend-components/dist/assets/footer';
  @import 'node_modules/@ministryofjustice/hmpps-probation-frontend-components/dist/assets/header';
```

Include reference to the components in your layout.njk file:

```typescript
{% for js in feComponents.jsIncludes %}
    <script src="{{ js }}" nonce="{{ cspNonce }}"></script>
{% endfor %}

{% for css in feComponents.cssIncludes %}
    <link href="{{ css }}" nonce="{{ cspNonce }}" rel="stylesheet" />
{% endfor %}
```

```typescript
{% block header %}
  {{ feComponents.header | safe }}
{% endblock %}

{% block footer %}
    {{ feComponents.footer | safe }}
{% endblock %}
```

### Extra calls

It may be that you need to add some extra requests for the page components for pages that do not fit the normal flow
of routes. e.g. in `setUpAuthentication.ts` on the `/autherror` path:

```javascript
      router.get(
       '/autherror',
       pdsComponents.getPageComponents({ pdsUrl: config.serviceUrls.digitalProbation }),
       (req, res) => {
         res.status(401)
         return res.render('autherror')
       },
      )
```

This will provide a stripped down header if there is no user object on `res.locals`.

### How to implement it for Javascript-based older projects

### CSP

The package updates the content-security-middleware to include references to the fe-components API. This package must be run after Helmet to prevent this being overwritten. Else additional headers need to be included manually by the service.

E.G: [See configuration example](https://github.com/ministryofjustice/hmpps-probation-supervision-contacts-ui/blob/550906c1bec807798867bec56b01d427ab19aa09/server/middleware/setUpWebSecurity.ts#L32)

### Note

In the event of a failure to retrieve the components, the package will populate the html fields with fallback components.

The fall back component for the header will render a banner which show the logged in user's details with links to signout and profile but will not be able to render any menu links as it will not be able to check user's credentials whereas the fallback footer component will render an empty element as none of the links will be available.

## Using wiremock with HMPPS Auth

This is the preferred technique if the service does not rely on real users or external services, or if external services are mocked by wiremock.

To implement this:
1. Add the HMPPS Auth in the local docker stack
    ```
    hmpps-auth:
        image: ghcr.io/ministryofjustice/hmpps-auth:<latest-hmpps-auth-version>
        # latest version can be found at
        networks:
        - hmpps
        container_name: hmpps-auth
        depends_on:
        - delius
        ports:
        - "8080:8080"
        healthcheck:
        test: ["CMD", "curl", "-f", "http://localhost:8080/auth/health"]
        environment:
        - SERVER_PORT=8080
        - SPRING_PROFILES_ACTIVE=dev,delius,manage-users-api
        - APPLICATION_AUTHENTICATION_UI_ALLOWLIST=0.0.0.0/0
        - LOGGING_LEVEL_ORG_SPRINGFRAMEWORK_SECURITY=DEBUG
        - DELIUS_ENDPOINT_URL=http://<wiremock-container-name>:<wiremock-container-port>
        - MANAGE_USERS_API_ENDPOINT_URL=http://<wiremock-container-name>:<wiremock-container-port>
    ```

   [See configuration example](https://github.com/ministryofjustice/hmpps-probation-frontend-component-api/blob/f2f7c3c8db5f6ab20796b0027b118b8eaf962447/docker-compose.deps.yml#L19)


2. Configure that container to point HMPPS Auth's delius setting to wire mocks by specifically those environment variable on the container defined above.
    ```
        - DELIUS_ENDPOINT_URL=http://<wiremock-container-name>:<wiremock-container-port>
        - MANAGE_USERS_API_ENDPOINT_URL=http://<wiremock-container-name>:<wiremock-container-port>
    ```

   [See configuration example](https://github.com/ministryofjustice/hmpps-probation-frontend-component-api/blob/f2f7c3c8db5f6ab20796b0027b118b8eaf962447/docker-compose.deps.yml#L35)
3. Set up the required endpoint on wiremock for simulating NDelius
    ```
        delius:
            image: wiremock/wiremock
            networks:
            - hmpps
            volumes:
            - ./<local-wiremock-folder>:/home/wiremock
            command:
            - -verbose
            - -global-response-templating
    ```

   [See configuration example](https://github.com/ministryofjustice/hmpps-probation-frontend-component-api/blob/f2f7c3c8db5f6ab20796b0027b118b8eaf962447/docker-compose.deps.yml#L9)
4. Create the fake users and map their roles

    In this folder you will have to create a few end points to simulate NDelius that HMPPS Auth needs.

    A. Add the end point HMPPS Auth uses to discover every Delius groups and their nomis mappings. This must be set at this location: `./<local-wiremock-folder>`/mappings/delius-roles.json

    ```
        {
          "priority": 1,
          "request": {
            "method": "GET",
            "urlPattern": "/roles/delius"
          },
          "response": {
            "status": 200,
            "headers": {
              "Content-Type": "application/json"
            },
            "jsonBody": {
              "DELIUS_ROLE_CODE": ["NOMIS_MAPPED_ROLE"],
              "DELIUS_LICENCE_CA": ["ROLE_LICENCE_CA"],
              [...]
            }
          }
        }
    ```

    The fake response should have as many Groups/Roles as your application need.


    B. Add the end points use to verify the credentials for each fake users. This must be located at `./<local-wiremock-folder>`/mappings/users.json

    ```
        {
          "mappings": [
            {
              "request": {
                "urlPattern": "/authenticate",
                "method": "POST",
                "bodyPatterns": [
                  {
                    "equalToJson": "{\"username\":\"MY.USERNAME\",\"password\":\"secret\"}"
                  }
                ]
              },
              "response": {
                "status": 200
              }
            },
            [...]
          ]
        }
    ```

    Feel free to replace the username (MY.USERNAME) and password with your own as required for your fixture.


    C. Add the end point bringing the user's profile for that given username on a config at location like

    ```
        {
          "mappings": [
            {
              "request": {
                "urlPattern": "/user/my.username",
                "method": "GET"
              },
              "response": {
                "status": 200,
                "jsonBody": {
                  "userId": 2500099998,
                  "username": "my.username",
                  "firstName": "My",
                  "surname": "Username",
                  "email": "my.userane@justice.gov.uk",
                  "enabled": true,
                  "roles": ["DELIUS_ROLE_CODE", "DELIUS_LICENCE_CA"]
                },
                "headers": {
                  "Content-Type": "application/json"
                }
              }
            },
            [...]
          ]
        }
    ```

    The username, `my.username` and groups/roles must be adapted per your need and multiple profiles can be set in the same file.


    D. Simulate the health check end point that HMPPS Auth poke at startup

    ```
        {
          "request": {
            "method": "GET",
            "url": "/health/ping"
          },
          "response": {
            "headers": {
              "Content-Type": "text/plain"
            },
            "status": 200,
            "body": "pong"
          }
        }
    ```

    E. respond to the randomised health check requests

    ```
        {
          "mappings": [
            {
              "request": {
                "urlPattern": "/health.*",
                "method": "GET"
              },
              "response": {
                "status": 200
              }
            }
          ]
        }

    ```

   [See configuration example](https://github.com/ministryofjustice/hmpps-probation-frontend-component-api/blob/main/wiremock-delius/mappings/health.json)



## Using real HMPPS Auth
If your service relies on other service that can't be stubbed out or need a record from a database, you may need to create a real user in the dev/test environment.

To do so we need to raise a Pull Request against the [test user file](https://github.com/ministryofjustice/hmpps-auth/blob/main/src/main/resources/db/dev/data/auth/V900_3__users.sql) either directly or on the [#hmpps-auth-audit-registers](https://moj.enterprise.slack.com/archives/C02S71KUBED) channel.

Using this method is the most straight forward but the least flexible. You will not be able to point this setup against a local HMPPS Probation Frontend API instance but it will work against DEV/PREPROD providing that a valid HMPPS Auth client and secret are provided.

[Learn more about how to obtain a Client ID](#how-to-obtain-client-id)

## Hybrid approach
The hybrid approach will allow for services to use fake user along with real developer services so long that they do not share real user ID.
Note: some real services when loading their dev profile returns fixtures based on fake user IDs.

## <a id="how-to-obtain-client-id"></a>How to obtain a client ID
By default, services reuse the client ID provided by the [hmpps-template-typescript template](https://github.com/ministryofjustice/hmpps-template-typescript) (hmpps-typescript-template).
This client ID works well by default, redirecting for http://localhost:3000 and http://localhost:3001/sign-in/callback but is shared with many services so it cannot be modified.

If you required custom client ID for your application in Dev/Test environment, you have to modify the [registered client ID fixture file](https://github.com/ministryofjustice/hmpps-auth/blob/main/src/main/resources/db/dev/data/auth/V900_8__registered_clients.sql) if you have access to this project.

Else, you can raise a request onto the [#hmpps-identity-public channel](https://moj.enterprise.slack.com/archives/C08FLTMJR8F) by providing:

1) the client ID you wish to have
2) the team/service you represent
3) the redirect URLs you want associated with your client ID
