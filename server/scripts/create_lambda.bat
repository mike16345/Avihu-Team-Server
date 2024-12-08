@echo off
set FUNCTION_NAME=%1
set RUNTIME=nodejs20.x
set HANDLER=index.handler
set ZIP_FILE=fileb://./archive.zip
set ROLE_ARN=arn:aws:iam::913524933161:role/BasicLambdaRole

REM Check if all arguments are provided
if "%~1"=="" (
    echo Usage: create_lambda.bat FUNCTION_NAME
    exit /b 1
)

REM Create Lambda function
aws lambda create-function ^
    --function-name %FUNCTION_NAME% ^
    --runtime %RUNTIME% ^
    --role %ROLE_ARN% ^
    --handler %HANDLER% ^
    --zip-file %ZIP_FILE% ^
    --timeout 10 

if %errorlevel% neq 0 (
    echo Failed to create Lambda function.
    exit /b %errorlevel%
)

echo Lambda function %FUNCTION_NAME% created successfully.
