param(
  [Parameter(Mandatory=$true)]
  [string]$GitHubUrl
)

git init
git add .
git commit -m "Initial deployment-ready CV PDF to Excel app"
git branch -M main
git remote add origin $GitHubUrl
git push -u origin main
