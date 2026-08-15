# Runs: product/reference uploads, one image generation, one caption generation,
# and one PHOTO_SHOOT still job. Does not publish social content, send email, or request video.

param(
    [string]$ApiBaseUrl = "http://localhost:8080",
    [string]$ProductImagePath = (Join-Path $PSScriptRoot "frontend\public\studio\creative\arc-runner-product.jpg"),
    [string]$ModelImagePath = (Join-Path $PSScriptRoot "frontend\public\studio\creative\runner-model-reference.jpg")
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Net.Http

function Invoke-StudioApi {
    param(
        [Parameter(Mandatory = $true)][string]$Method,
        [Parameter(Mandatory = $true)][string]$Path,
        [object]$Body,
        [hashtable]$Headers = @{}
    )

    $parameters = @{
        Method = $Method
        Uri = "$ApiBaseUrl$Path"
        Headers = $Headers
        ContentType = "application/json"
    }

    if ($null -ne $Body) {
        $parameters.Body = ($Body | ConvertTo-Json -Depth 8)
    }

    return Invoke-RestMethod @parameters
}

function Upload-StudioImage {
    param(
        [Parameter(Mandatory = $true)][string]$Path,
        [Parameter(Mandatory = $true)][string]$Endpoint,
        [Parameter(Mandatory = $true)][hashtable]$Headers
    )

    if (-not (Test-Path $Path)) {
        throw "Test image was not found: $Path"
    }

    $client = [System.Net.Http.HttpClient]::new()
    $multipart = [System.Net.Http.MultipartFormDataContent]::new()
    $bytes = [System.IO.File]::ReadAllBytes((Resolve-Path $Path))
    $fileContent = [System.Net.Http.ByteArrayContent]::new($bytes)
    $fileContent.Headers.ContentType = [System.Net.Http.Headers.MediaTypeHeaderValue]::Parse("image/jpeg")
    $multipart.Add($fileContent, "file", [System.IO.Path]::GetFileName($Path))
    $client.DefaultRequestHeaders.Authorization = [System.Net.Http.Headers.AuthenticationHeaderValue]::new("Bearer", $Headers.Authorization.Substring(7))

    try {
        $response = $client.PostAsync("$ApiBaseUrl$Endpoint", $multipart).GetAwaiter().GetResult()
        $text = $response.Content.ReadAsStringAsync().GetAwaiter().GetResult()
        if (-not $response.IsSuccessStatusCode) {
            throw "Upload failed at $Endpoint ($([int]$response.StatusCode)): $text"
        }
        return ($text | ConvertFrom-Json)
    }
    finally {
        $fileContent.Dispose()
        $multipart.Dispose()
        $client.Dispose()
    }
}

Write-Host "Checking local STUDIO capabilities..." -ForegroundColor Cyan
$capabilities = Invoke-StudioApi -Method "GET" -Path "/api/system/capabilities"
$available = $capabilities.data

if (-not $available.imageGeneration -or -not $available.captionGeneration -or -not $available.photoShootGeneration) {
    throw "Required live capabilities are not all enabled. Required: imageGeneration, captionGeneration, photoShootGeneration."
}

Write-Host "Creating a disposable test account..." -ForegroundColor Cyan
$suffix = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$register = Invoke-StudioApi -Method "POST" -Path "/api/auth/register" -Body @{
    name = "STUDIO Live Smoke"
    email = "studio.live.$suffix@example.com"
    password = "StudioSmoke!2026"
}

if (-not $register.success -or [string]::IsNullOrWhiteSpace($register.data.token)) {
    throw "Registration did not return an authentication token."
}

$headers = @{ Authorization = "Bearer $($register.data.token)" }

Write-Host "Uploading the product and model reference images..." -ForegroundColor Cyan
$productUpload = Upload-StudioImage -Path $ProductImagePath -Endpoint "/api/uploads/image" -Headers $headers
$creativeProductUpload = Upload-StudioImage -Path $ProductImagePath -Endpoint "/api/uploads/creative-reference" -Headers $headers
$modelUpload = Upload-StudioImage -Path $ModelImagePath -Endpoint "/api/uploads/creative-reference" -Headers $headers

if (-not $productUpload.success -or -not $creativeProductUpload.success -or -not $modelUpload.success) {
    throw "One or more image uploads returned an unsuccessful API response."
}

Write-Host "Creating a disposable product record..." -ForegroundColor Cyan
$product = Invoke-StudioApi -Method "POST" -Path "/api/products" -Headers $headers -Body @{
    name = "Live provider smoke product $suffix"
    description = "Disposable test product for STUDIO provider verification."
    sellingPoint = "Live provider validation only"
    price = 0
    imageUrl = $productUpload.data.url
}

$templates = Invoke-StudioApi -Method "GET" -Path "/api/templates" -Headers $headers
if (-not $templates.success -or $templates.data.Count -lt 1) {
    throw "No STUDIO template was available for image generation."
}

Write-Host "Requesting one live image generation (may consume provider quota)..." -ForegroundColor Yellow
$post = Invoke-StudioApi -Method "POST" -Path "/api/posts/generate-image" -Headers $headers -Body @{
    productId = $product.data.id
    templateId = $templates.data[0].id
    badgeText = "LIVE TEST"
    promoText = "Disposable STUDIO validation"
    accentColor = "#b9ff43"
    mood = "mint"
}

if (-not $post.success) {
    throw "Image generation returned an unsuccessful API response."
}

Write-Host "Requesting one English caption generation..." -ForegroundColor Yellow
$caption = Invoke-StudioApi -Method "POST" -Path "/api/posts/generate-captions" -Headers $headers -Body @{
    postId = $post.data.id
    languages = @("en")
}

if (-not $caption.success) {
    throw "Caption generation returned an unsuccessful API response."
}

Write-Host "Requesting one product-plus-model photo-shoot still (video disabled)..." -ForegroundColor Yellow
$creativeJob = Invoke-StudioApi -Method "POST" -Path "/api/creative/jobs" -Headers $headers -Body @{
    type = "PHOTO_SHOOT"
    prompt = "Premium editorial still photograph. Keep the supplied product accurate and place it naturally with the supplied model in an olive studio, soft directional lighting, clean commercial composition."
    aspectRatio = "1:1"
    productImageUrl = $creativeProductUpload.data.url
    modelImageUrl = $modelUpload.data.url
    generateVideo = $false
}

if (-not $creativeJob.success) {
    throw "Photo-shoot request returned an unsuccessful API response."
}

$jobId = $creativeJob.data.id
$finalJob = $creativeJob
Write-Host "Polling the creative job (up to four minutes)..." -ForegroundColor Cyan
for ($attempt = 1; $attempt -le 24; $attempt++) {
    Start-Sleep -Seconds 10
    $finalJob = Invoke-StudioApi -Method "GET" -Path "/api/creative/jobs/$jobId" -Headers $headers
    $status = $finalJob.data.status
    Write-Host "  Attempt ${attempt}: $status"
    if ($status -in @("SUCCEEDED", "FAILED")) { break }
}

Write-Host "`n===== STUDIO LIVE SMOKE RESULT =====" -ForegroundColor Green
[PSCustomObject]@{
    CapabilitiesChecked = "imageGeneration, captionGeneration, photoShootGeneration"
    ProductId = $product.data.id
    GeneratedPostId = $post.data.id
    CaptionLanguages = ($caption.data.captions.PSObject.Properties.Name -join ", ")
    CreativeJobId = $jobId
    CreativeJobStatus = $finalJob.data.status
    CreativeResultUrl = $finalJob.data.resultUrl
    CreativeError = $finalJob.data.errorMessage
    SocialPublished = $false
    EmailSent = $false
    VideoRequested = $false
} | Format-List

if ($finalJob.data.status -ne "SUCCEEDED") {
    exit 2
}
