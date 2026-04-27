param(
  [string]$MySqlUser = "root",
  [string]$MySqlHost = "localhost",
  [string]$BootstrapSqlPath = "backend/database/ownership_bootstrap.sql"
)

Write-Host "Beral Care Owner DB Setup" -ForegroundColor Cyan
Write-Host "MySQL User: $MySqlUser"
Write-Host "MySQL Host: $MySqlHost"
Write-Host "Bootstrap SQL: $BootstrapSqlPath"

if (!(Test-Path $BootstrapSqlPath)) {
  Write-Error "Bootstrap SQL file not found at: $BootstrapSqlPath"
  exit 1
}

$mysqlCommand = Get-Command mysql -ErrorAction SilentlyContinue
if (-not $mysqlCommand) {
  Write-Error "mysql CLI not found. Install MySQL client and ensure 'mysql' is on PATH."
  exit 1
}

Write-Host "Running bootstrap SQL (you may be prompted for password)..." -ForegroundColor Yellow
& mysql -h $MySqlHost -u $MySqlUser -p --execute="source $BootstrapSqlPath"

if ($LASTEXITCODE -ne 0) {
  Write-Error "Owner DB bootstrap failed."
  exit $LASTEXITCODE
}

Write-Host "Owner DB bootstrap completed." -ForegroundColor Green
Write-Host "Next: update backend/.env with DB_USER, DB_PASSWORD, DB_NAME and run the API."
