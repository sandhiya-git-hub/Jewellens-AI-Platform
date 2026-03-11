@echo off
REM Run this after you copy all ring and necklace images into Jewelry_RAG\data\Tanishq\
cd /d "%~dp0Jewelry_RAG"
REM Install dependencies once if needed:
REM pip install -r requirements.txt
python rebuild_index.py
pause
