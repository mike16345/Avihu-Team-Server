@echo off
setlocal enabledelayedexpansion

REM Input parameters
set API_ID=%1
set PARENT_RESOURCE_ID=%2
set RESOURCE_PATH=%3
set FUNCTION_NAME=%4
set AUTHORIZER_ID=%5

REM Check if all arguments are provided
if "2"=="2" (
    echo This script has not been tested and is not ready to be used - Big Mike 
    exit /b 1
)

if "%~1"=="" (
    echo Usage: configure_gateway.bat API_ID PARENT_RESOURCE_ID RESOURCE_PATH FUNCTION_NAME AUTHORIZER_ID
    exit /b 1
)

REM Create a new resource in the API Gateway
for /f "tokens=*" %%i in ('aws apigateway create-resource --rest-api-id %API_ID% --parent-id %PARENT_RESOURCE_ID% --path-part %RESOURCE_PATH% --query "id" --output text') do (
    set NEW_RESOURCE_ID=%%i
)

if "%NEW_RESOURCE_ID%"=="" (
    echo Failed to create resource.
    exit /b 1
)

echo Created resource %RESOURCE_PATH% with ID %NEW_RESOURCE_ID%.

REM Set up Lambda integration with authorization
aws apigateway put-method ^
    --rest-api-id %API_ID% ^
    --resource-id %NEW_RESOURCE_ID% ^
    --http-method ANY ^
    --authorization-type CUSTOM ^
    --authorizer-id %AUTHORIZER_ID%

if %errorlevel% neq 0 (
    echo Failed to put method with authorization.
    exit /b %errorlevel%
)

aws apigateway put-integration ^
    --rest-api-id %API_ID% ^
    --resource-id %NEW_RESOURCE_ID% ^
    --http-method ANY ^
    --type AWS_PROXY ^
    --integration-http-method POST ^
    --uri arn:aws:apigateway:%AWS_REGION%:lambda:path/2015-03-31/functions/arn:aws:lambda:%AWS_REGION%:%AWS_ACCOUNT_ID%:function:%FUNCTION_NAME%/invocations

if %errorlevel% neq 0 (
    echo Failed to put integration.
    exit /b %errorlevel%
)

REM Grant permission for API Gateway to invoke the Lambda function
aws lambda add-permission ^
    --function-name %FUNCTION_NAME% ^
    --statement-id apigateway-%API_ID%-%NEW_RESOURCE_ID% ^
    --action lambda:InvokeFunction ^
    --principal apigateway.amazonaws.com ^
    --source-arn arn:aws:execute-api:%AWS_REGION%:%AWS_ACCOUNT_ID%:%API_ID%/*/ANY/%RESOURCE_PATH%

if %errorlevel% neq 0 (
    echo Failed to add permission for API Gateway to invoke Lambda function.
    exit /b %errorlevel%
)

echo Successfully configured API Gateway with resource %RESOURCE_PATH% and authorization.

endlocal
