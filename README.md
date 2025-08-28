# hmpps-probation-frontend-components

`hmpps-probation-frontend-components` is a Node.js client library to simplify the process of incorporating global components 
within PDS applications. We welcome feedback on this Slack channel [here](https://moj.enterprise.slack.com/archives/C08RXCS63TM)
in order to improve it.

## Contents

1. [Using the library](#using-the-library)
2. [For library developers](#for-library-developers)


## Using the library

### Prerequisites

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

dev - https://probation-frontend-components-dev.hmpps.service.justice.gov.uk

preprod - https://probation-frontend-components-preprod.hmpps.service.justice.gov.uk

prod - https://probation-frontend-components.hmpps.service.justice.gov.uk

You can also add this to your `.env` or `docker-compose` files with the dev url, as follows:

```
- COMPONENT_API_URL=https://probation-frontend-components-dev.hmpps.service.justice.gov.uk
```

Add a block for the component library in the `apis` section of `server/config.ts`, for example:

```javascript
probationApi: {
  url: get('COMPONENT_API_URL', 'https://probation-frontend-components-dev.hmpps.service.justice.gov.uk', requiredInProduction),
  healthPath: '/health/ping'
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
```
```typescript
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

### CSP

The package updates the content-security-middleware to include references to the fe-components API. This package should 
be run after Helmet to prevent this being overwritten.

### Note

In the event of a failure to retrieve the components, the package will populate the html fields with fallback components.


## For library developers:

1. [Publishing to NPM](readme/publishing.md)
