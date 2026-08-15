# Supabase Pooler Configuration Reference

This note records the provider guidance used by STUDIO's local configuration template and Windows startup helper.

For persistent application traffic from an IPv4-only environment, Supabase documents its shared **Session pooler** at `aws-[region].pooler.supabase.com:5432`. The connection username must include the project reference in the form `postgres.[project-ref]`; a plain `postgres` username is not the correct shared-pooler account form.[1]

The six STUDIO database variables map to the connection string as follows:

| STUDIO variable | Session-pooler source |
| --- | --- |
| `DB_HOST` | Pooler host |
| `DB_PORT` | `5432` |
| `DB_NAME` | `postgres` unless the provider specifies otherwise |
| `DB_USERNAME` | `postgres.[project-ref]` |
| `DB_PASSWORD` | Current database password |
| `DB_SSL_MODE` | `require` |

Supabase distinguishes the database password from Data/Auth API keys. A `FATAL: password authentication failed` response requires checking the dashboard connection credentials and, if needed, resetting the database password.[1]

## Sources

[1] [Supabase: Connect to your database](https://supabase.com/docs/guides/database/connecting-to-postgres)

[2] [Supabase: Update connection pool settings](https://supabase.com/docs/guides/troubleshooting/how-do-i-update-connection-pool-settings-in-my-dashboard-wAxTJ_)
