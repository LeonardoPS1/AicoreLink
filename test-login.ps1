$csrfResponse = Invoke-WebRequest -Uri "https://aicorelink.aicorebots.com/api/auth/csrf" -Method Get
$csrfToken = ($csrfResponse.Content | ConvertFrom-Json).csrfToken

$loginResponse = Invoke-WebRequest -Uri "https://aicorelink.aicorebots.com/api/auth/callback/credentials" -Method Post -ContentType "application/x-www-form-urlencoded" -Body "email=dev@aicore.com&password=dev123456&csrfToken=$csrfToken" -SessionVariable session

Write-Host "Status: $($loginResponse.StatusCode)"
Write-Host "Headers: $($loginResponse.Headers)"
Write-Host "Content: $($loginResponse.Content)"