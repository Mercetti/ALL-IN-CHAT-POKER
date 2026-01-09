@echo off
echo 🚀 Quick Deploy - Fast Updates
echo.
echo This will deploy immediately without safety checks
echo Use for cosmetic changes and minor updates only
echo.
pause

fly deploy -a all-in-chat-poker --strategy immediate

echo.
echo ✅ Deploy Complete!
echo.
pause
