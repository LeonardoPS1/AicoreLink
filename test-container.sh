#!/bin/bash
CONTAINER=$(docker ps -q -f name=aicorelink-aicorelink-b7m7ol | head -1)
docker cp /tmp/test-db.js $CONTAINER:/tmp/test-db.js
docker exec -i $CONTAINER node /tmp/test-db.js