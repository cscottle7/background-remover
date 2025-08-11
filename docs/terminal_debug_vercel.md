vercel --debug --prod
> [debug] [2025-08-11T06:34:24.094Z] Found config in file "C:\Users\cscot\Documents\Apps\Remove background\charactercut-backend\vercel.json"
Vercel CLI 44.4.0
> [debug] [2025-08-11T06:34:24.107Z] user supplied a possible target for deployment or an extension
> [debug] [2025-08-11T06:34:24.127Z] failed to find extension command with name "vercel---prod"
> [debug] [2025-08-11T06:34:24.177Z] Setting target to production
> [debug] [2025-08-11T06:34:24.321Z] Found ".git\config" - detected "C:\Users\cscot\Documents\Apps\Remove background" as repo root
> [debug] [2025-08-11T06:34:24.372Z] Spinner invoked (Retrieving project…) with a 1000ms delay
> [debug] [2025-08-11T06:34:24.396Z] #1 → GET https://api.vercel.com/teams/team_NoWKv26OF6NAqdkdVJBvwWry?teamId=team_NoWKv26OF6NAqdkdVJBvwWry
> [debug] [2025-08-11T06:34:24.398Z] #2 → GET https://api.vercel.com/v9/projects/prj_gS0vehbs6d4XgYAgXbuIpT5jMJAh?teamId=team_NoWKv26OF6NAqdkdVJBvwWry
> [debug] [2025-08-11T06:34:25.107Z] #1 ← 200 OK: sfo1::xbqkx-1754894064503-b300291d9df7 [711ms]
> [debug] [2025-08-11T06:34:25.112Z] #2 ← 200 OK: sfo1::mg5cv-1754894064506-a3556fb52e14 [713ms]
> [debug] [2025-08-11T06:34:25.115Z] Error while parsing repo data: ENOENT: no such file or directory, open 'C:\Users\cscot\Documents\Apps\Remove background\charactercut-backend\.git\config'
> [debug] [2025-08-11T06:34:25.288Z] Spinner invoked (Deploying cscottle7-3073s-projects/background-remover-backend) with a 0ms delay
[client-debug] 2025-08-11T06:34:25.289Z Creating deployment...
[client-debug] 2025-08-11T06:34:25.289Z Provided 'path' is a directory.
[client-debug] 2025-08-11T06:34:25.292Z Found 26 rules in .vercelignore
[client-debug] 2025-08-11T06:34:25.292Z Building file tree...
[client-debug] 2025-08-11T06:34:25.296Z Found 9 files in the specified directory
[client-debug] 2025-08-11T06:34:25.299Z Yielding a 'hashes-calculated' event with 8 hashes
> [debug] [2025-08-11T06:34:25.300Z] #3 → GET https://api.vercel.com/v9/projects/background-remover-backend?teamId=team_NoWKv26OF6NAqdkdVJBvwWry
> [debug] [2025-08-11T06:34:25.504Z] #3 ← 200 OK: sfo1::mg5cv-1754894064931-cba8275c3e66 [203ms]
[client-debug] 2025-08-11T06:34:25.506Z Using provided API URL: https://api.vercel.com
[client-debug] 2025-08-11T06:34:25.507Z Using provided user agent: vercel 44.4.0 node-v22.16.0 win32 (x64)
[client-debug] 2025-08-11T06:34:25.507Z Setting platform version to harcoded value 2
[client-debug] 2025-08-11T06:34:25.507Z Creating the deployment and starting upload...
[client-debug] 2025-08-11T06:34:25.509Z Determining necessary files for upload...
[client-debug] 2025-08-11T06:34:25.510Z Creating deployment
[client-debug] 2025-08-11T06:34:25.511Z Sending deployment creation API request
[client-debug] 2025-08-11T06:34:26.681Z Deployment response: {"alias":["background-remover-backend-cscottle7-3073s-projects.vercel.app"],"aliasAssigned":false,"automaticAliases":["background-remover-backend-cscottle7-3073s-projects.vercel.app"],"bootedAt":1754894065447,"buildingAt":1754894065447,"buildSkipped":false,"createdAt":1754894065447,"creator":{"uid":"GBaEOaG3Bs3B2RLzAJptq9w9","username":"cscottle7-3073"},"id":"dpl_HJsEpncKfkyrCW5CtnMt5oH8emQr","name":"background-remover-backend","meta":{"gitCommitAuthorName":"cscottle7","gitCommitAuthorEmail":"cscottle7@gmail.com","gitCommitMessage":"Connect frontend to deployed backend","gitCommitRef":"master","gitCommitSha":"916b1fff11d93a83d79d7b51de7b1bd6c67049c6","gitDirty":"1"},"originCacheRegion":"iad1","project":{"id":"prj_gS0vehbs6d4XgYAgXbuIpT5jMJAh","name":"background-remover-backend","framework":null},"public":false,"readyState":"QUEUED","regions":["iad1"],"source":"cli","status":"QUEUED","target":"production","team":{"id":"team_NoWKv26OF6NAqdkdVJBvwWry","name":"cscottle7-3073's projects","slug":"cscottle7-3073s-projects"},"type":"LAMBDAS","url":"background-remover-backend-9xndgev1l-cscottle7-3073s-projects.vercel.app","version":2,"previewCommentsEnabled":true,"oidcTokenClaims":{"sub":"owner:cscottle7-3073s-projects:project:background-remover-backend:environment:production","iss":"https://oidc.vercel.com/cscottle7-3073s-projects","scope":"owner:cscottle7-3073s-projects:project:background-remover-backend:environment:production","aud":"https://vercel.com/cscottle7-3073s-projects","owner":"cscottle7-3073s-projects","owner_id":"team_NoWKv26OF6NAqdkdVJBvwWry","project":"background-remover-backend","project_id":"prj_gS0vehbs6d4XgYAgXbuIpT5jMJAh","environment":"production"},"lambdas":[{"id":"bld_jp1xwcrc9","createdAt":1754894065719,"entrypoint":".","readyState":"READY","readyStateAt":1754894065719,"output":[]}],"aliasAssignedAt":null,"build":{"env":["CI","VERCEL","VERCEL_ENV","VERCEL_TARGET_ENV","TURBO_REMOTE_ONLY","TURBO_RUN_SUMMARY","TURBO_DOWNLOAD_LOCAL_ENABLED","NX_DAEMON","TURBO_CACHE","VERCEL_URL","VERCEL_GIT_PROVIDER","VERCEL_GIT_PREVIOUS_SHA","VERCEL_GIT_REPO_SLUG","VERCEL_GIT_REPO_OWNER","VERCEL_GIT_REPO_ID","VERCEL_GIT_COMMIT_REF","VERCEL_GIT_COMMIT_SHA","VERCEL_GIT_COMMIT_MESSAGE","VERCEL_GIT_COMMIT_AUTHOR_LOGIN","VERCEL_GIT_COMMIT_AUTHOR_NAME","VERCEL_GIT_PULL_REQUEST_ID","TURBO_PLATFORM_ENV","VERCEL_DEPLOYMENT_ID","VERCEL_PROJECT_ID","VERCEL_PROJECT_NAME","VERCEL_PROJECT_PRODUCTION_URL","VERCEL_OIDC_TOKEN","VERCEL_DISCOVER_FOLDER_SIZES","VERCEL_LAMBDA_OUTPUTS_AS_MIDDLEWARE","VERCEL_NEXT_BUNDLED_SERVER","VERCEL_SERVERLESS_FUNCTION_FAILOVER","USE_RUST_LAYER_LATEST","USE_RUST_EDGE_WORKER_LAYER_LATEST","VERCEL_EDGE_FNS_ON_WORKERD","VERCEL_EDGE_FNS_ON_WORKERD_UNBUNDLED_FORMAT","VERCEL_EDGE_ON_SERVERLESS_NODE","VERCEL_EDGE_FNS_ON_SERVERLESS","VERCEL_EDGE_FNS_ON_SERVERLESS_USE_FILESYSTEM_CONTENT","VERCEL_NODE_BRIDGE_COMPRESS_MULTI_PAYLOADS","VERCEL_USE_BYTECODE_CACHING","VERCEL_RETRY_ON_MISSING_RESPONSE_BATON","VERCEL_COMPRESS_SERVERLESS_RESPONSE","VERCEL_SET_REQUESTED_AT_PRODUCTION_ON_DEPLOYMENT","VERCEL_ENABLE_REGIONALIZED_ISR","VERCEL_COMPRESSED_ISR_BILLING","VERCEL_NET_CPU_FUNCTIONS","VERCEL_USE_DEFAULT_PNPM_10","VERCEL_EDGE_MIDDLEWARE_MEMORY_SIZE","VERCEL_EDGE_FUNCTIONS_MEMORY_SIZE","VERCEL_EDGE_FUNCTIONS_MAX_DURATION","VERCEL_EDGE_FUNCTIONS_BATCH_SIZE","VERCEL_EDGE_FUNCTIONS_ENABLE_CREATE_FUNC_DEDUPE","VERCEL_EDGE_FUNCTIONS_USE_FILESYSTEM_CONTENT","NEXT_PRIVATE_MULTI_PAYLOAD","VERCEL_RICHER_DEPLOYMENT_OUTPUTS","VERCEL_SERVERLESS_SUSPENSE_CACHE","VERCEL_BUILD_MONOREPO_SUPPORT","VERCEL_USE_ONLY_STREAMING_LAMBDA","VERCEL_USE_STREAMING_PRERENDER","VERCEL_DEPLOYMENT_ROUTES_BUILD_OUTPUT_V1","VERCEL_DEPLOYMENT_ROUTES_CLEAN","VERCEL_ENABLE_EXTENDED_FALLBACK_PAYLOAD","VERCEL_WAKE_UP_DEPLOYMENT","VERCEL_PRERENDER_METADATA_AS_METADATA_FILE","VERCEL_COMPRESS_STATIC_ASSETS_BEFORE_UPLOAD"]},"builds":[{"src":"api/*.py","use":"@vercel/python"}],"createdIn":"sfo1","env":["VERCEL","VERCEL_ENV","VERCEL_TARGET_ENV","TURBO_REMOTE_ONLY","TURBO_RUN_SUMMARY","TURBO_DOWNLOAD_LOCAL_ENABLED","NX_DAEMON","TURBO_CACHE","VERCEL_URL","VERCEL_GIT_PROVIDER","VERCEL_GIT_PREVIOUS_SHA","VERCEL_GIT_REPO_SLUG","VERCEL_GIT_REPO_OWNER","VERCEL_GIT_REPO_ID","VERCEL_GIT_COMMIT_REF","VERCEL_GIT_COMMIT_SHA","VERCEL_GIT_COMMIT_MESSAGE","VERCEL_GIT_COMMIT_AUTHOR_LOGIN","VERCEL_GIT_COMMIT_AUTHOR_NAME","VERCEL_GIT_PULL_REQUEST_ID","TURBO_PLATFORM_ENV","VERCEL_DEPLOYMENT_ID","VERCEL_PROJECT_ID","VERCEL_PROJECT_NAME","VERCEL_PROJECT_PRODUCTION_URL","VERCEL_FLUID","VERCEL_CACHE_HANDLER_MEMORY_CACHE"],"functions":null,"inspectorUrl":"https://vercel.com/cscottle7-3073s-projects/background-remover-backend/HJsEpncKfkyrCW5CtnMt5oH8emQr","isInConcurrentBuildsQueue":false,"isInSystemBuildsQueue":true,"ownerId":"team_NoWKv26OF6NAqdkdVJBvwWry","plan":"hobby","projectId":"prj_gS0vehbs6d4XgYAgXbuIpT5jMJAh","projectSettings":{"buildCommand":null,"devCommand":null,"commandForIgnoringBuildStep":null,"installCommand":null,"outputDirectory":null,"speedInsights":{"id":"1jBZSC5UHqhnixd9p4mLanNS6fo","hasData":false},"webAnalytics":{"id":"cFi2ilYBq7Jd2iymzHbTJ1zQY"}},"routes":[{"src":"^/api/(.*)$","dest":"/api/$1"}],"config":{"version":1,"secureComputePrimaryRegion":null,"secureComputeFallbackRegion":null,"functionTimeout":300,"functionType":"fluid","functionMemoryType":"standard","isUsingActiveCPU":true}}
[client-debug] 2025-08-11T06:34:26.682Z Deployment created with a warning:  Due to `builds` existing in your configuration file, the Build and Development Settings defined in your Project Settings will not apply. Learn More: https://vercel.link/unused-build-settings
[client-debug] 2025-08-11T06:34:26.683Z Yielding a 'warning' event
[client-debug] 2025-08-11T06:34:26.683Z Deployment created
[client-debug] 2025-08-11T06:34:26.684Z Yielding a 'created' event
🔍  Inspect: https://vercel.com/cscottle7-3073s-projects/background-remover-backend/HJsEpncKfkyrCW5CtnMt5oH8emQr [1s]
✅  Production: https://background-remover-backend-9xndgev1l-cscottle7-3073s-projects.vercel.app [1s]
> [debug] [2025-08-11T06:34:26.686Z] Spinner invoked (Queued) with a 0ms delay
> [debug] [2025-08-11T06:34:26.687Z] #4 → GET https://api.vercel.com/v2/user
[client-debug] 2025-08-11T06:34:26.688Z Waiting for deployment to be ready...
[client-debug] 2025-08-11T06:34:26.689Z Waiting for builds and the deployment to complete...
> [debug] [2025-08-11T06:34:26.872Z] #4 ← 200 OK: sfo1::mg5cv-1754894066322-7a32a4236dbc [184ms]
> [debug] [2025-08-11T06:34:26.875Z] #5 → GET https://api.vercel.com/v3/now/deployments/dpl_HJsEpncKfkyrCW5CtnMt5oH8emQr/events?direction=forward&follow=1&format=lines&teamId=team_NoWKv26OF6NAqdkdVJBvwWry
[client-debug] 2025-08-11T06:34:28.443Z Deployment state changed to BUILDING
[client-debug] 2025-08-11T06:34:28.443Z Yielding a 'building' event
> [debug] [2025-08-11T06:34:30.209Z] #5 ← 200 OK: sfo1::mg5cv-1754894066505-6d2d652d1aea [3.33s]
2025-08-11T06:34:26.078Z  Running build in Washington, D.C., USA (East) – iad1
2025-08-11T06:34:26.079Z  Build machine configuration: 2 cores, 8 GB
2025-08-11T06:34:26.120Z  Retrieving list of deployment files...
2025-08-11T06:34:26.223Z  Previous build caches not available
2025-08-11T06:34:26.622Z  Downloading 9 deployment files...
2025-08-11T06:34:29.201Z  Running "vercel build"
2025-08-11T06:34:29.708Z  Vercel CLI 44.7.3
2025-08-11T06:34:29.893Z  WARN! Due to `builds` existing in your configuration file, the Build and Development Settings defined in your Project Settings will not apply. Learn More: https://vercel.link/unused-build-settings
2025-08-11T06:34:29.933Z  Installing required dependencies...
[client-debug] 2025-08-11T06:34:38.147Z Yielding a 'error' event