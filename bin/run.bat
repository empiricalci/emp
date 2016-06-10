if -%1-==-- echo Use: emp experiment-name path-to-code & exit /b
if -%2-==-- echo Use: emp experiment-name path-to-code & exit /b
docker run -t --rm -v /var/run/docker.sock:/var/run/docker.sock^
 -v %2:/empirical/code:ro^
 -v %EMPIRICAL_DIR%/data:/empirical/data^
 -v %EMPIRICAL_DIR%/workspaces:/empirical/workspaces^
 -e EMPIRICAL_DIR=%EMPIRICAL_DIR%^
 -e DEBUG=dataset-cache^
 empiricalci/emp %1
