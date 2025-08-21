@echo off
echo === TEPPEK.COM OTOMATIK DEPLOY ===
echo.

REM GitHub'a otomatik push
git add .
git commit -m "Otomatik güncelleme - %date% %time%"
git push origin main

echo.
echo ✅ Deploy tamamlandı! Vercel otomatik yayınlayacak.
echo 🌐 Site 1-2 dakika içinde güncellenecek: https://teppek.com
pause