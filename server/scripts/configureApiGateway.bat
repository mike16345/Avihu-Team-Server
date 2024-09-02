@echo off
setlocal enabledelayedexpansion

REM Input parameters
set API_ID=%1
set PARENT_RESOURCE_ID=%2
set RESOURCE_PATH=%3
set FUNCTION_NAME=%4
set AUTHORIZER_ID=%5
set ENABLE_PROXY=%6 
set STAGE_NAME=%7

set AWS_ACCOUNT_ID=913524933161
set AWS_REGION=il-central-1

REM Check if all arguments are provided
if "%~1"=="" (
    echo Usage: configure_gateway.bat API_ID PARENT_RESOURCE_ID RESOURCE_PATH FUNCTION_NAME AUTHORIZER_ID ENABLE_PROXY+ STAGE_NAME
    echo Example: configure_gateway.bat 8293749274 n2nu8r users userFunctionName j3jd84 true test
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



echo Setting up lambda authorization
REM Set up Lambda integration with authorization
aws apigateway put-method ^
    --rest-api-id %API_ID% ^
    --resource-id %NEW_RESOURCE_ID% ^
    --http-method ANY ^
    --authorization-type CUSTOM ^
    --authorizer-id %AUTHORIZER_ID%

if %errorlevel% neq 0 (
    echo Failed to put method with authorization.
    call :rollback
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
    call :rollback
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
    call :rollback
)


REM Create a proxy+ integration if the ENABLE_PROXY flag is set to true
if "%ENABLE_PROXY%"=="true" (
    echo Creating proxy+ for resource %RESOURCE_PATH%.
    
    aws apigateway put-method ^
        --rest-api-id %API_ID% ^
        --resource-id %NEW_RESOURCE_ID% ^
        --http-method ANY ^
        --authorization-type CUSTOM ^
        --authorizer-id %AUTHORIZER_ID%
    
    if %errorlevel% neq 0 (
        echo Failed to put method for proxy+.
        call :rollback
    )

    aws apigateway put-integration ^
        --rest-api-id %API_ID% ^
        --resource-id %NEW_RESOURCE_ID% ^
        --http-method ANY ^
        --type AWS_PROXY ^
        --integration-http-method POST ^
        --uri arn:aws:apigateway:%AWS_REGION%:lambda:path/2015-03-31/functions/arn:aws:lambda:%AWS_REGION%:%AWS_ACCOUNT_ID%:function:%FUNCTION_NAME%/invocations

    if %errorlevel% neq 0 (
        echo Failed to put integration for proxy+.
        call :rollback
    )
    
    echo Successfully configured proxy+ for resource %RESOURCE_PATH%.
)

REM Deploy the API if a stage name is provided
if not "%STAGE_NAME%"=="" (
    echo Deploying the API Gateway to stage %STAGE_NAME%.
    
    aws apigateway create-deployment ^
        --rest-api-id %API_ID% ^
        --stage-name %STAGE_NAME%

    if %errorlevel% neq 0 (
        echo Failed to deploy the API.
        exit /b %errorlevel%
    )
    
    echo Successfully deployed the API Gateway to stage %STAGE_NAME%.
)
echo Successfully configured API Gateway with resource %RESOURCE_PATH% and authorization.

endlocal
exit /b 0

REM Define a rollback function
:rollback
    echo Rolling back changes...
    if not "%NEW_RESOURCE_ID%"=="" (
        aws apigateway delete-resource --rest-api-id %API_ID% --resource-id %NEW_RESOURCE_ID%
        if %errorlevel% neq 0 (
            echo Failed to delete resource %NEW_RESOURCE_ID%.
        ) else (
            echo Deleted resource %NEW_RESOURCE_ID%.
        )
    )
    exit /b 1