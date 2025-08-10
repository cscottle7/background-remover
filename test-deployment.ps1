# PowerShell script to test Vercel deployment
Set-Location "C:\Users\cscot\Documents\Apps\Remove background"

Write-Host "🚀 Testing Vercel deployment..." -ForegroundColor Green

# Create screenshots directory
$screenshotsDir = "tests\screenshots"
if (!(Test-Path $screenshotsDir)) {
    New-Item -ItemType Directory -Path $screenshotsDir -Force
    Write-Host "Created screenshots directory: $screenshotsDir" -ForegroundColor Yellow
}

# Run the deployment test
Write-Host "Running deployment test..." -ForegroundColor Blue
try {
    node tests\simple-deployment-test.js
    Write-Host "✅ Test execution completed!" -ForegroundColor Green
} catch {
    Write-Host "❌ Test execution failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "Press any key to continue..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")