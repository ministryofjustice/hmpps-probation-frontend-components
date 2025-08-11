# hmpps-probation-components

`hmpps-probation-components` is a Node.js client library to simplify the process of incorporating global components 
within PDS applications. We welcome feedback on this README [here](https://moj.enterprise.slack.com/archives/C04JFG3QJE6)
in order to improve it.

## Contents

1. [Using the library](#using-the-library)
2. [For library developers](#for-library-developers)


## Using the library

### Prerequisites

The package assumes adherance to the standard [hmpps-template-typescript](https://github.com/ministryofjustice/hmpps-template-typescript) project.
It requires:
 - a user object to be available on `res.locals` containing a token, displayName, and authSource.
 - nunjucks to be setup
 - an environment variable to be set for the micro frontend components api called `COMPONENT_API_URL`
 - to be run AFTER helmet middleware

### Installation

To install the package, run the following command:

```bash
npm install @ministryofjustice/hmpps-probation-components
```

### Usage

Currently, the package provides the header and the footer component.

To incorporate use the middleware for appropriate routes within your Express application:

```javascript
    import pdsComponents from '@ministryofjustice/hmpps-probation-components'

    ...

    app.use(pdsComponents.getPageComponents({
      pdsUrl: config.serviceUrls.digitalPrison,
      logger,
    })
  )
```

**However, please 🙏 consider carefully whether you need the components for EVERY request.**

It may be sufficient for you app to only request components for GET requests for example, in which case

```javascript
    app.get('*', pdsComponents.getPageComponents({
      pdsUrl: config.serviceUrls.digitalPrison,
      logger,
    })
  )
```

may be more appropriate, especially if you use the [PRG pattern](https://en.wikipedia.org/wiki/Post/Redirect/Get) to
handle form submission. This will help us to reduce the load on the micro frontend components API. You may wish to
go even further, for example avoiding routes that don't need components - the Prisoner Profile does
something like this to avoid the component API call for the following routes: `/api` (provides prisoner images) and `/` 
(a redirect only route).

```javascript
    app.get(
      /^(?!\/api|^\/$).*/,
      pdsComponents.getPageComponents({
        pdsUrl: config.serviceUrls.digitalProbation,
        logger,
      }),
      (req, res) => {
        res.render('probationProfile')
      },
    )
```

There are a [number of options](./src/index.ts) available depending on your requirements.

Add the `hmpps-probation-components` path to the nunjucksSetup.ts file to enable css to be loaded:

```javascript
    const njkEnv = nunjucks.configure(
  [
    path.join(__dirname, '../../server/views'),
    'node_modules/govuk-frontend/dist/',
    'node_modules/govuk-frontend/dist/components/',
    'node_modules/@ministryofjustice/frontend/',
    'node_modules/@ministryofjustice/frontend/moj/components/',
    'node_modules/@ministryofjustice/hmpps-probation-components/dist/assets/',
  ],
  {
    autoescape: true,
    express: app,
  },
)
```

Include the package scss within the all.scss file
```scss
  @import 'node_modules/@ministryofjustice/hmpps-probation-components/dist/assets/footer';
  @import 'node_modules/@ministryofjustice/hmpps-probation-components/dist/assets/header';
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

This will provide a stripped down header for if there is no user object on `res.locals`.

### CSP

The package updates the content-security-middleware to include references to the fe-components API. This package should 
be run after Helmet to prevent this being overwritten.

### Note

In the event of a failure to retrieve the components, the package will populate the html fields with fallback components.


## For library developers:

1. [Publishing to NPM](readme/publishing.md)
