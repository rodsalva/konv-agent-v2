#!/bin/bash
# Script to fix TypeScript configuration for tests

# Ensure we're in the project root
cd "$(dirname "$0")/.." || exit 1

# Check if tsconfig.test.json exists
if [ ! -f "tsconfig.test.json" ]; then
    echo "Creating tsconfig.test.json..."
    cat > tsconfig.test.json << 'EOF'
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "rootDir": ".",
    "outDir": "./dist-tests",
    "noEmit": true
  },
  "include": [
    "src/**/*",
    "tests/**/*"
  ]
}
EOF
    echo "Created tsconfig.test.json"
else
    echo "tsconfig.test.json already exists"
fi

# Update tsconfig.json to include only src files
grep -q '"include": \["src/\*\*/\*"\]' tsconfig.json
if [ $? -ne 0 ]; then
    echo "Updating tsconfig.json to include only src files..."
    sed -i '' 's/"include": \[\s*"src\/\*\*\/\*",\s*"tests\/\*\*\/\*"\s*\]/"include": \[\n    "src\/**\/*"\n  \]/g' tsconfig.json
    echo "Updated tsconfig.json"
else
    echo "tsconfig.json already properly configured"
fi

# Update jest.config.js to use tsconfig.test.json
grep -q 'tsconfig: "tsconfig.test.json"' jest.config.js
if [ $? -ne 0 ]; then
    echo "Updating jest.config.js to use tsconfig.test.json..."
    sed -i '' 's/tsconfig: "tsconfig.json"/tsconfig: "tsconfig.test.json"/g' jest.config.js
    echo "Updated jest.config.js"
else
    echo "jest.config.js already properly configured"
fi

# Add typecheck:test script to package.json if it doesn't exist
grep -q '"typecheck:test":' package.json
if [ $? -ne 0 ]; then
    echo "Adding typecheck:test script to package.json..."
    sed -i '' 's/"typecheck": "tsc --noEmit",/"typecheck": "tsc --noEmit",\n    "typecheck:test": "tsc -p tsconfig.test.json --noEmit",/g' package.json
    echo "Added typecheck:test script to package.json"
else
    echo "typecheck:test script already exists in package.json"
fi

echo ""
echo "TypeScript configuration for tests has been fixed."
echo "To run type checking on tests, use: npm run typecheck:test"
echo "To run tests, use: npm test"
echo ""

# Make the script executable
chmod +x scripts/fix-tsconfig.sh