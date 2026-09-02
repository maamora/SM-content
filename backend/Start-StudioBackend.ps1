# STUDIO local backend launcher — loads backend/.env without printing secrets.
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

    $value = $match.Groups["value"].Value.Trim()
    if ($value.Length -ge 2 -and
        (($value.StartsWith('"') -and $value.EndsWith('"')) -or
         ($value.StartsWith("'") -and $value.EndsWith("'")))) {
        $value = $value.Substring(1, $value.Length - 2)
    }
    $settings[$key] = $value
}

foreach ($required in @("DB_HOST", "DB_PORT", "DB_NAME", "DB_USERNAME", "DB_PASSWORD", "DB_SSL_MODE", "JWT_SECRET")) {
    if (-not $settings.ContainsKey($required) -or [string]::IsNullOrWhiteSpace($settings[$required])) {
        throw "Missing required configuration value '$required' in backend/.env."
    }
}

$jwtSecretLength = [System.Text.Encoding]::UTF8.GetByteCount($settings["JWT_SECRET"])
if ($jwtSecretLength -lt 32) {
    throw "JWT_SECRET must contain at least 32 UTF-8 bytes for secure HS256 token signing. Replace it locally with a longer random server-only value."
}

foreach ($override in @("SPRING_DATASOURCE_URL", "SPRING_DATASOURCE_USERNAME", "SPRING_DATASOURCE_PASSWORD", "SPRING_DATASOURCE_DRIVER_CLASS_NAME")) {
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

$dataSourceUrl = "jdbc:postgresql://$($settings["DB_HOST"]):$($settings["DB_PORT"])/$($settings["DB_NAME"])?sslmode=$($settings["DB_SSL_MODE"])"
$dataSourceUsername = $settings["DB_USERNAME"]
$dataSourcePassword = $settings["DB_PASSWORD"]

if ([string]::IsNullOrWhiteSpace($dataSourceUrl) -or
    [string]::IsNullOrWhiteSpace($dataSourceUsername) -or
    [string]::IsNullOrWhiteSpace($dataSourcePassword)) {
    throw "The launcher could not construct Spring datasource properties from backend/.env. Verify the DB_* entries without printing their secret values."
}

function ConvertTo-PropertiesValue([string]$value) {
    return $value.Replace("\", "\\").Replace("`r", "\r").Replace("`n", "\n")
}

function ConvertTo-ConventionalPropertyName([string]$key) {
    return $key.ToLowerInvariant().Replace("_", ".")
}

$runtimeConfigDirectory = Join-Path ([System.IO.Path]::GetTempPath()) ("studio-backend-" + [Guid]::NewGuid().ToString("N"))
$runtimeConfigPath = Join-Path $runtimeConfigDirectory "application.properties"
New-Item -ItemType Directory -Path $runtimeConfigDirectory -Force | Out-Null

$runtimeProperties = New-Object 'System.Collections.Generic.List[string]'

# Preserve every dotenv entry for application.yml placeholders. The explicitly
# resolved Spring datasource keys are deliberately added last so they override
# any stale environment inherited by Maven or its Java subprocess.
foreach ($entry in $settings.GetEnumerator()) {
    $runtimeProperties.Add("$($entry.Key)=$(ConvertTo-PropertiesValue $entry.Value)")
    $runtimeProperties.Add("$(ConvertTo-ConventionalPropertyName $entry.Key)=$(ConvertTo-PropertiesValue $entry.Value)")
}

$springPropertyAliases = @{
    "JWT_SECRET" = @("app.jwt.secret")
    "JWT_EXPIRATION_MS" = @("app.jwt.expiration-ms")
    "IMAGE_PROVIDER" = @("app.image.provider")
    "IMAGE_PROVIDER_FALLBACK" = @("app.image.fallback-provider")
    "FAL_REFERENCE_MODE" = @("app.fal-reference-mode")
    "CAPTION_PROVIDER" = @("app.caption.provider")
    "STORAGE_LOCAL_PATH" = @("app.storage.local-path")
    "STORAGE_PUBLIC_BASE_URL" = @("app.storage.public-base-url")
    "CLOUDINARY_CLOUD_NAME" = @("app.cloudinary.cloud-name")
    "CLOUDINARY_API_KEY" = @("app.cloudinary.api-key")
    "CLOUDINARY_API_SECRET" = @("app.cloudinary.api-secret")
    "CORS_ALLOWED_ORIGINS" = @("app.cors.allowed-origins")
    "SMTP_HOST" = @("spring.mail.host")
    "SMTP_PORT" = @("spring.mail.port")
    "SMTP_USERNAME" = @("spring.mail.username")
    "SMTP_PASSWORD" = @("spring.mail.password")
    "SMTP_AUTH" = @("spring.mail.properties.mail.smtp.auth")
    "SMTP_STARTTLS" = @("spring.mail.properties.mail.smtp.starttls.enable")
    "SMTP_FROM" = @("app.mail.from")
    "APP_MAIL_FROM" = @("app.mail.from")
    "ADMIN_EMAIL" = @("app.admin.email")
    "ADMIN_PASSWORD" = @("app.admin.password")
}

foreach ($entry in $springPropertyAliases.GetEnumerator()) {
    if (-not $settings.ContainsKey($entry.Key)) { continue }
    foreach ($propertyName in $entry.Value) {
        $runtimeProperties.Add("$propertyName=$(ConvertTo-PropertiesValue $settings[$entry.Key])")
    }
}

@(
    "spring.datasource.url=$(ConvertTo-PropertiesValue $dataSourceUrl)",
    "spring.datasource.username=$(ConvertTo-PropertiesValue $dataSourceUsername)",
    "spring.datasource.password=$(ConvertTo-PropertiesValue $dataSourcePassword)",
    "spring.datasource.driver-class-name=org.postgresql.Driver"
) | ForEach-Object { $runtimeProperties.Add($_) }

[System.IO.File]::WriteAllLines(
    $runtimeConfigPath,
    $runtimeProperties,
    [System.Text.UTF8Encoding]::new($false)
)

# Spring config locations are ordered by precedence. Retain the packaged
# application.yml, then load the per-launch properties file last so its
# resolved datasource settings override the placeholder-based defaults.
$runtimeConfigLocation = ([System.Uri]::new($runtimeConfigPath)).AbsoluteUri
$configLocations = "classpath:/application.yml,$runtimeConfigLocation"
$jvmArguments = @(
    "-Dspring.config.location=$configLocations",
    "-Dspring.datasource.url=$dataSourceUrl",
    "-Dspring.datasource.username=$dataSourceUsername",
    "-Dspring.datasource.password=$dataSourcePassword",
    "-Dspring.datasource.driver-class-name=org.postgresql.Driver"
) -join " "

Write-Host "STUDIO configuration loaded from backend/.env. Prepared datasource target for $($settings["DB_HOST"]):$($settings["DB_PORT"])/$($settings["DB_NAME"]). Starting Spring Boot on http://localhost:8080..." -ForegroundColor Green
Push-Location $PSScriptRoot
try {
    & .\mvnw.cmd "-Dspring-boot.run.jvmArguments=$jvmArguments" spring-boot:run
    exit $LASTEXITCODE
}
finally {
    Pop-Location
    Remove-Item -LiteralPath $runtimeConfigDirectory -Recurse -Force -ErrorAction SilentlyContinue
}
