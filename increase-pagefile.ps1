# Increase Windows Virtual Memory/Page File for Android Builds
# Run this script as Administrator

Write-Host "Current page file settings:" -ForegroundColor Yellow
Get-CimInstance -ClassName Win32_PageFileSetting | Select-Object Name, InitialSize, MaximumSize | Format-Table

Write-Host "`nSystem drive information:" -ForegroundColor Yellow
Get-PSDrive C | Select-Object Name, @{Name="TotalGB";Expression={[math]::Round($_.Used/1GB + $_.Free/1GB,2)}}, @{Name="UsedGB";Expression={[math]::Round($_.Used/1GB,2)}}, @{Name="FreeGB";Expression={[math]::Round($_.Free/1GB,2)}} | Format-Table

Write-Host "`nIncreasing page file size to 16GB..." -ForegroundColor Green

# Get current page file settings
$pagefile = Get-CimInstance -ClassName Win32_PageFileSetting -Filter "Name='c:\\pagefile.sys'"

# Set new sizes (16GB max, 8GB initial)
$pagefile | Set-CimInstance -Property @{
    InitialSize = 8192   # 8GB initial
    MaximumSize = 16384  # 16GB maximum
}

Write-Host "Page file updated successfully!" -ForegroundColor Green
Write-Host "`nNew page file settings:" -ForegroundColor Yellow
Get-CimInstance -ClassName Win32_PageFileSetting | Select-Object Name, InitialSize, MaximumSize | Format-Table

Write-Host "`nNote: A system restart may be required for changes to take effect." -ForegroundColor Cyan
Write-Host "After restart, try the Android build again." -ForegroundColor Cyan
