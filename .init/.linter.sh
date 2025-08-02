#!/bin/bash
cd /home/kavia/workspace/code-generation/surflog-dashboard-43504-43513/surf_sync_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

