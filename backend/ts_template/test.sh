#!/usr/bin/env bash

set -e

TRAP_TRIGGERED=false

# Helper function to kill any process using port 8080
# kill_previous_processes() {
#   if lsof -i :8080 -t > /dev/null; then
#     echo "Killing existing process $(lsof -i :8080 -t) on port 8080..."
#     kill -9 $(lsof -i :8080 -t) > /dev/null 2>&1
#   fi
# }

# # Helper function to kill the server and any processes using port 8080
# kill_server() {
#   if [ "$TRAP_TRIGGERED" = true ]; then
#     return 
#   fi
#   TRAP_TRIGGERED=true

#   echo "== Stopping the server =="
#   if ps -p $SERVER_PID > /dev/null; then
#     echo "Killing server with PID: $SERVER_PID"
#     kill $SERVER_PID > /dev/null 2>&1
#   fi
#   kill_previous_processes
# }

# Helper function to kill any process using port 8080
kill_previous_processes() {
  # Get the PID of the process using port 8080
  PID=$(netstat -ano | findstr ":8080" | awk '{print $5}' | sort -u)

  if [ -n "$PID" ]; then
    echo "Killing existing process $PID on port 8080..."
    # Kill the process using the PID
    taskkill /PID $PID /F > /dev/null 2>&1
  else
    echo "No process found on port 8080."
  fi
}

# Helper function to kill the server and any processes using port 8080
kill_server() {
  if [ "$TRAP_TRIGGERED" = true ]; then
    return
  fi
  TRAP_TRIGGERED=true

  echo "== Running tests... =="

  # Insert your test commands here, for example:
  # ./run_tests.sh
  # or any other commands that you need to run the tests
  
  echo "Tests completed, now stopping the server..."

  # Kill the server with PID if set
  if [ -n "$SERVER_PID" ]; then
    echo "Killing server with PID: $SERVER_PID"
    taskkill /PID $SERVER_PID /F > /dev/null 2>&1
  fi
  
  # Now kill any process using port 8080
  kill_previous_processes
}

kill_previous_processes
trap 'kill_server' EXIT ERR
echo "== Starting server =="

npm i > /dev/null 2>&1
npm start > /dev/null 2>&1 &
SERVER_PID=$!

# Wait for the server to be up
echo "Waiting for server to start..."
until curl -s http://localhost:8080 > /dev/null; do
  echo -n "."
  sleep 0.05
done
echo
echo "Server is up. Yippee!!"

# Run tests
cd ../autotester
if [ "$1" == "part1" ]; then
  echo "Running test_part1..."
  npm run test_part1
elif [ "$1" == "part2" ]; then
  echo "Running test_part2..."
  npm run test_part2
elif [ "$1" == "part3" ]; then
  echo "Running test_part3..."
  npm run test_part3
else
  # Default: run all tests
  echo "Running all tests..."
  npm run test
fi

kill_server
