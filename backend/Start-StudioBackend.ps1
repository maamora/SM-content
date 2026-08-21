# STUDIO local backend launcher — runs a non-sensitive .env preflight before Spring Boot.
[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"
$envPath = Join-Path $PSScriptRoot ".env"

if (-not (Test-Path -LiteralPath $envPath)) {
    throw "Missing backend/.env. Copy .env.example to .env, add your local or provider values, and run this script again."
}

$settings = @{}
Get-Content -LiteralPath $envPath | ForEach-Object {
    $line = $_.Trim()
    if ([string]::IsNullOrWhiteSpace($line) -or $line.StartsWith("#")) { return }

    $match = [regex]::Match($line, '^(?<key>[A-Za-z_][A-Za-z0-9_]*)=(?<value>.*)$')
    if (-not $match.Success) { return }

    $key = $match.Groups["key"].Value
    if ($settings.ContainsKey($key)) {
        throw "Duplicate configuration key '$key' in backend/.env. Keep exactly one entry per key."
    }
    $settings[$key] = $match.Groups["value"].Value.Trim()
}

foreach ($required in @("DB_HOST", "DB_PORT", "DB_NAME", "DB_USERNAME", "DB_PASSWORD", "DB_SSL_MODE", "JWT_SECRET")) {
    if (-not $settings.ContainsKey($required) -or [string]::IsNullOrWhiteSpace($settings[$required])) {
        throw "Missing required configuration value '$required' in backend/.env."
    }
}

foreach ($entry in $settings.GetEnumerator()) {
    $value = $entry.Value
    if ($value.Length -ge 2 -and
        (($value.StartsWith('"') -and $value.EndsWith('"')) -or
         ($value.StartsWith("'") -and $value.EndsWith("'")))) {
        $value = $value.Substring(1, $value.Length - 2)
    }

    [Environment]::SetEnvironmentVariable($entry.Key, $value, 'Process')
}

$jwtSecretLength = [System.Text.Encoding]::UTF8.GetByteCount($settings["JWT_SECRET"])
if ($jwtSecretLength -lt 32) {
    throw "JWT_SECRET must contain at least 32 UTF-8 bytes for secure HS256 token signing. Replace it locally with a longer random server-only value."
}

foreach ($override in @("SPRING_DATASOURCE_URL", "SPRING_DATASOURCE_USERNAME", "SPRING_DATASOURCE_PASSWORD")) {
    if ($settings.ContainsKey($override)) {
        throw "Remove '$override' from backend/.env. STUDIO uses DB_* variables only."
    }
    if (Test-Path "Env:$override") {
        Remove-Item "Env:$override" -ErrorAction Stop
    }
}

if ($settings["DB_HOST"] -match '\.pooler\.supabase\.com$' -and $settings["DB_USERNAME"] -notmatch '^postgres\.[A-Za-z0-9_-]+$') {
    throw "A Supabase shared pooler requires DB_USERNAME in the form postgres.[project-ref], not plain postgres."
}

if ($settings["DB_SSL_MODE"] -ne "require" -and $settings["DB_HOST"] -match '\.supabase\.com$') {
    throw "Set DB_SSL_MODE=require for a Supabase connection."
}

Write-Host "STUDIO configuration loaded from backend/.env. Starting Spring Boot on http://localhost:8080..." -ForegroundColor Green
Push-Location $PSScriptRoot
try {
    & .\mvnw.cmd spring-boot:run
    exit $LASTEXITCODE
}
finally {
    Pop-Location
}
