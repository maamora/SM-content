# ============================================================
# run-backend.ps1
# Starts the Spring Boot backend with the correct JDK 17
# Usage: .\run-backend.ps1
# ============================================================

$JDK17 = "C:\Program Files\Microsoft\jdk-17.0.19.10-hotspot"

if (-Not (Test-Path $JDK17)) {
    Write-Host "[ERROR] JDK 17 not found at: $JDK17" -ForegroundColor Red
    Write-Host "Please install JDK 17 first." -ForegroundColor Yellow
    exit 1
}

Write-Host "[INFO] Using JDK 17 at: $JDK17" -ForegroundColor Green
$env:JAVA_HOME = $JDK17
$env:PATH = "$JDK17\bin;" + $env:PATH

Write-Host "[INFO] Java version:" -ForegroundColor Cyan
java -version

Write-Host ""
Write-Host "[INFO] Starting Maamora Spring Boot backend..." -ForegroundColor Cyan
Write-Host "[INFO] API will be available at http://localhost:8080" -ForegroundColor Green
Write-Host ""

.\mvnw.cmd spring-boot:run
