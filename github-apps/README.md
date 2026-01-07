# WorldDriven GitHub Apps

This directory contains the manifest files for WorldDriven's GitHub Apps. These manifests define the permissions, events, and configuration for each app.

For how these apps fit into the overall system, see [ARCHITECTURE.md](../ARCHITECTURE.md).

## Apps Overview

| App | Purpose | Permissions |
|-----|---------|-------------|
| [worlddriven](worlddriven.json) | PR voting and auto-merge | checks, contents, issues, pull_requests, statuses, workflows |
| [worlddriven-migrate](worlddriven-migrate.json) | One-time repository transfer | administration, metadata |

## WorldDriven (Main App)

The main app handles the democratic PR management system:
- Monitors pull requests and reviews
- Calculates voting weights based on contributions
- Automatically merges PRs when voting threshold is reached
- Posts status updates and comments

**Install**: [github.com/apps/worlddriven](https://github.com/apps/worlddriven)

## WorldDriven Migrate

A minimal app for transferring repositories to the worlddriven org:
- Only used during repository migration
- Requires Administration permission to perform transfers
- Can be uninstalled after migration completes

**Install**: [github.com/apps/worlddriven-migrate](https://github.com/apps/worlddriven-migrate)

## Why Two Apps?

We use separate apps to follow the principle of least privilege:

1. **Trust**: Users are more likely to install an app with minimal permissions
2. **Security**: The main app doesn't need admin access for normal operations
3. **Clarity**: Each app has a clear, single purpose
4. **Transparency**: Users know exactly why each permission is needed

## Using Manifests

These manifests can be used with GitHub's [App Manifest Flow](https://docs.github.com/en/apps/sharing-github-apps/registering-a-github-app-from-a-manifest) to create or recreate the apps.

### Creating an App from Manifest

1. Navigate to GitHub organization settings
2. Go to Developer settings > GitHub Apps > New GitHub App
3. Or use the manifest flow programmatically:

```html
<form action="https://github.com/organizations/worlddriven/settings/apps/new" method="post">
  <input type="hidden" name="manifest" value='<JSON_MANIFEST_HERE>'>
  <button type="submit">Create GitHub App</button>
</form>
```

### Manifest Parameters

| Field | Description |
|-------|-------------|
| `name` | Display name of the app |
| `url` | Homepage URL |
| `hook_attributes.url` | Webhook endpoint URL |
| `description` | App description shown to users |
| `public` | Whether app can be installed by anyone |
| `default_events` | GitHub events the app subscribes to |
| `default_permissions` | Permissions requested by the app |

## Updating Apps

GitHub Apps cannot be updated via API. To change permissions or settings:

1. Go to [github.com/organizations/worlddriven/settings/apps](https://github.com/organizations/worlddriven/settings/apps)
2. Select the app to modify
3. Update settings manually
4. Update the manifest file in this repository to keep documentation in sync

**Note**: When permissions are added, existing installations must approve the new permissions.

## Backend Implementation

The webhook handlers for these apps are implemented in the [core repository](https://github.com/worlddriven/core):

| App | Webhook Endpoint | Handler |
|-----|------------------|---------|
| WorldDriven | `/api/webhooks/github` | `webhookHandler.js` |
| WorldDriven Migrate | `/api/webhooks/migrate` | `migrationHandler.js` |

## References

- [GitHub App Manifest Flow](https://docs.github.com/en/apps/sharing-github-apps/registering-a-github-app-from-a-manifest)
- [Permissions for GitHub Apps](https://docs.github.com/en/rest/authentication/permissions-required-for-github-apps)
- [Choosing Permissions](https://docs.github.com/en/apps/creating-github-apps/registering-a-github-app/choosing-permissions-for-a-github-app)
