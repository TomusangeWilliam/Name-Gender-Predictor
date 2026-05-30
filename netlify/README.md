Netlify deployment helper

This folder contains Netlify deployment configuration.

- Update `netlify.toml` build `command` and `publish` directory to match your project.
- Place serverless functions in the `functions/` subfolder.

Quick deploy steps:
1. Push this repo to Git (if not already).
2. In Netlify UI, "New site from Git" -> connect your repo.
3. Set build command and publish directory as in `netlify/netlify.toml` (or leave blank to use file).
4. Deploy.
