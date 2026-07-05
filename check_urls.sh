#!/bin/bash
# 测试几个 Unsplash photo ID 是否有效
ids=(
  "1504198453319-5ce911bafcde"
  "1506905925346-21bda4d32df4"
  "1502082553048-f009c37129b9"
  "1441974231531-c6227db76b6e"
  "1469474968028-56623f02e42e"
  "1470071459604-3b5ec3a7fe05"
  "1426604966048-5f3a9e5b5b0d"
  "1519681393784-d120267933ba"
  "1534278931827-8f00e65e8b2c"
  "1477601267568-cb2a5e5b5b0d"
)
for id in "${ids[@]}"; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "https://images.unsplash.com/photo-${id}?w=200&h=200&fit=crop" 2>&1)
  echo "$id -> HTTP $code"
done
