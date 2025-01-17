# `@perfsee/sdk`

> Perfsee sdk and command line tools

## Installation

```
npm install -g @perfsee/sdk
```

## Usage

### Take snapshot

Take a snapshot for all pages of the project.

```
perfsee take-snapshot -p <your-project-id> --token <your-access-token>
```

This command requires the project id from `-p, --project` and the access token
from `--token` or environment variable `PERFSEE_TOKEN`, you can create the token
from [https://perfsee.512.pub/access-token](https://perfsee.512.pub/access-token).

You can filter the pages by appending page names to the command.

For example take a snapshot for `Home Page` and `User Page`:

```
perfsee take-snapshot -p <your-project-id> --token <your-access-token> "Home Page" "User Page"
```

### Webhook type

This package also provides TypeScript definitions for the Perfsee webhook.

You can use it on your webhook server with the code below. Learn more in our [Webhook Guide](https://perfsee.com/docs/settings/webhook-setting).

```ts
import express from 'express'
import { WebhookEvent } from '@perfsee/sdk'

const app = express()

app.post('/callback', express.json(), function (req, res) {
  const json = req.body as WebhookEvent
  console.log(json)
})

app.listen(3001)
```

## License

This project is licensed under the [Apache-2.0 License](LICENSE).
