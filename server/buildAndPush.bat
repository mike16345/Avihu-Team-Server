@echo off
REM Script to build, tag, and upload Docker image

REM Set variables for image name, repository, and tag
set IMAGE_NAME=avihu-app-server
set IMAGE_TAG=avihu-app-images
set REPO_NAME=michael16345
set FULL_TAG=%REPO_NAME%/%IMAGE_TAG%:%IMAGE_NAME%

REM Step 1: Build the Docker image
echo Building Docker image...
docker build -t %IMAGE_NAME% .

REM Step 2: Tag the image with the repository name
echo Tagging image...
docker tag %IMAGE_NAME% %FULL_TAG%

REM Step 3: Push the image to Docker Hub (or your repository)
echo Pushing image to repository...
docker push %FULL_TAG%

REM Done
echo Docker image has been successfully built, tagged, and pushed.
pause
