@echo off

for /L %%i in (1,1,10) do (
    start cmd /k "cd %%i && python parse.py"
)
