#!/bin/bash
cd /home/kavia/workspace/code-generation/attendance-management-system-42477-42487/attendance_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

